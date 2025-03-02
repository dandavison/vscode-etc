import * as vscode from 'vscode';

export async function ripgrep() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const pattern = editor.document.getText(editor.selection);
  let cmd = `rn ${pattern}`;
  const terminal =
    vscode.window.activeTerminal || vscode.window.createTerminal();
  terminal.show();
  vscode.commands.executeCommand('workbench.action.toggleMaximizedPanel');
  terminal.sendText(cmd, Boolean(pattern));
}
