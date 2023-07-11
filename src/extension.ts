import * as vscode from 'vscode';
import * as commands from './commands';

export function activate(context: vscode.ExtensionContext) {
  const catalog: [string, () => Promise<void>][] = [
    ['process.emacsclient', commands.emacsclient],
    ['process.magitStatus', commands.magitStatus],
    ['process.openFolders', commands.openFolders],
  ];
  for (const [command, handler] of catalog) {
    context.subscriptions.push(
      vscode.commands.registerCommand(command, handler)
    );
  }
}

export function deactivate() {}
