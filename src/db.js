// 폰 브라우저 안의 데이터베이스(IndexedDB)에 기록을 저장한다.
// 구글 백업(Firebase)은 이 저장소를 기준으로 클라우드와 주고받는다 (sync.js).

const DB_NAME = 'gagyebu';
const VERSION = 3;
// 기본 분류의 수정 시각. 새 폰에서 구글 백업을 처음 불러올 때 손대지 않은 기본 분류를 가려내는 표시.
export const SEED_TIME = 1;

export const STORES = ['transactions', 'categories', 'recurring', 'settings', 'memos', 'assets', 'snapshots'];

let dbPromise;

// 예전 버전 앱이 다른 창(크롬 탭, 뒤에 떠 있는 앱)에서 저장소를 붙잡고 있으면 새 버전이 열리지 못한다.
// 그때 화면에 안내를 띄우도록 알린다. 예전 창이 닫히면 저절로 이어서 열린다.
let blockedListener = null;
export function onDbBlocked(fn) {
  blockedListener = fn;
}

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
      req.onblocked = () => blockedListener?.();
      req.onsuccess = () => {
        const db = req.result;
        // 다음에 더 새 버전이 열리려 하면 이 창은 저장소를 내려놓고 새로 고친다 (서로 막지 않게)
        db.onversionchange = () => {
          db.close();
          location.reload();
        };
        resolve(db);
      };
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
