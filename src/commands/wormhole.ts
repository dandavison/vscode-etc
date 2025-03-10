import * as vscode from 'vscode';
import * as http from 'http';
import { log } from '../log';
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
];

export async function openViaWormhole(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const filePath = transformFilePath(editor.document.uri.fsPath);
    if (!filePath) {
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

function transformFilePath(filePath: string): string | null {
    for (const [pattern, replacement] of pathTransformationRules) {
        log(`Checking ${filePath} against ${pattern}`);
        if (filePath.match(pattern)) {
            const transformed = filePath.replace(pattern, replacement);
            log(`Transformed ${filePath} to ${transformed}`);
            return transformed;
        }
    }

    return filePath;
}

export async function onDidOpenTextDocument(document: vscode.TextDocument) {
    // Skip non-file schemes (like git:, untitled:, etc.)
    if (document.uri.scheme !== 'file') {
      return;
    }

    const filePath = document.uri.fsPath;
    const workspaceFolders = vscode.workspace.workspaceFolders;

    const isOutsideWorkspace = !workspaceFolders?.some(folder =>
      filePath.startsWith(folder.uri.fsPath)
    );

    if (isOutsideWorkspace) {
      // Use a slight delay to ensure the editor is fully opened
      setTimeout(async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor && editor.document === document) {
          await openViaWormhole();
        }
      }, 100);
    }
  }