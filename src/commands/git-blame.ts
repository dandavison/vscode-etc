import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import { log } from '../log';

const execAsync = promisify(exec);

export async function gitBlame() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }

  const path = editor.document.uri.fsPath;
  if (!path) {
    log('gitBlame: could not determine editor document path');
    return;
  }

  // Get the visible line range in the editor
  const visibleRanges = editor.visibleRanges;
  if (visibleRanges.length === 0) {
    return;
  }

  // Get first and last visible lines (1-indexed for git blame)
  const firstLine = visibleRanges[0].start.line + 1;
  const lastLine = visibleRanges[visibleRanges.length - 1].end.line + 1;

  // Build the git blame command for the visible lines
  const cmd = `git -c delta.width=0 blame -L ${firstLine},${lastLine} '${path}'`;

  // Send the command via tmux and open Alacritty. Target the default socket
  // explicitly: $TMUX may point at another server (e.g. wormhole-daemon) when
  // this window was launched from within one, and we must not send keys there.
  await execAsync(`tmux -L default send-keys C-c C-l`);
  await execAsync(`tmux -L default send-keys '${cmd}' Enter`);
  await execAsync('open -a Alacritty');
}
