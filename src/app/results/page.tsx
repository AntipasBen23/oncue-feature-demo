'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TypingSession } from '@/types/typing';
import { getSessionById, exportSessionsAsCSV, exportSessionsAsJSON, downloadFile } from '@/lib/storage';
import { formatTime } from '@/lib/calculations';

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('id');

  const [session, setSession] = useState<TypingSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      if (!sessionId) {
        router.push('/');
        return;
      }

      try {
        const data = await getSessionById(sessionId);
        if (data) {
          setSession(data);
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Error loading session:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadSession();
  }, [sessionId, router]);

  const handleExportCSV = async () => {
    try {
      const csv = await exportSessionsAsCSV();
      downloadFile(csv, `oncue-typing-data-${Date.now()}.csv`, 'text/csv');
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  const handleExportJSON = async () => {
    try {
      const json = await exportSessionsAsJSON();
      downloadFile(json, `oncue-typing-data-${Date.now()}.json`, 'application/json');
    } catch (error) {
      console.error('Error exporting JSON:', error);
    }
  };

  const getTremorLevel = (score: number): { label: string; color: string } => {
    if (score < 30) return { label: 'Low', color: 'text-green-400' };
    if (score < 60) return { label: 'Moderate', color: 'text-yellow-400' };
    return { label: 'High', color: 'text-red-400' };
  };

  const getFatigueLevel = (score: number): { label: string; color: string } => {
    if (score < 15) return { label: 'None', color: 'text-green-400' };
    if (score < 30) return { label: 'Mild', color: 'text-yellow-400' };
    return { label: 'Significant', color: 'text-red-400' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading results...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const tremorLevel = getTremorLevel(session.tremorScore || 0);
  const fatigueLevel = getFatigueLevel(session.fatigueScore || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Test Results
          </h1>
          <p className="text-slate-300 text-lg">
            Detailed performance analysis
          </p>
        </div>

        {/* Main Metrics Grid */}
        <div className="max-w-6xl mx-auto mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* WPM */}
            <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700 text-center">
              <p className="text-slate-400 text-sm mb-2">Words Per Minute</p>
              <p className="text-5xl font-bold text-orange-500">{session.wpm}</p>
            </div>

            {/* Accuracy */}
            <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700 text-center">
              <p className="text-slate-400 text-sm mb-2">Accuracy</p>
              <p className="text-5xl font-bold text-orange-500">{session.accuracy}%</p>
            </div>

            {/* Duration */}
            <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700 text-center">
              <p className="text-slate-400 text-sm mb-2">Duration</p>
              <p className="text-5xl font-bold text-orange-500">{formatTime(session.duration)}</p>
            </div>

            {/* Keystrokes */}
            <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700 text-center">
              <p className="text-slate-400 text-sm mb-2">Total Keystrokes</p>
              <p className="text-5xl font-bold text-orange-500">{session.keystrokes.length}</p>
            </div>
          </div>

          {/* Advanced Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Tremor Analysis */}
            <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700">
              <h3 className="text-white text-xl font-semibold mb-4">Tremor Analysis</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Tremor Severity Score</p>
                  <p className="text-3xl font-bold text-orange-500">{session.tremorScore || 0}/100</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Severity Level</p>
                  <p className={`text-2xl font-bold ${tremorLevel.color}`}>{tremorLevel.label}</p>
                </div>
                <div className="pt-4 border-t border-slate-700">
                  <p className="text-slate-300 text-sm">
                    Based on keystroke timing variability. Higher scores indicate more inconsistent typing patterns.
                  </p>
                </div>
              </div>
            </div>

            {/* Fatigue Detection */}
            <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700">
              <h3 className="text-white text-xl font-semibold mb-4">Fatigue Detection</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Fatigue Score</p>
                  <p className="text-3xl font-bold text-orange-500">{session.fatigueScore || 0}%</p>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-1">Fatigue Level</p>
                  <p className={`text-2xl font-bold ${fatigueLevel.color}`}>{fatigueLevel.label}</p>
                </div>
                <div className="pt-4 border-t border-slate-700">
                  <p className="text-slate-300 text-sm">
                    Compares typing speed between the beginning and end of the test to detect performance decline.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Error Analysis */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700 mb-8">
            <h3 className="text-white text-xl font-semibold mb-4">Error Analysis</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-slate-400 text-sm mb-1">Error Rate</p>
                <p className="text-3xl font-bold text-orange-500">{session.errorRate}%</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Correct Keystrokes</p>
                <p className="text-3xl font-bold text-green-400">
                  {session.keystrokes.filter(k => k.isCorrect).length}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm mb-1">Incorrect Keystrokes</p>
                <p className="text-3xl font-bold text-red-400">
                  {session.keystrokes.filter(k => !k.isCorrect).length}
                </p>
              </div>
            </div>
          </div>

          {/* Session Info */}
          <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700 mb-8">
            <h3 className="text-white text-xl font-semibold mb-4">Session Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
              <div>
                <span className="text-slate-400">Date: </span>
                {new Date(session.timestamp).toLocaleDateString()}
              </div>
              <div>
                <span className="text-slate-400">Time: </span>
                {new Date(session.timestamp).toLocaleTimeString()}
              </div>
              <div className="md:col-span-2">
                <span className="text-slate-400">Session ID: </span>
                {session.id}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center">
            <button
              onClick={() => router.push('/')}
              className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-lg transition-colors"
            >
              Take Another Test
            </button>
            <button
              onClick={() => router.push('/history')}
              className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white text-lg font-semibold rounded-lg transition-colors"
            >
              View History
            </button>
            <button
              onClick={handleExportCSV}
              className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white text-lg font-semibold rounded-lg transition-colors"
            >
              Export as CSV
            </button>
            <button
              onClick={handleExportJSON}
              className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white text-lg font-semibold rounded-lg transition-colors"
            >
              Export as JSON
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}