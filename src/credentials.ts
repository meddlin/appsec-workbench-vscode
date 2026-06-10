import * as vscode from 'vscode';

const secretKeys = {
  githubPat: 'appsecWorkbench.githubPat',
  postgresConnectionString: 'appsecWorkbench.postgresConnectionString',
  postgresUser: 'appsecWorkbench.postgresUser',
  postgresPassword: 'appsecWorkbench.postgresPassword'
} as const;

export interface PostgresSecretConfig {
  connectionString: string;
  user?: string;
  password?: string;
}

export class MissingCredentialError extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'MissingCredentialError';
  }
}

export class CredentialsStore {
  public constructor(private readonly secrets: vscode.SecretStorage) {}

  public async configureGitHubPat(): Promise<boolean> {
    const pat = await vscode.window.showInputBox({
      prompt: 'GitHub personal access token',
      password: true,
      ignoreFocusOut: true,
      validateInput: (value) => {
        return value.trim().length > 0 ? undefined : 'GitHub PAT is required.';
      }
    });

    if (pat === undefined) {
      return false;
    }

    await this.secrets.store(secretKeys.githubPat, pat.trim());
    return true;
  }

  public async getGitHubPat(): Promise<string> {
    const pat = await this.secrets.get(secretKeys.githubPat);

    if (!pat) {
      throw new MissingCredentialError('GitHub PAT is not configured. Run "AppSec Workbench: Configure GitHub PAT" first.');
    }

    return pat;
  }

  public async configurePostgres(): Promise<boolean> {
    const connectionString = await vscode.window.showInputBox({
      prompt: 'Postgres connection string',
      placeHolder: 'postgres://user:password@host:5432/database',
      password: true,
      ignoreFocusOut: true,
      validateInput: (value) => {
        return value.trim().length > 0 ? undefined : 'Postgres connection string is required.';
      }
    });

    if (connectionString === undefined) {
      return false;
    }

    const user = await vscode.window.showInputBox({
      prompt: 'Postgres username override (optional)',
      ignoreFocusOut: true
    });

    if (user === undefined) {
      return false;
    }

    const password = await vscode.window.showInputBox({
      prompt: 'Postgres password override (optional)',
      password: true,
      ignoreFocusOut: true
    });

    if (password === undefined) {
      return false;
    }

    await this.secrets.store(secretKeys.postgresConnectionString, connectionString.trim());
    await this.storeOptionalSecret(secretKeys.postgresUser, user.trim());
    await this.storeOptionalSecret(secretKeys.postgresPassword, password);

    return true;
  }

  public async getPostgresConfig(): Promise<PostgresSecretConfig> {
    const connectionString = await this.secrets.get(secretKeys.postgresConnectionString);

    if (!connectionString) {
      throw new MissingCredentialError('Postgres is not configured. Run "AppSec Workbench: Configure Postgres" first.');
    }

    const user = await this.secrets.get(secretKeys.postgresUser);
    const password = await this.secrets.get(secretKeys.postgresPassword);

    return {
      connectionString,
      user: user || undefined,
      password: password || undefined
    };
  }

  public async clearAll(): Promise<void> {
    await Promise.all(Object.values(secretKeys).map(async (key) => this.secrets.delete(key)));
  }

  private async storeOptionalSecret(key: string, value: string): Promise<void> {
    if (value.length === 0) {
      await this.secrets.delete(key);
      return;
    }

    await this.secrets.store(key, value);
  }
}
