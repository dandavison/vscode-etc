import * as vscode from 'vscode';
import * as path from 'path';
import { log } from '../log';

export async function goTest() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const test = enclosingTestFunc(editor.document, editor.selection.active.line);
  const dir = packageDir(editor.document.uri);
  if (!test || !dir) {
    vscode.window.showInformationMessage(
      'Could not determine Go test at cursor'
    );
    return;
  }
  const cmd = `go test -count=1 -run '^${test}$' ${dir}`;
  log(`Copied: ${cmd}`);
  vscode.env.clipboard.writeText(cmd).then(() => {
    let disposable = vscode.window.setStatusBarMessage(cmd);
    setTimeout(() => {
      disposable.dispose();
    }, 1000);
  });
}

function enclosingTestFunc(
  document: vscode.TextDocument,
  line: number
): string | undefined {
  for (let i = line; i >= 0; i--) {
    const m = /^func (\w+)\(/.exec(document.lineAt(i).text);
    if (m) {
      return m[1].startsWith('Test') ? m[1] : undefined;
    }
  }
  return undefined;
}

// "./chasm/chasmtest/" style package path relative to the repo root
function packageDir(uri: vscode.Uri): string | undefined {
  const root = vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath;
  if (!root) {
    return undefined;
  }
  const rel = path.relative(root, path.dirname(uri.fsPath));
  return rel ? `./${rel}/` : './';
}
