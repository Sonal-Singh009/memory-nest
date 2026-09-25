import { MemoryEntry, AppSettings } from '../types';

const DB_NAME = 'MemoryNestDB';
const DB_VERSION = 1;

const DEFAULT_SETTINGS: AppSettings = {
  appName: 'Memory Nest',
  theme: 'cream',
  fontFamily: 'serif',
  fontSize: 'normal',
  defaultCategory: 'Thought',
  hasPinLock: false,
  pinCode: '',
};

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('entries')) {
        const entriesStore = db.createObjectStore('entries', { keyPath: 'id' });
        entriesStore.createIndex('date', 'date', { unique: false });
        entriesStore.createIndex('category', 'category', { unique: false });
        entriesStore.createIndex('type', 'type', { unique: false });
        entriesStore.createIndex('createdAt', 'createdAt', { unique: false });
      }

      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      if (!db.objectStoreNames.contains('drafts')) {
        db.createObjectStore('drafts', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllEntries(): Promise<MemoryEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('entries', 'readonly');
    const store = transaction.objectStore('entries');
    const request = store.getAll();

    request.onsuccess = () => {
      const results = (request.result || []) as MemoryEntry[];
      // Sort newest created first
      results.sort((a, b) => b.createdAt - a.createdAt);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getEntriesByDate(dateStr: string): Promise<MemoryEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('entries', 'readonly');
    const store = transaction.objectStore('entries');
    const index = store.index('date');
    const request = index.getAll(dateStr);

    request.onsuccess = () => {
      const results = (request.result || []) as MemoryEntry[];
      results.sort((a, b) => b.createdAt - a.createdAt);
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function getEntryById(id: string): Promise<MemoryEntry | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('entries', 'readonly');
    const store = transaction.objectStore('entries');
    const request = store.get(id);

    request.onsuccess = () => resolve((request.result as MemoryEntry) || null);
    request.onerror = () => reject(request.error);
  });
}

export async function saveEntry(entry: MemoryEntry): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('entries', 'readwrite');
    const store = transaction.objectStore('entries');
    const request = store.put(entry);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('entries', 'readwrite');
    const store = transaction.objectStore('entries');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction('settings', 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get('app_settings');

      request.onsuccess = () => {
        if (request.result && request.result.value) {
          resolve({ ...DEFAULT_SETTINGS, ...request.result.value });
        } else {
          resolve(DEFAULT_SETTINGS);
        }
      };
      request.onerror = () => resolve(DEFAULT_SETTINGS);
    });
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('settings', 'readwrite');
    const store = transaction.objectStore('settings');
    const request = store.put({ key: 'app_settings', value: settings });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getDraft<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction('drafts', 'readonly');
      const store = transaction.objectStore('drafts');
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result ? request.result.value : null);
      request.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export async function saveDraft<T>(key: string, value: T): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('drafts', 'readwrite');
    const store = transaction.objectStore('drafts');
    const request = store.put({ key, value, updatedAt: Date.now() });

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function deleteDraft(key: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('drafts', 'readwrite');
    const store = transaction.objectStore('drafts');
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function exportAllData(): Promise<string> {
  const entries = await getAllEntries();
  const settings = await getSettings();

  const exportPayload = {
    app: 'Memory Nest',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    entries,
  };

  return JSON.stringify(exportPayload, null, 2);
}

export async function importData(jsonData: string, mode: 'merge' | 'replace'): Promise<{ importedCount: number }> {
  const parsed = JSON.parse(jsonData);
  if (!parsed || !Array.isArray(parsed.entries)) {
    throw new Error('Invalid backup file format: missing entries list.');
  }

  const entriesToImport: MemoryEntry[] = parsed.entries;
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(['entries', 'settings'], 'readwrite');
    const entriesStore = transaction.objectStore('entries');

    if (mode === 'replace') {
      entriesStore.clear();
    }

    let count = 0;
    for (const entry of entriesToImport) {
      if (entry && entry.id && entry.date) {
        entriesStore.put(entry);
        count++;
      }
    }

    if (parsed.settings) {
      const settingsStore = transaction.objectStore('settings');
      settingsStore.put({ key: 'app_settings', value: { ...DEFAULT_SETTINGS, ...parsed.settings } });
    }

    transaction.oncomplete = () => resolve({ importedCount: count });
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getStorageStats(): Promise<{ entryCount: number; mediaCount: number; estimatedSizeKb: number }> {
  const entries = await getAllEntries();
  let mediaCount = 0;
  let totalChars = 0;

  for (const e of entries) {
    totalChars += (e.title || '').length + (e.content || '').length;
    if (e.attachments && e.attachments.length > 0) {
      mediaCount += e.attachments.length;
      for (const a of e.attachments) {
        totalChars += (a.dataUrl || '').length;
      }
    }
  }

  const estimatedSizeKb = Math.round((totalChars * 2) / 1024);
  return {
    entryCount: entries.length,
    mediaCount,
    estimatedSizeKb,
  };
}

export async function seedSampleMemoriesIfEmpty(): Promise<void> {
  const entries = await getAllEntries();
  if (entries.length > 0) return;

  const todayStr = new Date().toISOString().split('T')[0];
  const now = Date.now();

  const welcomeEntry: MemoryEntry = {
    id: 'seed-welcome-1',
    date: todayStr,
    timeString: '09:00 AM',
    createdAt: now - 3600000 * 2,
    updatedAt: now - 3600000 * 2,
    type: 'text',
    title: 'Welcome to your Memory Nest 🌱',
    content: `This is your quiet, warm corner of the digital world.

Here, you can save:
- Quick reflections & wandering thoughts
- Voice recordings & spoken memories
- Hand-drawn sketches & doodles
- Photos from your daily life
- Future plans, ideas & heartfelt goals

Everything stays strictly on your device in your private vault. No ads, no feeds, no noise.

Tap the "+ Add to today" button below or try speaking into the microphone!`,
    category: 'Thought',
    tags: ['welcome', 'beginnings', 'mindfulness'],
    attachments: [],
    isPinned: true,
    isFavorite: true,
  };

  const ideaEntry: MemoryEntry = {
    id: 'seed-idea-2',
    date: todayStr,
    timeString: '11:15 AM',
    createdAt: now - 3600000,
    updatedAt: now - 3600000,
    type: 'text',
    title: 'Autumn morning rituals & cozy reading corner',
    content: `Idea for the coming weekend:
- Gather vintage ceramic mugs from the flea market
- Set up a soft throw blanket by the east-facing window
- Brew cinnamon spiced chai before opening my sketchbook
- Spend an hour reading without checking notifications

#dreams #cozy #weekend`,
    category: 'Idea',
    tags: ['dreams', 'cozy', 'weekend'],
    attachments: [],
  };

  await saveEntry(welcomeEntry);
  await saveEntry(ideaEntry);
}
