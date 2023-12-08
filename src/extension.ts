import * as vscode from 'vscode';
import * as githubUrl from './commands/copy-github-url';
import { emacsclient } from './commands/emacsclient';
import { magitStatus } from './commands/magit-status';
import * as wormhole from './lib/wormhole';

export function activate(context: vscode.ExtensionContext) {
  const catalog: [string, () => Promise<void>][] = [
    ['etc.copyGithubUrl', githubUrl.copyGithubUrl],
    ['etc.copyGithubMarkdownUrl', githubUrl.copyGithubMarkdownUrl],
    ['etc.emacsclient', emacsclient],
    ['etc.magitStatus', magitStatus],
  ];
  for (const [command, handler] of catalog) {
    context.subscriptions.push(
      vscode.commands.registerCommand(command, handler)
    );
  }
  let disposable = vscode.workspace.onDidOpenTextDocument(
    wormhole.openNonWorkspaceFile
  );
  context.subscriptions.push(disposable);
}

export function deactivate() {}
