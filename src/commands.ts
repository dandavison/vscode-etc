const { readFile } = require('node:fs/promises');
const { accessSync, realpathSync } = require('node:fs');
const { spawn } = require('node:child_process');
const { dirname, join, resolve } = require('node:path');
import * as vscode from 'vscode';
import { copyGithubUrl } from './commands/copyGithubUrl';

export { copyGithubUrl };

const outputChannel = vscode.window.createOutputChannel('Process');
const log = outputChannel.appendLine;
outputChannel.show();

export async function emacsclient() {
  const path = vscode.window.activeTextEditor?.document.uri.path;
  spawn('emacsclient', ['-n', path]);
}

export async function magitStatus(): Promise<void> {
  const nominalCwd = dirname(vscode.window.activeTextEditor?.document.uri.path);
  const cwd = realpathSync(nominalCwd);
  log(`Running in ${nominalCwd} (resolve => ${cwd})`);
  const result = spawn(
    'bash',
    ['/Users/dan/src/devenv/emacs-config/bin/emacs-magit-status'],
    { cwd }
  );
  result.stderr.on('data', (data: string) => {
    log(`stderr: ${data}`);
  });
  result.stdout.on('data', (data: string) => {
    log(`stdout: ${data}`);
  });
}

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
