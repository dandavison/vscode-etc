import { realpathSync } from 'fs';
import * as child_process from 'child_process';
import * as path from 'path';
import { log } from '../log';

interface IGitRepo {
  root: string;
  url: string;
  commit: string;
}

export interface IFileData {
  repo: IGitRepo;
  path: string;
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

export function getGitRepoFile(nonCanonicalFile: string): IFileData {
  const file = realpathSync(nonCanonicalFile);
  const p = path.parse(file);
  const root = git('-C', p.dir, 'rev-parse', '--show-toplevel');
  if (!root) {
    throw new Error(`Could not determine git root dir for file: ${file}`);
  }
  const repo = getGitRepo(root);
  const relativePath = path.relative(repo.root, file);
  log(`
    file:    ${file}
    root:    ${repo.root}
    commit:  ${repo.commit}
    repoUrl: ${repo.url}
    relativePath: ${relativePath}
  `);
  return { repo, path: relativePath };
}
