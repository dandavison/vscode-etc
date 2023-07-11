const { spawn } = require('node:child_process');
import * as vscode from 'vscode';

export async function emacsclient() {
  const path = vscode.window.activeTextEditor?.document.uri.path;
  spawn('emacsclient', ['-n', path]);
}
