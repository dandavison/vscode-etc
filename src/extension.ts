import * as vscode from 'vscode';
import { copyGithubUrl } from './commands/copy-github-url';
import { emacsclient } from './commands/emacsclient';
import { magitStatus } from './commands/magit-status';

export function activate(context: vscode.ExtensionContext) {
  const catalog: [string, () => Promise<void>][] = [
    ['process.copyGithubUrl', copyGithubUrl],
    ['process.emacsclient', emacsclient],
    ['process.magitStatus', magitStatus],
  ];
  for (const [command, handler] of catalog) {
    context.subscriptions.push(
      vscode.commands.registerCommand(command, handler)
    );
  }
}

export function deactivate() {}
