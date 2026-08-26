import * as assert from 'node:assert';
import * as vscode from 'vscode';

const EXTENSION_ID = 'emerardd.bug-barrage';
const COMMAND_ID = 'bugBarrage.toggleGame';
const DIAGNOSTICS_COMMAND_ID = 'bugBarrage.internal.getDiagnostics';
const VIEW_TYPE = 'bugBarrage.game';

interface ExtensionDiagnostics {
  panelExists: boolean;
  panelActive: boolean;
  webviewReady: boolean;
}

async function waitFor(predicate: () => boolean | Promise<boolean>, description: string): Promise<void> {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    if (await predicate()) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  assert.fail(`Timed out waiting for ${description}.`);
}

function isGameTabActive(): boolean {
  const input = vscode.window.tabGroups.activeTabGroup.activeTab?.input;
  return input instanceof vscode.TabInputWebview && input.viewType.endsWith(VIEW_TYPE);
}

suite('Bug Barrage extension', () => {
  test('toggles from code to the retained game panel and back', async () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(extension, `Expected ${EXTENSION_ID} to be installed in the test host.`);
    await extension.activate();

    const readmeUri = vscode.Uri.joinPath(extension.extensionUri, 'README.md');
    const document = await vscode.workspace.openTextDocument(readmeUri);
    await vscode.window.showTextDocument(document, { preview: false });

    await vscode.commands.executeCommand(COMMAND_ID);
    await waitFor(isGameTabActive, 'the game webview to become active');
    await waitFor(async () => {
      const diagnostics = await vscode.commands.executeCommand<ExtensionDiagnostics>(DIAGNOSTICS_COMMAND_ID);
      return diagnostics.panelExists && diagnostics.panelActive && diagnostics.webviewReady;
    }, 'the Webview React bundle to signal readiness');

    await vscode.commands.executeCommand(COMMAND_ID);
    await waitFor(() => vscode.window.activeTextEditor?.document.uri.toString() === readmeUri.toString(), 'the original editor to become active');

    await vscode.commands.executeCommand(COMMAND_ID);
    await waitFor(isGameTabActive, 'the retained game webview to be revealed');

    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });
});
