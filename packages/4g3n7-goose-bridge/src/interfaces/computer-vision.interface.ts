/**
 * Phase 5.2: Computer Vision Integration Interfaces
 * 
 * Comprehensive type definitions for image recognition, OCR, element detection,
 * layout analysis, visual change detection, and accessibility features.
 */

// ─────────────────────────────────────────────────────────────────
// IMAGE RECOGNITION & ANALYSIS
// ─────────────────────────────────────────────────────────────────

export enum ImageFormat {
  PNG = 'png',
  JPEG = 'jpeg',
  WEBP = 'webp',
  BMP = 'bmp',
  TIFF = 'tiff',
}

export enum ColorSpace {
  RGB = 'rgb',
  RGBA = 'rgba',
  GRAYSCALE = 'grayscale',
  HSV = 'hsv',
  LAB = 'lab',
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: ImageFormat;
  colorSpace: ColorSpace;
  channels: number;
  bitDepth: number;
  dpi?: number;
  timestamp?: Date;
}

export interface Pixel {
  x: number;
  y: number;
  r: number;
  g: number;
  b: number;
  a?: number;
}

export interface ImageRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  label?: string;
  color?: string;
  texture?: string;
}

export interface DetectionResult {
  object: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  probability: number;
  features?: Record<string, any>;
}

export interface ImageAnalysisResult {
  imageId: string;
  timestamp: Date;
  metadata: ImageMetadata;
  objects: DetectionResult[];
  colors: { dominant: string[]; palette: string[] };
  brightness: number;
  contrast: number;
  sharpness: number;
  quality: 'low' | 'medium' | 'high' | 'excellent';
  histogram?: Record<string, number[]>;
}

export interface FeatureDescriptor {
  id: string;
  type: 'sift' | 'surf' | 'orb' | 'akaze';
  keypoints: Array<{ x: number; y: number; scale: number; orientation: number }>;
  descriptors: number[][];
}

export interface ImageSimilarity {
  score: number; // 0-1, where 1 is identical
  matchCount: number;
  inliers: number;
  transformation?: {
    scale: number;
    rotation: number;
    translation: { x: number; y: number };
  };
}

// ─────────────────────────────────────────────────────────────────
// OPTICAL CHARACTER RECOGNITION (OCR)
// ─────────────────────────────────────────────────────────────────

export interface Character {
  char: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  fontSize?: number;
  fontName?: string;
  bold?: boolean;
  italic?: boolean;
}

export interface TextBlock {
  id: string;
  text: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  characters: Character[];
  language?: string;
  direction?: 'ltr' | 'rtl' | 'vertical';
  angle?: number;
  lineHeight?: number;
}

export interface TextLine {
  id: string;
  text: string;
  confidence: number;
  boundingBox: { x: number; y: number; width: number; height: number };
  words: TextBlock[];
  baseline?: number;
}

export interface OCRResult {
  imageId: string;
  timestamp: Date;
  rawText: string;
  blocks: TextBlock[];
  lines: TextLine[];
  metadata: {
    language: string;
    direction: 'ltr' | 'rtl' | 'vertical';
    averageConfidence: number;
    processingTime: number;
  };
  tables?: TableDetection[];
  formFields?: FormField[];
}

export interface FormField {
  id: string;
  fieldType: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'textarea';
  label: string;
  value?: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  required: boolean;
}

export interface TableDetection {
  id: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  rows: number;
  columns: number;
  cells: Array<{ row: number; col: number; text: string; confidence: number }>;
}

// ─────────────────────────────────────────────────────────────────
// VISUAL ELEMENT DETECTION & INTERACTION
// ─────────────────────────────────────────────────────────────────

export enum ElementType {
  BUTTON = 'button',
  INPUT = 'input',
  TEXTAREA = 'textarea',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  DROPDOWN = 'dropdown',
  SLIDER = 'slider',
  LINK = 'link',
  IMAGE = 'image',
  TEXT = 'text',
  ICON = 'icon',
  MENU = 'menu',
  DIALOG = 'dialog',
  TAB = 'tab',
  LIST = 'list',
  TABLE = 'table',
}

export interface VisualElement {
  id: string;
  type: ElementType;
  label?: string;
  text?: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  confidence: number;
  state?: 'normal' | 'hover' | 'active' | 'disabled' | 'focused';
  color?: string;
  icon?: string;
  interactive: boolean;
  parent?: string;
  children?: string[];
  ariaLabel?: string;
  ariaRole?: string;
}

export interface ClickableElement extends VisualElement {
  actionType?: 'click' | 'longPress' | 'doubleClick' | 'rightClick';
  predictedAction?: string;
}

