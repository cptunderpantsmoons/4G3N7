/**
 * Claude Code Skills Registry Service for Goose Bridge
 * 
 * This service manages the registration, discovery, and lifecycle of Claude Code Skills
 * within the Goose AI Agent system. It provides a registry for skills discovered from
 * various sources (personal, project, plugin) and handles skill metadata.
 */

import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { 
  ClaudeSkillMetadata, 
  ClaudeSkillManifest, 
  ClaudeSkillsRegistry, 
  ClaudeSkillEvent,
  ClaudeCodeIntegrationConfig 
} from './skills.interface';

@Injectable()
export class ClaudeSkillsRegistryService implements ClaudeSkillsRegistry {
  private readonly logger = new Logger(ClaudeSkillsRegistryService.name);
  private skills = new Map<string, ClaudeSkillMetadata>();
  private config: ClaudeCodeIntegrationConfig;

  constructor(private readonly eventEmitter: EventEmitter2) {
    this.config = {
      enabled: true,
      models: [],
      skillsPath: {
        personal: '~/.claude/skills',
        project: '.claude/skills',
        plugin: '.claude/plugins',
      },
      defaultTimeout: 300000, // 5 minutes
      maxConcurrentTasks: 10,
      autoUpdateSkills: true,
      verboseLogging: true,
    };
  }

  /**
   * Initialize the skills registry by scanning for available skills
   */
  async initialize(): Promise<void> {
    this.logger.log('Initializing Claude Code Skills Registry...');
    
    try {
      // Scan for personal skills
      await this.scanSkillsDirectory(this.config.skillsPath.personal, 'personal');
      
      // Scan for project skills
      await this.scanSkillsDirectory(this.config.skillsPath.project, 'project');
      
      // Scan for plugin skills
      await this.scanSkillsDirectory(this.config.skillsPath.plugin, 'plugin');
      
      this.logger.log(`Loaded ${this.skills.size} Claude Code Skills`);
    } catch (error) {
      this.logger.error('Failed to initialize skills registry', error);
    }
  }

  /**
   * Register a new skill
   */
  async registerSkill(skill: ClaudeSkillMetadata): Promise<void> {
    try {
      // Validate skill
      await this.validateSkill(skill);
      
      // Store skill metadata
      this.skills.set(skill.id, {
        ...skill,
        updatedAt: new Date(),
      });
      
      // Emit event
      this.eventEmitter.emit('skill.registered', {
        type: 'skill_registered',
        skillId: skill.id,
        timestamp: new Date(),
        data: skill,
      } as ClaudeSkillEvent);
      
      this.logger.log(`Registered skill: ${skill.name} (${skill.id})`);
    } catch (error) {
      this.logger.error(`Failed to register skill: ${skill.name}`, error);
      throw error;
    }
  }

  /**
   * Unregister a skill
   */
  async unregisterSkill(skillId: string): Promise<void> {
    const skill = this.skills.get(skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }

    this.skills.delete(skillId);
    
    this.eventEmitter.emit('skill.unregistered', {
      type: 'skill_updated',
      skillId,
      timestamp: new Date(),
      data: { previous: skill },
    } as ClaudeSkillEvent);
    
    this.logger.log(`Unregistered skill: ${skill.name} (${skillId})`);
  }

  /**
   * Get skill metadata by ID
   */
  async getSkill(skillId: string): Promise<ClaudeSkillMetadata | null> {
    return this.skills.get(skillId) || null;
  }

  /**
   * List all skills with optional filtering
   */
  async listSkills(filter?: { 
    type?: 'personal' | 'project' | 'plugin'; 
    capability?: string; 
  }): Promise<ClaudeSkillMetadata[]> {
    let skills = Array.from(this.skills.values());
    
    if (filter?.type) {
      skills = skills.filter(skill => skill.type === filter.type);
    }
    
    if (filter?.capability) {
      skills = skills.filter(skill => 
        skill.capabilities.some(cap => cap.id === filter.capability)
      );
    }
    
    return skills;
  }

  /**
   * Update skill metadata
   */
  async updateSkill(skillId: string, updates: Partial<ClaudeSkillMetadata>): Promise<void> {
    const skill = this.skills.get(skillId);
    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }

    const updatedSkill = {
      ...skill,
      ...updates,
      updatedAt: new Date(),
    };

    this.skills.set(skillId, updatedSkill);
    
    this.eventEmitter.emit('skill.updated', {
      type: 'skill_updated',
      skillId,
      timestamp: new Date(),
      data: { previous: skill, updated: updatedSkill },
    } as ClaudeSkillEvent);
    
