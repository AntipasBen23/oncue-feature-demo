import { KeystrokeEvent, PerformanceMetrics } from '@/types/typing';

/**
 * Calculate Words Per Minute
 * Standard: 5 characters = 1 word
 */
export const calculateWPM = (characterCount: number, durationMs: number): number => {
  if (durationMs === 0) return 0;
  const minutes = durationMs / 60000;
  const words = characterCount / 5;
  return Math.round(words / minutes);
};

/**
 * Calculate typing accuracy
 */
export const calculateAccuracy = (typedText: string, referenceText: string): number => {
  if (typedText.length === 0) return 100;
  
  let correct = 0;
  const comparisonLength = Math.min(typedText.length, referenceText.length);
  
  for (let i = 0; i < comparisonLength; i++) {
    if (typedText[i] === referenceText[i]) correct++;
  }
  
  return Math.round((correct / typedText.length) * 100);
};

/**
 * Calculate error rate
 */
export const calculateErrorRate = (typedText: string, referenceText: string): number => {
  return 100 - calculateAccuracy(typedText, referenceText);
};

/**
 * Calculate average keystroke duration
 */
export const calculateAverageKeystrokeDuration = (keystrokes: KeystrokeEvent[]): number => {
  const validKeystrokes = keystrokes.filter(k => k.duration !== null);
  if (validKeystrokes.length === 0) return 0;
  
  const sum = validKeystrokes.reduce((acc, k) => acc + (k.duration || 0), 0);
  return Math.round(sum / validKeystrokes.length);
};

/**
 * Calculate standard deviation of keystroke durations
 * Higher std dev = more inconsistent typing (potential tremor indicator)
 */
export const calculateKeystrokeDurationStdDev = (keystrokes: KeystrokeEvent[]): number => {
  const validKeystrokes = keystrokes.filter(k => k.duration !== null);
  if (validKeystrokes.length === 0) return 0;
  
  const mean = calculateAverageKeystrokeDuration(keystrokes);
  const squaredDiffs = validKeystrokes.map(k => {
    const diff = (k.duration || 0) - mean;
    return diff * diff;
  });
  
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / validKeystrokes.length;
  return Math.round(Math.sqrt(variance));
};

/**
 * Calculate tremor severity score (0-100)
 * Based on keystroke duration variability
 * Higher score = more severe tremor indication
 */
export const calculateTremorScore = (keystrokes: KeystrokeEvent[]): number => {
  const stdDev = calculateKeystrokeDurationStdDev(keystrokes);
  const mean = calculateAverageKeystrokeDuration(keystrokes);
  
  if (mean === 0) return 0;
  
  // Coefficient of variation as tremor indicator
  const coefficientOfVariation = (stdDev / mean) * 100;
  
  // Normalize to 0-100 scale (CV above 50 is considered high)
  return Math.min(100, Math.round(coefficientOfVariation * 2));
};

/**
 * Detect typing fatigue
 * Compares WPM in first third vs last third of test
 */
export const detectFatigue = (keystrokes: KeystrokeEvent[], startTime: number, endTime: number): {
  fatigueDetected: boolean;
  fatigueScore: number;
  earlyWPM: number;
  lateWPM: number;
} => {
  if (keystrokes.length < 10) {
    return { fatigueDetected: false, fatigueScore: 0, earlyWPM: 0, lateWPM: 0 };
  }
  
  const totalDuration = endTime - startTime;
  const thirdDuration = totalDuration / 3;
  
  // First third keystrokes
  const earlyKeystrokes = keystrokes.filter(
    k => k.keyDownTime < startTime + thirdDuration
  );
  
  // Last third keystrokes
  const lateKeystrokes = keystrokes.filter(
    k => k.keyDownTime > startTime + (2 * thirdDuration)
  );
  
  if (earlyKeystrokes.length === 0 || lateKeystrokes.length === 0) {
    return { fatigueDetected: false, fatigueScore: 0, earlyWPM: 0, lateWPM: 0 };
  }
  
  const earlyWPM = calculateWPM(earlyKeystrokes.length, thirdDuration);
  const lateWPM = calculateWPM(lateKeystrokes.length, thirdDuration);
  
  // Calculate percentage decline
  const decline = earlyWPM > 0 ? ((earlyWPM - lateWPM) / earlyWPM) * 100 : 0;
  
  // Fatigue detected if decline > 20%
  const fatigueDetected = decline > 20;
  const fatigueScore = Math.max(0, Math.round(decline));
  
  return {
    fatigueDetected,
    fatigueScore,
    earlyWPM: Math.round(earlyWPM),
    lateWPM: Math.round(lateWPM)
  };
};

/**
 * Calculate comprehensive performance metrics
 */
export const calculatePerformanceMetrics = (
  typedText: string,
  referenceText: string,
  keystrokes: KeystrokeEvent[],
  startTime: number,
  endTime: number
): PerformanceMetrics => {
  const duration = endTime - startTime;
  const accuracy = calculateAccuracy(typedText, referenceText);
  const wpm = calculateWPM(typedText.length, duration);
  const avgDuration = calculateAverageKeystrokeDuration(keystrokes);
  const stdDev = calculateKeystrokeDurationStdDev(keystrokes);
  const tremorScore = calculateTremorScore(keystrokes);
  const fatigue = detectFatigue(keystrokes, startTime, endTime);
  
  const correctKeystrokes = keystrokes.filter(k => k.isCorrect).length;
  const incorrectKeystrokes = keystrokes.length - correctKeystrokes;
  
  return {
    wpm,
    accuracy,
    errorRate: 100 - accuracy,
    totalKeystrokes: keystrokes.length,
    correctKeystrokes,
    incorrectKeystrokes,
    averageKeystrokeDuration: avgDuration,
    keystrokeDurationStdDev: stdDev,
    tremorSeverityScore: tremorScore,
    fatigueDetected: fatigue.fatigueDetected,
    fatigueScore: fatigue.fatigueScore
  };
};

/**
 * Format milliseconds to MM:SS
 */
export const formatTime = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * Generate unique ID
 */
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};