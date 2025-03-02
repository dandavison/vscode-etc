import * as vscode from 'vscode';

export async function zoomPane() {
  // if (vscode.window.activeTerminal) {
  //   vscode.commands.executeCommand('workbench.action.terminal.toggleTerminal');
  // }
  vscode.commands.executeCommand('workbench.action.closePanel');
  vscode.commands.executeCommand('workbench.action.toggleMaximizeEditorGroup');
}
