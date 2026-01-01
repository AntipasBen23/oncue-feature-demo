// Keystroke event captured during typing
export interface KeystrokeEvent {
  key: string;
  keyDownTime: number;
  keyUpTime: number | null;
  duration: number | null;
  isCorrect: boolean;
  characterIndex: number;
}

// Complete typing session data
export interface TypingSession {
  id: string;
  timestamp: number;
  referenceText: string;
  typedText: string;
  keystrokes: KeystrokeEvent[];
  startTime: number;
  endTime: number;
  duration: number;
  wpm: number;
  accuracy: number;
  errorRate: number;
  tremorScore?: number;
  fatigueScore?: number;
}

// Performance metrics calculated from session
export interface PerformanceMetrics {
  wpm: number;
  accuracy: number;
  errorRate: number;
  totalKeystrokes: number;
  correctKeystrokes: number;
  incorrectKeystrokes: number;
  averageKeystrokeDuration: number;
  keystrokeDurationStdDev: number;
  tremorSeverityScore: number;
  fatigueDetected: boolean;
  fatigueScore: number;
}

// User profile (stored in localStorage/IndexedDB)
export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  age?: number;
  diagnosisYear?: number;
  symptomSeverity?: 'mild' | 'moderate' | 'severe';
  createdAt: number;
  lastActive: number;
}

// Heatmap data for visualization
export interface KeyHeatmapData {
  key: string;
  pressCount: number;
  errorCount: number;
  averageDuration: number;
  errorRate: number;
}

// Test status
export type TestStatus = 'idle' | 'active' | 'completed';

// Chart data point
export interface ChartDataPoint {
  timestamp: number;
  value: number;
  label?: string;
}