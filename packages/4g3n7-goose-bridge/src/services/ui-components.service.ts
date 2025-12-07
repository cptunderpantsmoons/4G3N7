/**
 * Phase 7 - UI Components Service
 * Component library and management
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  UIComponent,
  Button,
  Input,
  Modal,
  Table,
  Form,
  ComponentType,
  ButtonVariant,
  ButtonSize,
} from '../interfaces/ui-experience.interface';

@Injectable()
export class UIComponentsService {
  private readonly logger = new Logger(UIComponentsService.name);

  private components = new Map<string, UIComponent>();

  constructor() {
    this.initializeDefaultComponents();
  }

  async registerComponent(component: UIComponent): Promise<void> {
    this.logger.log(`Registering component: ${component.name}`);
    this.components.set(component.componentId, component);
  }

  async getComponent(componentId: string): Promise<UIComponent> {
    const component = this.components.get(componentId);
    if (!component) {
      throw new Error(`Component not found: ${componentId}`);
    }
    return component;
  }

  async updateComponent(componentId: string, updates: Partial<UIComponent>): Promise<void> {
    const component = this.components.get(componentId);
    if (!component) {
      throw new Error(`Component not found: ${componentId}`);
    }

    Object.assign(component, updates);
    this.logger.log(`Updated component: ${componentId}`);
  }

  async getAllComponents(type?: ComponentType): Promise<UIComponent[]> {
    let result = Array.from(this.components.values());
    if (type) {
      result = result.filter(c => c.type === type);
    }
    return result;
  }

  private initializeDefaultComponents(): void {
    const primaryButton: Button = {
      componentId: 'btn_primary',
      name: 'Primary Button',
      type: ComponentType.BUTTON,
      variant: ButtonVariant.PRIMARY,
      size: ButtonSize.MEDIUM,
      disabled: false,
      visible: true,
      label: 'Click me',
      loading: false,
      children: undefined,
      createdAt: new Date(),
    };

    const dangerButton: Button = {
      componentId: 'btn_danger',
      name: 'Danger Button',
      type: ComponentType.BUTTON,
      variant: ButtonVariant.DANGER,
      size: ButtonSize.MEDIUM,
      disabled: false,
      visible: true,
      label: 'Delete',
      loading: false,
      children: undefined,
      createdAt: new Date(),
    };

    const emailInput: Input = {
      componentId: 'inp_email',
      name: 'Email Input',
      type: ComponentType.INPUT,
      inputType: 'email',
      placeholder: 'Enter email',
      value: '',
      required: true,
      disabled: false,
      visible: true,
      children: undefined,
      validation: { pattern: '^[^@]+@[^@]+\\.[^@]+$' },
      createdAt: new Date(),
    };

    const modal: Modal = {
      componentId: 'modal_confirm',
      name: 'Confirmation Modal',
      type: ComponentType.MODAL,
      title: 'Confirm Action',
      open: false,
      modalSize: 'medium',
      closeButton: true,
      backdrop: true,
      disabled: false,
      visible: true,
      children: undefined,
      createdAt: new Date(),
    };

    this.components.set(primaryButton.componentId, primaryButton);
    this.components.set(dangerButton.componentId, dangerButton);
    this.components.set(emailInput.componentId, emailInput);
    this.components.set(modal.componentId, modal);

    this.logger.log('Initialized 4 default components');
  }

  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Shutting down UI Components Service');
    this.components.clear();
  }
}
