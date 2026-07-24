import * as vscode from 'vscode';
import { getPort } from '../api/server';

const RGI_VSCODE_PORT = 'RGI_VSCODE_PORT';

let rgiTerminal: vscode.Terminal | undefined;

vscode.window.onDidCloseTerminal((terminal) => {
  if (terminal === rgiTerminal) {
    rgiTerminal = undefined;
  }
});

/**
 * Run rgi in a panel terminal, prepopulated with the word at point.
 *
 * RGI_VSCODE_PORT puts rgi into vscode mode: the editor above the terminal
 * acts as the preview (updated on every cursor move) and RET focuses the
 * editor at the selected hit.
 */
export async function rgi() {
  const editor = vscode.window.activeTextEditor;
  let pattern = '';
  if (editor) {
    pattern = editor.document.getText(editor.selection);
    if (!pattern) {
      const wordRange = editor.document.getWordRangeAtPosition(
        editor.selection.active
      );
      pattern = wordRange ? editor.document.getText(wordRange) : '';
    }
  }

  // A fresh terminal per search: disposing kills any fzf still running in it.
  if (rgiTerminal) {
    rgiTerminal.dispose();
  }
  rgiTerminal = vscode.window.createTerminal({
    name: 'rgi',
    location: vscode.TerminalLocation.Panel,
    env: { [RGI_VSCODE_PORT]: `${getPort()}` },
  });
  rgiTerminal.show();
  // When rgi exits (ctrl-c/esc abort fzf with a non-zero status), exit the
  // shell with code 0: the terminal and panel close silently, instead of
  // dropping to a prompt or triggering VSCode's "process exited with
  // error" alert.
  const cmd = pattern ? `rgi ${shellQuote(pattern)}` : 'rgi';
  rgiTerminal.sendText(`${cmd}; exit 0`);
}

function shellQuote(s: string): string {
  return `'${s.replace(/'/g, `'\\''`)}'`;
}
