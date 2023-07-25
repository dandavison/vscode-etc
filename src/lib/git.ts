import { realpathSync } from 'fs';
import * as child_process from 'child_process';
import * as path from 'path';
// import * as vscode from 'vscode';

interface IGitRepo {
  root: string;
  url: string;
  commit: string;
}

interface IFileData {
  repo: IGitRepo;
  path: string;
  line: number;
}

const gitRepos: Record<string, IGitRepo> = {};

function git(...args: string[]): string | null {
  let output;
  try {
    output = child_process.execFileSync('git', args, {
      encoding: 'utf8',
    });
  } catch (error) {
    console.error(error);
    return null;
  }
  return output.trim();
}

function getGitRepo(root: string): IGitRepo {
  if (!(root in gitRepos)) {
    const url = git('-C', root, 'remote', 'get-url', 'origin');
    if (!url) {
      throw new Error(`Git repo at ${root} has no remote named 'origin'`);
    }
    const commit = git('-C', root, 'rev-parse', 'HEAD');
    if (!commit) {
      throw new Error(`Could not determine HEAD commit at ${root}`);
    }
    gitRepos[root] = { root, url, commit };
  }
  return gitRepos[root];
}

function getRepoName(url: string): string {
  const regex = /^git@github.com:(?<name>[^.]+)(\.git)?$/;
  const match = regex.exec(url);
  if (!match) {
    throw new Error(`Regex ${regex} did not match url: ${url}`);
  }
  return match.groups!.name;
}

function formatGitHubUrl(fileData: IFileData): string {
  return `http://o/${getRepoName(fileData.repo.url)}/blob/${
    fileData.repo.commit
  }/${fileData.path}?line=${fileData.line}`;
}

export function makeGithubUrl(nonCanonicalFile: string, line: number): string {
  const file = realpathSync(nonCanonicalFile);
  const p = path.parse(file);
  const root = git('-C', p.dir, 'rev-parse', '--show-toplevel');
  if (!root) {
    throw new Error(`Could not determine git root dir for file: ${file}`);
  }
  const repo = getGitRepo(root);
  const relativePath = path.relative(repo.root, file);
  const fileData: IFileData = { repo, path: relativePath, line };
  const url = formatGitHubUrl(fileData);
  // vscode.window.showInformationMessage(`
  //   file:    ${file}
  //   root:    ${repo.root}
  //   commit:  ${repo.commit}
  //   repoUrl: ${repo.url}
  //   relPath: ${fileData.path}
  //   line:    ${line}
  //   url:     ${url}
  // `);
  return url;
}
