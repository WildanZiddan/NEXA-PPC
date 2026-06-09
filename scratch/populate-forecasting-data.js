const { PrismaClient } = require('../generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    // 1. Get the MTB-200 item
    const item = await prisma.mstIte.findUnique({
      where: { item_code: 'MTB-200' }
    });

    if (!item) {
      console.error("Item MTB-200 not found in database!");
      return;
    }

    console.log("Found item:", item.item_name, "with ID:", item.item_id);

    // 2. Clear any existing OUT_WO (demand) transactions for this item to prevent duplicates
    console.log("Clearing old demand transactions for MTB-200...");
    await prisma.trxInv.deleteMany({
      where: {
        item_id: item.item_id,
        transaction_type: 'OUT_WO'
      }
    });

    // 3. Insert historical demand data (quantity < 0 is interpreted as demand)
    const historicalData = [
      { date: "2026-03-15T10:00:00Z", qty: -120 },
      { date: "2026-04-15T12:00:00Z", qty: -95 },
      { date: "2026-05-18T14:30:00Z", qty: -110 }
    ];

    console.log("Inserting 3 months of historical demand data for June 2026 forecasting...");
    for (const data of historicalData) {
      await prisma.trxInv.create({
        data: {
          item_id: item.item_id,
          transaction_type: 'OUT_WO',
          quantity: data.qty,
          current_stock: 0,
          created_at: new Date(data.date)
        }
      });
    }

    console.log("Dummy forecasting data successfully populated!");
  } catch (error) {
    console.error("Error populating data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
