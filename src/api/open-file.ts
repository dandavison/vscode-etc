import * as vscode from 'vscode';
import { log } from '../log';

// Visual indicator for the current search hit: a whole-line highlight that
// follows the hit while navigating in rgi, and pulses briefly on RET.
const hitLineDecoration = vscode.window.createTextEditorDecorationType({
  isWholeLine: true,
  backgroundColor: new vscode.ThemeColor('editor.findMatchHighlightBackground'),
});

let decoratedEditor: vscode.TextEditor | undefined;
let clearTimer: NodeJS.Timeout | undefined;

function showHitLine(
  editor: vscode.TextEditor,
  range: vscode.Range,
  transient: boolean,
) {
  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = undefined;
  }
  if (decoratedEditor && decoratedEditor !== editor) {
    decoratedEditor.setDecorations(hitLineDecoration, []);
  }
  editor.setDecorations(hitLineDecoration, [range]);
  decoratedEditor = editor;
  if (transient) {
    clearTimer = setTimeout(() => {
      editor.setDecorations(hitLineDecoration, []);
      if (decoratedEditor === editor) {
        decoratedEditor = undefined;
      }
    }, 500);
  }
}

/**
 * Show `file` at `line` in the editor above the rgi terminal.
 *
 * While the user navigates hits in rgi (focus = false) the file appears in
 * a transient preview editor and keyboard focus stays in the terminal. On
 * RET (focus = true) the editor becomes a permanent tab, takes focus, and
 * the rgi panel is dismissed.
 */
export async function openFileAtLine(
  file: string,
  line: number,
  focus: boolean,
): Promise<void> {
  try {
    const document = await vscode.workspace.openTextDocument(file);
    const options = { preview: !focus, preserveFocus: !focus };
    let editor = await vscode.window.showTextDocument(document, options);
    if (!vscode.window.visibleTextEditors.includes(editor)) {
      // The panel is maximized (common in zen mode): restore the split so
      // that the editor is actually visible above the terminal.
      await vscode.commands.executeCommand(
        'workbench.action.toggleMaximizedPanel',
      );
      editor = await vscode.window.showTextDocument(document, options);
    }
    const lineIndex = Math.min(Math.max(line - 1, 0), document.lineCount - 1);
    const position = new vscode.Position(lineIndex, 0);
    const range = new vscode.Range(position, position);
    editor.selection = new vscode.Selection(position, position);
    editor.revealRange(range, vscode.TextEditorRevealType.InCenter);
    showHitLine(editor, range, focus);
    if (focus) {
      // RET: dismiss the rgi terminal; the editor keeps focus.
      await vscode.commands.executeCommand('workbench.action.closePanel');
    }
  } catch (err) {
    log(`openFileAtLine(${file}:${line}) failed: ${err}`);
  }
}
