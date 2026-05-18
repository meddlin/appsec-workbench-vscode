import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { runTests } from '@vscode/test-electron';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

async function main(): Promise<void> {
  const extensionDevelopmentPath = path.resolve(currentDirectory, '../..');
  const extensionTestsPath = path.resolve(currentDirectory, './suite/index.js');

  await runTests({
    extensionDevelopmentPath,
    extensionTestsPath,
    extensionTestsEnv: {
      ELECTRON_RUN_AS_NODE: undefined
    },
    launchArgs: ['--disable-extensions']
  });
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
