import { openDB } from 'idb';

export const initDB = async () => {
    return openDB('CDManagerDB', 1, {
        upgrade(db) {
            // Store for caching downloaded CDs
            if (!db.objectStoreNames.contains('cds')) {
                db.createObjectStore('cds', { keyPath: 'id' });
            }
            // Store for holding offline mutations (our "Outbox")
            if (!db.objectStoreNames.contains('syncQueue')) {
                db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
            }
        },
    });
};

export const saveToCache = async (cds) => {
    const db = await initDB();
    const tx = db.transaction('cds', 'readwrite');
    cds.forEach(cd => tx.store.put(cd));
    await tx.done;
};

export const getCachedCDs = async () => {
    const db = await initDB();
    return db.getAll('cds');
};

export const addToSyncQueue = async (operation) => {
    const db = await initDB();
    await db.add('syncQueue', operation);
};