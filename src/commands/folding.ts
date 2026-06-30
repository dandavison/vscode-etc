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
  const region = await enclosingRegion(editor);
  if (!region) {
    await vscode.commands.executeCommand(
      editor.visibleRanges.length > 1 ? 'editor.unfoldAll' : 'editor.foldAll'
    );
    return;
  }
  const folded = hasFoldInRange(editor, region);
  editor.selection = new vscode.Selection(region.start, region.start);
  if (folded) {
    await vscode.commands.executeCommand('editor.unfoldRecursively');
  } else {
    await vscode.commands.executeCommand('editor.foldRecursively');
    await vscode.commands.executeCommand('editor.unfold');
  }
}

function isFoldedAt(editor: vscode.TextEditor, line: number): boolean {
  const visible = (l: number) =>
    editor.visibleRanges.some((r) => r.start.line <= l && l <= r.end.line);
  return visible(line) && line + 1 < editor.document.lineCount && !visible(line + 1);
}

function hasFoldInRange(editor: vscode.TextEditor, range: vscode.Range): boolean {
  const ranges = editor.visibleRanges;
  for (let i = 0; i + 1 < ranges.length; i++) {
    const header = ranges[i].end.line;
    if (header >= range.start.line && header < range.end.line) {
      return true;
    }
  }
  return false;
}

async function enclosingRegion(editor: vscode.TextEditor): Promise<vscode.Range | undefined> {
  const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
    'vscode.executeDocumentSymbolProvider',
    editor.document.uri
  );
  const pos = editor.selection.active;
  let region: vscode.Range | undefined;
  const visit = (syms: vscode.DocumentSymbol[] | undefined) => {
    for (const s of syms ?? []) {
      if (s.range?.contains(pos) && s.range.end.line > s.range.start.line) {
        region = s.range;
        visit(s.children);
      }
    }
  };
  visit(symbols);
  return region;
}
