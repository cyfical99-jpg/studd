import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Local-first "backend": a generic AsyncStorage-backed JSON collection store
 * with pub/sub, so screens can `useCollection('shifts')` and re-render when
 * any repository mutates that collection — anywhere in the app, in the same
 * session.
 *
 * This is a real, working persistence layer (not a stub) so the app is
 * genuinely interactive without a live cloud backend. See
 * services/repositories/README.md for how this maps onto the Supabase
 * schema in supabase/migrations/ once a real project exists.
 */

const KEY_PREFIX = 'stud:v1:';

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

const memoryCache = new Map<string, unknown[]>();
const inFlightLoads = new Map<string, Promise<unknown[]>>();

function notify(collection: string) {
  listeners.get(collection)?.forEach((fn) => fn());
}

export function subscribe(collection: string, listener: Listener): () => void {
  if (!listeners.has(collection)) listeners.set(collection, new Set());
  listeners.get(collection)!.add(listener);
  return () => listeners.get(collection)?.delete(listener);
}

async function loadCollection<T>(collection: string, seed: T[]): Promise<T[]> {
  if (memoryCache.has(collection)) return memoryCache.get(collection) as T[];

  if (inFlightLoads.has(collection)) return inFlightLoads.get(collection) as Promise<T[]>;

  const promise = (async () => {
    const raw = await AsyncStorage.getItem(KEY_PREFIX + collection);
    const value = raw ? (JSON.parse(raw) as T[]) : seed;
    if (!raw) await AsyncStorage.setItem(KEY_PREFIX + collection, JSON.stringify(seed));
    memoryCache.set(collection, value);
    return value;
  })();
  inFlightLoads.set(collection, promise as Promise<unknown[]>);
  const result = await promise;
  inFlightLoads.delete(collection);
  return result;
}

async function saveCollection<T>(collection: string, value: T[]): Promise<void> {
  memoryCache.set(collection, value);
  await AsyncStorage.setItem(KEY_PREFIX + collection, JSON.stringify(value));
  notify(collection);
}

/** Reads a whole collection, seeding it on first access. */
export async function getAll<T>(collection: string, seed: T[]): Promise<T[]> {
  return loadCollection(collection, seed);
}

/** Replaces a whole collection (used by mutation helpers below). */
export async function setAll<T>(collection: string, value: T[]): Promise<void> {
  await saveCollection(collection, value);
}

/** Upserts one record by `id`, seeding the collection first if needed. */
export async function upsert<T extends { id: string }>(
  collection: string,
  seed: T[],
  record: T
): Promise<T> {
  const all = await loadCollection(collection, seed);
  const idx = all.findIndex((r) => r.id === record.id);
  const next = idx === -1 ? [...all, record] : all.map((r, i) => (i === idx ? record : r));
  await saveCollection(collection, next);
  return record;
}

/** Updates one record by `id` via a partial patch. Throws if not found. */
export async function update<T extends { id: string }>(
  collection: string,
  seed: T[],
  id: string,
  patch: Partial<T>
): Promise<T> {
  const all = await loadCollection(collection, seed);
  const idx = all.findIndex((r) => r.id === id);
  if (idx === -1) throw new Error(`${collection}: record ${id} not found`);
  const updated = { ...all[idx], ...patch };
  const next = all.map((r, i) => (i === idx ? updated : r));
  await saveCollection(collection, next);
  return updated;
}

export async function remove(collection: string, seed: unknown[], id: string): Promise<void> {
  const all = await loadCollection(collection, seed);
  await saveCollection(
    collection,
    (all as { id: string }[]).filter((r) => r.id !== id)
  );
}

/** Wipes ALL local app data (used by a dev-only "reset demo data" action). */
export async function resetAll(): Promise<void> {
  const keys = await AsyncStorage.getAllKeys();
  const ours = keys.filter((k) => k.startsWith(KEY_PREFIX));
  await AsyncStorage.multiRemove(ours);
  memoryCache.clear();
  ours.forEach((k) => notify(k.slice(KEY_PREFIX.length)));
}

export function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