export interface EditableElement extends VisualElement {
  placeholder?: string;
  value?: string;
  type: ElementType.INPUT | ElementType.TEXTAREA;
  validation?: string;
  mask?: string;
}

export interface SelectableElement extends VisualElement {
  options?: Array<{ label: string; value: string }>;
  selectedIndex?: number;
  multiSelect?: boolean;
}

export interface ElementDetectionResult {
  imageId: string;
  timestamp: Date;
  elements: VisualElement[];
  clickables: ClickableElement[];
  editables: EditableElement[];
  selectables: SelectableElement[];
  hierarchy: ElementHierarchy;
  interactionMap: InteractionMap;
}

export interface ElementHierarchy {
  rootId: string;
  nodes: Array<{
    id: string;
    parentId?: string;
    childrenIds: string[];
    element: VisualElement;
    depth: number;
  }>;
}

export interface InteractionMap {
  clickableRegions: Array<{ element: string; coordinates: { x: number; y: number; width: number; height: number } }>;
  editableRegions: Array<{ element: string; coordinates: { x: number; y: number; width: number; height: number } }>;
  focusOrder: string[];
  tabSequence: string[];
}

// ─────────────────────────────────────────────────────────────────
// LAYOUT ANALYSIS & UNDERSTANDING
// ─────────────────────────────────────────────────────────────────

export enum LayoutType {
  SINGLE_COLUMN = 'single_column',
  TWO_COLUMN = 'two_column',
  THREE_COLUMN = 'three_column',
  GRID = 'grid',
  CARD_GRID = 'card_grid',
  MASONRY = 'masonry',
  SIDEBAR = 'sidebar',
  TABBED = 'tabbed',
  MODAL = 'modal',
}

export interface LayoutRegion {
  id: string;
  type: 'header' | 'footer' | 'sidebar' | 'main' | 'nav' | 'content' | 'custom';
  boundingBox: { x: number; y: number; width: number; height: number };
  elements: string[];
  percentage: number;
}

export interface ContentBlock {
  id: string;
  type: 'text' | 'image' | 'video' | 'table' | 'form' | 'navigation';
  boundingBox: { x: number; y: number; width: number; height: number };
  content?: string;
  children?: string[];
  importance: number; // 0-1
  readingOrder?: number;
}

export interface LayoutAnalysisResult {
  imageId: string;
  timestamp: Date;
  layoutType: LayoutType;
  regions: LayoutRegion[];
  contentBlocks: ContentBlock[];
  spacing: {
    horizontalGutter: number;
    verticalGutter: number;
    margins: { top: number; right: number; bottom: number; left: number };
  };
  alignment: {
    horizontal: 'left' | 'center' | 'right' | 'justify';
    vertical: 'top' | 'middle' | 'bottom';
  };
  symmetry: number; // 0-1
  balance: number; // 0-1
  consistency: number; // 0-1
}

export interface ReadingOrder {
  elementId: string;
  order: number;
  type: 'primary' | 'secondary' | 'supplementary';
  importance: number;
}

// ─────────────────────────────────────────────────────────────────
// VISUAL CHANGE DETECTION & MONITORING
// ─────────────────────────────────────────────────────────────────

export interface PixelDifference {
  x: number;
  y: number;
  oldColor: { r: number; g: number; b: number };
  newColor: { r: number; g: number; b: number };
  euclideanDistance: number;
}

export interface RegionChange {
  id: string;
  boundingBox: { x: number; y: number; width: number; height: number };
  type: 'added' | 'removed' | 'modified' | 'moved' | 'resized';
  confidence: number;
  pixelDifferences: number;
  percentageChanged: number;
  elements?: VisualElement[];
}

export interface ChangeDetectionResult {
  baselineImageId: string;
  currentImageId: string;
  timestamp: Date;
  changeDetected: boolean;
  overallDifference: number; // 0-1
  pixelChanges: PixelDifference[];
  regionChanges: RegionChange[];
  elementChanges: Array<{
    elementId: string;
    oldState?: VisualElement;
    newState?: VisualElement;
    changeType: 'added' | 'removed' | 'modified';
  }>;
  significantAreas: ImageRegion[];
}

export interface VisualChangeMonitor {
  monitorId: string;
  baselineImage: string;
  targetRegion?: { x: number; y: number; width: number; height: number };
  sensitivity: 'low' | 'medium' | 'high';
  checkInterval: number;
  isActive: boolean;
  lastCheckTime?: Date;
  history: ChangeDetectionResult[];
}

// ─────────────────────────────────────────────────────────────────
// ACCESSIBILITY FEATURES
// ─────────────────────────────────────────────────────────────────

