import * as vscode from 'vscode';
import * as githubUrl from './commands/copy-github-url';
import { emacsclient } from './commands/emacsclient';
import { magitStatus } from './commands/magit-status';
import { gitBlame } from './commands/git-blame';

export function activate(context: vscode.ExtensionContext) {
  const catalog: [string, () => Promise<void>][] = [
    ['etc.copyGithubUrl', githubUrl.copyGithubUrl],
    ['etc.copyGithubMarkdownUrl', githubUrl.copyGithubMarkdownUrl],
    ['etc.gitBlame', gitBlame],
    ['etc.emacsclient', emacsclient],
    ['etc.magitStatus', magitStatus],
  ];
  for (const [command, handler] of catalog) {
    context.subscriptions.push(
      vscode.commands.registerCommand(command, handler)
    );
  }

  showExtensionVersion();
}

export function deactivate() {}

function showExtensionVersion() {
  const extensionId = 'dandavison.vscode-etc';
  const extension = vscode.extensions.getExtension(extensionId);
  const extensionName =
    extension?.packageJSON.name ?? '[failed to locate extension]';
  const extensionVersion = extension?.packageJSON.version ?? '?.?.?';

  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = `${extensionName} v${extensionVersion}`;
  statusBarItem.tooltip = `${extensionName} Version: ${extensionVersion}`;
  statusBarItem.show();
}
