/**
 * Phase 7: UI Experience Interfaces
 * 
 * Comprehensive type definitions for UI components, notifications,
 * theming, accessibility, and internationalization.
 */

// ─────────────────────────────────────────────────────────────────
// UI COMPONENTS
// ─────────────────────────────────────────────────────────────────

export enum ComponentType {
  BUTTON = 'button',
  INPUT = 'input',
  SELECT = 'select',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  SWITCH = 'switch',
  SLIDER = 'slider',
  TEXTAREA = 'textarea',
  MODAL = 'modal',
  CARD = 'card',
  TABLE = 'table',
  FORM = 'form',
  DROPDOWN = 'dropdown',
  MENU = 'menu',
  TAB = 'tab',
  TOAST = 'toast',
  BADGE = 'badge',
  PROGRESS = 'progress',
  SPINNER = 'spinner',
  TOOLTIP = 'tooltip',
}

export enum ButtonVariant {
  PRIMARY = 'primary',
  SECONDARY = 'secondary',
  DANGER = 'danger',
  SUCCESS = 'success',
  WARNING = 'warning',
  INFO = 'info',
  TEXT = 'text',
  OUTLINE = 'outline',
}

export enum ButtonSize {
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
}

export interface UIComponent {
  componentId: string;
  name: string;
  type: ComponentType;
  variant?: string;
  size?: ButtonSize;
  disabled: boolean;
  visible: boolean;
  className?: string;
  style?: Record<string, string>;
  attributes?: Record<string, any>;
  children?: UIComponent[];
  createdAt: Date;
}

export interface Button extends UIComponent {
  type: ComponentType.BUTTON;
  variant: ButtonVariant;
  size: ButtonSize;
  label: string;
  icon?: string;
  loading: boolean;
  onClick?: string;
}

export interface Input extends UIComponent {
  type: ComponentType.INPUT;
  inputType: 'text' | 'email' | 'password' | 'number' | 'date' | 'time';
  placeholder?: string;
  value: string;
  required: boolean;
  validation?: { pattern?: string; minLength?: number; maxLength?: number };
  errorMessage?: string;
}

export interface Modal extends UIComponent {
  type: ComponentType.MODAL;
  title: string;
  description?: string;
  open: boolean;
  modalSize: 'small' | 'medium' | 'large';
  closeButton: boolean;
  backdrop: boolean;
  actions?: Button[];
}

export interface Table extends UIComponent {
  type: ComponentType.TABLE;
  columns: Array<{ id: string; label: string; width?: string; sortable?: boolean }>;
  rows: Record<string, any>[];
  selectable: boolean;
  paginated: boolean;
  pageSize: number;
  currentPage: number;
  totalRows: number;
}

export interface Form extends UIComponent {
  type: ComponentType.FORM;
  fields: UIComponent[];
  submitButton: Button;
  validationMode: 'onChange' | 'onBlur' | 'onSubmit';
  errors: Record<string, string>;
  isDirty: boolean;
  isSubmitting: boolean;
}

// ─────────────────────────────────────────────────────────────────
// NOTIFICATIONS
// ─────────────────────────────────────────────────────────────────

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

export enum NotificationPosition {
  TOP_LEFT = 'top-left',
  TOP_CENTER = 'top-center',
  TOP_RIGHT = 'top-right',
  BOTTOM_LEFT = 'bottom-left',
  BOTTOM_CENTER = 'bottom-center',
  BOTTOM_RIGHT = 'bottom-right',
}

export interface Notification {
  notificationId: string;
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  action?: { label: string; callback: string };
  duration: number;
  position: NotificationPosition;
  closeable: boolean;
  timestamp: Date;
  read: boolean;
}

export interface NotificationQueue {
  queueId: string;
  notifications: Notification[];
  maxVisible: number;
  position: NotificationPosition;
  transition: 'fade' | 'slide' | 'scale';
}

export interface NotificationPreference {
  preferenceId: string;
  userId: string;
  type: NotificationType;
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  email: boolean;
  channels: Array<'in-app' | 'desktop' | 'email' | 'sms'>;
}

// ─────────────────────────────────────────────────────────────────
// THEME & PERSONALIZATION
// ─────────────────────────────────────────────────────────────────

export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
}

export interface ColorPalette {
  primary: string;
  secondary: string;
  danger: string;
  success: string;
  warning: string;
  info: string;
  background: string;
  surface: string;
  surfaceVariant: string;
  onPrimary: string;
  onSecondary: string;
  outline: string;
  outlineVariant: string;
  custom?: Record<string, string>;
}

export interface Typography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
}

export interface Theme {
  themeId: string;
  name: string;
  mode: ThemeMode;
  colors: ColorPalette;
  typography: Typography;
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
  shadows: Record<string, string>;
  custom?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  preferenceId: string;
  userId: string;
  theme: Theme;
  language: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  density: 'compact' | 'normal' | 'comfortable';
  animations: boolean;
  soundEnabled: boolean;
  notifications: NotificationPreference[];
  customizations?: Record<string, any>;
  updatedAt: Date;
}

