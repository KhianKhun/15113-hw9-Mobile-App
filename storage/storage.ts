import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityRecord, ActiveSession } from '../types';
import { STORAGE_KEYS } from '../constants';

// ─── Records ────────────────────────────────────────────────────────────────

export async function loadRecords(): Promise<ActivityRecord[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.RECORDS);
    return json ? (JSON.parse(json) as ActivityRecord[]) : [];
  } catch (e) {
    console.error('loadRecords failed:', e);
    return [];
  }
}

export async function saveRecords(records: ActivityRecord[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.RECORDS, JSON.stringify(records));
  } catch (e) {
    console.error('saveRecords failed:', e);
  }
}

export async function addRecord(record: ActivityRecord): Promise<void> {
  const records = await loadRecords();
  records.unshift(record); // newest first
  await saveRecords(records);
}

export async function updateRecord(updated: ActivityRecord): Promise<void> {
  const records = await loadRecords();
  const idx = records.findIndex((r) => r.id === updated.id);
  if (idx !== -1) {
    records[idx] = updated;
    await saveRecords(records);
  }
}

export async function deleteRecord(id: string): Promise<void> {
  const records = await loadRecords();
  await saveRecords(records.filter((r) => r.id !== id));
}

// ─── Active Session ──────────────────────────────────────────────────────────

export async function loadActiveSession(): Promise<ActiveSession | null> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    return json ? (JSON.parse(json) as ActiveSession) : null;
  } catch (e) {
    console.error('loadActiveSession failed:', e);
    return null;
  }
}

export async function saveActiveSession(
  session: ActiveSession | null,
): Promise<void> {
  try {
    if (session === null) {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    } else {
      await AsyncStorage.setItem(
        STORAGE_KEYS.ACTIVE_SESSION,
        JSON.stringify(session),
      );
    }
  } catch (e) {
    console.error('saveActiveSession failed:', e);
  }
}

// ─── Custom Tags ─────────────────────────────────────────────────────────────

export async function loadCustomTags(): Promise<string[]> {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEYS.CUSTOM_TAGS);
    return json ? (JSON.parse(json) as string[]) : [];
  } catch (e) {
    console.error('loadCustomTags failed:', e);
    return [];
  }
}

export async function saveCustomTags(tags: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.CUSTOM_TAGS, JSON.stringify(tags));
  } catch (e) {
    console.error('saveCustomTags failed:', e);
  }
}
