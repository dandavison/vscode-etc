import * as vscode from 'vscode';

class Logger {
  private static instance: vscode.OutputChannel;

  private constructor() {}

  public static getInstance(): vscode.OutputChannel {
    if (!Logger.instance) {
      Logger.instance = vscode.window.createOutputChannel('Etc');
    }
    return Logger.instance;
  }

  public static log(message: string): void {
    Logger.getInstance().appendLine(message);
  }
}

export const log = Logger.log;
