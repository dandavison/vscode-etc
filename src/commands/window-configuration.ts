import * as vscode from 'vscode';
import { log } from '../log';

/**
 * A saved window configuration, inspired by Emacs' window-configuration-to-register.
 * Captures the editor layout (splits) and the VISIBLE file in each split.
 *
 * This is designed for users who work with tabs hidden - it only saves what's
 * actually visible on screen, not hidden tabs.
 */
interface WindowConfiguration {
  /** The editor group layout (splits, orientations, sizes) */
  layout: EditorGroupLayout;
  /** The visible file in each split */
  visibleEditors: VisibleEditor[];
  /** Which split was focused */
  activeSplitIndex: number;
}

interface VisibleEditor {
  uri: string;
  /** Cursor position to restore */
  line?: number;
  column?: number;
}

/** Matches VS Code's internal EditorGroupLayout structure */
interface EditorGroupLayout {
  orientation: number; // 0 = horizontal, 1 = vertical
  groups: GroupLayoutArgument[];
}

interface GroupLayoutArgument {
  size?: number;
  groups?: GroupLayoutArgument[];
}

/** In-memory register storage (0-9, a-z) */
const registers = new Map<string, WindowConfiguration>();

/**
 * Save the current window configuration to a register.
 * Prompts the user for a register name.
 */
export async function saveWindowConfiguration(): Promise<void> {
  const register = await vscode.window.showInputBox({
    prompt: 'Save window configuration to register',
    placeHolder: 'Enter register (0-9, a-z)',
    validateInput: (value) => {
      if (value.length !== 1) {
        return 'Register must be a single character';
      }
      if (!/^[0-9a-z]$/i.test(value)) {
        return 'Register must be 0-9 or a-z';
      }
      return undefined;
    },
  });
  if (register === undefined) {
    return;
  }

  const config = captureCurrentConfiguration();
  if (config) {
    registers.set(register.toLowerCase(), config);
    const files = config.visibleEditors.map(e => e.uri.split('/').pop()).join(' | ');
    vscode.window.showInformationMessage(`Saved to register '${register}': ${files}`);
  }
}

/**
 * Save to register 1
 */
export async function saveWindowConfiguration1(): Promise<void> {
  const config = captureCurrentConfiguration();
  if (config) {
    registers.set('1', config);
    const files = config.visibleEditors.map(e => e.uri.split('/').pop()).join(' | ');
    vscode.window.showInformationMessage(`Saved to register '1': ${files}`);
  }
}

/**
 * Restore from register 1
 */
export async function restoreWindowConfiguration1(): Promise<void> {
  const config = registers.get('1');
  if (!config) {
    vscode.window.showWarningMessage(`No window configuration in register '1'`);
    return;
  }
  await applyConfiguration(config);
}

/**
 * Save to register 2
 */
export async function saveWindowConfiguration2(): Promise<void> {
  const config = captureCurrentConfiguration();
  if (config) {
    registers.set('2', config);
    const files = config.visibleEditors.map(e => e.uri.split('/').pop()).join(' | ');
    vscode.window.showInformationMessage(`Saved to register '2': ${files}`);
  }
}

/**
 * Restore from register 2
 */
export async function restoreWindowConfiguration2(): Promise<void> {
  const config = registers.get('2');
  if (!config) {
    vscode.window.showWarningMessage(`No window configuration in register '2'`);
    return;
  }
  await applyConfiguration(config);
}

