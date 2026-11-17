// IndexedDB persistence layer for BassCircle mastery & user preferences

import { buildCanonicalDeckDefinitions } from './quizzes.js';

const DB_NAME = 'basscircle_db';
const DB_VERSION = 1;
const CARDS_STORE = 'cards';
const META_STORE = 'meta';

let dbPromise = null;

export async function requestPersistentStorage() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      await navigator.storage.persist();
    }
  } catch {
    // Ignore if unsupported
  }
}

function openDB() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(CARDS_STORE)) {
        const store = db.createObjectStore(CARDS_STORE, { keyPath: 'id' });
        store.createIndex('category', 'category', { unique: false });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

  return dbPromise;
}

/**
 * Ensures all canonical quiz definitions exist in IndexedDB while preserving
 * existing FSRS progress on already-reviewed cards.
 */
export async function syncDeckAndGetAllCards() {
  const defs = buildCanonicalDeckDefinitions();
  const db = await openDB();

  const existing = await new Promise((resolve, reject) => {
    const tx = db.transaction(CARDS_STORE, 'readonly');
    const req = tx.objectStore(CARDS_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });

  const existingMap = new Map(existing.map((c) => [c.id, c]));
  const validIds = new Set(defs.map((d) => d.id));
  const now = Date.now();
  const toPut = [];
  const toDelete = [];

  for (const def of defs) {
    const cur = existingMap.get(def.id);
    if (!cur) {
      const fresh = {
        id: def.id,
        category: def.category,
        stability: 0,
        difficulty: 0,
        reps: 0,
        lapses: 0,
        lastReviewAt: null,
        dueAt: null,
        createdAt: now,
        updatedAt: now
      };
      existingMap.set(def.id, fresh);
      toPut.push(fresh);
    } else if (cur.category !== def.category) {
      const fixed = { ...cur, category: def.category, updatedAt: now };
      existingMap.set(def.id, fixed);
      toPut.push(fixed);
    }
  }

  for (const old of existing) {
    if (!validIds.has(old.id)) {
      toDelete.push(old.id);
      existingMap.delete(old.id);
    }
  }

  if (toPut.length > 0 || toDelete.length > 0) {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(CARDS_STORE, 'readwrite');
      const store = tx.objectStore(CARDS_STORE);
      for (const c of toPut) store.put(c);
      for (const id of toDelete) store.delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  return Array.from(existingMap.values());
}

export async function saveCardProgress(card) {
  const db = await openDB();
  const clean = {
    ...card,
    updatedAt: Date.now()
  };
  await new Promise((resolve, reject) => {
    const tx = db.transaction(CARDS_STORE, 'readwrite');
    tx.objectStore(CARDS_STORE).put(clean);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return clean;
}

export async function resetAllProgress() {
  const defs = buildCanonicalDeckDefinitions();
  const db = await openDB();
  const now = Date.now();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(CARDS_STORE, 'readwrite');
    const store = tx.objectStore(CARDS_STORE);
    store.clear();
    for (const def of defs) {
      store.put({
        id: def.id,
        category: def.category,
        stability: 0,
        difficulty: 0,
        reps: 0,
        lapses: 0,
        lastReviewAt: null,
        dueAt: null,
        createdAt: now,
        updatedAt: now
      });
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getSettings() {
  const defaults = {
    notation: 'solfege', // 'solfege' (Do Ré Mi) | 'letter' (C D E)
    blindMode: 'auto',   // 'auto' (FSRS progressive blind) | 'blind' (always blind) | 'labels' (always labeled)
    sound: false
  };
  try {
    const db = await openDB();
    return await new Promise((resolve) => {
      const tx = db.transaction(META_STORE, 'readonly');
      const req = tx.objectStore(META_STORE).get('settings');
      req.onsuccess = () => {
        const val = req.result?.value || {};
        resolve({ ...defaults, ...val });
      };
      req.onerror = () => resolve(defaults);
    });
  } catch {
    return defaults;
  }
}

export async function saveSettings(partial) {
  const current = await getSettings();
  const merged = { ...current, ...partial };
  const db = await openDB();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(META_STORE, 'readwrite');
    tx.objectStore(META_STORE).put({ key: 'settings', value: merged });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  return merged;
}

export async function exportBackupPayload() {
  const cards = await syncDeckAndGetAllCards();
  const settings = await getSettings();
  return {
    app: 'basscircle',
    version: 1,
    exportedAt: new Date().toISOString(),
    settings,
    cards: cards.filter((c) => (c.reps || 0) > 0)
  };
}

export async function importBackupPayload(payload) {
  const rawList = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.cards)
    ? payload.cards
    : null;

  if (!rawList) {
    throw new Error('Invalid backup file.');
  }

  const all = await syncDeckAndGetAllCards();
  const byId = new Map(all.map((c) => [c.id, c]));
  const now = Date.now();
  const toPut = [];
  let restored = 0;

  for (const item of rawList) {
    if (!item || typeof item !== 'object' || !byId.has(item.id)) continue;
    const local = byId.get(item.id);
    const incomingLast = Number(item.lastReviewAt) || 0;
    const localLast = Number(local.lastReviewAt) || 0;

    if (incomingLast >= localLast && (Number(item.reps) || 0) > 0) {
      toPut.push({
        ...local,
        stability: Number(item.stability) || 0,
        difficulty: Number(item.difficulty) || 0,
        reps: Number(item.reps) || 0,
        lapses: Number(item.lapses) || 0,
        lastReviewAt: incomingLast || null,
        dueAt: item.dueAt ? Number(item.dueAt) : null,
        updatedAt: now
      });
      restored += 1;
    }
  }

  if (toPut.length > 0) {
    const db = await openDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(CARDS_STORE, 'readwrite');
      const store = tx.objectStore(CARDS_STORE);
      for (const c of toPut) store.put(c);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  if (payload && !Array.isArray(payload) && payload.settings) {
    const s = {};
    if (payload.settings.notation === 'solfege' || payload.settings.notation === 'letter') {
      s.notation = payload.settings.notation;
    }
    if (['auto', 'blind', 'labels'].includes(payload.settings.blindMode)) {
      s.blindMode = payload.settings.blindMode;
    }
    if (typeof payload.settings.sound === 'boolean') {
      s.sound = payload.settings.sound;
    }
    if (Object.keys(s).length > 0) {
      await saveSettings(s);
    }
  }

  return { restored };
}
