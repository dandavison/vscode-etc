import * as vscode from 'vscode';
import * as wormhole from '../lib/wormhole';
import * as github from '../lib/github';
import { log } from '../log';

export async function copyGithubUrl() {
  _copyGitHubUrl({ markdown: false, wormholeUrl: false });
}

export async function copyGithubMarkdownUrl() {
  _copyGitHubUrl({ markdown: true, wormholeUrl: false });
}

export async function copyWormholeUrl() {
  _copyGitHubUrl({ markdown: false, wormholeUrl: true });
}

export async function copyWormholeMarkdownUrl() {
  _copyGitHubUrl({ markdown: true, wormholeUrl: true });
}

type Coords = {
  path: string;
  line: number;
  text: string;
  selection: string;
};

function getCoords(): Coords | null {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return null;
  }
  const path = editor.document.uri.path;
  const line = editor.selection.active.line;
  const text = editor.document.lineAt(line).text;
  const selection = editor.document.getText(editor.selection);
  return {
    path,
    line,
    text,
    selection,
  };
}

function _copyGitHubUrl({
  markdown,
  wormholeUrl,
}: {
  markdown: boolean;
  wormholeUrl: boolean;
}) {
  const coords = getCoords();
  if (!coords) {
    vscode.window.showInformationMessage(
      'Could not determine (path, line) coordinates'
    );
    return;
  }
  try {
    var link = wormholeUrl
      ? wormhole.makeUrl(coords.path, coords.line + 1)
      : github.makeUrl(coords.path, coords.line + 1);
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
      `Could not determine GitHub URL for ${coords.path}:${coords.line}: ${error}`
    );
  }
}
