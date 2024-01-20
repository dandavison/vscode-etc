import * as vscode from 'vscode';

export async function zoomPane() {
  vscode.window.activeTerminal?.dispose();
  vscode.commands.executeCommand('workbench.action.toggleMaximizeEditorGroup');
}
