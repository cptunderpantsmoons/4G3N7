/**
 * Phase 5.1 - Macro Engine Service
 * 
 * Manages application-specific automation macros, triggers, and execution.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  ApplicationMacro,
  MacroLibrary,
  MacroTrigger,
  MacroTriggerType,
  MacroExecution,
} from '../interfaces/desktop-control.interface';

@Injectable()
export class MacroEngineService {
  private readonly logger = new Logger(MacroEngineService.name);

  // Store macro libraries per application
  private libraries = new Map<string, MacroLibrary>();
  // Store all macros for quick lookup
  private macros = new Map<string, ApplicationMacro>();
  // Track macro executions
  private executionHistory = new Map<string, MacroExecution[]>();
  // Active triggers and their handlers
  private activeTriggers = new Map<string, NodeJS.Timeout>();

  constructor() {
    this.initializeDefaultLibraries();
  }

  /**
   * Initialize default macro libraries
   */
  private initializeDefaultLibraries(): void {
    const defaultApps = [
      'firefox',
      'vscode',
      'terminal',
      'libreoffice',
      'thunderbird',
      'file-manager',
    ];

    for (const app of defaultApps) {
      this.createLibrary(app, `${app} Macro Library`, `Automation macros for ${app}`);
    }
  }

  /**
   * Create a new macro library
   */
  createLibrary(applicationName: string, name: string, description: string): MacroLibrary {
    const libraryId = `lib_${applicationName}_${Date.now()}`;

    const library: MacroLibrary = {
      id: libraryId,
      name,
      description,
      applicationName,
      macros: [],
      categories: {},
      tags: [],
    };

    this.libraries.set(applicationName, library);
    this.logger.log(`Created macro library for ${applicationName}: ${name}`);

    return library;
  }

  /**
   * Get a macro library
   */
  getLibrary(applicationName: string): MacroLibrary | undefined {
    return this.libraries.get(applicationName);
  }

  /**
   * List all libraries
   */
  listLibraries(): MacroLibrary[] {
    return Array.from(this.libraries.values());
  }

  /**
   * Save a macro
   */
  async saveMacro(macro: ApplicationMacro): Promise<void> {
    if (!macro.id) {
      macro.id = `macro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    const library = this.libraries.get(macro.applicationName);
    if (!library) {
      throw new Error(`Library not found for application: ${macro.applicationName}`);
    }

    this.macros.set(macro.id, macro);
    
    // Add to library if not already present
    if (!library.macros.find(m => m.id === macro.id)) {
      library.macros.push(macro);
    }

    // Add tags to library
    for (const tag of macro.actions[0]?.type ? [macro.actions[0].type] : []) {
      if (!library.tags.includes(tag)) {
        library.tags.push(tag);
      }
    }

    this.logger.log(`Saved macro: ${macro.id} (${macro.name})`);
  }

  /**
   * Get a macro by ID
   */
  getMacro(macroId: string): ApplicationMacro | undefined {
    return this.macros.get(macroId);
  }

  /**
   * Get all macros for an application
   */
  getMacrosForApplication(applicationName: string): ApplicationMacro[] {
    const library = this.libraries.get(applicationName);
    if (!library) {
      return [];
    }

    return [...library.macros];
  }

  /**
   * Update a macro
   */
  async updateMacro(macroId: string, updates: Partial<ApplicationMacro>): Promise<void> {
    const macro = this.macros.get(macroId);
    if (!macro) {
      throw new Error(`Macro not found: ${macroId}`);
    }

    Object.assign(macro, updates);
    macro.modifiedAt = new Date();

    this.logger.log(`Updated macro: ${macroId}`);
  }

  /**
   * Delete a macro
   */
  async deleteMacro(macroId: string): Promise<void> {
    const macro = this.macros.get(macroId);
    if (!macro) {
      throw new Error(`Macro not found: ${macroId}`);
    }

    const library = this.libraries.get(macro.applicationName);
    if (library) {
      library.macros = library.macros.filter(m => m.id !== macroId);
    }

    this.macros.delete(macroId);
    this.logger.log(`Deleted macro: ${macroId}`);
  }

  /**
   * Execute a macro
   */
  async executeMacro(macroId: string): Promise<MacroExecution> {
    const macro = this.macros.get(macroId);
    if (!macro) {
      throw new Error(`Macro not found: ${macroId}`);
    }

    if (!macro.enabled) {
      throw new Error(`Macro is disabled: ${macroId}`);
    }

    const execution: MacroExecution = {
      id: `exec_${macroId}_${Date.now()}`,
      macroId,
      macroName: macro.name,
      startTime: new Date(),
      status: 'running',
      executedActions: 0,
      totalActions: macro.actions.length,
    };

    try {
      this.logger.log(`Executing macro: ${macro.name} (${macroId})`);

      // Check preconditions
      if (macro.preconditions) {
        for (const condition of macro.preconditions) {
          this.logger.debug(`Checking precondition: ${condition.criteria}`);
          // TODO: Actually evaluate conditions
        }
      }

      // Execute actions
      for (const action of macro.actions) {
        // TODO: Actually execute the action
        execution.executedActions++;
      }

      // Check postconditions
      if (macro.postconditions) {
        for (const condition of macro.postconditions) {
          this.logger.debug(`Checking postcondition: ${condition.criteria}`);
          // TODO: Actually evaluate conditions
        }
      }

      execution.endTime = new Date();
      execution.status = 'completed';

      macro.executionCount++;
      macro.lastExecutedAt = new Date();

      this.logger.log(`Macro executed successfully: ${macro.name}`);
    } catch (error) {
      execution.endTime = new Date();
      execution.status = 'failed';
      execution.errors = [error.message];

      this.logger.error(`Macro execution failed: ${error.message}`);
    } finally {
      this.recordExecution(macroId, execution);
    }

    return execution;
  }

  /**
   * Execute macro by trigger
   */
  async executeMacroByTrigger(trigger: MacroTrigger): Promise<MacroExecution[]> {
    const executions: MacroExecution[] = [];

    // Find macros with this trigger
    for (const macro of this.macros.values()) {
      const hasTrigger = macro.triggers.some(t => this.trigerMatches(t, trigger));
      if (hasTrigger) {
        const execution = await this.executeMacro(macro.id);
        executions.push(execution);
      }
    }

    return executions;
  }

  /**
   * Check if two triggers match
   */
  private trigerMatches(trigger1: MacroTrigger, trigger2: MacroTrigger): boolean {
    if (trigger1.type !== trigger2.type) {
      return false;
    }

    switch (trigger1.type) {
      case MacroTriggerType.HOTKEY:
        return JSON.stringify(trigger1.hotkey) === JSON.stringify(trigger2.hotkey);
      case MacroTriggerType.SCHEDULED:
        return JSON.stringify(trigger1.schedule) === JSON.stringify(trigger2.schedule);
      case MacroTriggerType.EVENT:
        return trigger1.event?.name === trigger2.event?.name;
      case MacroTriggerType.VOICE:
        return trigger1.voice?.phrase === trigger2.voice?.phrase;
      case MacroTriggerType.GESTURE:
        return trigger1.gesture?.type === trigger2.gesture?.type;
      default:
        return false;
    }
  }

  /**
   * Register a hotkey trigger
   */
  registerHotkey(macroId: string, modifiers: string[], key: string): void {
    const macro = this.macros.get(macroId);
    if (!macro) {
      throw new Error(`Macro not found: ${macroId}`);
    }

    const triggerId = `trigger_${macroId}_${Date.now()}`;

    // TODO: Actually register hotkey with system
    // This would involve:
    // - Using a hotkey library like globalShortcut or electron-localshortcut
    // - Registering the hotkey globally
    // - Executing the macro when pressed

    this.logger.log(`Registered hotkey for macro ${macroId}: ${modifiers.join('+')}+${key}`);
  }

  /**
   * Unregister a hotkey trigger
   */
  unregisterHotkey(macroId: string): void {
    const timeout = this.activeTriggers.get(macroId);
    if (timeout) {
      clearTimeout(timeout);
      this.activeTriggers.delete(macroId);
    }

    this.logger.log(`Unregistered hotkey for macro ${macroId}`);
  }

  /**
   * Record macro execution
   */
  private recordExecution(macroId: string, execution: MacroExecution): void {
    if (!this.executionHistory.has(macroId)) {
      this.executionHistory.set(macroId, []);
    }

    const history = this.executionHistory.get(macroId)!;
    history.push(execution);

    // Keep only last 50 executions per macro
    if (history.length > 50) {
      history.shift();
    }
  }

  /**
   * Get execution history for a macro
   */
  getExecutionHistory(macroId: string, limit: number = 10): MacroExecution[] {
    const history = this.executionHistory.get(macroId) || [];
    return history.slice(-limit);
  }

  /**
   * Get macro statistics
   */
  getMacroStats(macroId?: string): {
    totalMacros: number;
    enabledMacros: number;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
  } {
    let macros: ApplicationMacro[] = [];

    if (macroId) {
      const macro = this.macros.get(macroId);
      if (macro) macros = [macro];
    } else {
      macros = Array.from(this.macros.values());
    }

    const enabledMacros = macros.filter(m => m.enabled).length;
    let totalExecutions = 0;
    let successfulExecutions = 0;
    let failedExecutions = 0;

    for (const macro of macros) {
      const executions = this.executionHistory.get(macro.id) || [];
      totalExecutions += executions.length;
      successfulExecutions += executions.filter(e => e.status === 'completed').length;
      failedExecutions += executions.filter(e => e.status === 'failed').length;
    }

    return {
      totalMacros: macros.length,
      enabledMacros,
      totalExecutions,
      successfulExecutions,
      failedExecutions,
    };
  }

  /**
   * Clone a macro
   */
  async cloneMacro(macroId: string, newName: string): Promise<ApplicationMacro> {
    const originalMacro = this.macros.get(macroId);
    if (!originalMacro) {
      throw new Error(`Macro not found: ${macroId}`);
    }

    const clonedMacro: ApplicationMacro = {
      ...JSON.parse(JSON.stringify(originalMacro)),
      id: `macro_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: newName,
      createdAt: new Date(),
      modifiedAt: new Date(),
      executionCount: 0,
      lastExecutedAt: undefined,
    };

    await this.saveMacro(clonedMacro);
    this.logger.log(`Cloned macro ${macroId} as ${clonedMacro.id}`);

    return clonedMacro;
  }

  /**
   * Import macros from JSON
   */
  async importMacros(json: string): Promise<ApplicationMacro[]> {
    try {
      const data = JSON.parse(json);
      const macros: ApplicationMacro[] = Array.isArray(data) ? data : [data];

      for (const macro of macros) {
        await this.saveMacro(macro);
      }

      this.logger.log(`Imported ${macros.length} macros`);
      return macros;
    } catch (error) {
      throw new Error(`Failed to import macros: ${error.message}`);
    }
  }

  /**
   * Export macros to JSON
   */
  exportMacros(applicationName?: string): string {
    let macrosToExport: ApplicationMacro[] = [];

    if (applicationName) {
      macrosToExport = this.getMacrosForApplication(applicationName);
    } else {
      macrosToExport = Array.from(this.macros.values());
    }

    return JSON.stringify(macrosToExport, null, 2);
  }

  /**
   * Shutdown the service
   */
  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Shutting down Macro Engine Service');

    // Unregister all hotkeys
    for (const [macroId] of this.activeTriggers) {
      this.unregisterHotkey(macroId);
    }

    this.activeTriggers.clear();
  }
}
