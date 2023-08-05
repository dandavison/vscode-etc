import * as vscode from 'vscode';
import { IFileData, getGitRepoFile } from '../lib/git';

export async function copyGithubUrl() {
  _copyGitHubUrl({ markdown: false, wormhole: false });
}

export async function copyGithubMarkdownUrl() {
  _copyGitHubUrl({ markdown: true, wormhole: false });
}

export async function copyWormholeGithubUrl() {
  _copyGitHubUrl({ markdown: false, wormhole: true });
}

export async function copyWormholeGithubMarkdownUrl() {
  _copyGitHubUrl({ markdown: true, wormhole: true });
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
  wormhole,
}: {
  markdown: boolean;
  wormhole: boolean;
}) {
  const coords = getCoords();
  if (!coords) {
    vscode.window.showInformationMessage(
      'Could not determine (path, line) coordinates'
    );
    return;
  }
  try {
    const repoFile = getGitRepoFile(coords.path);
    var link = wormhole
      ? formatWormholeGitHubUrl(repoFile, coords.line + 1)
      : formatGitHubUrl(repoFile, coords.line + 1);
    if (markdown) {
      const text = coords.selection || coords.text.trim();
      link = `[\`${text}\`](${link})`;
    }
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

function getRepoName(url: string): string {
  const regex = /^git@github.com:(?<name>[^.]+)(\.git)?$/;
  const match = regex.exec(url);
  if (!match) {
    throw new Error(`Regex ${regex} did not match url: ${url}`);
  }
  return match.groups!.name;
}

const WORMHOLE_DOMAIN = 'o';

function formatWormholeGitHubUrl(fileData: IFileData, line: number): string {
  return `http://${WORMHOLE_DOMAIN}/${getRepoName(fileData.repo.url)}/blob/${
    fileData.repo.commit
  }/${fileData.path}?line=${line}`;
}

function formatGitHubUrl(fileData: IFileData, line: number): string {
  return `https://${getRepoName(fileData.repo.url)}/blob/${
    fileData.repo.commit
  }/${fileData.path}#L${line}`;
}
