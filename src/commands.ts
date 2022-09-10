const { readFile } = require('fs');
const { spawn } = require('node:child_process');
const { dirname, resolve } = require('node:path');
import * as vscode from 'vscode';

const outputChannel = vscode.window.createOutputChannel('Process');
const log = outputChannel.appendLine;
outputChannel.show();

export async function emacsclient() {
  const path = vscode.window.activeTextEditor?.document.uri.path;
  spawn('emacsclient', ['-n', path]);
}

export async function magitStatus(): Promise<void> {
  const cwd = dirname(vscode.window.activeTextEditor?.document.uri.path);
  log(`Running in ${cwd} (resolve => ${resolve(cwd)})`);
  const result = spawn('bash', ['/Users/ddavison/src/emacs-config/bin/emacs-magit-status'], { cwd });
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
      .map(dirname)
  );
  for (const dir of dirs.keys()) {
    let success = await vscode.commands.executeCommand('vscode.openFolder', vscode.Uri.file(dir), {
      forceNewWindow: true,
    });
    if (!success) {
      log(`Failed to open folder: ${dir}`);
    }
  }
}

function expandPath(path: string): string {
  return path.replace(/^~/, process.env.HOME || '~');
}
