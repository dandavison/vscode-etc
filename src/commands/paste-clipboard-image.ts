import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as os from 'os';
import * as path from 'path';

const execAsync = promisify(exec);

export async function pasteClipboardImage() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const tmpFile = path.join(os.tmpdir(), `clipboard-${Date.now()}.png`);
  try {
    await execAsync(`pngpaste "${tmpFile}"`);
  } catch {
    vscode.window.showErrorMessage('No image data in clipboard (pngpaste failed)');
    return;
  }

  await editor.edit(editBuilder => {
    editBuilder.insert(editor.selection.active, tmpFile);
  });
}
