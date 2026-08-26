import * as vscode from 'vscode';
import { decideToggleAction } from './toggleDecision';
import { createNonce, createWebviewHtml } from './webviewHtml';

const COMMAND_ID = 'macrohardVsCode.toggleGame';
const DIAGNOSTICS_COMMAND_ID = 'macrohardVsCode.internal.getDiagnostics';
const VIEW_TYPE = 'macrohardVsCode.game';
const GAME_ACTIVE_CONTEXT = 'macrohardVsCode.gameActive';
const PREVIOUS_EDITOR_COMMAND = 'workbench.action.openPreviousRecentlyUsedEditorInGroup';

const isSimplifiedChinese = ['zh-cn', 'zh-hans'].some(language => (
  vscode.env.language.toLowerCase().startsWith(language)
));
const BRAND_NAME = isSimplifiedChinese ? '巨硬大战代码' : 'Macrohard vs Code';
const STATUS_TOOLTIP = isSimplifiedChinese
  ? '切换巨硬大战代码（Ctrl+Alt+G）'
  : 'Toggle Macrohard vs Code (Ctrl+Alt+G)';

let currentPanel: vscode.WebviewPanel | undefined;
let panelIsActive = false;
let webviewReady = false;

function getPanelState(): 'missing' | 'active' | 'hidden' {
  if (!currentPanel) return 'missing';
  return panelIsActive ? 'active' : 'hidden';
}

async function leaveGame(panel: vscode.WebviewPanel): Promise<void> {
  panelIsActive = false;
  await vscode.commands.executeCommand('setContext', GAME_ACTIVE_CONTEXT, false);
  await panel.webview.postMessage({ type: 'pause-before-hide' });
  await vscode.commands.executeCommand(PREVIOUS_EDITOR_COMMAND);
  await new Promise(resolve => setTimeout(resolve, 0));
  panelIsActive = panel.active;
  await vscode.commands.executeCommand('setContext', GAME_ACTIVE_CONTEXT, panelIsActive);
}

function configurePanel(panel: vscode.WebviewPanel, context: vscode.ExtensionContext): void {
  currentPanel = panel;
  panelIsActive = panel.active;
  webviewReady = false;
  const mediaRoot = vscode.Uri.joinPath(context.extensionUri, 'media');
  const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'game.js'));
  const styleUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'game.css'));

  panel.webview.html = createWebviewHtml({
    cspSource: panel.webview.cspSource,
    language: isSimplifiedChinese ? 'zh-CN' : 'en',
    nonce: createNonce(),
    scriptUri: scriptUri.toString(),
    styleUri: styleUri.toString(),
    title: BRAND_NAME,
  });

  panel.webview.onDidReceiveMessage(
    async (message: { type?: string }) => {
      if (message.type === 'ready' && currentPanel === panel) {
        webviewReady = true;
        return;
      }
      if (message.type === 'return-to-code' && currentPanel === panel) {
        await leaveGame(panel);
      }
    },
    undefined,
    context.subscriptions,
  );

  panel.onDidChangeViewState(
    ({ webviewPanel }) => {
      panelIsActive = webviewPanel.active;
      void vscode.commands.executeCommand('setContext', GAME_ACTIVE_CONTEXT, panelIsActive);
    },
    undefined,
    context.subscriptions,
  );

  panel.onDidDispose(
    () => {
      if (currentPanel === panel) currentPanel = undefined;
      panelIsActive = false;
      webviewReady = false;
      void vscode.commands.executeCommand('setContext', GAME_ACTIVE_CONTEXT, false);
    },
    undefined,
    context.subscriptions,
  );
}

function createPanel(context: vscode.ExtensionContext): vscode.WebviewPanel {
  const mediaRoot = vscode.Uri.joinPath(context.extensionUri, 'media');
  const panel = vscode.window.createWebviewPanel(
    VIEW_TYPE,
    BRAND_NAME,
    vscode.ViewColumn.Active,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [mediaRoot],
    },
  );
  configurePanel(panel, context);
  return panel;
}

async function toggleGame(context: vscode.ExtensionContext): Promise<void> {
  const action = decideToggleAction(getPanelState());
  if (action === 'create') {
    const panel = createPanel(context);
    await vscode.commands.executeCommand('setContext', GAME_ACTIVE_CONTEXT, panel.active);
    return;
  }
  if (!currentPanel) return;
  if (action === 'leave') {
    await leaveGame(currentPanel);
    return;
  }
  currentPanel.reveal(currentPanel.viewColumn ?? vscode.ViewColumn.Active);
  panelIsActive = true;
  await vscode.commands.executeCommand('setContext', GAME_ACTIVE_CONTEXT, true);
}

export function activate(context: vscode.ExtensionContext): void {
  void vscode.commands.executeCommand('setContext', GAME_ACTIVE_CONTEXT, false);

  context.subscriptions.push(
    vscode.commands.registerCommand(COMMAND_ID, () => toggleGame(context)),
    vscode.commands.registerCommand(DIAGNOSTICS_COMMAND_ID, () => ({
      panelExists: currentPanel !== undefined,
      panelActive: panelIsActive,
      webviewReady,
    })),
  );

  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBarItem.command = COMMAND_ID;
  statusBarItem.text = `$(game) ${BRAND_NAME}`;
  statusBarItem.tooltip = STATUS_TOOLTIP;
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);
}

export function deactivate(): void {
  currentPanel = undefined;
  panelIsActive = false;
  webviewReady = false;
}
