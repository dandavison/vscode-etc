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
  // Target the default socket explicitly: $TMUX may point at another server
  // (e.g. wormhole-daemon) when this window was launched from within one, and
  // we must not send keys there.
  await execAsync(`tmux -L default send-keys C-c`);
  await execAsync(`tmux -L default send-keys '${cmd}' Enter`);
  await execAsync('open -a Alacritty');
}
