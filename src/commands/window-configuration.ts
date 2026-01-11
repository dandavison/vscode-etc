import * as vscode from 'vscode';
import { log } from '../log';

/**
 * A saved window configuration, inspired by Emacs' window-configuration-to-register.
 * Captures the editor layout (splits) and the files open in each group.
 */
interface WindowConfiguration {
  /** The editor group layout (splits, orientations, sizes) */
  layout: EditorGroupLayout;
  /** Files in each group, indexed by viewColumn */
  groups: GroupState[];
  /** Which group was active */
  activeGroupIndex: number;
}

interface GroupState {
  viewColumn: vscode.ViewColumn;
  tabs: TabState[];
  activeTabIndex: number;
}

interface TabState {
  uri: string;
  isPreview: boolean;
  isPinned: boolean;
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
  const register = await promptForRegister('Save window configuration to register');
  if (register === undefined) {
    return;
  }

  const config = await captureCurrentConfiguration();
  if (config) {
    registers.set(register, config);
    vscode.window.showInformationMessage(`Window configuration saved to register '${register}'`);
    log(`Saved window configuration to register '${register}': ${config.groups.length} groups`);
  }
}

/**
 * Restore a window configuration from a register.
 * Prompts the user for a register name.
 */
export async function restoreWindowConfiguration(): Promise<void> {
  const register = await promptForRegister('Restore window configuration from register');
  if (register === undefined) {
    return;
  }

  const config = registers.get(register);
  if (!config) {
    vscode.window.showWarningMessage(`No window configuration in register '${register}'`);
    return;
  }

  await applyConfiguration(config);
  log(`Restored window configuration from register '${register}'`);
}

/**
 * Quick save to register 1 (most common use case)
 */
export async function quickSaveWindowConfiguration(): Promise<void> {
  const config = await captureCurrentConfiguration();
  if (config) {
    registers.set('1', config);
    vscode.window.showInformationMessage(`Window configuration saved to register '1'`);
  }
}

/**
 * Quick restore from register 1
 */
export async function quickRestoreWindowConfiguration(): Promise<void> {
  const config = registers.get('1');
  if (!config) {
    vscode.window.showWarningMessage(`No window configuration in register '1'`);
    return;
  }
  await applyConfiguration(config);
}

async function promptForRegister(prompt: string): Promise<string | undefined> {
  const result = await vscode.window.showInputBox({
    prompt,
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
  return result?.toLowerCase();
}

async function captureCurrentConfiguration(): Promise<WindowConfiguration | null> {
  // Get the layout structure
  const layout = await vscode.commands.executeCommand<EditorGroupLayout>('vscode.getEditorLayout');
  if (!layout) {
    vscode.window.showErrorMessage('Could not get editor layout');
    return null;
  }

  // Get the tabs in each group
  const tabGroups = vscode.window.tabGroups;
  const groups: GroupState[] = [];
  let activeGroupIndex = 0;

  for (let i = 0; i < tabGroups.all.length; i++) {
    const group = tabGroups.all[i];
    if (group.isActive) {
      activeGroupIndex = i;
    }

    const tabs: TabState[] = [];
    let activeTabIndex = 0;

    for (let j = 0; j < group.tabs.length; j++) {
      const tab = group.tabs[j];
      if (tab.isActive) {
        activeTabIndex = j;
      }

      // We only save text tabs (files)
      const uri = getTabUri(tab);
      if (uri) {
        tabs.push({
          uri: uri.toString(),
          isPreview: tab.isPreview,
          isPinned: tab.isPinned,
        });
      }
    }

    groups.push({
      viewColumn: group.viewColumn,
      tabs,
      activeTabIndex,
    });
  }

  return { layout, groups, activeGroupIndex };
}

function getTabUri(tab: vscode.Tab): vscode.Uri | undefined {
  const input = tab.input;
  if (input instanceof vscode.TabInputText) {
    return input.uri;
  }
  if (input instanceof vscode.TabInputNotebook) {
    return input.uri;
  }
  // Could extend to handle diffs, custom editors, etc.
  return undefined;
}

async function applyConfiguration(config: WindowConfiguration): Promise<void> {
  // Close all current editors first
  await vscode.commands.executeCommand('workbench.action.closeAllEditors');

  // Apply the layout structure
  await vscode.commands.executeCommand('vscode.setEditorLayout', config.layout);

  // Small delay to let the layout settle
  await new Promise(resolve => setTimeout(resolve, 50));

  // Open files in each group
  for (let groupIndex = 0; groupIndex < config.groups.length; groupIndex++) {
    const groupState = config.groups[groupIndex];

    // Determine the view column for this group
    // viewColumn is 1-indexed in VS Code API
    const viewColumn = groupIndex + 1;

    for (let tabIndex = 0; tabIndex < groupState.tabs.length; tabIndex++) {
      const tabState = groupState.tabs[tabIndex];
      const uri = vscode.Uri.parse(tabState.uri);

      try {
        // Open the document
        const doc = await vscode.workspace.openTextDocument(uri);

        // Show it in the correct group
        const isActiveTab = tabIndex === groupState.activeTabIndex;
        await vscode.window.showTextDocument(doc, {
          viewColumn: viewColumn as vscode.ViewColumn,
          preview: tabState.isPreview && !tabState.isPinned,
          preserveFocus: !isActiveTab || groupIndex !== config.activeGroupIndex,
        });

        // Pin if it was pinned
        if (tabState.isPinned) {
          await vscode.commands.executeCommand('workbench.action.pinEditor');
        }
      } catch (err) {
        log(`Failed to restore tab ${tabState.uri}: ${err}`);
      }
    }
  }

  // Focus the originally active group
  const targetViewColumn = config.activeGroupIndex + 1;
  await vscode.commands.executeCommand('workbench.action.focusEditorGroup', targetViewColumn);
}

/**
 * Show all saved registers
 */
export async function listWindowConfigurationRegisters(): Promise<void> {
  if (registers.size === 0) {
    vscode.window.showInformationMessage('No saved window configurations');
    return;
  }

  const items = Array.from(registers.entries()).map(([key, config]) => ({
    label: `Register '${key}'`,
    description: `${config.groups.length} groups, ${config.groups.reduce((acc, g) => acc + g.tabs.length, 0)} tabs`,
    register: key,
  }));

  const selected = await vscode.window.showQuickPick(items, {
    placeHolder: 'Select a register to restore',
  });

  if (selected) {
    const config = registers.get(selected.register);
    if (config) {
      await applyConfiguration(config);
    }
  }
}
