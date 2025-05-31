import * as vscode from 'vscode';
import * as http from 'http';
import { log } from '../log';
import * as fs from 'fs';

const pathTransformationRules: [RegExp, string][] = [
  // E.g. /Users/dan/go/pkg/mod/github.com/nexus-rpc/sdk-go@v0.2.0/nexus/operation.go:114
  [
      /\/Users\/dan\/go\/pkg\/mod\/github\.com\/nexus-rpc\/sdk-go@v[0-9a-f.-]+\/(.*)/,
      '/Users/dan/src/temporalio/nexus-sdk-go/$1',
  ],
  // E.g. /Users/dan/go/pkg/mod/go.temporal.io/sdk@v1.32.2-0.20250211003938-22ebdc0dfafb/temporalnexus/operation.go:156
  [
      /\/Users\/dan\/go\/pkg\/mod\/go\.temporal\.io\/sdk@v[0-9a-f.-]+\/(.*)/,
      '/Users/dan/src/temporalio/sdk-go/$1',
  ],
  // // E.g. /Users/dan/.local/share/uv/python/cpython-3.9.21-macos-aarch64-none/lib/python3.9/asyncio/events.py:98
  // [
  //     /\/Users\/dan\/\.local\/share\/uv\/python\/cpython-[^/]+\/lib\/python[0-9.]+\/(.*)/,
  //     '/Users/dan/tmp/3p/cpython/Lib/$1',
  // ],
];

export async function openViaWormhole(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const filePath = getWormholeFilePath(editor.document.uri.fsPath);
    if (!filePath) {
        log(`No transformation found for ${editor.document.uri.fsPath}`);
        return;
    } else if (!fs.existsSync(filePath)) {
      log(`File does not exist: ${filePath}`);
      return;
    }

    const line = editor.selection.active.line + 1;

    await vscode.window.showTextDocument(editor.document, editor.viewColumn)
        .then(() => vscode.commands.executeCommand('workbench.action.closeActiveEditor'));

    const url = `http://localhost:7117/file/${filePath}:${line}`;

    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            if (res.statusCode !== 200) {
                vscode.window.showErrorMessage(`Failed to open ${url} via wormhole: ${res.statusCode}`);
                reject(new Error(`HTTP status ${res.statusCode}`));
            }
            resolve();
        }).on('error', (error) => {
            vscode.window.showErrorMessage(`Failed to open URL ${url} via wormhole: ${error.message}`);
            reject(error);
        });
    });
}

function getWormholeFilePath(filePath: string): string | null {
    for (const [pattern, replacement] of pathTransformationRules) {
        log(`Checking ${filePath} against ${pattern}`);
        if (filePath.match(pattern)) {
            const transformed = filePath.replace(pattern, replacement);
            log(`Transformed ${filePath} to ${transformed}`);
            return transformed;
        }
    }
    // Outside the workspace but a local repo; e.g. a Python dependency installed in editable mode.
    if (filePath.startsWith('/Users/dan/src/')) {
        return filePath;
    }
    return null;
}

export async function onDidOpenTextDocument(document: vscode.TextDocument) {
    if (document.uri.scheme !== 'file') {
        return;
    }
    const isOutsideWorkspace = !vscode.workspace.workspaceFolders?.some(folder =>
        document.uri.fsPath.startsWith(folder.uri.fsPath)
    );

    log(`${document.uri.fsPath} isOutsideWorkspace: ${isOutsideWorkspace}`);
    const autoOpen = vscode.workspace.getConfiguration('vscode-etc.wormhole').get('openOutsideWorkspace');
    if (autoOpen && isOutsideWorkspace) {
      // Use a slight delay to ensure the editor is fully opened
      setTimeout(async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document === document) {
          await openViaWormhole();
        }
      }, 500);
    }
}