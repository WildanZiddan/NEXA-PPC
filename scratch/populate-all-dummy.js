const { PrismaClient } = require('d:\\ASTRATech\\Semester 4\\Sistem Produksi\\NEXA-PPC\\frontend\\generated\\prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config({ path: 'd:\\ASTRATech\\Semester 4\\Sistem Produksi\\NEXA-PPC\\frontend\\.env' });

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log("--- Populating Aggregate Planning and MPS Dummy Data ---");

    // 1. Get MTB-200 item
    const itemMtb = await prisma.mstIte.findUnique({
      where: { item_code: 'MTB-200' }
    });

    if (!itemMtb) {
      console.error("Mountain Bike MTB-200 not found!");
      return;
    }

    // 2. Check if we already have aggregate plans
    const existingAggs = await prisma.trxAgg.findMany();
    if (existingAggs.length > 0) {
      console.log(`Found ${existingAggs.length} existing aggregate plans. Skipping seed.`);
      return;
    }

    // 3. Create Aggregate Plan for June 2026
    console.log("Creating Aggregate Plan for June 2026...");
    const aggPlanJune = await prisma.trxAgg.create({
      data: {
        period_date: new Date("2026-06-01T00:00:00Z"),
        total_demand: 180,
        production_target: 180,
        strategy_used: 'LEVEL',
        details: {
          create: [
            {
              item_id: itemMtb.item_id,
              allocated_quantity: 180
            }
          ]
        }
      }
    });
    console.log("Created aggregate plan June 2026:", aggPlanJune.aggregate_id);

    // 4. Create Aggregate Plan for July 2026
    console.log("Creating Aggregate Plan for July 2026...");
    const aggPlanJuly = await prisma.trxAgg.create({
      data: {
        period_date: new Date("2026-07-01T00:00:00Z"),
        total_demand: 200,
        production_target: 200,
        strategy_used: 'CHASE',
        details: {
          create: [
            {
              item_id: itemMtb.item_id,
              allocated_quantity: 200
            }
          ]
        }
      }
    });
    console.log("Created aggregate plan July 2026:", aggPlanJuly.aggregate_id);

    // 5. Create some default Master Production Schedule (MPS) records
    console.log("Creating MPS for June 2026...");
    const mps1 = await prisma.trxMps.create({
      data: {
        aggregate_id: aggPlanJune.aggregate_id,
        item_id: itemMtb.item_id,
        due_date: new Date("2026-06-15T00:00:00Z"),
        quantity_demanded: 90
      }
    });

    const mps2 = await prisma.trxMps.create({
      data: {
        aggregate_id: aggPlanJune.aggregate_id,
        item_id: itemMtb.item_id,
        due_date: new Date("2026-06-22T00:00:00Z"),
        quantity_demanded: 90
      }
    });

    console.log("Created MPS schedules:", mps1.mps_id, mps2.mps_id);
    console.log("Dummy data populated successfully!");

  } catch (error) {
    console.error("Error populating data:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
