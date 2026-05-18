import * as vscode from 'vscode';

import { CredentialsStore, MissingCredentialError } from './credentials.js';
import { checkGitHubApi } from './githubClient.js';
import { checkPostgres, createPostgresPool, type PostgresPool } from './postgresClient.js';

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
