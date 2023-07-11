import * as vscode from 'vscode';
import { makeGithubUrl } from '../lib/git';

export async function copyGithubUrl() {
  const path = vscode.window.activeTextEditor?.document.uri.path;
  const line = vscode.window.activeTextEditor?.selection.active.line;
  if (path && line) {
    vscode.env.clipboard.writeText(makeGithubUrl(path, line)).then(() => {
      let disposable = vscode.window.setStatusBarMessage('Copied GitHub URL');

      setTimeout(() => {
        disposable.dispose();
      }, 1000);
    });
  }
}
