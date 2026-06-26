import * as vscode from 'vscode';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';

export async function tempFile() {
  const name = await vscode.window.showInputBox({
    prompt: 'Temp file name (with extension)',
    placeHolder: 'scratch.py',
  });
  if (!name) {
    return;
  }

  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'vscode-etc-'));
  const file = path.join(dir, name);
  await fs.writeFile(file, '');

  const document = await vscode.workspace.openTextDocument(file);
  await vscode.window.showTextDocument(document);
}
