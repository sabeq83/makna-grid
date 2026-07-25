import pkg from 'pg';
const { Pool } = pkg;

const PG_HOST = process.env.PGHOST || '100.78.186.123';
const PG_PORT = parseInt(process.env.PGPORT || '5432', 10);
const PG_USER = process.env.PGUSER || 'makna_user';
const PG_PASSWORD = process.env.PGPASSWORD || 'maknagridpass';
const PG_DATABASE = process.env.PGDATABASE || 'makna_grid_db';

let pool;

export function getPgPool() {
  if (!pool) {
    pool = new Pool({
      host: PG_HOST,
      port: PG_PORT,
      user: PG_USER,
      password: PG_PASSWORD,
      database: PG_DATABASE,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('[PostgreSQL Pool Error]', err);
    });

    console.log(`[PostgreSQL] Connection Pool initialized to ${PG_HOST}:${PG_PORT}/${PG_DATABASE}`);
  }
  return pool;
}

export async function pgQuery(text, params = []) {
  const pool = getPgPool();
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`[PostgreSQL Slow Query] ${duration}ms: ${text.slice(0, 80)}`);
    }
    return res;
  } catch (err) {
    console.error('[PostgreSQL Query Error]', err.message, 'SQL:', text);
    throw err;
  }
}
