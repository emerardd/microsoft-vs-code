import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const extensionRoot = process.cwd();
const outputDirectory = path.resolve(extensionRoot, '..', 'artifacts');
const outputPath = path.join(outputDirectory, 'bug-barrage-0.1.0.vsix');
const vsceCli = path.join(extensionRoot, 'node_modules', '@vscode', 'vsce', 'vsce');

mkdirSync(outputDirectory, { recursive: true });

const result = spawnSync(
  process.execPath,
  [vsceCli, 'package', '--no-dependencies', '--out', outputPath],
  { cwd: extensionRoot, stdio: 'inherit' },
);

if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