// ─────────────────────────────────────────────────────────────────
// ACCESSIBILITY & INTERNATIONALIZATION
// ─────────────────────────────────────────────────────────────────

export enum AccessibilityFeature {
  HIGH_CONTRAST = 'high-contrast',
  LARGE_TEXT = 'large-text',
  FOCUS_INDICATORS = 'focus-indicators',
  REDUCED_MOTION = 'reduced-motion',
  SCREEN_READER = 'screen-reader',
  KEYBOARD_NAVIGATION = 'keyboard-navigation',
}

export interface AccessibilitySettings {
  settingsId: string;
  userId: string;
  enabledFeatures: AccessibilityFeature[];
  textScale: number;
  contrastLevel: 'normal' | 'high' | 'maximum';
  reduceMotion: boolean;
  focusIndicatorColor: string;
  focusIndicatorWidth: number;
  screenReaderOptimized: boolean;
  keyboardShortcuts: Record<string, string>;
  announceUpdates: boolean;
  announceErrors: boolean;
  announceSuccess: boolean;
  updatedAt: Date;
}

export interface LocalizationString {
  stringId: string;
  key: string;
  namespace: string;
  defaultValue: string;
  translations: Record<string, string>;
  context?: string;
  plural?: { one: string; other: string };
}

export interface LanguagePack {
  packId: string;
  language: string;
  languageName: string;
  locale: string;
  direction: 'ltr' | 'rtl';
  strings: LocalizationString[];
  dateFormat: string;
  timeFormat: string;
  numberFormat: { decimal: string; thousands: string };
  currency: string;
}

export interface Translation {
  translationId: string;
  language: string;
  strings: Record<string, string>;
  lastUpdated: Date;
}

// ─────────────────────────────────────────────────────────────────
// RESPONSIVE & LAYOUT
// ─────────────────────────────────────────────────────────────────

export enum BreakPoint {
  XS = 'xs',
  SM = 'sm',
  MD = 'md',
  LG = 'lg',
  XL = 'xl',
}

export interface ResponsiveLayout {
  layoutId: string;
  name: string;
  breakpoints: Record<BreakPoint, number>;
  columns: Record<BreakPoint, number>;
  gutter: Record<BreakPoint, string>;
  margins: Record<BreakPoint, string>;
  containerWidth: Record<BreakPoint, string>;
}

export interface ViewportMetrics {
  width: number;
  height: number;
  breakpoint: BreakPoint;
  orientation: 'portrait' | 'landscape';
  isDarkMode: boolean;
  pixelRatio: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

// ─────────────────────────────────────────────────────────────────
// UNIFIED UI EXPERIENCE SERVICE INTERFACE
// ─────────────────────────────────────────────────────────────────

export interface IUIExperienceService {
  // Component Management
  registerComponent(component: UIComponent): Promise<void>;
  getComponent(componentId: string): Promise<UIComponent>;
  updateComponent(componentId: string, updates: Partial<UIComponent>): Promise<void>;
  getAllComponents(type?: ComponentType): Promise<UIComponent[]>;

  // Notifications
  showNotification(notification: Notification): Promise<void>;
  dismissNotification(notificationId: string): Promise<void>;
  getNotifications(limit?: number): Promise<Notification[]>;
  getNotificationQueue(): Promise<NotificationQueue>;
  setNotificationPreference(preference: NotificationPreference): Promise<void>;

  // Theme Management
  getAvailableThemes(): Promise<Theme[]>;
  applyTheme(themeId: string): Promise<void>;
  createCustomTheme(theme: Theme): Promise<Theme>;
  updateTheme(themeId: string, updates: Partial<Theme>): Promise<void>;
  getCurrentTheme(): Promise<Theme>;

  // User Preferences
  getUserPreferences(userId: string): Promise<UserPreferences>;
  updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): Promise<void>;
  resetPreferences(userId: string): Promise<void>;

  // Accessibility
  getAccessibilitySettings(userId: string): Promise<AccessibilitySettings>;
  updateAccessibilitySettings(userId: string, settings: Partial<AccessibilitySettings>): Promise<void>;
  enableAccessibilityFeature(userId: string, feature: AccessibilityFeature): Promise<void>;
  disableAccessibilityFeature(userId: string, feature: AccessibilityFeature): Promise<void>;

  // Internationalization
  getAvailableLanguages(): Promise<LanguagePack[]>;
  setLanguage(userId: string, language: string): Promise<void>;
  getTranslation(key: string, language?: string): Promise<string>;
  getLanguagePack(language: string): Promise<LanguagePack>;
  loadTranslations(language: string): Promise<Record<string, string>>;

  // Responsive Layout
  getResponsiveLayout(layoutId?: string): Promise<ResponsiveLayout>;
  getViewportMetrics(): Promise<ViewportMetrics>;
  registerBreakpointListener(callback: (metrics: ViewportMetrics) => void): Promise<string>;
  removeBreakpointListener(listenerId: string): Promise<void>;
}

// ─────────────────────────────────────────────────────────────────
// RESPONSE TYPES
// ─────────────────────────────────────────────────────────────────

export interface UIExperienceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  processingTime: number;
  timestamp: Date;
}
