import * as vscode from 'vscode';

// VS Code exposes no API to read folding state, so we infer it from
// `visibleRanges`: a collapsed region leaves a gap in the displayed lines.

export async function toggleFold() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const command = isFoldedAt(editor, editor.selection.active.line)
    ? 'editor.unfoldRecursively'
    : 'editor.foldRecursively';
  await vscode.commands.executeCommand(command);
}

export async function toggleFoldAll() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return;
  }
  const command = editor.visibleRanges.length > 1 ? 'editor.unfoldAll' : 'editor.foldAll';
  await vscode.commands.executeCommand(command);
}

function isFoldedAt(editor: vscode.TextEditor, line: number): boolean {
  const visible = (l: number) =>
    editor.visibleRanges.some((r) => r.start.line <= l && l <= r.end.line);
  return visible(line) && line + 1 < editor.document.lineCount && !visible(line + 1);
}
