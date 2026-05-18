import * as vscode from 'vscode';

import { CredentialsStore, MissingCredentialError } from './credentials.js';
import { checkGitHubApi } from './githubClient.js';
import {
  checkPostgres,
  createPostgresPool,
  getRepoInventory,
  getRepoVulnFindings,
  type CodeQlFinding,
  type DependabotFinding,
  type RepoInventory,
  type RepoVulnFindings,
  type PostgresPool
} from './postgresClient.js';

let postgresPool: PostgresPool | undefined;

export function activate(context: vscode.ExtensionContext): void {
  const credentials = new CredentialsStore(context.secrets);

  context.subscriptions.push(
    vscode.commands.registerCommand('appsecSidecar.configureGitHubPat', () =>
      runCommand(async () => {
        const stored = await credentials.configureGitHubPat();

        if (stored) {
          vscode.window.showInformationMessage('GitHub PAT stored for AppSec Sidecar.');
        }
      })
    ),
    vscode.commands.registerCommand('appsecSidecar.checkGitHubApi', () =>
      runCommand(async () => {
        const token = await credentials.getGitHubPat();
        const result = await checkGitHubApi(token);

        vscode.window.showInformationMessage(
          `GitHub API OK for ${result.login}. Core rate limit: ${result.rateLimitRemaining}/${result.rateLimit}, resets ${result.rateLimitReset.toLocaleString()}.`
        );
      })
    ),
    vscode.commands.registerCommand('appsecSidecar.configurePostgres', () =>
      runCommand(async () => {
        const stored = await credentials.configurePostgres();

        if (stored) {
          await disposePostgresPool();
          vscode.window.showInformationMessage('Postgres credentials stored for AppSec Sidecar.');
        }
      })
    ),
    vscode.commands.registerCommand('appsecSidecar.checkPostgres', () =>
      runCommand(async () => {
        const config = await credentials.getPostgresConfig();

        try {
          await disposePostgresPool();
          postgresPool = createPostgresPool(config);

          const now = await checkPostgres(postgresPool);
          vscode.window.showInformationMessage(`Postgres OK. SELECT now() returned ${formatTimestamp(now)}.`);
        } catch (error) {
          await disposePostgresPool();
          throw error;
        }
      })
    ),
    vscode.commands.registerCommand('appsecSidecar.viewRepoInventory', () =>
      runCommand(async () => {
        const config = await credentials.getPostgresConfig();

        try {
          await disposePostgresPool();
          postgresPool = createPostgresPool(config);

          const inventory = await getRepoInventory(postgresPool);
          showRepoInventory(inventory);
        } catch (error) {
          await disposePostgresPool();
          throw error;
        }
      })
    ),
    vscode.commands.registerCommand('appsecSidecar.repoVulnFindings', () =>
      runCommand(async () => {
        const fullName = await promptForRepoFullName();

        if (!fullName) {
          return;
        }

        const config = await credentials.getPostgresConfig();

        try {
          await disposePostgresPool();
          postgresPool = createPostgresPool(config);

          const findings = await getRepoVulnFindings(postgresPool, fullName);
          showRepoVulnFindings(findings);
        } catch (error) {
          await disposePostgresPool();
          throw error;
        }
      })
    ),
    vscode.commands.registerCommand('appsecSidecar.clearStoredCredentials', () =>
      runCommand(async () => {
        await credentials.clearAll();
        await disposePostgresPool();
        vscode.window.showInformationMessage('Stored AppSec Sidecar credentials cleared.');
      })
    )
  );
}

export async function deactivate(): Promise<void> {
  await disposePostgresPool();
}

async function runCommand(command: () => Promise<void>): Promise<void> {
  try {
    await command();
  } catch (error) {
    if (error instanceof MissingCredentialError) {
      vscode.window.showWarningMessage(error.message);
      return;
    }

    vscode.window.showErrorMessage(`AppSec Sidecar command failed: ${getErrorMessage(error)}`);
  }
}

