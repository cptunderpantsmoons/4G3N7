/**
 * Phase 5.1: Enhanced Desktop Control Interfaces
 * 
 * Comprehensive type definitions for advanced mouse/keyboard automation,
 * screen recording, window management, macros, and system monitoring
 */

// ─────────────────────────────────────────────────────────────────
// MOUSE & KEYBOARD AUTOMATION
// ─────────────────────────────────────────────────────────────────

export enum MouseButton {
  LEFT = 'left',
  RIGHT = 'right',
  MIDDLE = 'middle',
  BACK = 'back',
  FORWARD = 'forward',
}

export enum KeyModifier {
  SHIFT = 'shift',
  CTRL = 'ctrl',
  ALT = 'alt',
  META = 'meta',
  CMD = 'cmd',
}

export interface Coordinates {
  x: number;
  y: number;
}

export interface MouseAction {
  type: 'move' | 'click' | 'dblClick' | 'press' | 'release' | 'drag' | 'scroll';
  button?: MouseButton;
  coordinates?: Coordinates;
  clickCount?: number;
  holdKeys?: KeyModifier[];
  path?: Coordinates[];
  duration?: number;
  scrollDelta?: number;
  scrollDirection?: 'up' | 'down' | 'left' | 'right';
}

export interface KeyboardAction {
  type: 'press' | 'release' | 'type';
  key?: string;
  keys?: string[];
  text?: string;
  holdKeys?: KeyModifier[];
  delay?: number;
  sensitive?: boolean;
}

export interface AdvancedMouseAutomation {
  actions: MouseAction[];
  speed?: 'slow' | 'normal' | 'fast';
  acceleration?: boolean;
  smoothing?: boolean;
  repeatCount?: number;
}

export interface AdvancedKeyboardAutomation {
  actions: KeyboardAction[];
  speed?: 'slow' | 'normal' | 'fast';
  repeatCount?: number;
}

export interface AutomationSequence {
  id: string;
  name: string;
  description: string;
  mouse: AdvancedMouseAutomation[];
  keyboard: AdvancedKeyboardAutomation[];
  timing: { pause: number; sync: boolean }[];
  repeat?: number;
  conditions?: AutomationCondition[];
}

export interface AutomationCondition {
  type: 'screenshot' | 'element' | 'time' | 'custom';
  criteria: string;
  action: 'continue' | 'pause' | 'retry' | 'cancel';
}

// ─────────────────────────────────────────────────────────────────
// SCREEN RECORDING & PLAYBACK
// ─────────────────────────────────────────────────────────────────

export enum ScreenRecordingFormat {
  MP4 = 'mp4',
  WEBM = 'webm',
  AVI = 'avi',
  MOV = 'mov',
}

export enum FrameRate {
  FPS_15 = 15,
  FPS_24 = 24,
  FPS_30 = 30,
  FPS_60 = 60,
}

export interface ScreenRecordingOptions {
  format: ScreenRecordingFormat;
  frameRate: FrameRate;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  bitrate?: string;
  audioEnabled: boolean;
  audioSource?: 'system' | 'microphone' | 'both';
  includeMouseCursor: boolean;
  includeKeystrokes: boolean;
  monitorIndex?: number;
}

export interface RecordingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  filename: string;
  filepath: string;
  options: ScreenRecordingOptions;
  frameCount: number;
  totalSize: number;
  isActive: boolean;
}

export interface PlaybackFrame {
  timestamp: number;
  image: Buffer;
  width: number;
  height: number;
  mousePosition?: Coordinates;
  mouseButton?: MouseButton;
  keystroke?: string;
}

export interface ScreenRecording {
  id: string;
  filename: string;
  filepath: string;
  duration: number;
  frameRate: FrameRate;
  frameCount: number;
  fileSize: number;
  createdAt: Date;
  modifiedAt: Date;
  metadata: {
    resolution: { width: number; height: number };
    audioTracks: number;
    videoCodec: string;
    audioCodec?: string;
  };
}

export interface PlaybackOptions {
  speed: number; // 0.5 to 2.0
  loop: boolean;
  startFrame?: number;
  endFrame?: number;
  captureFrames?: boolean;
}

// ─────────────────────────────────────────────────────────────────
// WINDOW MANAGEMENT & MULTI-MONITOR
// ─────────────────────────────────────────────────────────────────

