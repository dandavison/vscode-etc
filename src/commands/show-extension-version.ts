import * as vscode from 'vscode';

export function showExtensionVersion() {
  const extensionId = 'dandavison.vscode-etc';
  const extension = vscode.extensions.getExtension(extensionId);
  const extensionName =
    extension?.packageJSON.name ?? '[failed to locate extension]';
  const extensionVersion = extension?.packageJSON.version ?? '?.?.?';

  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  statusBarItem.text = `v${extensionVersion}`;
  statusBarItem.tooltip = `${extensionName} v${extensionVersion}`;
  statusBarItem.show();
}
