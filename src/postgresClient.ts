import pg from 'pg';

import type { PoolConfig } from 'pg';
import type { PostgresSecretConfig } from './credentials.js';

const { Pool } = pg;

export type PostgresPool = pg.Pool;

export function createPostgresPool(config: PostgresSecretConfig): PostgresPool {
  const poolConfig: PoolConfig = {
    connectionString: config.connectionString
  };

  if (config.user) {
    poolConfig.user = config.user;
  }

  if (config.password) {
    poolConfig.password = config.password;
  }

  return new Pool(poolConfig);
}

export async function checkPostgres(pool: PostgresPool): Promise<Date | string> {
  const result = await pool.query<{ now: Date | string }>('SELECT now() AS now');
  const row = result.rows[0];

  if (!row) {
    throw new Error('Postgres health check returned no rows.');
  }

  return row.now;
}
