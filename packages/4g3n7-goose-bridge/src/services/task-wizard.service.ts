/**
 * Phase 6.1 - Task Wizard Service
 * Guided task creation with step-by-step wizards
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  TaskWizard,
  WizardSession,
  WizardStep,
  TaskDefinition,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '../interfaces/ui-task-management.interface';

@Injectable()
export class TaskWizardService {
  private readonly logger = new Logger(TaskWizardService.name);

  private wizards = new Map<string, TaskWizard>();
  private sessions = new Map<string, WizardSession>();
  private sessionHistory = new Map<string, WizardSession[]>();

  constructor() {
    this.initializeDefaultWizards();
  }

  async createWizard(wizard: TaskWizard): Promise<void> {
    this.logger.log(`Creating wizard: ${wizard.name}`);
    this.wizards.set(wizard.wizardId, wizard);
  }

  async startWizardSession(wizardId: string): Promise<WizardSession> {
    const wizard = this.wizards.get(wizardId);
    if (!wizard) {
      throw new Error(`Wizard not found: ${wizardId}`);
    }

    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.logger.log(`Starting wizard session: ${sessionId}`);

    const session: WizardSession = {
      sessionId,
      wizardId,
      currentStepId: wizard.startStepId,
      completedSteps: 0,
      totalSteps: wizard.steps.length,
      formData: {},
      startTime: new Date(),
      lastModified: new Date(),
      status: 'in_progress',
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  async getWizardStep(sessionId: string, stepId: string): Promise<WizardStep> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const wizard = this.wizards.get(session.wizardId);
    if (!wizard) {
      throw new Error(`Wizard not found: ${session.wizardId}`);
    }

    const step = wizard.steps.find(s => s.stepId === stepId);
    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    this.logger.debug(`Retrieved step: ${step.title}`);
    return step;
  }

  async submitWizardStep(sessionId: string, stepId: string, data: Record<string, any>): Promise<WizardStep | TaskDefinition> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.formData = { ...session.formData, ...data };
    session.lastModified = new Date();

    const wizard = this.wizards.get(session.wizardId);
    if (!wizard) {
      throw new Error(`Wizard not found: ${session.wizardId}`);
    }

    const step = wizard.steps.find(s => s.stepId === stepId);
    if (!step) {
      throw new Error(`Step not found: ${stepId}`);
    }

    session.completedSteps++;

    // Check if this is the last step
    if (session.completedSteps >= wizard.steps.length) {
      return await this.completeWizardSession(sessionId);
    }

    // Get next step
    const nextStepId = step.nextStep;
    if (nextStepId) {
      session.currentStepId = nextStepId;
      return this.getWizardStep(sessionId, nextStepId);
    }

    throw new Error(`No next step defined for: ${stepId}`);
  }

  async completeWizardSession(sessionId: string): Promise<TaskDefinition> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    this.logger.log(`Completing wizard session: ${sessionId}`);

    session.status = 'completed';

    const taskId = `task_${Date.now()}`;
    const task: TaskDefinition = {
      taskId,
      name: session.formData.taskName || 'Unnamed Task',
      description: session.formData.taskDescription || '',
      type: session.formData.taskType || TaskType.CUSTOM,
      priority: session.formData.taskPriority || TaskPriority.MEDIUM,
      status: TaskStatus.PENDING,
      createdAt: new Date(),
      modifiedAt: new Date(),
      dueDate: session.formData.dueDate,
      estimatedDuration: session.formData.estimatedDuration,
      tags: session.formData.tags || [],
      metadata: { wizardId: session.wizardId, sessionId },
    };

    this.storeSession(session);
    return task;
  }

  async cancelWizardSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.status = 'abandoned';
    this.logger.log(`Cancelled wizard session: ${sessionId}`);
    this.storeSession(session);
    this.sessions.delete(sessionId);
  }

  async getWizardSessions(limit: number = 50): Promise<WizardSession[]> {
    const allSessions: WizardSession[] = [];
    for (const sessions of this.sessionHistory.values()) {
      allSessions.push(...sessions);
    }
    return allSessions.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime()).slice(0, limit);
  }

  private initializeDefaultWizards(): void {
    const wizards: TaskWizard[] = [
      {
        wizardId: 'wiz_automation',
        name: 'Automation Task Wizard',
        description: 'Create automated tasks with scheduling',
        steps: [
          {
            stepId: 'step_1',
            title: 'Task Details',
            description: 'Enter task name and description',
            type: 'input',
            fields: [
              { fieldId: 'taskName', label: 'Task Name', type: 'text', required: true },
              { fieldId: 'taskDescription', label: 'Description', type: 'text', required: false },
            ],
            nextStep: 'step_2',
          },
          {
            stepId: 'step_2',
            title: 'Task Type & Priority',
            description: 'Select task type and priority',
            type: 'select',
            fields: [
              { fieldId: 'taskType', label: 'Task Type', type: 'select', required: true, options: [
                { value: 'automation', label: 'Automation' },
                { value: 'workflow', label: 'Workflow' },
              ]},
              { fieldId: 'taskPriority', label: 'Priority', type: 'select', required: true, options: [
                { value: 'low', label: 'Low' },
                { value: 'medium', label: 'Medium' },
                { value: 'high', label: 'High' },
              ]},
            ],
            previousStep: 'step_1',
            nextStep: 'step_3',
          },
          {
            stepId: 'step_3',
            title: 'Review & Create',
            description: 'Review your task configuration',
            type: 'summary',
            previousStep: 'step_2',
          },
        ],
        startStepId: 'step_1',
        category: 'automation',
        created: new Date(),
        modified: new Date(),
        enabled: true,
      },
    ];

    for (const wizard of wizards) {
      this.wizards.set(wizard.wizardId, wizard);
    }
  }

  private storeSession(session: WizardSession): void {
    const key = session.wizardId;
    if (!this.sessionHistory.has(key)) {
      this.sessionHistory.set(key, []);
    }
    const history = this.sessionHistory.get(key)!;
    history.push(session);

    if (history.length > 100) {
      history.shift();
    }
  }

  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Shutting down Task Wizard Service');
    this.wizards.clear();
    this.sessions.clear();
    this.sessionHistory.clear();
  }
}
