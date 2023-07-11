import * as child_process from 'child_process';
import * as path from 'path';

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
    const commit =
      git('-C', root, 'rev-parse', 'origin/main') ||
      git('-C', root, 'rev-parse', 'origin/master');
    if (!commit) {
      throw new Error(`Neither origin/main nor origin/master exist at ${root}`);
    }
    gitRepos[root] = { root, url, commit };
  }
  return gitRepos[root];
}

function getRepoName(url: string): string {
  const match = /^git@github.com:(?<name>.+)(\.git)?$/.exec(url);
  if (!match) {
    throw new Error(`Could not determine repo name from url: ${url}`);
  }
  return match.groups!.name;
}

function formatGitHubUrl(fileData: IFileData): string {
  return `https://github.com/${getRepoName(fileData.repo.url)}/blob/${
    fileData.repo.commit
  }/${fileData.path}#L${fileData.line}`;
}

export function makeGithubUrl(file: string, line: number): string {
  const p = path.parse(file);
  const root = git('-C', p.dir, 'rev-parse', '--show-toplevel');
  if (!root) {
    throw new Error(`Could not determine git root dir for file: ${file}`);
  }
  const repo = getGitRepo(root);
  const relativePath = path.relative(repo.root, file);
  const fileData: IFileData = { repo, path: relativePath, line };
  const url = formatGitHubUrl(fileData);
  return url;
}
