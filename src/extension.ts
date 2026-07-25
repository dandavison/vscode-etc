import * as vscode from 'vscode';
import * as githubUrl from './commands/copy-github-url';
import { magitStatus, magitShow } from './commands/magit-status';
import { gitBlame } from './commands/git-blame';
import { goTest } from './commands/go-test';
import { zoomPane } from './commands/zoom-pane';
import { showExtensionVersion } from './commands/show-extension-version';
import { ripgrep } from './commands/ripgrep';
import { rgi } from './commands/rgi';
import { log } from './log';
import * as server from './api/server';
import * as wormhole from './commands/wormhole';
import { togglePythonTypeCheckingMode } from './commands/toggle-python-type-checking';
import { createPythonTypeCheckingStatus, updateStatus } from './commands/python-type-checking-status';
import { createFilePathStatus, updateFilePathStatus } from './commands/file-path-status';
import * as windowConfig from './commands/window-configuration';
import { pasteClipboardImage } from './commands/paste-clipboard-image';
import { toggleFold, toggleFoldAll } from './commands/folding';
import { tempFile } from './commands/temp-file';
import { revertAllEditors } from './commands/revert-all-editors';

export function activate(context: vscode.ExtensionContext) {
  const catalog: [string, () => Promise<void>][] = [
    ['etc.copyGithubUrl', githubUrl.copyGithubUrl],
    ['etc.copyGithubMarkdownUrl', githubUrl.copyGithubMarkdownUrl],
    ['etc.gitBlame', gitBlame],
    ['etc.goTest', goTest],
    ['etc.magitStatus', magitStatus],
    ['etc.magitShow', magitShow],
    ['etc.ripgrep', ripgrep],
    ['etc.rgi', rgi],
    ['etc.zoomPane', zoomPane],
    ['etc.openViaWormhole', wormhole.openViaWormhole],
    ['etc.saveWindowConfiguration', windowConfig.saveWindowConfiguration],
    ['etc.saveWindowConfiguration1', windowConfig.saveWindowConfiguration1],
    ['etc.restoreWindowConfiguration1', windowConfig.restoreWindowConfiguration1],
    ['etc.saveWindowConfiguration2', windowConfig.saveWindowConfiguration2],
    ['etc.restoreWindowConfiguration2', windowConfig.restoreWindowConfiguration2],
    ['etc.listWindowConfigurationRegisters', windowConfig.listWindowConfigurationRegisters],
    ['etc.pasteClipboardImage', pasteClipboardImage],
    ['etc.toggleFold', toggleFold],
    ['etc.toggleFoldAll', toggleFoldAll],
    ['etc.tempFile', tempFile],
    ['etc.revertAllEditors', revertAllEditors],
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

  createPythonTypeCheckingStatus();
  context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('python.analysis.typeCheckingMode')) {
      updateStatus();
    }
  }));

  // File path status bar
  createFilePathStatus();
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(() => updateFilePathStatus()),
    vscode.window.onDidChangeTextEditorSelection(() => updateFilePathStatus())
  );

  context.subscriptions.push(
    vscode.window.registerUriHandler({
      handleUri(uri: vscode.Uri) {
        const params = new URLSearchParams(uri.query);
        const cmd = params.get('id');
        if (cmd) {
          vscode.commands.executeCommand(cmd);
        }
      }
    })
  );

  showExtensionVersion();
  server.activate(context);
  log('Etc activated');
}

export function deactivate() {}
