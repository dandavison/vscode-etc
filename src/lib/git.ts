import * as child_process from 'child_process';
import * as path from 'path';
import { URL } from 'url';

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
      console.error(`Git repo at ${root} has no remote named 'origin'`);
      process.exit(1);
    }
    const commit =
      git('-C', root, 'rev-parse', 'origin/main') ||
      git('-C', root, 'rev-parse', 'origin/master');
    if (!commit) {
      console.error(`Neither origin/main nor origin/master exist at ${root}`);
      process.exit(1);
    }
    gitRepos[root] = { root, url, commit };
  }
  return gitRepos[root];
}

function getRepoName(url: string): string {
  const repoUrl = new URL(url);
  const match = /\/(?<name>.+)\.git$/.exec(repoUrl.pathname);
  return match ? match.groups!.name : '';
}

function formatGitHubUrl(fileData: IFileData): string {
  return `https://github.com/${getRepoName(fileData.repo.url)}/blob/${
    fileData.repo.commit
  }/${fileData.path}#L${fileData.line}`;
}

export function makeGithubUrl(file: string, line: number): string | null {
  const p = path.parse(file);
  const root = git('-C', p.dir, 'rev-parse', '--show-toplevel');
  if (root) {
    const repo = getGitRepo(root);
    const relativePath = path.relative(repo.root, file);
    const fileData: IFileData = { repo, path: relativePath, line };

    return formatGitHubUrl(fileData);
  } else {
    return null;
  }
}
