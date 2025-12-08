import * as vscode from 'vscode';

let statusBarItem: vscode.StatusBarItem;

export function createFilePathStatus() {
  // Left alignment, high priority to appear near the left
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'etc.copyGithubUrl';
  statusBarItem.tooltip = 'Click to copy GitHub URL';
  updateFilePathStatus();
  statusBarItem.show();
}

export function updateFilePathStatus() {
  if (!statusBarItem) {
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    statusBarItem.hide();
    return;
  }

  const filePath = editor.document.uri.fsPath;
  const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);

  if (workspaceFolder) {
    const relativePath = vscode.workspace.asRelativePath(editor.document.uri, false);
    statusBarItem.text = relativePath;
  } else {
    // File is outside workspace - show full path
    statusBarItem.text = filePath;
  }

  statusBarItem.show();
}


