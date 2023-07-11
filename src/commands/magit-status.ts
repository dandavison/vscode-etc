const { realpathSync } = require('node:fs');
const { spawn } = require('node:child_process');
const { dirname } = require('node:path');
import * as vscode from 'vscode';
import { log } from '../log';

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
