import * as vscode from 'vscode';

export async function ripgrep() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const pattern = editor.document.getText(editor.selection);
  let cmd = `rgd ${pattern}`;
  const terminal =
    vscode.window.activeTerminal || vscode.window.createTerminal();
  terminal.show();
  terminal.sendText(cmd, true);
}
