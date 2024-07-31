import * as vscode from 'vscode';
import { log } from '../log';

export async function focusWorkspaceWindow(workspacePath: string) {
  log(`focusWorkspaceWindow: ${workspacePath}`);
  try {
    await vscode.commands.executeCommand(
      'vscode.open',
      vscode.Uri.file(
        '/Users/dan/src/temporalio/sdk-typescript/packages/workflow/src/internals.ts'
      )
    );
  } catch (err) {
    log(`error opening cross-workspace file: ${err}`);
  }
  for (const folder of vscode.workspace.workspaceFolders || []) {
    log(`folder.uri.fsPath: ${folder.uri.fsPath}`);
    if (folder.uri.fsPath === workspacePath) {
      // Focus a file in the workspace to bring the window to the foreground
      const files = await vscode.workspace.findFiles(
        new vscode.RelativePattern(folder, '**/*'),
        '**/node_modules/**',
        1
      );
      if (files.length > 0) {
        const document = await vscode.workspace.openTextDocument(files[0]);
        await vscode.window.showTextDocument(document, vscode.ViewColumn.One);
      }
      break;
    }
  }
}
