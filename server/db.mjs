import pg from 'pg';
import { readFile, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';

export function database(connectionString) {
  const pool = new pg.Pool({ connectionString, max: 10, statement_timeout: 10000 });
  return {
    query: (sql, args) => pool.query(sql, args),
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally { client.release(); }
    },
    close: () => pool.end(),
  };
}

export async function migrate(db) {
  await db.transaction(async tx => {
    await tx.query("SELECT pg_advisory_xact_lock(814527)");
    await tx.query('CREATE TABLE IF NOT EXISTS migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz DEFAULT now())');
    const directory = new URL('./migrations/', import.meta.url);
    for (const name of (await readdir(directory)).filter(n => n.endsWith('.sql')).sort()) {
      const sql = await readFile(new URL(name, directory), 'utf8');
      const checksum = createHash('sha256').update(sql).digest('hex');
      const old = (await tx.query('SELECT checksum FROM migrations WHERE name=$1', [name])).rows[0];
      if (old && old.checksum !== checksum) throw new Error(`Changed migration: ${name}`);
      if (!old) {
        await tx.query(sql);
        await tx.query('INSERT INTO migrations(name,checksum) VALUES ($1,$2)', [name,checksum]);
      }
    }
  });
}
