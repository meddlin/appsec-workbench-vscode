import assert from 'node:assert/strict';

import * as vscode from 'vscode';

const expectedCommands = [
  'appsecSidecar.configureGitHubPat',
  'appsecSidecar.checkGitHubApi',
  'appsecSidecar.configurePostgres',
  'appsecSidecar.checkPostgres',
  'appsecSidecar.viewRepoInventory',
  'appsecSidecar.clearStoredCredentials'
];

export async function run(): Promise<void> {
  const extension = vscode.extensions.all.find((candidate) => {
    return candidate.packageJSON.name === 'appsec-sidecar-vscode';
  });

  assert.ok(extension, 'Expected the AppSec Sidecar extension to be installed in the test host.');

  await extension.activate();

  const commands = await vscode.commands.getCommands(true);

  for (const command of expectedCommands) {
    assert.ok(commands.includes(command), `Expected command to be registered: ${command}`);
  }
}
