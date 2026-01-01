import { TypingSession, UserProfile } from '@/types/typing';

const DB_NAME = 'OnCueTypingDB';
const DB_VERSION = 1;
const SESSIONS_STORE = 'typingSessions';
const PROFILE_STORE = 'userProfile';

/**
 * Initialize IndexedDB
 */
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create sessions store
      if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
        const sessionsStore = db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
        sessionsStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Create profile store
      if (!db.objectStoreNames.contains(PROFILE_STORE)) {
        db.createObjectStore(PROFILE_STORE, { keyPath: 'id' });
      }
    };
  });
};

/**
 * Save typing session to IndexedDB
 */
export const saveSession = async (session: TypingSession): Promise<void> => {
  const db = await initDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], 'readwrite');
    const store = transaction.objectStore(SESSIONS_STORE);
    const request = store.add(session);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
};

/**
 * Get all typing sessions
 */
export const getAllSessions = async (): Promise<TypingSession[]> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], 'readonly');
    const store = transaction.objectStore(SESSIONS_STORE);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
};

/**
 * Get session by ID
 */
export const getSessionById = async (id: string): Promise<TypingSession | null> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], 'readonly');
    const store = transaction.objectStore(SESSIONS_STORE);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
};

/**
 * Delete session by ID
 */
export const deleteSession = async (id: string): Promise<void> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], 'readwrite');
    const store = transaction.objectStore(SESSIONS_STORE);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
};

/**
 * Clear all sessions
 */
export const clearAllSessions = async (): Promise<void> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SESSIONS_STORE], 'readwrite');
    const store = transaction.objectStore(SESSIONS_STORE);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
};

/**
 * Save user profile
 */
export const saveProfile = async (profile: UserProfile): Promise<void> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PROFILE_STORE], 'readwrite');
    const store = transaction.objectStore(PROFILE_STORE);
    const request = store.put(profile);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
};

/**
 * Get user profile
 */
export const getProfile = async (): Promise<UserProfile | null> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([PROFILE_STORE], 'readonly');
    const store = transaction.objectStore(PROFILE_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const profiles = request.result || [];
      resolve(profiles.length > 0 ? profiles[0] : null);
    };
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
};

/**
 * Export all sessions as JSON
 */
export const exportSessionsAsJSON = async (): Promise<string> => {
  const sessions = await getAllSessions();
  return JSON.stringify(sessions, null, 2);
};

/**
 * Export all sessions as CSV
 */
export const exportSessionsAsCSV = async (): Promise<string> => {
  const sessions = await getAllSessions();
  
  if (sessions.length === 0) return '';

  // CSV headers
  const headers = [
    'Session ID',
    'Date',
    'Duration (seconds)',
    'WPM',
    'Accuracy (%)',
    'Error Rate (%)',
    'Total Keystrokes',
    'Tremor Score',
    'Fatigue Score'
  ];

  // CSV rows
  const rows = sessions.map(session => [
    session.id,
    new Date(session.timestamp).toISOString(),
    Math.round(session.duration / 1000),
    session.wpm,
    session.accuracy,
    session.errorRate,
    session.keystrokes.length,
    session.tremorScore || 0,
    session.fatigueScore || 0
  ]);

  // Combine headers and rows
  const csv = [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');

  return csv;
};

/**
 * Download data as file
 */
export const downloadFile = (content: string, filename: string, mimeType: string = 'text/plain') => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};