export interface AccessibilityAnalysis {
  imageId: string;
  timestamp: Date;
  wcagCompliance: {
    level: 'A' | 'AA' | 'AAA';
    score: number; // 0-100
  };
  issues: AccessibilityIssue[];
  suggestions: AccessibilitySuggestion[];
  colorContrast: Array<{
    elementId: string;
    ratio: number;
    compliant: boolean;
    minRequired: number;
  }>;
  textSize: Array<{
    elementId: string;
    size: number;
    readable: boolean;
    minRequired: number;
  }>;
  altText: Array<{
    elementId: string;
    hasAlt: boolean;
    description?: string;
  }>;
}

export interface AccessibilityIssue {
  id: string;
  severity: 'critical' | 'major' | 'minor';
  type: string;
  element: string;
  description: string;
  wcagGuideline?: string;
}

export interface AccessibilitySuggestion {
  id: string;
  priority: number;
  suggestion: string;
  implementation: string;
  estimatedImpact: string;
}

// ─────────────────────────────────────────────────────────────────
// VISUAL DEBUGGING & TROUBLESHOOTING
// ─────────────────────────────────────────────────────────────────

export interface DebugAnnotation {
  id: string;
  type: 'box' | 'circle' | 'arrow' | 'line' | 'text' | 'highlight';
  coordinates: { x: number; y: number; width?: number; height?: number };
  color: string;
  label?: string;
  metadata?: Record<string, any>;
}

export interface DebugVisualization {
  imageId: string;
  originalImage: string;
  annotations: DebugAnnotation[];
  overlayType: 'elements' | 'regions' | 'text' | 'differences' | 'custom';
  metadata: {
    generatedAt: Date;
    purpose: string;
    confidence?: number;
  };
}

export interface VisualizationSession {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  visualizations: DebugVisualization[];
  notes?: string;
  issues?: string[];
  resolution?: string;
}

// ─────────────────────────────────────────────────────────────────
// UNIFIED COMPUTER VISION SERVICE INTERFACE
// ─────────────────────────────────────────────────────────────────

export interface IComputerVisionService {
  // Image Analysis
  analyzeImage(imageBuffer: Buffer): Promise<ImageAnalysisResult>;
  detectObjects(imageBuffer: Buffer): Promise<DetectionResult[]>;
  extractFeatures(imageBuffer: Buffer): Promise<FeatureDescriptor>;
  compareImages(image1: Buffer, image2: Buffer): Promise<ImageSimilarity>;

  // OCR
  performOCR(imageBuffer: Buffer, language?: string): Promise<OCRResult>;
  extractText(imageBuffer: Buffer): Promise<string>;
  detectTables(imageBuffer: Buffer): Promise<TableDetection[]>;
  detectForms(imageBuffer: Buffer): Promise<FormField[]>;

  // Element Detection
  detectElements(imageBuffer: Buffer): Promise<ElementDetectionResult>;
  findClickableElements(imageBuffer: Buffer): Promise<ClickableElement[]>;
  findEditableElements(imageBuffer: Buffer): Promise<EditableElement[]>;
  findSelectableElements(imageBuffer: Buffer): Promise<SelectableElement[]>;

  // Layout Analysis
  analyzeLayout(imageBuffer: Buffer): Promise<LayoutAnalysisResult>;
  detectRegions(imageBuffer: Buffer): Promise<LayoutRegion[]>;
  determineReadingOrder(imageBuffer: Buffer): Promise<ReadingOrder[]>;

  // Change Detection
  detectChanges(baselineBuffer: Buffer, currentBuffer: Buffer): Promise<ChangeDetectionResult>;
  startChangeMonitoring(monitorId: string, baseline: Buffer): Promise<VisualChangeMonitor>;
  checkForChanges(monitorId: string, currentImage: Buffer): Promise<ChangeDetectionResult>;
  stopChangeMonitoring(monitorId: string): Promise<void>;

  // Accessibility
  analyzeAccessibility(imageBuffer: Buffer): Promise<AccessibilityAnalysis>;
  suggestAccessibilityImprovements(imageBuffer: Buffer): Promise<AccessibilitySuggestion[]>;

  // Visual Debugging
  createDebugVisualization(imageBuffer: Buffer, annotations: DebugAnnotation[]): Promise<DebugVisualization>;
  startDebugSession(purpose: string): Promise<VisualizationSession>;
  endDebugSession(sessionId: string): Promise<VisualizationSession>;
}

// ─────────────────────────────────────────────────────────────────
// RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────

export interface ComputerVisionResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  processingTime: number;
  timestamp: Date;
}
