export interface WebviewHtmlOptions {
  cspSource: string;
  language: 'en' | 'zh-CN';
  nonce: string;
  scriptUri: string;
  styleUri: string;
  title: string;
}

export function createWebviewHtml(options: WebviewHtmlOptions): string {
  const { cspSource, language, nonce, scriptUri, styleUri, title } = options;
  return `<!DOCTYPE html>
<html lang="${language}">
  <head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${cspSource} data:; font-src ${cspSource}; style-src ${cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link href="${styleUri}" rel="stylesheet">
    <title>${title}</title>
  </head>
  <body>
    <div id="root"></div>
    <script nonce="${nonce}" src="${scriptUri}"></script>
  </body>
</html>`;
}

export function createNonce(random: () => number = Math.random): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let value = '';
  for (let index = 0; index < 32; index += 1) {
    value += alphabet.charAt(Math.floor(random() * alphabet.length));
  }
  return value;
}
