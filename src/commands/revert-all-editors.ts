import * as vscode from 'vscode';

// VS Code's native `workbench.action.files.revert` only acts on the active
// editor. Reverting every dirty document to disk means closing tabs never
// triggers the "do you want to save changes?" prompt.

export async function revertAllEditors() {
  const active = vscode.window.activeTextEditor;
  const dirty = vscode.workspace.textDocuments.filter((doc) => doc.isDirty);
  for (const doc of dirty) {
    await vscode.window.showTextDocument(doc, { preview: false });
    await vscode.commands.executeCommand('workbench.action.files.revert');
  }
  if (active) {
    await vscode.window.showTextDocument(active.document, {
      viewColumn: active.viewColumn,
      preview: false,
    });
  }
}
