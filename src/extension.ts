import * as vscode from 'vscode';

import { CredentialsStore, MissingCredentialError } from './credentials.js';
import { checkGitHubApi } from './githubClient.js';
import {
  checkPostgres,
  createPostgresPool,
  getRepoInventory,
  getRepoVulnFindings,
  type RepoInventory,
  type RepoVulnFindings,
  type PostgresPool
} from './postgresClient.js';

let postgresPool: PostgresPool | undefined;

type WebviewPayload =
  | {
      view: 'repoInventory';
      inventory: RepoInventory;
    }
  | {
      view: 'repoVulnFindings';
      findings: RepoVulnFindings;
    };

interface OpenExternalMessage {
  type: 'openExternal';
  url: string;
}

export function activate(context: vscode.ExtensionContext): void {
  const credentials = new CredentialsStore(context.secrets);

  const configureGitHubPat = (): Promise<void> =>
    runCommand(async () => {
      const stored = await credentials.configureGitHubPat();

      if (stored) {
        vscode.window.showInformationMessage('GitHub PAT stored for AppSec Workbench.');
      }
    });

  const checkGitHubApiCommand = (): Promise<void> =>
    runCommand(async () => {
      const token = await credentials.getGitHubPat();
      const result = await checkGitHubApi(token);

      vscode.window.showInformationMessage(
        `GitHub API OK for ${result.login}. Core rate limit: ${result.rateLimitRemaining}/${result.rateLimit}, resets ${result.rateLimitReset.toLocaleString()}.`
      );
    });

  const configurePostgres = (): Promise<void> =>
    runCommand(async () => {
      const stored = await credentials.configurePostgres();

      if (stored) {
        await disposePostgresPool();
        vscode.window.showInformationMessage('Postgres credentials stored for AppSec Workbench.');
      }
    });

  const checkPostgresCommand = (): Promise<void> =>
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
    });

  const viewRepoInventory = (): Promise<void> =>
    runCommand(async () => {
      const config = await credentials.getPostgresConfig();

      try {
        await disposePostgresPool();
        postgresPool = createPostgresPool(config);

        const inventory = await getRepoInventory(postgresPool);
        showRepoInventory(context, inventory);
      } catch (error) {
        await disposePostgresPool();
        throw error;
      }
    });

  const repoVulnFindings = (): Promise<void> =>
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
        showRepoVulnFindings(context, findings);
      } catch (error) {
        await disposePostgresPool();
        throw error;
      }
    });

  const clearStoredCredentials = (): Promise<void> =>
    runCommand(async () => {
      await credentials.clearAll();
      await disposePostgresPool();
      vscode.window.showInformationMessage('Stored AppSec Workbench credentials cleared.');
    });

  context.subscriptions.push(
    vscode.commands.registerCommand('appsecWorkbench.configureGitHubPat', configureGitHubPat),
    vscode.commands.registerCommand('appsecWorkbench.checkGitHubApi', checkGitHubApiCommand),
    vscode.commands.registerCommand('appsecWorkbench.configurePostgres', configurePostgres),
    vscode.commands.registerCommand('appsecWorkbench.checkPostgres', checkPostgresCommand),
    vscode.commands.registerCommand('appsecWorkbench.viewRepoInventory', viewRepoInventory),
    vscode.commands.registerCommand('appsecWorkbench.repoVulnFindings', repoVulnFindings),
    vscode.commands.registerCommand('appsecWorkbench.clearStoredCredentials', clearStoredCredentials)
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

    vscode.window.showErrorMessage(`AppSec Workbench command failed: ${getErrorMessage(error)}`);
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

function showRepoInventory(context: vscode.ExtensionContext, inventory: RepoInventory): void {
  const panel = vscode.window.createWebviewPanel(
    'appsecWorkbench.repoInventory',
    'Repo Inventory',
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
      localResourceRoots: [getWebviewRoot(context)]
    }
  );

  attachWebviewMessageHandlers(context, panel);
  panel.webview.html = renderWebviewHtml(context, panel.webview, 'Repo Inventory', {
    view: 'repoInventory',
    inventory
  });
}

function showRepoVulnFindings(context: vscode.ExtensionContext, findings: RepoVulnFindings): void {
  const panel = vscode.window.createWebviewPanel(
    'appsecWorkbench.repoVulnFindings',
    `Repo Vuln Findings: ${findings.fullName}`,
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
      localResourceRoots: [getWebviewRoot(context)]
    }
  );

  attachWebviewMessageHandlers(context, panel);
  panel.webview.html = renderWebviewHtml(context, panel.webview, 'Repo Vuln Findings', {
    view: 'repoVulnFindings',
    findings
  });
}

function renderWebviewHtml(
  context: vscode.ExtensionContext,
  webview: vscode.Webview,
  title: string,
  payload: WebviewPayload
): string {
  const nonce = getNonce();
  const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(getWebviewRoot(context), 'assets', 'webview.js'));
  const styleUri = webview.asWebviewUri(vscode.Uri.joinPath(getWebviewRoot(context), 'assets', 'webview.css'));
  const initialState = serializeWebviewState(payload);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${webview.cspSource} https: data:; font-src ${webview.cspSource}; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="${escapeHtml(styleUri.toString())}">
</head>
<body>
  <div id="root"></div>
  <script nonce="${nonce}">window.__APPSEC_WORKBENCH_INITIAL_STATE__ = ${initialState};</script>
  <script nonce="${nonce}" type="module" src="${escapeHtml(scriptUri.toString())}"></script>
</body>
</html>`;
}

function getWebviewRoot(context: vscode.ExtensionContext): vscode.Uri {
  return vscode.Uri.joinPath(context.extensionUri, 'media', 'webview');
}

function attachWebviewMessageHandlers(context: vscode.ExtensionContext, panel: vscode.WebviewPanel): void {
  const disposable = panel.webview.onDidReceiveMessage((message: unknown) =>
    runCommand(async () => {
      if (!isOpenExternalMessage(message)) {
        return;
      }

      const uri = vscode.Uri.parse(message.url, true);

      if (uri.scheme !== 'https') {
        vscode.window.showWarningMessage('AppSec Workbench blocked a non-HTTPS external link.');
        return;
      }

      await vscode.env.openExternal(uri);
    })
  );

  panel.onDidDispose(disposable.dispose, disposable, context.subscriptions);
}

function isOpenExternalMessage(message: unknown): message is OpenExternalMessage {
  if (!message || typeof message !== 'object') {
    return false;
  }

  const candidate = message as Partial<OpenExternalMessage>;
  return candidate.type === 'openExternal' && typeof candidate.url === 'string';
}

function serializeWebviewState(payload: WebviewPayload): string {
  return JSON.stringify(payload).replace(/[<>&\u2028\u2029]/g, (character) => {
    switch (character) {
      case '<':
        return '\\u003C';
      case '>':
        return '\\u003E';
      case '&':
        return '\\u0026';
      case '\u2028':
        return '\\u2028';
      case '\u2029':
        return '\\u2029';
      default:
        return character;
    }
  });
}

function getNonce(): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let text = '';

  for (let index = 0; index < 32; index += 1) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }

  return text;
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
