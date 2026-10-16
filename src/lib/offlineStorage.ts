// IndexedDB cache is per signed-in employee; not encrypted and not a server authority.
const DB = 'kanthaaram-offline-v1';
const STORE = 'cache';
const openDB = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  const req = indexedDB.open(DB, 1);
  req.onupgradeneeded = () => {
    if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
  };
  req.onsuccess = () => resolve(req.result);
  req.onerror = () => reject(req.error);
});
const keyFor = (userId: string, kind: string) => `${userId}:${kind}`;
export async function readOfflineCache<T>(userId: string, kind: string): Promise<T | null> {
  try {
    const db = await openDB();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(keyFor(userId, kind));
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  } catch (error) { console.warn('Offline cache unavailable', error); return null; }
}
export async function writeOfflineCache<T>(userId: string, kind: string, value: T): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(value, keyFor(userId, kind));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (error) { console.warn('Offline draft could not be saved', error); }
}
export async function clearOfflineDraft(userId: string): Promise<void> {
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).delete(keyFor(userId, 'draft'));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (error) { console.warn('Offline draft cleanup failed', error); }
}
