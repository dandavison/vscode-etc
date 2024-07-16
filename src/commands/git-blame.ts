import * as vscode from 'vscode';
import { log } from '../log';

export async function gitBlame() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const path = editor.document.uri.fsPath;
  if (path) {
    let cmd = 'git -c delta.width=0 blame ';
    const [start, end] = [
      editor.selection.start.line,
      editor.selection.end.line,
    ];
    if (end > start) {
      cmd += `-L ${start + 1},${end + 1} `;
    }
    cmd += path;
    const terminal =
      vscode.window.activeTerminal || vscode.window.createTerminal();
    terminal.show();
    terminal.sendText(cmd, true);
  } else {
    log('gitBlame: could not determine editor document path');
  }
}
