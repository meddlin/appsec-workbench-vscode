import pg from 'pg';

import type { PoolConfig } from 'pg';
import type { PostgresSecretConfig } from './credentials.js';

const { Pool } = pg;

export type PostgresPool = pg.Pool;

export interface RepoInventory {
  columns: string[];
  rows: Record<string, unknown>[];
}

export interface RepoVulnFindings {
  fullName: string;
  codeqlOpen: CodeQlFinding[];
  codeqlDismissed: CodeQlFinding[];
  dependabotOpen: DependabotFinding[];
  dependabotDismissed: DependabotFinding[];
}

export interface CodeQlFinding {
  githubNumber: number;
  state: string;
  severity: string | null;
  githubRuleSeverity: string | null;
  ruleId: string | null;
  ruleName: string | null;
  ruleDescription: string | null;
  path: string | null;
  startLine: number | null;
  endLine: number | null;
  message: string | null;
  htmlUrl: string | null;
  githubUpdatedAt: Date | string | null;
  dismissedAt: Date | string | null;
}

export interface DependabotFinding {
  githubNumber: number;
  state: string;
  severity: string | null;
  packageName: string | null;
  ecosystem: string | null;
  manifestPath: string | null;
  vulnerableVersionRange: string | null;
  patchedVersions: string | null;
  advisorySummary: string | null;
  htmlUrl: string | null;
  githubUpdatedAt: Date | string | null;
  dismissedAt: Date | string | null;
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

export async function getRepoVulnFindings(pool: PostgresPool, fullName: string): Promise<RepoVulnFindings> {
  const repositoryResult = await pool.query<{ id: string; fullName: string }>(
    `select r."id", r."fullName"
from "Repository" r
where r."fullName" = $1;`,
    [fullName]
  );
  const repository = repositoryResult.rows[0];

  if (!repository) {
    throw new Error(`Repository not found in Postgres inventory: ${fullName}`);
  }

  const [codeqlResult, dependabotResult] = await Promise.all([
    pool.query<CodeQlFinding>(
      `select
  c."githubNumber",
  c."state",
  c."severity",
  c."githubRuleSeverity",
  c."ruleId",
  c."ruleName",
  c."ruleDescription",
  c."path",
  c."startLine",
  c."endLine",
  c."message",
  c."htmlUrl",
  c."githubUpdatedAt",
  c."dismissedAt"
from "CodeQlAlert" c
where c."repositoryId" = $1
  and c."state" <> 'fixed'
  and (
    c."state" in ('open', 'dismissed')
    or c."dismissedAt" is not null
  )
order by c."githubUpdatedAt" desc nulls last, c."githubNumber" asc;`,
      [repository.id]
    ),
    pool.query<DependabotFinding>(
      `select
  d."githubNumber",
  d."state",
  d."severity",
  d."packageName",
  d."ecosystem",
  d."manifestPath",
  d."vulnerableVersionRange",
  d."patchedVersions",
  d."advisorySummary",
  d."htmlUrl",
  d."githubUpdatedAt",
  d."dismissedAt"
from "DependabotAlert" d
where d."repositoryId" = $1
  and d."state" <> 'fixed'
  and (
    d."state" in ('open', 'dismissed', 'auto_dismissed')
    or d."dismissedAt" is not null
  )
order by d."githubUpdatedAt" desc nulls last, d."githubNumber" asc;`,
      [repository.id]
    )
  ]);

  return {
    fullName: repository.fullName,
    codeqlOpen: codeqlResult.rows.filter((finding) => !isCodeQlDismissed(finding)),
    codeqlDismissed: codeqlResult.rows.filter(isCodeQlDismissed),
    dependabotOpen: dependabotResult.rows.filter((finding) => !isDependabotDismissed(finding)),
    dependabotDismissed: dependabotResult.rows.filter(isDependabotDismissed)
  };
}

function isCodeQlDismissed(finding: CodeQlFinding): boolean {
  return finding.state === 'dismissed' || finding.dismissedAt !== null;
}

function isDependabotDismissed(finding: DependabotFinding): boolean {
  return finding.state === 'dismissed' || finding.state === 'auto_dismissed' || finding.dismissedAt !== null;
}
