/**
 * ScribeRx — Server-Side Data Persistence Layer
 *
 * Provides JSON-file-based storage for the application database,
 * fuzzy drug name matching via Levenshtein distance, and intake
 * schedule generation from clinical frequency strings.
 */

import fs from 'fs';
import path from 'path';
import { AppDatabase, InventoryItem } from './types';

const DB_FILE = path.join(process.cwd(), 'src_db_store.json');

const DEFAULT_INVENTORY: InventoryItem[] = [];

/** Returns a fresh, empty database structure with all collections initialized. */
export function getInitialDatabase(): AppDatabase {
  return {
    inventory: [],
    prescriptions: [],
    prescription_items: [],
    intake_alerts: [],
    low_stock_alerts: []
  };
}

/**
 * Loads the application database from the JSON store file.
 * If the file does not exist or is corrupt, returns and persists a fresh database.
 */
export function loadDatabase(): AppDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Failed to load local DB, resetting to default:', err);
  }
  const db = getInitialDatabase();
  saveDatabase(db);
  return db;
}

/** Persists the full application database to the JSON store file. */
export function saveDatabase(db: AppDatabase): void {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save local DB:', err);
  }
}

/**
 * Computes the Levenshtein (edit) distance between two strings.
 * Used internally by fuzzyMatchDrug to quantify drug name similarity.
 */
function levenshteinDistance(a: string, b: string): number {
  const tmp = [];
  let i, j;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  for (i = 0; i <= a.length; i++) tmp[i] = [i];
  for (j = 0; j <= b.length; j++) tmp[0][j] = j;
  for (i = 1; i <= a.length; i++) {
    for (j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1, // deletion
        tmp[i][j - 1] + 1, // insertion
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1) // substitution
      );
    }
  }
  return tmp[a.length][b.length];
}

/**
 * Fuzzy-matches an extracted drug name against the inventory catalog.
 *
 * Uses Levenshtein distance with a similarity threshold of >= 85%.
 * Falls back to substring containment matching (>= 70%) if the
 * edit-distance check fails. Returns the best match or null.
 *
 * @param drugName  - The raw drug name extracted from the prescription.
 * @param inventory - The current inventory item list to match against.
 */
export function fuzzyMatchDrug(drugName: string, inventory: InventoryItem[]): { item: InventoryItem; similarity: number } | null {
  const target = drugName.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
  let bestMatch: InventoryItem | null = null;
  let maxSimilarity = 0;

  for (const item of inventory) {
    const candidate = item.drug_name.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
    const distance = levenshteinDistance(target, candidate);
    const maxLen = Math.max(target.length, candidate.length);
    const similarity = maxLen === 0 ? 1 : 1 - distance / maxLen;

    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      bestMatch = item;
    }
  }

  // Also check if any item name is a substring or contains the search string
  if (maxSimilarity < 0.85) {
    for (const item of inventory) {
      const candidate = item.drug_name.toLowerCase();
      const rawTarget = drugName.toLowerCase();
      if (candidate.includes(rawTarget) || rawTarget.includes(candidate)) {
        // Boost similarity if it is a strong substring match
        const subSimilarity = Math.min(candidate.length, rawTarget.length) / Math.max(candidate.length, rawTarget.length);
        if (subSimilarity >= 0.70 && subSimilarity > maxSimilarity) {
          maxSimilarity = subSimilarity;
          bestMatch = item;
        }
      }
    }
  }

  if (maxSimilarity >= 0.85 && bestMatch) {
    return { item: bestMatch, similarity: maxSimilarity };
  }
  return null;
}

/**
 * Generates daily intake time slots from a clinical frequency string.
 *
 * Parses common medical abbreviations (QID, TDS, BID, etc.) and natural
 * language patterns ("twice daily", "at night") into concrete clock times.
 * Defaults to a single 09:00 AM dose if the frequency is unrecognized.
 *
 * @param drugName  - Drug name (for logging/context, not used in logic).
 * @param dosage    - Dosage string (for logging/context, not used in logic).
 * @param frequency - Raw frequency string from VLM extraction.
 * @returns Array of time strings (e.g., ["09:00 AM", "09:00 PM"]).
 */
export function generateIntakeSchedules(drugName: string, dosage: string, frequency: string): string[] {
  const freq = frequency.toLowerCase();
  
  if (freq.includes('four') || freq.includes('qid') || freq.includes('4 times')) {
    return ['08:00 AM', '12:00 PM', '04:00 PM', '08:00 PM'];
  }
  if (freq.includes('three') || freq.includes('tds') || freq.includes('tid') || freq.includes('3 times')) {
    return ['08:00 AM', '02:00 PM', '08:00 PM'];
  }
  if (freq.includes('twice') || freq.includes('bid') || freq.includes('twice daily') || freq.includes('2 times') || freq.includes('b.i.d')) {
    return ['09:00 AM', '09:00 PM'];
  }
  if (freq.includes('night') || freq.includes('bedtime') || freq.includes('evening') || freq.includes('hs') || freq.includes('h.s.')) {
    return ['09:00 PM'];
  }
  
  // Default once daily
  return ['09:00 AM'];
}