export interface Monitor {
  id: string;
  index: number;
  name: string;
  primary: boolean;
  bounds: { x: number; y: number; width: number; height: number };
  scale: number;
  refreshRate: number;
}

export interface Window {
  id: string;
  hwnd?: number;
  title: string;
  className: string;
  processId: number;
  processName: string;
  visible: boolean;
  maximized: boolean;
  minimized: boolean;
  focused: boolean;
  bounds: { x: number; y: number; width: number; height: number };
  monitor: string;
  alwaysOnTop: boolean;
}

export enum WindowState {
  NORMAL = 'normal',
  MAXIMIZED = 'maximized',
  MINIMIZED = 'minimized',
  HIDDEN = 'hidden',
  FULLSCREEN = 'fullscreen',
}

export interface WindowOperation {
  windowId: string;
  operation: 'move' | 'resize' | 'focus' | 'close' | 'minimize' | 'maximize' | 'fullscreen';
  targetState?: WindowState;
  position?: Coordinates;
  size?: { width: number; height: number };
  targetMonitor?: string;
}

export interface WindowLayout {
  id: string;
  name: string;
  description: string;
  windows: Array<{
    title: string;
    bounds: { x: number; y: number; width: number; height: number };
    monitor: string;
    state: WindowState;
  }>;
  createdAt: Date;
}

export interface MultiMonitorConfig {
  primaryMonitor: string;
  monitorArrangement: 'extend' | 'duplicate' | 'single';
  scalingMode: 'scale' | 'fit' | 'stretch';
}

// ─────────────────────────────────────────────────────────────────
// APPLICATION MACROS
// ─────────────────────────────────────────────────────────────────

export enum MacroTriggerType {
  HOTKEY = 'hotkey',
  SCHEDULED = 'scheduled',
  EVENT = 'event',
  VOICE = 'voice',
  GESTURE = 'gesture',
}

export interface MacroTrigger {
  type: MacroTriggerType;
  hotkey?: {
    modifiers: KeyModifier[];
    key: string;
  };
  schedule?: {
    frequency: 'once' | 'hourly' | 'daily' | 'weekly' | 'custom';
    cron?: string;
  };
  event?: {
    name: string;
    params?: Record<string, any>;
  };
  voice?: {
    phrase: string;
    language: string;
  };
  gesture?: {
    type: string;
    coordinates?: Coordinates[];
  };
}

export interface ApplicationMacro {
  id: string;
  name: string;
  description: string;
  applicationName: string;
  triggers: MacroTrigger[];
  actions: (MouseAction | KeyboardAction)[];
  preconditions?: AutomationCondition[];
  postconditions?: AutomationCondition[];
  enabled: boolean;
  createdAt: Date;
  modifiedAt: Date;
  executionCount: number;
  lastExecutedAt?: Date;
}

export interface MacroLibrary {
  id: string;
  name: string;
  description: string;
  applicationName: string;
  macros: ApplicationMacro[];
  categories: Record<string, string[]>;
  tags: string[];
}

export interface MacroExecution {
  id: string;
  macroId: string;
  macroName: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  executedActions: number;
  totalActions: number;
  errors?: string[];
}

// ─────────────────────────────────────────────────────────────────
// SYSTEM MONITORING & PERFORMANCE
// ─────────────────────────────────────────────────────────────────

export interface PerformanceMetrics {
  timestamp: Date;
  cpu: {
    usage: number; // 0-100
    cores: number;
    frequency: number;
    temperature?: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
    readSpeed?: number;
    writeSpeed?: number;
  };
  gpu?: {
    usage: number;
    memory: number;
    temperature?: number;
  };
  network?: {
    bytesIn: number;
    bytesOut: number;
    latency?: number;
  };
}

export interface ProcessMetrics {
  processId: number;
  processName: string;
  cpuUsage: number;
  memoryUsage: number;
  diskIORead?: number;
  diskIOWrite?: number;
  threadCount: number;
  state: 'running' | 'sleeping' | 'stopped';
}

export interface SystemAlert {
  id: string;
  type: 'cpu' | 'memory' | 'disk' | 'gpu' | 'temperature' | 'network';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  timestamp: Date;
  acknowledged: boolean;
}

export interface SystemProfile {
  os: string;
  osVersion: string;
  architecture: string;
  hostname: string;
  uptime: number;
  cpuModel: string;
  totalMemory: number;
  totalDisk: number;
  gpuInfo?: string;
  monitors: Monitor[];
}

