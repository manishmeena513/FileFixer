import { openDB, DBSchema, IDBPDatabase } from "idb";

export interface HistoryRecord {
  id: string;
  filename: string;
  tool: string;
  originalSize: number;
  outputSize: number;
  savingsPct: number;
  timestamp: number;
}

interface FileFixerDB extends DBSchema {
  history: {
    key: string;
    value: HistoryRecord;
    indexes: { "by-timestamp": number };
  };
}

const DB_NAME = "filefixer_db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<FileFixerDB>> | null = null;

function getDB() {
  if (typeof window === "undefined") return null;
  if (!dbPromise) {
    dbPromise = openDB<FileFixerDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("history")) {
          const store = db.createObjectStore("history", { keyPath: "id" });
          store.createIndex("by-timestamp", "timestamp");
        }
      },
    });
  }
  return dbPromise;
}

export async function addHistoryRecord(record: Omit<HistoryRecord, "id" | "timestamp" | "savingsPct"> & { savingsPct?: number }): Promise<void> {
  const db = await getDB();
  if (!db) return;

  const original = record.originalSize || 1;
  const output = record.outputSize || original;
  const savingsPct = record.savingsPct ?? Math.max(0, ((original - output) / original) * 100);

  const entry: HistoryRecord = {
    ...record,
    id: `hist-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: Date.now(),
    savingsPct: parseFloat(savingsPct.toFixed(1)),
  };

  await db.put("history", entry);
}

export async function getAllHistory(): Promise<HistoryRecord[]> {
  const db = await getDB();
  if (!db) return [];
  const list = await db.getAllFromIndex("history", "by-timestamp");
  return list.reverse(); // Most recent first
}

export async function clearAllHistory(): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.clear("history");
}

export async function deleteHistoryRecord(id: string): Promise<void> {
  const db = await getDB();
  if (!db) return;
  await db.delete("history", id);
}
