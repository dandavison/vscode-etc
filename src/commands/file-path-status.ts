import * as vscode from 'vscode';

let statusBarItem: vscode.StatusBarItem;

export function createFilePathStatus() {
  // Left alignment, high priority to appear near the left
  statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  statusBarItem.command = 'etc.copyGithubUrl';
  statusBarItem.tooltip = 'Click to copy GitHub URL';
  updateFilePathStatus();
  statusBarItem.show();
}

export async function updateFilePathStatus() {
  if (!statusBarItem) {
    return;
  }

  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    statusBarItem.hide();
    return;
  }

  const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
  let text: string;

  if (workspaceFolder) {
    text = vscode.workspace.asRelativePath(editor.document.uri, false);
  } else {
    text = editor.document.uri.fsPath;
  }

  // Get enclosing symbol(s)
  const symbolChain = await getEnclosingSymbols(editor.document, editor.selection.active);
  if (symbolChain.length > 0) {
    text += ' › ' + symbolChain.join(' › ');
  }

  statusBarItem.text = text;
  statusBarItem.show();
}

async function getEnclosingSymbols(
  document: vscode.TextDocument,
  position: vscode.Position
): Promise<string[]> {
  const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
    'vscode.executeDocumentSymbolProvider',
    document.uri
  );

  if (!symbols || symbols.length === 0) {
    return [];
  }

  const chain: string[] = [];
  findEnclosingSymbols(symbols, position, chain);
  return chain;
}

function findEnclosingSymbols(
  symbols: vscode.DocumentSymbol[],
  position: vscode.Position,
  chain: string[]
): boolean {
  for (const symbol of symbols) {
    if (symbol.range.contains(position)) {
      chain.push(symbol.name);
      // Recurse into children to find more specific symbols
      if (symbol.children && symbol.children.length > 0) {
        findEnclosingSymbols(symbol.children, position, chain);
      }
      return true;
    }
  }
  return false;
}
