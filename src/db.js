// 폰 브라우저 안의 데이터베이스(IndexedDB)에 기록을 저장한다.
// 구글 백업(Firebase)은 이 저장소를 기준으로 클라우드와 주고받는다 (sync.js).

const DB_NAME = 'gagyebu';
const VERSION = 3;
// 기본 분류의 수정 시각. 새 폰에서 구글 백업을 처음 불러올 때 손대지 않은 기본 분류를 가려내는 표시.
export const SEED_TIME = 1;

export const STORES = ['transactions', 'categories', 'recurring', 'settings', 'memos', 'assets', 'snapshots'];

let dbPromise;

function openDb() {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        for (const name of STORES) {
          if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'id' });
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  return dbPromise;
}

export async function getAll(store) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(store).objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putMany(store, items) {
  if (!items.length) return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    for (const item of items) os.put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function removeMany(store, ids) {
  if (!ids.length) return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, 'readwrite');
    const os = tx.objectStore(store);
    for (const id of ids) os.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export function put(store, item) {
  return putMany(store, [item]);
}
