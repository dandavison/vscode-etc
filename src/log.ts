import * as vscode from 'vscode';

const outputChannel = vscode.window.createOutputChannel('Process');
export const log = outputChannel.appendLine;
