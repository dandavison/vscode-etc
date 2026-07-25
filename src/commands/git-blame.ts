import * as vscode from 'vscode';
import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import { log } from '../log';

const execFileAsync = promisify(execFile);
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

  // In the popup stdout is a tty, so git invokes its pager; -EE keeps the
  // popup open showing the error if the command fails.
  const cmd = `git -c delta.width=0 blame -L ${firstLine},${lastLine} '${path}'`;

  const cwd = path.replace(/\/[^/]*$/, '');

  // Focus first: display-popup blocks until the popup closes. Socket is
  // explicit as in ripgrep.ts: $TMUX may point at another server.
  await execAsync('open -a Alacritty');
  try {
    await execFileAsync('tmux', [
      '-L',
      'default',
      'display-popup',
      '-EE',
      '-e',
      `PATH=${process.env.PATH}`,
      '-w',
      '100%',
      '-h',
      '100%',
      '-b',
      'rounded',
      '-d',
      cwd,
      cmd,
    ]);
  } catch (e) {
    log(`gitBlame: tmux display-popup failed: ${e}`);
    vscode.window.showErrorMessage(
      'git blame: tmux display-popup failed (is tmux running?)',
    );
  }
}
