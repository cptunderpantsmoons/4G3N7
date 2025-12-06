/**
 * Learning & Optimization Interfaces for Phase 4
 * Defines pattern recognition, optimization, and improvement tracking
 */

export enum PatternType {
  BEHAVIORAL = 'behavioral',
  PERFORMANCE = 'performance',
  ANOMALY = 'anomaly',
  CORRELATION = 'correlation',
  TREND = 'trend',
  CYCLE = 'cycle',
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: Date;
  context?: Record<string, any>;
}

export interface PerformanceBaseline {
  metric: string;
  avgValue: number;
  minValue: number;
  maxValue: number;
  stdDev: number;
  sampleSize: number;
  lastUpdated: Date;
}

export interface DetectedPattern {
  id: string;
  type: PatternType;
  name: string;
  description: string;
  confidence: number;
  frequency: number;
  firstSeen: Date;
  lastSeen: Date;
  examples: string[];
  implications: string[];
  recommendations: string[];
}

export interface Anomaly {
  id: string;
  timestamp: Date;
  metricName: string;
  expectedValue: number;
  actualValue: number;
  deviation: number;
  severity: 'low' | 'medium' | 'high';
  rootCause?: string;
  resolution?: string;
}

export interface OptimizationRecommendation {
  id: string;
  area: string;
  currentState: string;
  proposedState: string;
  expectedImprovement: number; // percentage
  implementationEffort: 'low' | 'medium' | 'high';
  priority: number; // 1-10
  evidence: string[];
  estimatedImpact: {
    performance?: number;
    cost?: number;
    reliability?: number;
  };
}

export interface LearningSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  tasks: TaskLearning[];
  patternsDetected: DetectedPattern[];
  anomaliesFound: Anomaly[];
  recommendations: OptimizationRecommendation[];
  successRate: number;
  insights: string[];
}

export interface TaskLearning {
  taskId: string;
  taskType: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  success: boolean;
  metrics: PerformanceMetric[];
  errors?: string[];
  improvements?: string[];
}

export interface WorkflowOptimization {
  workflowId: string;
  currentEfficiency: number;
  potentialEfficiency: number;
  bottlenecks: string[];
  parallelizationOpportunities: string[];
  cachingOpportunities: string[];
  estimatedTimeSavings: number; // milliseconds
  estimatedResourceSavings: number; // percentage
}

export interface ResourceAllocation {
  resource: string;
  currentAllocation: number;
  recommendedAllocation: number;
  utilisationRate: number;
  bottleneckDetected: boolean;
  improvement: number; // percentage
}

export interface LearningStatistics {
  totalTasksProcessed: number;
  successRate: number;
  avgTaskDuration: number;
  patternsDetected: number;
  anomaliesDetected: number;
  recommendationsGenerated: number;
  implementedRecommendations: number;
  averageImprovement: number; // percentage
  lastLearningSession: Date;
}

export interface AdaptationConfig {
  enabled: boolean;
  learningRate: number; // 0-1
  minPatternConfidence: number;
  minDataPoints: number;
  updateInterval: number; // milliseconds
  autoOptimize: boolean;
}

export interface LearningInsight {
  id: string;
  type: string;
  description: string;
  evidence: string[];
  confidence: number;
  actionable: boolean;
  suggestedAction?: string;
  generatedAt: Date;
}
