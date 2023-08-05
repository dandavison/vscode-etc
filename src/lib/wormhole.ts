import * as git from './git';
import * as github from './github';

const WORMHOLE_DOMAIN = 'o';

export function makeUrl(path: string, line: number): string {
  const fileData = git.getGitRepoFile(path);
  return `http://${WORMHOLE_DOMAIN}/${github.getRepoName(
    fileData.repo.url
  )}/blob/${fileData.repo.commit}/${fileData.path}?line=${line}`;
}