export interface PerformanceOptimization {
  id: string;
  name: string;
  category: 'cpu' | 'memory' | 'disk' | 'network';
  description: string;
  priority: number;
  estimatedImprovement: string;
  implementation: string;
  implemented: boolean;
  timestamp: Date;
}

// ─────────────────────────────────────────────────────────────────
// DESKTOP ENVIRONMENT CUSTOMIZATION
// ─────────────────────────────────────────────────────────────────

export interface DesktopTheme {
  id: string;
  name: string;
  colorScheme: 'light' | 'dark' | 'auto';
  accentColor: string;
  wallpaper?: string;
  customizations: Record<string, any>;
}

export interface TaskbarConfig {
  position: 'top' | 'bottom' | 'left' | 'right';
  autoHide: boolean;
  showClock: boolean;
  showNotifications: boolean;
  pinnedApplications: string[];
}

export interface DesktopShortcut {
  id: string;
  name: string;
  targetPath: string;
  icon?: string;
  position: Coordinates;
  description?: string;
}

export interface DesktopEnvironment {
  id: string;
  name: string;
  theme: DesktopTheme;
  taskbarConfig: TaskbarConfig;
  shortcuts: DesktopShortcut[];
  hotkeys: Record<string, string>;
  soundEnabled: boolean;
  notifications: {
    enabled: boolean;
    position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  };
}

// ─────────────────────────────────────────────────────────────────
// UNIFIED DESKTOP CONTROL SERVICE INTERFACE
// ─────────────────────────────────────────────────────────────────

export interface IDesktopControlService {
  // Mouse & Keyboard Control
  moveMouse(coordinates: Coordinates): Promise<void>;
  clickMouse(button: MouseButton, coordinates?: Coordinates): Promise<void>;
  doubleClickMouse(coordinates?: Coordinates): Promise<void>;
  dragMouse(from: Coordinates, to: Coordinates, button?: MouseButton): Promise<void>;
  scrollMouse(direction: 'up' | 'down' | 'left' | 'right', delta?: number): Promise<void>;
  
  pressKey(key: string, modifiers?: KeyModifier[]): Promise<void>;
  releaseKey(key: string): Promise<void>;
  typeText(text: string, delay?: number): Promise<void>;
  
  executeAutomation(sequence: AutomationSequence): Promise<MacroExecution>;

  // Screen Recording
  startRecording(options: ScreenRecordingOptions): Promise<RecordingSession>;
  stopRecording(sessionId: string): Promise<ScreenRecording>;
  playRecording(recordingId: string, options?: PlaybackOptions): Promise<void>;
  listRecordings(): Promise<ScreenRecording[]>;

  // Window Management
  getWindows(): Promise<Window[]>;
  focusWindow(windowId: string): Promise<void>;
  moveWindow(operation: WindowOperation): Promise<void>;
  getMonitors(): Promise<Monitor[]>;
  saveWindowLayout(layout: WindowLayout): Promise<void>;
  restoreWindowLayout(layoutId: string): Promise<void>;

  // Application Macros
  executeMacro(macroId: string): Promise<MacroExecution>;
  saveMacro(macro: ApplicationMacro): Promise<void>;
  deleteMacro(macroId: string): Promise<void>;
  listMacros(applicationName?: string): Promise<ApplicationMacro[]>;

  // System Monitoring
  getSystemMetrics(): Promise<PerformanceMetrics>;
  getProcessMetrics(processId?: number): Promise<ProcessMetrics[]>;
  getSystemProfile(): Promise<SystemProfile>;
  monitorMetrics(interval: number): Promise<void>;
  stopMonitoring(): Promise<void>;

  // Environment Customization
  getDesktopEnvironment(): Promise<DesktopEnvironment>;
  updateDesktopTheme(theme: DesktopTheme): Promise<void>;
  updateTaskbarConfig(config: TaskbarConfig): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────
// RECORDING PLAYLIST
// ─────────────────────────────────────────────────────────────────

export interface RecordingPlaylist {
  id: string;
  name: string;
  description: string;
  recordings: ScreenRecording[];
  createdAt: Date;
  modifiedAt: Date;
}

// ─────────────────────────────────────────────────────────────────
// DESKTOP CONTROL RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────

export interface DesktopControlResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}
