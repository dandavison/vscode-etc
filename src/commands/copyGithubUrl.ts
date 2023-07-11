import * as vscode from 'vscode';
import { makeGithubUrl } from '../lib/git';

export async function copyGithubUrl() {
  const path = vscode.window.activeTextEditor?.document.uri.path;
  const line = vscode.window.activeTextEditor?.selection.active.line;
  if (path && line) {
    const url = makeGithubUrl(path, line);
    if (url) {
      vscode.env.clipboard.writeText(url).then(() => {
        let disposable = vscode.window.setStatusBarMessage('Copied GitHub URL');

        setTimeout(() => {
          disposable.dispose();
        }, 1000);
      });
    } else {
      vscode.window.showInformationMessage(
        `Could not determine GitHub URL for ${path}:${line}`
      );
    }
  }
}
