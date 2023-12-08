import * as http from 'http';
import * as vscode from 'vscode';
import { log } from '../log';

export function openNonWorkspaceFile(document: vscode.TextDocument) {
  log('openNonWorkspaceFile');
  const workspaceFolders = vscode.workspace.workspaceFolders;
  const isOutsideWorkspace = workspaceFolders
    ? workspaceFolders.every((folder) => {
        return !document.uri.fsPath.startsWith(folder.uri.fsPath);
      })
    : true;

  if (isOutsideWorkspace) {
    const options = {
      hostname: 'localhost',
      port: 7117,
      path: `/${encodeURIComponent(document.uri.fsPath)}`,
      method: 'GET',
    };

    const req = http.request(options, () => {});

    req.on('error', (error) => {
      console.error(error);
    });

    req.end();
  }
}
