import * as vscode from 'vscode';
import * as githubUrl from './commands/copy-github-url';
import { emacsclient } from './commands/emacsclient';
import { magitStatus, magitShow } from './commands/magit-status';
import { gitBlame } from './commands/git-blame';
import { zoomPane } from './commands/zoom-pane';
import { showExtensionVersion } from './commands/show-extension-version';
import { ripgrep } from './commands/ripgrep';
import { toggleCursorCpp } from './commands/cursor-cpp-toggle';
import * as server from './api/server';
import { log } from './log';
import { openViaWormhole } from './commands/open-via-wormhole';

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
    ['etc.openViaWormhole', openViaWormhole],
    ['etc.toggleCursorCpp', toggleCursorCpp],
  ];
  for (const [command, handler] of catalog) {
    context.subscriptions.push(
      vscode.commands.registerCommand(command, handler)
    );
  }

  // Register file open handler
  context.subscriptions.push(
    vscode.workspace.onDidOpenTextDocument(async (document) => {
      // Skip non-file schemes (like git:, untitled:, etc.)
      if (document.uri.scheme !== 'file') {
        return;
      }

      const filePath = document.uri.fsPath;
      const workspaceFolders = vscode.workspace.workspaceFolders;

      const isOutsideWorkspace = !workspaceFolders?.some(folder =>
        filePath.startsWith(folder.uri.fsPath)
      );

      if (isOutsideWorkspace) {
        // Use a slight delay to ensure the editor is fully opened
        setTimeout(async () => {
          const editor = vscode.window.activeTextEditor;
          if (editor && editor.document === document) {
            await openViaWormhole();
          }
        }, 100);
      }
    })
  );

  server.activate(context);

  showExtensionVersion();
  log('Etc activated');
}

export function deactivate() {}
