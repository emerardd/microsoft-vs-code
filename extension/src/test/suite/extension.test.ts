import * as assert from 'node:assert';
import * as vscode from 'vscode';

const EXTENSION_ID = 'emerardd.macrohard-vs-code';
const COMMAND_ID = 'macrohardVsCode.toggleGame';
const DIAGNOSTICS_COMMAND_ID = 'macrohardVsCode.internal.getDiagnostics';
const VIEW_TYPE = 'macrohardVsCode.game';

interface ExtensionDiagnostics {
  panelExists: boolean;
  panelActive: boolean;
  webviewReady: boolean;
  gameMounted: boolean;
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

suite('Macrohard vs Code extension', () => {
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
      return diagnostics.panelExists && diagnostics.panelActive && diagnostics.webviewReady && diagnostics.gameMounted;
    }, 'the profile handshake and React game to mount');

    await vscode.commands.executeCommand(COMMAND_ID);
    await waitFor(() => vscode.window.activeTextEditor?.document.uri.toString() === readmeUri.toString(), 'the original editor to become active');

    await vscode.commands.executeCommand(COMMAND_ID);
    await waitFor(isGameTabActive, 'the retained game webview to be revealed');

    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
    await vscode.commands.executeCommand(COMMAND_ID);
    await waitFor(async () => (await vscode.commands.executeCommand<ExtensionDiagnostics>(DIAGNOSTICS_COMMAND_ID)).gameMounted, 'a newly created panel to load its profile and mount');
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
  });
});
