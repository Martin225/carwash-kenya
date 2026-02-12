const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
  ssl: { rejectUnauthorized: false }
});

async function query(text, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } catch (error) {
    console.error('DB Error:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

async function querySingle(text, params = []) {
  const rows = await query(text, params);
  return rows[0] || null;
}

module.exports = { query, querySingle };