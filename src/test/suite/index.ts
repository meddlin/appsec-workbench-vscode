import assert from 'node:assert/strict';

import * as vscode from 'vscode';

const expectedCommands = [
  'appsecWorkbench.configureGitHubPat',
  'appsecWorkbench.checkGitHubApi',
  'appsecWorkbench.configurePostgres',
  'appsecWorkbench.checkPostgres',
  'appsecWorkbench.viewRepoInventory',
  'appsecWorkbench.repoVulnFindings',
  'appsecWorkbench.clearStoredCredentials'
];

export async function run(): Promise<void> {
  const extension = vscode.extensions.all.find((candidate) => {
    return candidate.packageJSON.name === 'appsec-workbench-vscode';
  });

  assert.ok(extension, 'Expected the AppSec Workbench extension to be installed in the test host.');

  await extension.activate();

  const commands = await vscode.commands.getCommands(true);

  for (const command of expectedCommands) {
    assert.ok(commands.includes(command), `Expected command to be registered: ${command}`);
  }
}
