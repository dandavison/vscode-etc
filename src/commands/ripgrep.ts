import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function ripgrep() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  let pattern = editor.document.getText(editor.selection);
  if (!pattern) {
    const wordRange = editor.document.getWordRangeAtPosition(
      editor.selection.active
    );
    pattern = wordRange ? editor.document.getText(wordRange) : '';
  }

  const cmd = pattern ? `rgi '${pattern}'` : 'rgi';
  await execAsync(`tmux send-keys C-c`);
  await execAsync(`tmux send-keys '${cmd}' Enter`);
  await execAsync('open -a Alacritty');
}
