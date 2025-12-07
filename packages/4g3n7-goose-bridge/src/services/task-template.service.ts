/**
 * Phase 6.1 - Task Template Service
 * Task template management and AI suggestions
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  TaskTemplate,
  TaskSuggestion,
  TemplateLibrary,
  TaskType,
  TaskPriority,
} from '../interfaces/ui-task-management.interface';

@Injectable()
export class TaskTemplateService {
  private readonly logger = new Logger(TaskTemplateService.name);

  private templates = new Map<string, TaskTemplate>();
  private libraries = new Map<string, TemplateLibrary>();
  private suggestions = new Map<string, TaskSuggestion[]>();

  constructor() {
    this.initializeDefaultTemplates();
  }

  async createTemplate(template: TaskTemplate): Promise<void> {
    this.logger.log(`Creating template: ${template.name}`);
    this.templates.set(template.templateId, template);
  }

  async getTemplates(category?: string): Promise<TaskTemplate[]> {
    let templates = Array.from(this.templates.values());

    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    return templates.sort((a, b) => b.usageCount - a.usageCount);
  }

  async getSuggestions(context?: Record<string, any>): Promise<TaskSuggestion[]> {
    this.logger.debug('Generating task suggestions');

    const suggestions: TaskSuggestion[] = [];
    // TODO: Implement AI-based suggestion logic using context

    for (const template of this.templates.values()) {
      if (suggestions.length >= 5) break;
      
      const suggestion: TaskSuggestion = {
        suggestionId: `sug_${Date.now()}`,
        taskName: template.name,
        description: template.description,
        templateId: template.templateId,
        confidence: 0.75 + Math.random() * 0.25,
        reason: 'Based on your recent activity',
        context,
        suggestedAt: new Date(),
      };
      suggestions.push(suggestion);
    }

    return suggestions;
  }

  async applyTemplate(templateId: string, overrides?: Record<string, any>): Promise<any> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    this.logger.log(`Applying template: ${template.name}`);

    template.usageCount++;
    template.modified = new Date();

    return {
      name: overrides?.name || template.name,
      description: overrides?.description || template.description,
      type: overrides?.type || template.type,
      steps: template.steps,
      priority: overrides?.priority || template.defaultPriority,
      estimatedDuration: overrides?.estimatedDuration || template.estimatedDuration,
    };
  }

  async cloneTemplate(templateId: string, newName: string): Promise<TaskTemplate> {
    const original = this.templates.get(templateId);
    if (!original) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const clonedId = `tpl_${Date.now()}`;
    const cloned: TaskTemplate = {
      ...original,
      templateId: clonedId,
      name: newName,
      created: new Date(),
      modified: new Date(),
      usageCount: 0,
    };

    this.templates.set(clonedId, cloned);
    this.logger.log(`Cloned template: ${newName}`);
    return cloned;
  }

  private initializeDefaultTemplates(): void {
    const templates: TaskTemplate[] = [
      {
        templateId: 'tpl_backup',
        name: 'System Backup',
        description: 'Automated system backup task',
        category: 'maintenance',
        type: TaskType.BACKUP,
        steps: [
          {
            stepId: 'step_1',
            name: 'Prepare Backup',
            description: 'Prepare system for backup',
            action: 'prepare_backup',
            sequence: 1,
            optional: false,
          },
          {
            stepId: 'step_2',
            name: 'Execute Backup',
            description: 'Execute backup process',
            action: 'execute_backup',
            sequence: 2,
            optional: false,
            timeout: 3600000,
          },
          {
            stepId: 'step_3',
            name: 'Verify Backup',
            description: 'Verify backup integrity',
            action: 'verify_backup',
            sequence: 3,
            optional: false,
          },
        ],
        defaultPriority: TaskPriority.HIGH,
        estimatedDuration: 3600000,
        tags: ['backup', 'maintenance'],
        created: new Date(),
        modified: new Date(),
        usageCount: 0,
      },
      {
        templateId: 'tpl_monitoring',
        name: 'System Monitoring',
        description: 'Monitor system health and performance',
        category: 'monitoring',
        type: TaskType.MONITORING,
        steps: [
          {
            stepId: 'step_1',
            name: 'Collect Metrics',
            description: 'Collect system metrics',
            action: 'collect_metrics',
            sequence: 1,
            optional: false,
          },
          {
            stepId: 'step_2',
            name: 'Analyze Health',
            description: 'Analyze system health',
            action: 'analyze_health',
            sequence: 2,
            optional: false,
          },
        ],
        defaultPriority: TaskPriority.MEDIUM,
        estimatedDuration: 300000,
        tags: ['monitoring', 'health'],
        created: new Date(),
        modified: new Date(),
        usageCount: 0,
      },
    ];

    for (const template of templates) {
      this.templates.set(template.templateId, template);
    }
  }

  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Shutting down Task Template Service');
    this.templates.clear();
    this.libraries.clear();
    this.suggestions.clear();
  }
}