    this.logger.log(`Updated skill: ${updatedSkill.name} (${skillId})`);
  }

  /**
   * Get skill manifest from file system
   */
  async getSkillManifest(skillId: string): Promise<ClaudeSkillManifest | null> {
    const skill = this.skills.get(skillId);
    if (!skill) {
      return null;
    }

    try {
      const manifestPath = path.join(skill.path, 'SKILL.md');
      const content = await fs.readFile(manifestPath, 'utf-8');
      
      // Parse YAML frontmatter
      const manifest = this.parseSkillManifest(content);
      return manifest;
    } catch (error) {
      this.logger.error(`Failed to load skill manifest for ${skillId}`, error);
      return null;
    }
  }

  /**
   * Get skill content blocks
   */
  async getSkillContentBlocks(skillId: string): Promise<any[]> {
    const skill = this.skills.get(skillId);
    if (!skill) {
      return [];
    }

    try {
      const manifestPath = path.join(skill.path, 'SKILL.md');
      const content = await fs.readFile(manifestPath, 'utf-8');
      
      // Extract content blocks from the markdown
      const contentBlocks = this.extractContentBlocks(content);
      return contentBlocks;
    } catch (error) {
      this.logger.error(`Failed to load skill content for ${skillId}`, error);
      return [];
    }
  }

  /**
   * Refresh skills from file system
   */
  async refreshSkills(): Promise<void> {
    this.logger.log('Refreshing skills from file system...');
    
    // Clear existing skills
    this.skills.clear();
    
    // Rescan directories
    await this.scanSkillsDirectory(this.config.skillsPath.personal, 'personal');
    await this.scanSkillsDirectory(this.config.skillsPath.project, 'project');
    await this.scanSkillsDirectory(this.config.skillsPath.plugin, 'plugin');
    
    this.logger.log(`Refreshed ${this.skills.size} skills`);
  }

  /**
   * Private methods
   */

  private async scanSkillsDirectory(directory: string, type: 'personal' | 'project' | 'plugin'): Promise<void> {
    try {
      const fullPath = this.resolvePath(directory);
      const stats = await fs.stat(fullPath);
      
      if (!stats.isDirectory()) {
        return;
      }

      const items = await fs.readdir(fullPath);
      
      for (const item of items) {
        const itemPath = path.join(fullPath, item);
        const itemStats = await fs.stat(itemPath);
        
        if (itemStats.isDirectory()) {
          await this.processSkillDirectory(itemPath, item, type);
        }
      }
    } catch (error) {
      if (this.config.verboseLogging) {
        this.logger.warn(`Skills directory not found: ${directory}`);
      }
    }
  }

  private async processSkillDirectory(skillPath: string, skillName: string, type: 'personal' | 'project' | 'plugin'): Promise<void> {
    try {
      const manifestPath = path.join(skillPath, 'SKILL.md');
      const manifestExists = await this.fileExists(manifestPath);
      
      if (!manifestExists) {
        return;
      }

      const content = await fs.readFile(manifestPath, 'utf-8');
      const manifest = this.parseSkillManifest(content);
      
      if (!manifest) {
        return;
      }

      const skill: ClaudeSkillMetadata = {
        id: this.generateSkillId(skillName, type),
        name: manifest.name,
        version: manifest.version,
        author: manifest.author,
        description: manifest.description,
        type,
        path: skillPath,
        source: 'local',
        installedAt: new Date(),
        updatedAt: new Date(),
        capabilities: manifest.capabilities,
      };

      await this.registerSkill(skill);
    } catch (error) {
      this.logger.error(`Failed to process skill directory: ${skillPath}`, error);
    }
  }

  private parseSkillManifest(content: string): ClaudeSkillManifest | null {
    try {
      // Extract YAML frontmatter
      const frontmatterMatch = content.match(/^---\s*\n([\s\S]*?)\n---/);
      
      if (!frontmatterMatch) {
        return null;
      }

      const frontmatter = yaml.load(frontmatterMatch[1]) as any;
      
      return {
        name: frontmatter.name,
        description: frontmatter.description,
        version: frontmatter.version,
        author: frontmatter.author,
        capabilities: frontmatter.capabilities || [],
        allowedTools: frontmatter.allowedTools,
        dependencies: frontmatter.dependencies,
      };
    } catch (error) {
      this.logger.error('Failed to parse skill manifest', error);
      return null;
    }
  }

  private extractContentBlocks(content: string): any[] {
    // Remove YAML frontmatter
    const contentWithoutFrontmatter = content.replace(/^---\s*\n([\s\S]*?)\n---/, '');
    
    // Extract code blocks and sections
    const codeBlocks = this.extractCodeBlocks(contentWithoutFrontmatter);
    const sections = this.extractSections(contentWithoutFrontmatter);
    
    return [...codeBlocks, ...sections];
  }

  private extractCodeBlocks(content: string): any[] {
    const blocks: any[] = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    let match;
    
    while ((match = codeBlockRegex.exec(content)) !== null) {
      blocks.push({
        type: 'code',
        language: match[1] || 'text',
        content: match[2],
      });
    }
    
    return blocks;
  }

  private extractSections(content: string): any[] {
    const sections: any[] = [];
    const lines = content.split('\n');
    let currentSection = null;
    let sectionContent: string[] = [];
    
    for (const line of lines) {
      if (line.startsWith('#')) {
        if (currentSection) {
          sections.push({
            type: 'section',
            title: currentSection,
            content: sectionContent.join('\n'),
          });
        }
        
        currentSection = line.replace(/^#+\s*/, '');
        sectionContent = [];
      } else if (currentSection) {
        sectionContent.push(line);
      }
    }
    
    if (currentSection && sectionContent.length > 0) {
      sections.push({
        type: 'section',
        title: currentSection,
        content: sectionContent.join('\n'),
      });
    }
    
    return sections;
  }

  private async validateSkill(skill: ClaudeSkillMetadata): Promise<void> {
    if (!skill.name || !skill.id || !skill.description) {
      throw new Error('Invalid skill: missing required fields');
    }
    
    if (!skill.capabilities || skill.capabilities.length === 0) {
      throw new Error('Invalid skill: no capabilities defined');
    }
  }

  private generateSkillId(name: string, type: string): string {
    const sanitized = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    return `${type}-${sanitized}-${Date.now()}`;
  }

  private resolvePath(pathStr: string): string {
    if (pathStr.startsWith('~')) {
      const homeDir = process.env.HOME || process.env.USERPROFILE || '';
      return path.join(homeDir, pathStr.slice(1));
    }
    return path.resolve(pathStr);
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }
}
