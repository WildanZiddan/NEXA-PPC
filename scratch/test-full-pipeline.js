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
  console.log("=== MEMULAI PENGUJIAN PIPELINE END-TO-END NEXA-PPC ===");

  try {
    // 1. Get MTB-200 Item
    const itemMtb = await prisma.mstIte.findUnique({
      where: { item_code: 'MTB-200' }
    });

    if (!itemMtb) {
      console.error("❌ Finished Good MTB-200 tidak ditemukan!");
      return;
    }
    console.log(`✅ Finished Good ditemukan: [${itemMtb.item_code}] ${itemMtb.item_name}`);

    // 2. Simulasi Perhitungan Peramalan (Forecasting)
    console.log("\n--- Langkah 1: Simulasi Peramalan ---");
    // Simulasi hitungan langsung (Moving Average & Exponential Smoothing)
    // Ambil mutasi stock keluar untuk hitung manual
    const transactions = await prisma.trxInv.findMany({
      where: { item_id: itemMtb.item_id },
      orderBy: { created_at: "asc" }
    });
    
    let totalDemand = 0;
    transactions.forEach(tx => {
      if (tx.quantity < 0) {
        console.log(`   * Mutasi Keluar: Tanggal ${tx.created_at.toISOString().split('T')[0]}, Kuantitas: ${tx.quantity}`);
        totalDemand += Math.abs(tx.quantity);
      }
    });

    // Model peramalan sederhana
    const averageDemand = Math.round(totalDemand / 3); 
    console.log(`   * Total Demand Historis (3 bulan terakhir): ${totalDemand}`);
    console.log(`   * Hasil Moving Average 3 Bulan (MA-3): ${averageDemand}`);

    // Simpan data peramalan untuk periode 2026-06-01
    const targetPeriod = new Date("2026-06-01T00:00:00Z");
    // Hapus data peramalan lama jika ada agar tidak duplikat
    await prisma.trxFor.deleteMany({
      where: { item_id: itemMtb.item_id, period_date: targetPeriod }
    });
    
    const savedForecast = await prisma.trxFor.create({
      data: {
        item_id: itemMtb.item_id,
        period_date: targetPeriod,
        quantity_forecast: averageDemand
      }
    });
    console.log(`✅ Data Peramalan berhasil disimpan ke TRX_FOR: Qty = ${savedForecast.quantity_forecast}`);

    // 3. Simulasi Perencanaan Agregat (Aggregate Planning)
    console.log("\n--- Langkah 2: Simulasi Perencanaan Agregat ---");
    // Rilis rencana agregat dengan total target sama dengan hasil forecast
    const strat = 'LEVEL';
    const prodTarget = savedForecast.quantity_forecast; // e.g. 108 atau sesuai data

    // Hapus data lama yang berelasi untuk menghindari pelanggaran FK
    console.log("Cleaning up old transactional data for testing...");
    await prisma.trxMrp.deleteMany();
    await prisma.trxMps.deleteMany();
    await prisma.trxAgd.deleteMany();
    await prisma.trxAgg.deleteMany();

    const aggregatePlan = await prisma.$transaction(async (tx) => {
      const header = await tx.trxAgg.create({
        data: {
          period_date: targetPeriod,
          total_demand: prodTarget,
          production_target: prodTarget,
          strategy_used: strat
        }
      });

      await tx.trxAgd.create({
        data: {
          aggregate_id: header.aggregate_id,
          item_id: itemMtb.item_id,
          allocated_quantity: prodTarget
        }
      });

      return header;
    });

    console.log(`✅ Rencana Agregat Bulanan berhasil dibuat (TRX_AGG & TRX_AGD):`);
    console.log(`   * ID: ${aggregatePlan.aggregate_id}`);
    console.log(`   * Strategi: ${aggregatePlan.strategy_used}`);
    console.log(`   * Target Produksi: ${aggregatePlan.production_target}`);

    // 4. Simulasi Master Production Schedule (MPS)
    console.log("\n--- Langkah 3: Simulasi Jadwal Induk Mingguan (MPS) ---");
    // Kita pecah target produksi bulanan menjadi jadwal produksi mingguan (misal di minggu ke-2)
    const mpsDueDate = new Date("2026-06-15T00:00:00Z");
    const mpsQty = Math.round(prodTarget / 2); // pecah setengahnya untuk minggu itu

    const mpsEntry = await prisma.trxMps.create({
      data: {
        aggregate_id: aggregatePlan.aggregate_id,
        item_id: itemMtb.item_id,
        due_date: mpsDueDate,
        quantity_demanded: mpsQty
      }
    });

    console.log(`✅ Jadwal Induk Produksi (MPS) berhasil dibuat (TRX_MPS):`);
    console.log(`   * ID: ${mpsEntry.mps_id}`);
    console.log(`   * Tanggal Jatuh Tempo: ${mpsEntry.due_date.toISOString().split('T')[0]}`);
    console.log(`   * Qty Jadwal: ${mpsEntry.quantity_demanded}`);

    // 5. Simulasi Perhitungan MRP (BOM & Netting)
    console.log("\n--- Langkah 4: Simulasi Penguraian BOM & Netting (MRP) ---");
    
    // Panggil helper explodeBOM secara dinamis
    const { explodeBOM } = require('../lib/calculations/mrp');
    
    const mrpResults = await explodeBOM(
      mpsEntry.mps_id,
      mpsEntry.item_id,
      mpsEntry.quantity_demanded,
      mpsEntry.due_date
    );

    console.log(`✅ Perhitungan MRP Selesai! Menghasilkan ${mrpResults.length} baris kebutuhan material.`);
    
    // Tampilkan hasil penguraian BOM
    console.log("\nDetail Hasil Penguraian Bill of Materials (BOM):");
    console.log("--------------------------------------------------------------------------------------------------");
    console.log("Kode Item\t| Nama Item\t\t\t| Gross\t| Net Req\t| Safety\t| Release Date");
    console.log("--------------------------------------------------------------------------------------------------");
    for (const r of mrpResults) {
      const padName = r.item_name.padEnd(30, ' ');
      const relDateStr = r.order_release_date.toISOString().split('T')[0];
      console.log(`${r.item_code}\t| ${padName}\t| ${r.gross_requirement}\t| ${r.net_requirement}\t\t| ${r.safety_stock}\t\t| ${relDateStr}`);
    }
    console.log("--------------------------------------------------------------------------------------------------");

    // Simpan ke database
    console.log("Menyimpan hasil perhitungan MRP ke TRX_MRP...");
    for (const r of mrpResults) {
      await prisma.trxMrp.create({
        data: {
          mps_id: r.mps_id,
          item_id: r.item_id,
          gross_requirement: r.gross_requirement,
          net_requirement: r.net_requirement,
          safety_stock: r.safety_stock,
          order_release_date: r.order_release_date,
          due_date: r.due_date,
          status: r.status
        }
      });
    }
    console.log("✅ Berhasil menyimpan semua data MRP!");

  } catch (err) {
    console.error("❌ Terjadi error dalam pengujian pipeline:", err);
  } finally {
    await prisma.$disconnect();
    console.log("\n=== PENGUJIAN SELESAI ===");
  }
}

main();
