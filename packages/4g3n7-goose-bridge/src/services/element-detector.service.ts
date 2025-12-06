/**
 * Phase 5.2 - Element Detector Service
 * 
 * Detects UI elements and interactive components in images.
 * Identifies buttons, inputs, clickable regions, and accessibility features.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  ElementDetectionResult,
  VisualElement,
  ClickableElement,
  EditableElement,
  SelectableElement,
  ElementType,
  ElementHierarchy,
  InteractionMap,
} from '../interfaces/computer-vision.interface';
import * as crypto from 'crypto';

@Injectable()
export class ElementDetectorService {
  private readonly logger = new Logger(ElementDetectorService.name);

  // Cache detection results
  private detectionCache = new Map<string, ElementDetectionResult>();
  // Store element hierarchies
  private hierarchyStore = new Map<string, ElementHierarchy>();
  // Track detected elements
  private elementHistory = new Map<string, VisualElement[]>();

  constructor() {
    this.startCleanupScheduler();
  }

  /**
   * Detect all UI elements in an image
   */
  async detectElements(imageBuffer: Buffer): Promise<ElementDetectionResult> {
    const imageId = this.generateImageId(imageBuffer);

    // Check cache
    const cached = this.detectionCache.get(imageId);
    if (cached) {
      this.logger.debug(`Using cached detection for image ${imageId}`);
      return cached;
    }

    try {
      this.logger.log(`Detecting elements in image: ${imageId}`);

      const elements = await this.identifyElements(imageBuffer);
      const clickables = elements.filter((e): e is ClickableElement => this.isClickable(e));
      const editables = elements.filter((e): e is EditableElement => this.isEditable(e));
      const selectables = elements.filter((e): e is SelectableElement => this.isSelectable(e));
      const hierarchy = this.buildElementHierarchy(elements);
      const interactionMap = this.createInteractionMap(elements, hierarchy);

      const result: ElementDetectionResult = {
        imageId,
        timestamp: new Date(),
        elements,
        clickables,
        editables,
        selectables,
        hierarchy,
        interactionMap,
      };

      this.detectionCache.set(imageId, result);
      this.hierarchyStore.set(imageId, hierarchy);
      this.elementHistory.set(imageId, elements);

      return result;
    } catch (error) {
      this.logger.error(`Error detecting elements: ${error.message}`);
      throw error;
    }
  }

  /**
   * Find clickable elements specifically
   */
  async findClickableElements(imageBuffer: Buffer): Promise<ClickableElement[]> {
    const result = await this.detectElements(imageBuffer);
    return result.clickables;
  }

  /**
   * Find editable elements (inputs, textareas)
   */
  async findEditableElements(imageBuffer: Buffer): Promise<EditableElement[]> {
    const result = await this.detectElements(imageBuffer);
    return result.editables;
  }

  /**
   * Find selectable elements (dropdowns, lists)
   */
  async findSelectableElements(imageBuffer: Buffer): Promise<SelectableElement[]> {
    const result = await this.detectElements(imageBuffer);
    return result.selectables;
  }

  /**
   * Generate unique image ID from buffer hash
   */
  private generateImageId(imageBuffer: Buffer): string {
    return `img_${crypto.createHash('sha256').update(imageBuffer).digest('hex').substring(0, 16)}`;
  }

  /**
   * Identify all elements in image
   */
  private async identifyElements(imageBuffer: Buffer): Promise<VisualElement[]> {
    this.logger.debug('Identifying elements in image');

    // TODO: Integrate with computer vision library for actual element detection
    // - Use CNN models to classify UI elements
    // - Detect buttons, inputs, links, etc.
    // - Extract text labels
    // - Determine element states

    const elements: VisualElement[] = [];

    // TODO: Actual element identification
    // Example element:
    // {
    //   id: 'elem_0',
    //   type: ElementType.BUTTON,
    //   label: 'Submit',
    //   boundingBox: { x: 100, y: 200, width: 80, height: 40 },
    //   confidence: 0.95,
    //   state: 'normal',
    //   interactive: true,
    //   ariaLabel: 'Submit button',
    //   ariaRole: 'button'
    // }

    return elements;
  }

  /**
   * Check if element is clickable
   */
  private isClickable(element: VisualElement): element is ClickableElement {
    const clickableTypes = [
      ElementType.BUTTON,
      ElementType.LINK,
      ElementType.CHECKBOX,
      ElementType.RADIO,
      ElementType.DROPDOWN,
      ElementType.TAB,
    ];

    return clickableTypes.includes(element.type);
  }

  /**
   * Check if element is editable
   */
  private isEditable(element: VisualElement): element is EditableElement {
    return element.type === ElementType.INPUT || element.type === ElementType.TEXTAREA;
  }

  /**
   * Check if element is selectable
   */
  private isSelectable(element: VisualElement): element is SelectableElement {
    return element.type === ElementType.DROPDOWN || element.type === ElementType.LIST;
  }

  /**
   * Build element hierarchy (parent-child relationships)
   */
  private buildElementHierarchy(elements: VisualElement[]): ElementHierarchy {
    this.logger.debug(`Building hierarchy for ${elements.length} elements`);

    const nodes = elements.map((element, index) => ({
      id: element.id,
      parentId: element.parent,
      childrenIds: element.children || [],
      element,
      depth: this.calculateDepth(element.parent, elements),
    }));

    const rootId = nodes.find(n => !n.parentId)?.id || '';

    return {
      rootId,
      nodes,
    };
  }

  /**
   * Calculate depth of element in hierarchy
   */
  private calculateDepth(parentId: string | undefined, elements: VisualElement[], depth: number = 0): number {
    if (!parentId) return depth;

    const parent = elements.find(e => e.id === parentId);
    if (!parent) return depth;

    return this.calculateDepth(parent.parent, elements, depth + 1);
  }

  /**
   * Create interaction map for the elements
   */
  private createInteractionMap(elements: VisualElement[], hierarchy: ElementHierarchy): InteractionMap {
    this.logger.debug('Creating interaction map');

    const clickableRegions = elements
      .filter(e => this.isClickable(e))
      .map(e => ({
        element: e.id,
        coordinates: e.boundingBox,
      }));

    const editableRegions = elements
      .filter(e => this.isEditable(e))
      .map(e => ({
        element: e.id,
        coordinates: e.boundingBox,
      }));

    // TODO: Determine focus order and tab sequence based on layout
    const focusOrder = elements.filter(e => e.interactive).map(e => e.id);
    const tabSequence = focusOrder; // Simplified - should follow visual order

    return {
      clickableRegions,
      editableRegions,
      focusOrder,
      tabSequence,
    };
  }

  /**
   * Get detection result from cache
   */
  getDetection(imageId: string): ElementDetectionResult | undefined {
    return this.detectionCache.get(imageId);
  }

  /**
   * Get element by ID
   */
  getElement(imageId: string, elementId: string): VisualElement | undefined {
    const result = this.detectionCache.get(imageId);
    if (!result) return undefined;

    return result.elements.find(e => e.id === elementId);
  }

  /**
   * Find elements by type
   */
  findElementsByType(imageId: string, type: ElementType): VisualElement[] {
    const result = this.detectionCache.get(imageId);
    if (!result) return [];

    return result.elements.filter(e => e.type === type);
  }

  /**
   * Find elements by label or text
   */
  findElementsByText(imageId: string, text: string): VisualElement[] {
    const result = this.detectionCache.get(imageId);
    if (!result) return [];

    const lowerText = text.toLowerCase();
    return result.elements.filter(
      e => e.label?.toLowerCase().includes(lowerText) || e.text?.toLowerCase().includes(lowerText)
    );
  }

  /**
   * List all detected elements
   */
  listElements(imageId: string, limit?: number): VisualElement[] {
    const elements = this.elementHistory.get(imageId) || [];

    if (limit) {
      return elements.slice(-limit);
    }

    return elements;
  }

  /**
   * Clear detection cache
   */
  clearDetection(imageId?: string): void {
    if (imageId) {
      this.detectionCache.delete(imageId);
      this.hierarchyStore.delete(imageId);
      this.elementHistory.delete(imageId);
      this.logger.log(`Cleared detection for image: ${imageId}`);
    } else {
      this.detectionCache.clear();
      this.hierarchyStore.clear();
      this.elementHistory.clear();
      this.logger.log('Cleared all detections');
    }
  }

  /**
   * Get detector statistics
   */
  getStatistics(): {
    cachedDetections: number;
    totalElementsDetected: number;
    averageElementsPerImage: number;
  } {
    let totalElements = 0;
    for (const elements of this.elementHistory.values()) {
      totalElements += elements.length;
    }

    const avgElements = this.elementHistory.size > 0 ? totalElements / this.elementHistory.size : 0;

    return {
      cachedDetections: this.detectionCache.size,
      totalElementsDetected: totalElements,
      averageElementsPerImage: avgElements,
    };
  }

  /**
   * Cleanup old cached data
   */
  private startCleanupScheduler(): void {
    const MAX_CACHED = 50;
    const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

    setInterval(() => {
      if (this.detectionCache.size > MAX_CACHED) {
        const toRemove = this.detectionCache.size - MAX_CACHED;
        const entries = Array.from(this.detectionCache.entries()).slice(0, toRemove);

        for (const [key] of entries) {
          this.detectionCache.delete(key);
          this.hierarchyStore.delete(key);
          this.elementHistory.delete(key);
        }

        this.logger.log(`Cleaned up ${toRemove} cached detections`);
      }
    }, CLEANUP_INTERVAL);
  }

  /**
   * Shutdown the service
   */
  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Shutting down Element Detector Service');
    this.detectionCache.clear();
    this.hierarchyStore.clear();
    this.elementHistory.clear();
  }
}
