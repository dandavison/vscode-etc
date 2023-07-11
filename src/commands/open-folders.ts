const { readFile } = require('node:fs/promises');
const { accessSync } = require('node:fs');
const { dirname, join } = require('node:path');
import * as vscode from 'vscode';
import { log } from '../log';

export async function openFolders(): Promise<void> {
  const dirs: Set<string> = new Set(
    (await readFile(expandPath('~/.probable-paths.txt')))
      .toString()
      .split('\n')
      .filter((s: string) => s.length > 0)
      .map(expandPath)
      .map(isProjectDirectory)
  );
  for (const dir of dirs.keys()) {
    let success = await vscode.commands.executeCommand(
      'vscode.openFolder',
      vscode.Uri.file(dir),
      {
        forceNewWindow: true,
      }
    );
    if (!success) {
      log(`Failed to open folder: ${dir}`);
    }
  }
}

function isProjectDirectory(path: string): Boolean {
  const dir: string = path.endsWith('/') ? path : dirname(path);
  const isProjectDir = accessSync(join(path, '.git'));
  log(`${isProjectDir ? 'Project' : 'Not a project'} dir: ${path}`);
  return isProjectDir;
}

function expandPath(path: string): string {
  return path.replace(/^~/, process.env.HOME || '~');
}
