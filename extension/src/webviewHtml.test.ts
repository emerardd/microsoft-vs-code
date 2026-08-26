import { describe, expect, it } from 'vitest';
import { createNonce, createWebviewHtml } from './webviewHtml';

describe('webview HTML', () => {
  it('restricts scripts to a nonce and mounts only packaged assets', () => {
    const html = createWebviewHtml({
      cspSource: 'vscode-webview-resource:',
      language: 'zh-CN',
      nonce: 'fixed-nonce',
      scriptUri: 'game.js',
      styleUri: 'game.css',
      title: '巨硬大战代码',
    });

    expect(html).toContain("default-src 'none'");
    expect(html).toContain("script-src 'nonce-fixed-nonce'");
    expect(html).toContain('<script nonce="fixed-nonce" src="game.js"></script>');
    expect(html).toContain('<link href="game.css" rel="stylesheet">');
    expect(html).toContain('<html lang="zh-CN">');
    expect(html).toContain('<title>巨硬大战代码</title>');
    expect(html).not.toContain('https:');
  });

  it('creates a 32-character nonce from the supplied entropy source', () => {
    expect(createNonce(() => 0.5)).toBe('f'.repeat(32));
  });
});