async function disposePostgresPool(): Promise<void> {
  const pool = postgresPool;
  postgresPool = undefined;

  if (pool) {
    await pool.end();
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function formatTimestamp(value: Date | string): string {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

async function promptForRepoFullName(): Promise<string | undefined> {
  const fullName = await vscode.window.showInputBox({
    prompt: 'Repository full name',
    placeHolder: 'owner/repo',
    ignoreFocusOut: true,
    validateInput: (value) => {
      const trimmed = value.trim();

      if (trimmed.length === 0) {
        return 'Repository full name is required.';
      }

      return /^[^/\s]+\/[^/\s]+$/.test(trimmed) ? undefined : 'Use the owner/repo format.';
    }
  });

  return fullName?.trim();
}

function showRepoInventory(inventory: RepoInventory): void {
  const panel = vscode.window.createWebviewPanel(
    'appsecSidecar.repoInventory',
    'Repo Inventory',
    vscode.ViewColumn.Active,
    {
      enableScripts: false
    }
  );

  panel.webview.html = renderRepoInventoryHtml(inventory);
}

function showRepoVulnFindings(findings: RepoVulnFindings): void {
  const panel = vscode.window.createWebviewPanel(
    'appsecSidecar.repoVulnFindings',
    `Repo Vuln Findings: ${findings.fullName}`,
    vscode.ViewColumn.Active,
    {
      enableScripts: false
    }
  );

  panel.webview.html = renderRepoVulnFindingsHtml(findings);
}

function renderRepoInventoryHtml(inventory: RepoInventory): string {
  const headerCells = inventory.columns.map((column) => `<th>${escapeHtml(column)}</th>`).join('');
  const bodyRows = inventory.rows
    .map((row) => {
      const cells = inventory.columns
        .map((column) => `<td>${escapeHtml(formatCellValue(row[column]))}</td>`)
        .join('');

      return `<tr>${cells}</tr>`;
    })
    .join('');

  const content =
    inventory.rows.length === 0
      ? '<p class="empty-state">No repositories found in the Postgres inventory.</p>'
      : `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Repo Inventory</title>
  <style>
    body {
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      padding: 24px;
    }

    h1 {
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 16px;
    }

    table {
      border-collapse: collapse;
      width: 100%;
    }

    th,
    td {
      border: 1px solid var(--vscode-panel-border);
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background: var(--vscode-editorWidget-background);
      font-weight: 600;
      position: sticky;
      top: 0;
    }

    tr:nth-child(even) td {
      background: var(--vscode-list-hoverBackground);
    }

    .empty-state {
      color: var(--vscode-descriptionForeground);
      margin: 0;
    }
  </style>
</head>
<body>
  <h1>Repo Inventory</h1>
  ${content}
</body>
</html>`;
}

function renderRepoVulnFindingsHtml(findings: RepoVulnFindings): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Repo Vuln Findings</title>
  <style>
    body {
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      padding: 24px;
    }

    h1 {
      font-size: 20px;
      font-weight: 600;
      margin: 0 0 4px;
    }

    h2 {
      font-size: 16px;
      font-weight: 600;
      margin: 24px 0 10px;
    }

    p {
      margin: 0;
    }

    a {
      color: var(--vscode-textLink-foreground);
    }

    table {
      border-collapse: collapse;
      width: 100%;
    }

    th,
    td {
      border: 1px solid var(--vscode-panel-border);
      padding: 8px 10px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background: var(--vscode-editorWidget-background);
      font-weight: 600;
      position: sticky;
      top: 0;
    }

    tr:nth-child(even) td {
      background: var(--vscode-list-hoverBackground);
    }

    details {
      margin-top: 24px;
    }

    summary {
      cursor: pointer;
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .repo-name,
    .empty-state {
      color: var(--vscode-descriptionForeground);
    }
  </style>
</head>
<body>
  <h1>Repo Vuln Findings</h1>
  <p class="repo-name">${escapeHtml(findings.fullName)}</p>
  ${renderFindingsSection('CodeQL Open Findings', renderCodeQlTable(findings.codeqlOpen), findings.codeqlOpen.length)}
  ${renderFindingsSection(
    'Dependabot Open Findings',
    renderDependabotTable(findings.dependabotOpen),
    findings.dependabotOpen.length
  )}
  ${renderCollapsedFindingsSection(
    'CodeQL Dismissed Findings',
    renderCodeQlTable(findings.codeqlDismissed),
    findings.codeqlDismissed.length
  )}
  ${renderCollapsedFindingsSection(
    'Dependabot Dismissed Findings',
    renderDependabotTable(findings.dependabotDismissed),
    findings.dependabotDismissed.length
  )}
</body>
</html>`;
}

function renderFindingsSection(title: string, tableHtml: string, rowCount: number): string {
  return `<section>
    <h2>${escapeHtml(title)} (${rowCount})</h2>
    ${rowCount === 0 ? '<p class="empty-state">No findings found.</p>' : tableHtml}
  </section>`;
}

function renderCollapsedFindingsSection(title: string, tableHtml: string, rowCount: number): string {
  return `<details>
    <summary>${escapeHtml(title)} (${rowCount})</summary>
    ${rowCount === 0 ? '<p class="empty-state">No findings found.</p>' : tableHtml}
  </details>`;
}

function renderCodeQlTable(findings: CodeQlFinding[]): string {
  return renderTable(
    ['Number', 'Severity', 'Rule', 'Description', 'Location', 'Message', 'Updated', 'Link'],
    findings.map((finding) => [
      escapeHtml(String(finding.githubNumber)),
      escapeHtml(finding.severity || finding.githubRuleSeverity || ''),
      escapeHtml(formatRule(finding.ruleId, finding.ruleName)),
      escapeHtml(finding.ruleDescription || ''),
      formatLocation(finding.path, finding.startLine, finding.endLine),
      escapeHtml(finding.message || ''),
      formatNullableTimestamp(finding.githubUpdatedAt),
      renderLink(finding.htmlUrl)
    ])
  );
}

function renderDependabotTable(findings: DependabotFinding[]): string {
  return renderTable(
    ['Number', 'Severity', 'Package', 'Ecosystem', 'Manifest', 'Vulnerable Range', 'Patched Versions', 'Advisory', 'Updated', 'Link'],
    findings.map((finding) => [
      escapeHtml(String(finding.githubNumber)),
      escapeHtml(finding.severity || ''),
      escapeHtml(finding.packageName || ''),
      escapeHtml(finding.ecosystem || ''),
      escapeHtml(finding.manifestPath || ''),
      escapeHtml(finding.vulnerableVersionRange || ''),
      escapeHtml(finding.patchedVersions || ''),
      escapeHtml(finding.advisorySummary || ''),
      formatNullableTimestamp(finding.githubUpdatedAt),
      renderLink(finding.htmlUrl)
    ])
  );
}

function renderTable(headers: string[], rows: string[][]): string {
  const headerCells = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('');
  const bodyRows = rows
    .map((row) => {
      const cells = row.map((cell) => `<td>${cell}</td>`).join('');

      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `<table><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
}

function formatRule(ruleId: string | null, ruleName: string | null): string {
  const parts = [ruleId, ruleName].filter((part): part is string => Boolean(part));

  return parts.join(' - ');
}

function formatLocation(path: string | null, startLine: number | null, endLine: number | null): string {
  if (!path) {
    return '';
  }

  if (!startLine) {
    return escapeHtml(path);
  }

  const lineRange = endLine && endLine !== startLine ? `${startLine}-${endLine}` : String(startLine);

  return `${escapeHtml(path)}:${escapeHtml(lineRange)}`;
}

function formatNullableTimestamp(value: Date | string | null): string {
  if (!value) {
    return '';
  }

  return escapeHtml(formatTimestamp(value));
}

function renderLink(url: string | null): string {
  if (!url) {
    return '';
  }

  return `<a href="${escapeHtml(url)}">Open</a>`;
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return character;
    }
  });
}
