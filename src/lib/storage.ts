import type { Job } from './contracts';
export type Take = { original: Blob; normalized: Blob; name: string; duration: number; width: number; height: number; trimmed: boolean };
export type Session = { take: Take | null; job: Job | null };
function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('cinema-session', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('session');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function loadSession(): Promise<Session | undefined> {
  const database = await db();
  return new Promise((resolve, reject) => {
    const request = database.transaction('session').objectStore('session').get('current');
    request.onsuccess = () => { database.close(); resolve(request.result); };
    request.onerror = () => { database.close(); reject(request.error); };
  });
}
export async function saveSession(value: Session) {
  const database = await db();
  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction('session', 'readwrite');
    transaction.objectStore('session').put(value, 'current');
    transaction.oncomplete = () => { database.close(); resolve(); };
    transaction.onerror = () => { database.close(); reject(transaction.error); };
  });
}
