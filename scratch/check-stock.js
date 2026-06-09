const { Client } = require('pg');
require('dotenv').config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;
const client = new Client({ connectionString });

async function main() {
  try {
    await client.connect();
    const res = await client.query(`
      SELECT i.item_code, i.item_name, i.item_type,
             COALESCE(
               (SELECT current_stock 
                FROM "TRX_INV" l 
                WHERE l.item_id = i.item_id 
                ORDER BY created_at DESC, ledger_id DESC 
                LIMIT 1), 
               0
             ) as current_stock
      FROM "MST_ITE" i
      ORDER BY i.item_type, i.item_code
    `);
    console.table(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

main();
