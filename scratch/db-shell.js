const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("❌ DATABASE_URL tidak ditemukan di .env");
  process.exit(1);
}

const pool = new Pool({ connectionString });

async function runQuery() {
  const queryText = process.argv[2];

  if (!queryText) {
    console.log("ℹ️ Cara Penggunaan: node scratch/db-shell.js \"Kueri SQL Anda\"");
    console.log("Contoh: node scratch/db-shell.js \"SELECT * FROM \\\"MST_ITE\\\"\"");
    process.exit(0);
  }

  try {
    const res = await pool.query(queryText);
    
    if (res.command === 'SELECT') {
      if (res.rows.length === 0) {
        console.log("Empty set (0 rows)");
      } else {
        console.table(res.rows);
        console.log(`(${res.rows.length} rows)`);
      }
    } else {
      console.log(`✅ Perintah berhasil dijalankan: ${res.command}`);
      if (res.rowCount !== null) {
        console.log(`Baris terpengaruh: ${res.rowCount}`);
      }
    }
  } catch (err) {
    console.error("❌ Error saat mengeksekusi SQL:");
    console.error(err.message);
  } finally {
    await pool.end();
  }
}

runQuery();
