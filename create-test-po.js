const { PrismaClient } = require('./generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Membuat Purchase Order Uji Coba untuk Supplier ---');

  // 1. Dapatkan Supplier (PT. Alumindo Utama)
  const supplier = await prisma.mstSup.findFirst({
    where: { supplier_name: 'PT. Alumindo Utama' }
  });

  if (!supplier) {
    console.error('Error: Supplier PT. Alumindo Utama tidak ditemukan. Pastikan database telah diseed.');
    process.exit(1);
  }

  // 2. Dapatkan Item (ALT-03)
  const item = await prisma.mstIte.findUnique({
    where: { item_code: 'ALT-03' }
  });

  if (!item) {
    console.error('Error: Item ALT-03 tidak ditemukan. Pastikan database telah diseed.');
    process.exit(1);
  }

  // 3. Buat Purchase Order (PO)
  const newPO = await prisma.$transaction(async (tx) => {
    // Buat header PO
    const header = await tx.trxPur.create({
      data: {
        supplier_id: supplier.supplier_id,
        po_date: new Date(),
        status: 'PENDING',
      }
    });

    // Buat detail PO
    await tx.trxPod.create({
      data: {
        po_id: header.po_id,
        item_id: item.item_id,
        quantity_ordered: 75.0, // Order 75 meters of Aluminum Tubes
      }
    });

    return tx.trxPur.findUnique({
      where: { po_id: header.po_id },
      include: {
        supplier: true,
        purchaseOrderDetails: {
          include: { item: true }
        }
      }
    });
  });

  console.log('\n✅ Sukses Membuat Purchase Order Uji Coba:');
  console.log(`- PO ID: ${newPO.po_id}`);
  console.log(`- Nomor PO: PO-${newPO.po_id.slice(0, 8).toUpperCase()}`);
  console.log(`- Supplier: ${newPO.supplier.supplier_name}`);
  console.log(`- Status: ${newPO.status}`);
  console.log(`- Item Dipesan: ${newPO.purchaseOrderDetails[0].item.item_name} (${newPO.purchaseOrderDetails[0].quantity_ordered} ${newPO.purchaseOrderDetails[0].item.unit})`);
  console.log('\nSilakan login ke http://localhost:3001/login menggunakan akun supplier untuk memproses PO ini.');
}

main()
  .catch((e) => {
    console.error('Error saat membuat PO:', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
