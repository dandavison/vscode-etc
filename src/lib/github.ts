import * as git from './git';

export function getRepoName(url: string): string {
  const regex = /^[^@]+@github.com:(?<name>[^.]+)(\.git)?$/;
  const match = regex.exec(url);
  if (!match) {
    throw new Error(`Regex ${regex} did not match url: ${url}`);
  }
  return match.groups!.name;
}

export function makeUrl(
  path: string,
  startLine: number,
  endLine?: number
): string {
  const fileData = git.getGitRepoFile(path);
  let url = `https://github.com/${getRepoName(fileData.repo.url)}/blob/${
    fileData.repo.branch
  }/${fileData.path}#L${startLine}`;
  if (endLine) {
    url += `-L${endLine}`;
  }
  return url;
}
