import * as vscode from 'vscode';
import * as github from '../lib/github';
import { log } from '../log';

export async function copyGithubUrl() {
  _copyGitHubUrl({ markdown: false });
}

export async function copyGithubMarkdownUrl() {
  _copyGitHubUrl({ markdown: true });
}

type Coords = {
  path: string;
  startLine: number;
  endLine?: number;
  text: string;
  selection: string;
};

// 1-based coordinates
function getCoords(): Coords | null {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return null;
  }
  const path = editor.document.uri.path;
  const line = editor.selection.active.line;
  const text = editor.document.lineAt(line).text;
  const selection = editor.document.getText(editor.selection);
  const startLine = editor.selection.start.line + 1;
  const endLine = editor.selection.end.line + 1;
  return {
    path,
    startLine,
    endLine: endLine > startLine ? endLine : undefined,
    text,
    selection,
  };
}

function _copyGitHubUrl({ markdown }: { markdown: boolean }) {
  const coords = getCoords();
  if (!coords) {
    vscode.window.showInformationMessage(
      'Could not determine (path, line) coordinates'
    );
    return;
  }
  try {
    let link = github.makeUrl(coords.path, coords.startLine, coords.endLine);
    if (markdown) {
      const text = coords.selection || coords.text.trim();
      link = `[\`${text}\`](${link})`;
    }
    log(`Created link: ${link}`);
    vscode.env.clipboard.writeText(link).then(() => {
      let disposable = vscode.window.setStatusBarMessage('Copied GitHub URL');
      setTimeout(() => {
        disposable.dispose();
      }, 1000);
    });
  } catch (error) {
    vscode.window.showInformationMessage(
      `Could not determine GitHub URL for ${coords.path}:${coords.startLine}: ${error}`
    );
  }
}
