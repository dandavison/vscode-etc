import * as vscode from 'vscode';
import * as http from 'http';

export async function openViaWormhole(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }
    const filePath = editor.document.uri.fsPath;
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