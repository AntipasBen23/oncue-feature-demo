'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { KeystrokeEvent, TypingSession } from '@/types/typing';
import { saveSession } from '@/lib/storage';
import { calculatePerformanceMetrics, formatTime, generateId } from '@/lib/calculations';

export default function TypingTest() {
  const router = useRouter();
  const [testStatus, setTestStatus] = useState<'idle' | 'active' | 'completed'>('idle');
  const [typedText, setTypedText] = useState('');
  const [keystrokes, setKeystrokes] = useState<KeystrokeEvent[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentKeyDownTime, setCurrentKeyDownTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Sample text for typing test
  const referenceText = "The quick brown fox jumps over the lazy dog. This simple sentence helps us measure typing speed and accuracy effectively.";

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (testStatus === 'active' && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [testStatus, startTime]);

  // Calculate WPM
  const calculateWPM = () => {
    if (!startTime || elapsedTime === 0) return 0;
    const minutes = elapsedTime / 60000;
    const words = typedText.length / 5; // Standard: 5 chars = 1 word
    return Math.round(words / minutes);
  };

  // Calculate accuracy
  const calculateAccuracy = () => {
    if (typedText.length === 0) return 100;
    let correct = 0;
    for (let i = 0; i < typedText.length; i++) {
      if (typedText[i] === referenceText[i]) correct++;
    }
    return Math.round((correct / typedText.length) * 100);
  };

  const handleStartTest = () => {
    setTestStatus('active');
    setStartTime(Date.now());
    setTypedText('');
    setKeystrokes([]);
    setElapsedTime(0);
    textareaRef.current?.focus();
  };

  const handleFinishTest = async () => {
    if (!startTime) return;
    
    const endTime = Date.now();
    const sessionId = generateId();
    
    // Calculate comprehensive metrics
    const metrics = calculatePerformanceMetrics(
      typedText,
      referenceText,
      keystrokes,
      startTime,
      endTime
    );
    
    // Create typing session object
    const session: TypingSession = {
      id: sessionId,
      timestamp: startTime,
      referenceText: referenceText,
      typedText: typedText,
      keystrokes: keystrokes,
      startTime: startTime,
      endTime: endTime,
      duration: endTime - startTime,
      wpm: metrics.wpm,
      accuracy: metrics.accuracy,
      errorRate: metrics.errorRate,
      tremorScore: metrics.tremorSeverityScore,
      fatigueScore: metrics.fatigueScore
    };
    
    try {
      // Save to IndexedDB
      await saveSession(session);
      
      // Redirect to results page
      router.push(`/results?id=${sessionId}`);
    } catch (error) {
      console.error('Error saving session:', error);
      // Still show completed state even if save fails
      setTestStatus('completed');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (testStatus !== 'active') return;
    
    // Ignore modifier keys
    if (['Shift', 'Control', 'Alt', 'Meta'].includes(e.key)) return;

    setCurrentKeyDownTime(Date.now());
  };

  const handleKeyUp = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (testStatus !== 'active' || currentKeyDownTime === null) return;

    const keyUpTime = Date.now();
    const duration = keyUpTime - currentKeyDownTime;
    const currentCharIndex = typedText.length;
    const isCorrect = e.key === referenceText[currentCharIndex];

    const keystrokeEvent: KeystrokeEvent = {
      key: e.key,
      keyDownTime: currentKeyDownTime,
      keyUpTime: keyUpTime,
      duration: duration,
      isCorrect: isCorrect,
      characterIndex: currentCharIndex
    };

    setKeystrokes(prev => [...prev, keystrokeEvent]);
    setCurrentKeyDownTime(null);
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            OnCue Analytics Engine
          </h1>
          <p className="text-slate-300 text-lg">
            Real-time typing performance tracking for Parkinson's research
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {/* Stats Bar */}
          {testStatus !== 'idle' && (
            <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 mb-6 border border-slate-700">
              <div className="grid grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-1">Time</p>
                  <p className="text-3xl font-bold text-orange-500">
                    {formatTime(elapsedTime)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-1">WPM</p>
                  <p className="text-3xl font-bold text-orange-500">
                    {calculateWPM()}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-slate-400 text-sm mb-1">Accuracy</p>
                  <p className="text-3xl font-bold text-orange-500">
                    {calculateAccuracy()}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reference Text */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 mb-6 border border-slate-700">
            <h2 className="text-white text-xl font-semibold mb-4">Type this text:</h2>
            <p className="text-slate-300 text-lg leading-relaxed font-mono">
              {referenceText.split('').map((char, index) => {
                let colorClass = 'text-slate-300';
                if (index < typedText.length) {
                  colorClass = typedText[index] === char ? 'text-green-400' : 'text-red-400';
                }
                return (
                  <span key={index} className={colorClass}>
                    {char}
                  </span>
                );
              })}
            </p>
          </div>

          {/* Typing Area */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 mb-6 border border-slate-700">
            <h2 className="text-white text-xl font-semibold mb-4">Your typing:</h2>
            <textarea
              ref={textareaRef}
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              onKeyDown={handleKeyDown}
              onKeyUp={handleKeyUp}
              disabled={testStatus !== 'active'}
              className="w-full h-32 bg-slate-900 text-white text-lg p-4 rounded-lg border border-slate-600 focus:border-orange-500 focus:outline-none font-mono resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder={testStatus === 'idle' ? 'Click "Start Test" to begin' : 'Start typing...'}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center">
            {testStatus === 'idle' && (
              <>
                <button
                  onClick={handleStartTest}
                  className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-lg transition-colors"
                >
                  Start Test
                </button>
                <button
                  onClick={() => router.push('/history')}
                  className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white text-lg font-semibold rounded-lg transition-colors"
                >
                  View History
                </button>
              </>
            )}

            {testStatus === 'active' && (
              <button
                onClick={handleFinishTest}
                className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-lg transition-colors"
              >
                Finish Test
              </button>
            )}

            {testStatus === 'completed' && (
              <div className="text-center">
                <p className="text-white text-xl mb-4">Test Completed!</p>
                <button
                  onClick={handleStartTest}
                  className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-lg transition-colors"
                >
                  Take Another Test
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}