function captureCurrentConfiguration(): WindowConfiguration | null {
  const tabGroups = vscode.window.tabGroups;
  const visibleEditors: VisibleEditor[] = [];
  let activeSplitIndex = 0;

  // Capture layout by counting groups and their arrangement
  // For simplicity, we'll use a basic layout based on group count
  const groupCount = tabGroups.all.length;

  for (let i = 0; i < tabGroups.all.length; i++) {
    const group = tabGroups.all[i];
    if (group.isActive) {
      activeSplitIndex = i;
    }

    // Only capture the active (visible) tab in each group
    const activeTab = group.activeTab;
    if (activeTab) {
      const uri = getTabUri(activeTab);
      if (uri) {
        // Try to get cursor position from the active editor
        let line: number | undefined;
        let column: number | undefined;

        const editor = vscode.window.visibleTextEditors.find(
          e => e.document.uri.toString() === uri.toString()
        );
        if (editor) {
          line = editor.selection.active.line;
          column = editor.selection.active.character;
        }

        visibleEditors.push({
          uri: uri.toString(),
          line,
          column,
        });
      }
    }
  }

  if (visibleEditors.length === 0) {
    vscode.window.showWarningMessage('No visible editors to save');
    return null;
  }

  // Build layout based on current arrangement
  const layout: EditorGroupLayout = {
    orientation: 0, // horizontal by default
    groups: visibleEditors.map(() => ({})),
  };

  return { layout, visibleEditors, activeSplitIndex };
}

function getTabUri(tab: vscode.Tab): vscode.Uri | undefined {
  const input = tab.input;
  if (input instanceof vscode.TabInputText) {
    return input.uri;
  }
  if (input instanceof vscode.TabInputNotebook) {
    return input.uri;
  }
  return undefined;
}

async function applyConfiguration(config: WindowConfiguration): Promise<void> {
  // Close all current editors
  await vscode.commands.executeCommand('workbench.action.closeAllEditors');

  // Apply the layout structure
  await vscode.commands.executeCommand('vscode.setEditorLayout', config.layout);

  // Small delay to let the layout settle
  await new Promise(resolve => setTimeout(resolve, 50));

  // Open each visible file in its split
  for (let i = 0; i < config.visibleEditors.length; i++) {
    const editor = config.visibleEditors[i];
    const uri = vscode.Uri.parse(editor.uri);
    const viewColumn = i + 1;
    const isActiveSplit = i === config.activeSplitIndex;

    try {
      const doc = await vscode.workspace.openTextDocument(uri);
      const textEditor = await vscode.window.showTextDocument(doc, {
        viewColumn: viewColumn as vscode.ViewColumn,
        preserveFocus: !isActiveSplit,
      });

      // Restore cursor position if we have it
      if (editor.line !== undefined && editor.column !== undefined) {
        const position = new vscode.Position(editor.line, editor.column);
        textEditor.selection = new vscode.Selection(position, position);
        textEditor.revealRange(new vscode.Range(position, position), vscode.TextEditorRevealType.InCenter);
      }
    } catch (err) {
      log(`Failed to restore editor ${editor.uri}: ${err}`);
    }
  }

  // Focus the originally active split
  await focusEditorGroup(config.activeSplitIndex + 1);
}

async function focusEditorGroup(groupNumber: number): Promise<void> {
  const focusCommands: Record<number, string> = {
    1: 'workbench.action.focusFirstEditorGroup',
    2: 'workbench.action.focusSecondEditorGroup',
    3: 'workbench.action.focusThirdEditorGroup',
    4: 'workbench.action.focusFourthEditorGroup',
    5: 'workbench.action.focusFifthEditorGroup',
    6: 'workbench.action.focusSixthEditorGroup',
    7: 'workbench.action.focusSeventhEditorGroup',
    8: 'workbench.action.focusEighthEditorGroup',
  };
  const command = focusCommands[groupNumber];
  if (command) {
    await vscode.commands.executeCommand(command);
  }
}

/**
 * Show all saved registers
 */
export async function listWindowConfigurationRegisters(): Promise<void> {
  if (registers.size === 0) {
    vscode.window.showInformationMessage('No saved window configurations');
    return;
  }

  const items: (vscode.QuickPickItem & { register?: string })[] = [];

  for (const [key, config] of registers.entries()) {
    // Create a simple description of visible files
    const fileNames = config.visibleEditors
      .map(e => e.uri.split('/').pop())
      .join(' | ');

    items.push({
      label: `Register '${key}'`,
      description: `${config.visibleEditors.length} split(s): ${fileNames}`,
      register: key,
    });
  }

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a register to restore',
  });

  if (selected?.register) {
    const config = registers.get(selected.register);
    if (config) {
      await applyConfiguration(config);
    }
  }
}
