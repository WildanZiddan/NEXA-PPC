const { PrismaClient } = require('../generated/prisma');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('--- Memulai Seeding Database NEXA-PPC ---');

  // ==========================================
  // 1. CLEAR OLD DATA (Order: Dependency Child -> Parent)
  // ==========================================
  console.log('Membersihkan data lama...');
  await prisma.trxInv.deleteMany();
  await prisma.trxWoo.deleteMany();
  await prisma.trxPod.deleteMany();
  await prisma.trxPur.deleteMany();
  await prisma.trxMrp.deleteMany();
  await prisma.trxMps.deleteMany();
  await prisma.trxAgd.deleteMany();
  await prisma.trxAgg.deleteMany();
  await prisma.trxFor.deleteMany();
  await prisma.mstBom.deleteMany();
  await prisma.mstWor.deleteMany();
  await prisma.mstUsr.deleteMany();
  await prisma.mstSup.deleteMany();
  await prisma.mstRol.deleteMany();
  await prisma.mstIte.deleteMany();
  console.log('Pembersihan data selesai.');

  // ==========================================
  // 2. SEED ROLES (MST_ROL)
  // ==========================================
  console.log('Seeding Roles (MST_ROL)...');
  const roleAdmin = await prisma.mstRol.create({
    data: {
      role_name: 'ADMIN',
      description: 'Administrator & Staff Internal Produksi dengan akses penuh',
    },
  });

  const roleSupplier = await prisma.mstRol.create({
    data: {
      role_name: 'SUPPLIER',
      description: 'Pihak ketiga penyedia bahan baku dengan akses terbatas ke Purchase Order',
    },
  });

  // ==========================================
  // 3. SEED SUPPLIERS (MST_SUP)
  // ==========================================
  console.log('Seeding Suppliers (MST_SUP)...');
  const supAlt = await prisma.mstSup.create({
    data: {
      supplier_name: 'PT. Alumindo Utama',
      contact_person: 'Budi Santoso',
      lead_time_days: 5,
    },
  });

  const supWhl = await prisma.mstSup.create({
    data: {
      supplier_name: 'CV. Roda Perkasa',
      contact_person: 'Siti Rahma',
      lead_time_days: 3,
    },
  });

  // ==========================================
  // 4. SEED USERS (MST_USR)
  // ==========================================
  console.log('Seeding Users (MST_USR)...');
  const adminPasswordHash = bcrypt.hashSync('admin123', 10);
  const supAltPasswordHash = bcrypt.hashSync('supalt123', 10);
  const supWhlPasswordHash = bcrypt.hashSync('supwhl123', 10);

  // Admin user (supplier_id = null)
  await prisma.mstUsr.create({
    data: {
      role_id: roleAdmin.role_id,
      supplier_id: null,
      username: 'admin',
      password: adminPasswordHash,
      full_name: 'Aditya Pratama (Admin PPC)',
    },
  });

  // Supplier 1 User (linked to PT. Alumindo Utama)
  await prisma.mstUsr.create({
    data: {
      role_id: roleSupplier.role_id,
      supplier_id: supAlt.supplier_id,
      username: 'supplier_alt',
      password: supAltPasswordHash,
      full_name: 'Budi Santoso (PT. Alumindo)',
    },
  });

  // Supplier 2 User (linked to CV. Roda Perkasa)
  await prisma.mstUsr.create({
    data: {
      role_id: roleSupplier.role_id,
      supplier_id: supWhl.supplier_id,
      username: 'supplier_whl',
      password: supWhlPasswordHash,
      full_name: 'Siti Rahma (CV. Roda Perkasa)',
    },
  });

  // ==========================================
  // 5. SEED ITEMS (MST_ITE)
  // ==========================================
  console.log('Seeding Items (MST_ITE)...');
  
  // Level 0: Finished Good
  const itemMtb = await prisma.mstIte.create({
    data: {
      item_code: 'MTB-200',
      item_name: 'Mountain Bike MTB-200',
      item_type: 'Finished Good',
      unit: 'UNIT',
    },
  });

  // Level 1: Components (Sub-assemblies)
  const itemFrame = await prisma.mstIte.create({
    data: {
      item_code: 'FRM-01',
      item_name: 'Frame Assembly FRM-01',
      item_type: 'Component',
      unit: 'SET',
    },
  });

  const itemWheel = await prisma.mstIte.create({
    data: {
      item_code: 'WHL-02',
      item_name: 'Wheel Assembly WHL-02',
      item_type: 'Component',
      unit: 'SET',
    },
  });

  const itemHandlebar = await prisma.mstIte.create({
    data: {
      item_code: 'HDL-03',
      item_name: 'Handlebar Assembly HDL-03',
      item_type: 'Component',
      unit: 'SET',
    },
  });

  const itemDrivetrain = await prisma.mstIte.create({
    data: {
      item_code: 'DRV-04',
      item_name: 'Drivetrain Assembly DRV-04',
      item_type: 'Component',
      unit: 'SET',
    },
  });

  // Level 2: Raw Materials / Parts
  const itemAlt = await prisma.mstIte.create({
    data: {
      item_code: 'ALT-03',
      item_name: 'Aluminum Tubes ALT-03',
      item_type: 'Raw Material',
      unit: 'METER',
    },
  });

  const itemSaddle = await prisma.mstIte.create({
    data: {
      item_code: 'SDL-08',
      item_name: 'Comfort Saddle SDL-08',
      item_type: 'Raw Material',
      unit: 'PCS',
    },
  });

  const itemSeatPost = await prisma.mstIte.create({
    data: {
      item_code: 'STP-09',
      item_name: 'Seat Post STP-09',
      item_type: 'Raw Material',
      unit: 'PCS',
    },
  });

  const itemSpk = await prisma.mstIte.create({
    data: {
      item_code: 'SPK-04',
      item_name: 'Spokes SPK-04',
      item_type: 'Raw Material',
      unit: 'PCS',
    },
  });

  const itemHub = await prisma.mstIte.create({
    data: {
      item_code: 'HUB-05',
      item_name: 'Hubs HUB-05',
      item_type: 'Raw Material',
      unit: 'PCS',
    },
  });

  const itemRim = await prisma.mstIte.create({
    data: {
      item_code: 'RIM-06',
      item_name: 'Rims RIM-06',
      item_type: 'Raw Material',
      unit: 'PCS',
    },
  });

  const itemTir = await prisma.mstIte.create({
    data: {
      item_code: 'TIR-07',
      item_name: 'Tires TIR-07',
      item_type: 'Raw Material',
      unit: 'PCS',
    },
  });

  const itemValve = await prisma.mstIte.create({
    data: {
      item_code: 'VLV-10',
      item_name: 'Valves VLV-10',
      item_type: 'Raw Material',
      unit: 'PCS',
    },
  });

  const itemGrip = await prisma.mstIte.create({
    data: {
      item_code: 'HGP-11',
      item_name: 'Handlebar Grip HGP-11',
      item_type: 'Raw Material',
      unit: 'PCS',
    },
  });

  const itemHeadTube = await prisma.mstIte.create({
    data: {
      item_code: 'HDT-12',
      item_name: 'Head Tube HDT-12',
      item_type: 'Raw Material',
      unit: 'PCS',
    },
  });

  const itemChain = await prisma.mstIte.create({
    data: {
      item_code: 'CHN-13',
      item_name: 'Chain CHN-13',
      item_type: 'Raw Material',
      unit: 'PCS',
    },
  });

  const itemPedal = await prisma.mstIte.create({
    data: {
      item_code: 'PDL-14',
      item_name: 'Pedals PDL-14',
      item_type: 'Raw Material',
      unit: 'PCS',
    },
  });

  const itemCrankArm = await prisma.mstIte.create({
    data: {
      item_code: 'CRA-15',
      item_name: 'Crank Arm CRA-15',
      item_type: 'Raw Material',
      unit: 'PCS',
    },
  });

  const itemChainRing = await prisma.mstIte.create({
    data: {
      item_code: 'CRG-16',
      item_name: 'Chain Ring CRG-16',
      item_type: 'Raw Material',
      unit: 'PCS',
    },
  });

  // ==========================================
  // 6. SEED BILL OF MATERIALS (MST_BOM)
  // ==========================================
  console.log('Seeding Bill of Materials (MST_BOM)...');

  // Level 1: MTB-200 -> Frame (1), Wheel (2), Handlebar (1), Drivetrain (1)
  await prisma.mstBom.create({
    data: { parent_item_id: itemMtb.item_id, child_item_id: itemFrame.item_id, quantity_needed: 1.0 }
  });
  await prisma.mstBom.create({
    data: { parent_item_id: itemMtb.item_id, child_item_id: itemWheel.item_id, quantity_needed: 2.0 }
  });
  await prisma.mstBom.create({
    data: { parent_item_id: itemMtb.item_id, child_item_id: itemHandlebar.item_id, quantity_needed: 1.0 }
  });
  await prisma.mstBom.create({
    data: { parent_item_id: itemMtb.item_id, child_item_id: itemDrivetrain.item_id, quantity_needed: 1.0 }
  });

  // Level 2: Frame Assembly -> Aluminum Tubes (3), Saddle (1), Seat Post (1)
  await prisma.mstBom.create({
    data: { parent_item_id: itemFrame.item_id, child_item_id: itemAlt.item_id, quantity_needed: 3.0 }
  });
  await prisma.mstBom.create({
    data: { parent_item_id: itemFrame.item_id, child_item_id: itemSaddle.item_id, quantity_needed: 1.0 }
  });
  await prisma.mstBom.create({
    data: { parent_item_id: itemFrame.item_id, child_item_id: itemSeatPost.item_id, quantity_needed: 1.0 }
  });

  // Level 2: Wheel Assembly -> Rim (1), Spokes (32), Hub (1), Tire (1), Valve (1)
  await prisma.mstBom.create({
    data: { parent_item_id: itemWheel.item_id, child_item_id: itemRim.item_id, quantity_needed: 1.0 }
  });
  await prisma.mstBom.create({
    data: { parent_item_id: itemWheel.item_id, child_item_id: itemSpk.item_id, quantity_needed: 32.0 }
  });
  await prisma.mstBom.create({
    data: { parent_item_id: itemWheel.item_id, child_item_id: itemHub.item_id, quantity_needed: 1.0 }
  });
  await prisma.mstBom.create({
    data: { parent_item_id: itemWheel.item_id, child_item_id: itemTir.item_id, quantity_needed: 1.0 }
  });
  await prisma.mstBom.create({
    data: { parent_item_id: itemWheel.item_id, child_item_id: itemValve.item_id, quantity_needed: 1.0 }
  });

  // Level 2: Handlebar Assembly -> Handlebar Grip (2), Head Tube (1)
  await prisma.mstBom.create({
    data: { parent_item_id: itemHandlebar.item_id, child_item_id: itemGrip.item_id, quantity_needed: 2.0 }
  });
  await prisma.mstBom.create({
    data: { parent_item_id: itemHandlebar.item_id, child_item_id: itemHeadTube.item_id, quantity_needed: 1.0 }
  });

  // Level 2: Drivetrain Assembly -> Chain (1), Pedals (2), Crank Arm (2), Chain Ring (1)
  await prisma.mstBom.create({
    data: { parent_item_id: itemDrivetrain.item_id, child_item_id: itemChain.item_id, quantity_needed: 1.0 }
  });
  await prisma.mstBom.create({
    data: { parent_item_id: itemDrivetrain.item_id, child_item_id: itemPedal.item_id, quantity_needed: 2.0 }
  });
  await prisma.mstBom.create({
    data: { parent_item_id: itemDrivetrain.item_id, child_item_id: itemCrankArm.item_id, quantity_needed: 2.0 }
  });
  await prisma.mstBom.create({
    data: { parent_item_id: itemDrivetrain.item_id, child_item_id: itemChainRing.item_id, quantity_needed: 1.0 }
  });

  // ==========================================
  // 7. SEED WORK CENTERS (MST_WOR)
  // ==========================================
  console.log('Seeding Work Centers (MST_WOR)...');
  await prisma.mstWor.create({
    data: {
      work_center_name: 'Welding & Frame Prep Center (W-WEL)',
      capacity_per_day: 15,
    },
  });

  await prisma.mstWor.create({
    data: {
      work_center_name: 'Wheel Assembly & Lacing Center (W-LAC)',
      capacity_per_day: 20,
    },
  });

  await prisma.mstWor.create({
    data: {
      work_center_name: 'Final Assembly Line (W-ASM)',
      capacity_per_day: 10,
    },
  });

  // ==========================================
  // 8. SEED INITIAL STOCK (TRX_INV)
  // ==========================================
  console.log('Seeding Initial Stock (TRX_INV)...');
  
  // Penambahan stok awal untuk Raw Materials
  const initialStocks = [
    { item: itemAlt, qty: 150.0 },       // Aluminum Tubes
    { item: itemSaddle, qty: 50.0 },     // Saddle
    { item: itemSeatPost, qty: 50.0 },   // Seat Post
    { item: itemSpk, qty: 1000.0 },      // Spokes
    { item: itemHub, qty: 100.0 },       // Hubs
    { item: itemRim, qty: 100.0 },       // Rims
    { item: itemTir, qty: 120.0 },       // Tires
    { item: itemValve, qty: 150.0 },     // Valves
    { item: itemGrip, qty: 80.0 },       // Grips
    { item: itemHeadTube, qty: 40.0 },   // Head Tube
    { item: itemChain, qty: 50.0 },      // Chain
    { item: itemPedal, qty: 100.0 },     // Pedals
    { item: itemCrankArm, qty: 100.0 },  // Crank Arm
    { item: itemChainRing, qty: 50.0 },  // Chain Ring
  ];

  for (const entry of initialStocks) {
    await prisma.trxInv.create({
      data: {
        item_id: entry.item.item_id,
        transaction_type: 'ADJUSTMENT',
        quantity: entry.qty,
        current_stock: entry.qty,
      },
    });
  }

  console.log('Seeding Berhasil Selesai! 🚀');
}

main()
  .catch((e) => {
    console.error('Error saat seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

