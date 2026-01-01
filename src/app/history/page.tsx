'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TypingSession } from '@/types/typing';
import { getAllSessions, deleteSession, clearAllSessions } from '@/lib/storage';
import { formatTime } from '@/lib/calculations';

export default function HistoryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<TypingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await getAllSessions();
      // Sort by timestamp, newest first
      const sorted = data.sort((a, b) => b.timestamp - a.timestamp);
      setSessions(sorted);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewSession = (id: string) => {
    router.push(`/results?id=${id}`);
  };

  const handleDeleteSession = async (id: string) => {
    try {
      await deleteSession(id);
      await loadSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleClearAll = async () => {
    try {
      await clearAllSessions();
      setSessions([]);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error clearing sessions:', error);
    }
  };

  const calculateAverageWPM = () => {
    if (sessions.length === 0) return 0;
    const sum = sessions.reduce((acc, session) => acc + session.wpm, 0);
    return Math.round(sum / sessions.length);
  };

  const calculateAverageAccuracy = () => {
    if (sessions.length === 0) return 0;
    const sum = sessions.reduce((acc, session) => acc + session.accuracy, 0);
    return Math.round(sum / sessions.length);
  };

  const getTremorBadge = (score: number) => {
    if (score < 30) return { label: 'Low', bg: 'bg-green-500/20', text: 'text-green-400' };
    if (score < 60) return { label: 'Moderate', bg: 'bg-yellow-500/20', text: 'text-yellow-400' };
    return { label: 'High', bg: 'bg-red-500/20', text: 'text-red-400' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading history...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Typing History
          </h1>
          <p className="text-slate-300 text-lg">
            View and analyze your past typing sessions
          </p>
        </div>

        {/* Summary Stats */}
        {sessions.length > 0 && (
          <div className="max-w-6xl mx-auto mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700 text-center">
                <p className="text-slate-400 text-sm mb-2">Total Sessions</p>
                <p className="text-5xl font-bold text-orange-500">{sessions.length}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700 text-center">
                <p className="text-slate-400 text-sm mb-2">Average WPM</p>
                <p className="text-5xl font-bold text-orange-500">{calculateAverageWPM()}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700 text-center">
                <p className="text-slate-400 text-sm mb-2">Average Accuracy</p>
                <p className="text-5xl font-bold text-orange-500">{calculateAverageAccuracy()}%</p>
              </div>
            </div>
          </div>
        )}

        {/* Sessions List */}
        <div className="max-w-6xl mx-auto">
          {sessions.length === 0 ? (
            <div className="bg-slate-800/50 backdrop-blur rounded-lg p-12 border border-slate-700 text-center">
              <p className="text-slate-300 text-xl mb-6">No typing sessions yet</p>
              <button
                onClick={() => router.push('/')}
                className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-lg transition-colors"
              >
                Take Your First Test
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-8">
                {sessions.map((session) => {
                  const tremorBadge = getTremorBadge(session.tremorScore || 0);
                  
                  return (
                    <div
                      key={session.id}
                      className="bg-slate-800/50 backdrop-blur rounded-lg p-6 border border-slate-700 hover:border-orange-500/50 transition-colors cursor-pointer"
                      onClick={() => handleViewSession(session.id)}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-white text-lg font-semibold">
                              {new Date(session.timestamp).toLocaleDateString('en-US', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </h3>
                            <span className="text-slate-400 text-sm">
                              {new Date(session.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-slate-300">
                            <span>
                              <span className="text-slate-400">WPM:</span> {session.wpm}
                            </span>
                            <span>
                              <span className="text-slate-400">Accuracy:</span> {session.accuracy}%
                            </span>
                            <span>
                              <span className="text-slate-400">Duration:</span> {formatTime(session.duration)}
                            </span>
                            <span>
                              <span className="text-slate-400">Keystrokes:</span> {session.keystrokes.length}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className={`px-3 py-1 rounded-full ${tremorBadge.bg}`}>
                            <span className={`text-sm font-medium ${tremorBadge.text}`}>
                              Tremor: {tremorBadge.label}
                            </span>
                          </div>
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                            }}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center">
                <button
                  onClick={() => router.push('/')}
                  className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-semibold rounded-lg transition-colors"
                >
                  Take New Test
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-8 py-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-lg font-semibold rounded-lg transition-colors border border-red-500/50"
                >
                  Clear All History
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-8 max-w-md w-full border border-slate-700">
            <h3 className="text-white text-2xl font-bold mb-4">Confirm Delete</h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete all {sessions.length} typing sessions? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button
                onClick={handleClearAll}
                className="flex-1 px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg transition-colors"
              >
                Yes, Delete All
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}