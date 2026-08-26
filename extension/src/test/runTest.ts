import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { runTests } from '@vscode/test-electron';

async function main(): Promise<void> {
  const extensionDevelopmentPath = path.resolve(__dirname, '..', '..');
  const extensionTestsPath = path.resolve(__dirname, 'suite', 'index');
  const isolatedRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bug-barrage-vscode-test-'));
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
    const resolvedTemp = path.resolve(os.tmpdir());
    const resolvedTarget = path.resolve(isolatedRoot);
    if (resolvedTarget.startsWith(`${resolvedTemp}${path.sep}`)) {
      fs.rmSync(resolvedTarget, { recursive: true, force: true });
    }
  }
}

main().catch(error => {
  console.error('Bug Barrage integration tests failed.', error);
  process.exitCode = 1;
});
