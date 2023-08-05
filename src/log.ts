import * as vscode from 'vscode';

const outputChannel = vscode.window.createOutputChannel('Etc');
export const log = outputChannel.appendLine;
