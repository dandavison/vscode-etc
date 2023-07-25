import * as vscode from 'vscode';
import { makeGithubUrl } from '../lib/git';

export async function copyGithubUrl() {
  const editor = vscode.window.activeTextEditor;
  const path = editor?.document.uri.path;
  const zeroBasedlineNum = editor?.selection.active.line;
  if (path !== undefined && zeroBasedlineNum !== undefined) {
    const oneBasedLineNum = zeroBasedlineNum + 1;
    try {
      const url = makeGithubUrl(path, oneBasedLineNum);
      const lineText = editor?.document.lineAt(zeroBasedlineNum).text;
      const link = `[\`${lineText?.trim()}\`](${url})`;
      vscode.env.clipboard.writeText(link).then(() => {
        let disposable = vscode.window.setStatusBarMessage('Copied GitHub URL');

        setTimeout(() => {
          disposable.dispose();
        }, 1000);
      });
    } catch (error) {
      vscode.window.showInformationMessage(
        `Could not determine GitHub URL for ${path}:${oneBasedLineNum}: ${error}`
      );
    }
  }
}
