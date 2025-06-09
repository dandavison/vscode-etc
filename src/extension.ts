import * as vscode from 'vscode';
import * as githubUrl from './commands/copy-github-url';
import { emacsclient } from './commands/emacsclient';
import { magitStatus, magitShow } from './commands/magit-status';
import { gitBlame } from './commands/git-blame';
import { zoomPane } from './commands/zoom-pane';
import { showExtensionVersion } from './commands/show-extension-version';
import { ripgrep } from './commands/ripgrep';
import { toggleCursorCpp } from './commands/cursor-cpp-toggle';
import { log } from './log';
import * as wormhole from './commands/wormhole';
import { togglePythonTypeCheckingMode } from './commands/toggle-python-type-checking';

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
    ['etc.openViaWormhole', wormhole.openViaWormhole],
    ['etc.toggleCursorCpp', toggleCursorCpp],
  ];
  for (const [command, handler] of catalog) {
    context.subscriptions.push(
      vscode.commands.registerCommand(command, handler)
    );
  }

  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(wormhole.onDidOpenTextDocument)
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('vscode-etc.togglePythonTypeCheckingMode', togglePythonTypeCheckingMode)
  );

  showExtensionVersion();
  log('Etc activated');
}

export function deactivate() {}
