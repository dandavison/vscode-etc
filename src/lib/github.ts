import * as git from './git';

export function getRepoName(url: string): string {
  const regex = /^git@github.com:(?<name>[^.]+)(\.git)?$/;
  const match = regex.exec(url);
  if (!match) {
    throw new Error(`Regex ${regex} did not match url: ${url}`);
  }
  return match.groups!.name;
}

export function makeUrl(path: string, line: number): string {
  const fileData = git.getGitRepoFile(path);
  return `https://${getRepoName(fileData.repo.url)}/blob/${
    fileData.repo.commit
  }/${fileData.path}#L${line}`;
}
