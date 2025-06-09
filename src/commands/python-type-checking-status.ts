import * as vscode from 'vscode';

let statusBarItem: vscode.StatusBarItem;

export function createPythonTypeCheckingStatus() {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 200);
    statusBarItem.command = 'vscode-etc.togglePythonTypeCheckingMode';
    updateStatus();
    statusBarItem.show();
}

export function updateStatus() {
    const config = vscode.workspace.getConfiguration('python.analysis');
    const mode = config.get<string>('typeCheckingMode');

    if (!statusBarItem) {
        return;
    }

    if (mode === 'strict') {
        statusBarItem.text = '🔥';
        statusBarItem.tooltip = 'Python Type Checking: Strict';
    } else {
        statusBarItem.text = '–';
        statusBarItem.tooltip = 'Python Type Checking: Basic';
    }
} 