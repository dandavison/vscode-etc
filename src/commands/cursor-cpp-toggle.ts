import * as vscode from 'vscode';

var on = false;

export async function toggleCursorCpp() {
  if (on) {
    await vscode.commands.executeCommand('editor.cpp.disableenabled');
  } else {
    await vscode.commands.executeCommand('editor.action.enableCppGlobally');
  }
  on = !on;
}
