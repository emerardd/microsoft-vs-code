import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { runTests } from '@vscode/test-electron';

async function main(): Promise<void> {
  const extensionDevelopmentPath = path.resolve(__dirname, '..', '..');
  const extensionTestsPath = path.resolve(__dirname, 'suite', 'index');
  const tempRoot = path.resolve(process.env.MACROHARD_TEST_TMPDIR ?? os.tmpdir());
  fs.mkdirSync(tempRoot, { recursive: true });
  const isolatedRoot = fs.mkdtempSync(path.join(tempRoot, 'macrohard-vs-code-test-'));
  const userDataDir = path.join(isolatedRoot, 'user-data');
  const extensionsDir = path.join(isolatedRoot, 'extensions');
  const vscodeExecutablePath = process.env.VSCODE_EXECUTABLE_PATH;

  try {
    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath,
      vscodeExecutablePath,
      launchArgs: [
        '--disable-extensions',
        '--disable-gpu',
        '--skip-release-notes',
        '--skip-welcome',
        `--user-data-dir=${userDataDir}`,
        `--extensions-dir=${extensionsDir}`,
      ],
    });
  } finally {
    const resolvedTemp = tempRoot;
    const resolvedTarget = path.resolve(isolatedRoot);
    if (resolvedTarget.startsWith(`${resolvedTemp}${path.sep}`)) {
      fs.rmSync(resolvedTarget, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 });
    }
  }
}

main().catch(error => {
  console.error('Macrohard vs Code integration tests failed.', error);
  process.exitCode = 1;
});
