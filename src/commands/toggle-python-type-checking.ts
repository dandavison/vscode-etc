import * as vscode from 'vscode';

export async function togglePythonTypeCheckingMode(): Promise<void> {
    const config = vscode.workspace.getConfiguration('python.analysis');
    const currentMode = config.get<string>('typeCheckingMode');

    const newMode = currentMode === 'basic' ? 'strict' : 'basic';

    await config.update('typeCheckingMode', newMode, vscode.ConfigurationTarget.Global);

    vscode.window.setStatusBarMessage(`Python Type Checking: ${newMode}`, 2000);
}