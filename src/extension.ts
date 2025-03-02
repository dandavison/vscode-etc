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
import * as http from 'http';

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
    ['etc.toggleCursorCpp', toggleCursorCpp],
  ];
  for (const [command, handler] of catalog) {
    context.subscriptions.push(
      vscode.commands.registerCommand(command, handler)
    );
  }

  // In your extension's activate() function:
context.subscriptions.push(
  vscode.languages.registerDefinitionProvider(['*'], {
      async provideDefinition(document, position, token) {
          // Get the original definitions
          const originalDefinitions = await vscode.commands.executeCommand<vscode.Location[]>(
              'vscode.executeDefinitionProvider',
              document.uri,
              position
          );

          if (originalDefinitions && originalDefinitions[0]) {
              const targetUri = originalDefinitions[0].uri;
              if (await handleGoToDefinition(targetUri)) {
                  // Wait a bit for wormhole to switch projects
                  await new Promise(resolve => setTimeout(resolve, 500));
              }
          }

          return originalDefinitions;
      }
  })
);

  
  server.activate(context);

  showExtensionVersion();
  log('Etc activated');
}

export function deactivate() {}


async function handleGoToDefinition(uri: vscode.Uri) {
  // Only intercept if the target file is outside current workspace
  if (isFileOutsideWorkspace(uri)) {
      const absolutePath = uri.fsPath;
      
      // Call wormhole's /file/ endpoint to switch projects
      const wormholeUrl = `http://localhost:7117/file/${absolutePath}?land-in=editor`;
      
      try {
          const response = await new Promise<http.IncomingMessage>((resolve, reject) => {
              http.get(wormholeUrl, resolve).on('error', reject);
          });
          if (response.statusCode === 200) {
              return true;
          }
      } catch (err) {
          console.error('Wormhole request failed:', err);
      }
  }
  return false;
}

function isFileOutsideWorkspace(uri: vscode.Uri): boolean {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders) return true;
  
  return !workspaceFolders.some(folder => 
      uri.fsPath.startsWith(folder.uri.fsPath)
  );
}