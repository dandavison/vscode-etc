import * as vscode from 'vscode';
import * as githubUrl from './commands/copy-github-url';
import { emacsclient } from './commands/emacsclient';
import { magitStatus, magitShow } from './commands/magit-status';
import { gitBlame } from './commands/git-blame';
import { zoomPane } from './commands/zoom-pane';
import { showExtensionVersion } from './commands/show-extension-version';
import { ripgrep } from './commands/ripgrep';
import * as server from './api/server';
import { log } from './log';

export function activate(context: vscode.ExtensionContext) {
  const catalog: [string, () => Promise<void>][] = [
    ['etc.copyGithubUrl', githubUrl.copyGithubUrl],
    ['etc.copyGithubMarkdownUrl', githubUrl.copyGithubMarkdownUrl],
    ['etc.gitBlame', gitBlame],
    ['etc.emacsclient', emacsclient],
    ['etc.magitStatus', magitStatus],
    ['etc.magitShow', magitShow],
    ['etc.ripgrep', ripgrep],
    ['etc.zoomPane', zoomPane],
  ];
  for (const [command, handler] of catalog) {
    context.subscriptions.push(
      vscode.commands.registerCommand(command, handler)
    );
  }

  server.activate(context);

  showExtensionVersion();
  log('Etc activated');
}

export function deactivate() {}
