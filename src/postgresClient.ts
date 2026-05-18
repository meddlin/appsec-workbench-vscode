import pg from 'pg';

import type { PoolConfig } from 'pg';
import type { PostgresSecretConfig } from './credentials.js';

const { Pool } = pg;

export type PostgresPool = pg.Pool;

export interface RepoInventory {
  columns: string[];
  rows: Record<string, unknown>[];
}

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

export async function getRepoInventory(pool: PostgresPool): Promise<RepoInventory> {
  const result = await pool.query<Record<string, unknown>>(
    `select
  r."fullName",
  r."visibility",
  r."defaultBranch",
  r."primaryLanguage",
  r."archived",
  r."updatedAt"
from "Repository" r
order by r."fullName";`
  );

  return {
    columns: result.fields.map((field) => field.name),
    rows: result.rows
  };
}
