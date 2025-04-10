export async function storeKeysInIndexedDB(aes_key) {
    const dbName = "access_keys";
    const storeName = "access_keys";

    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(storeName)) {
            db.createObjectStore(storeName, { keyPath: "id" });
        }
    };

    request.onsuccess = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(storeName)) {
            console.error(`Object store '${storeName}' still not found after upgrade. Deleting database and retrying...`);
            db.close();
            indexedDB.deleteDatabase(dbName); 
            setTimeout(() => storeKeysInIndexedDB(aes_key), 500);
            return;
        }

        const transaction = db.transaction([storeName], "readwrite");
        const store = transaction.objectStore(storeName);

        const encryptedData = { id: "keys", aes_key: aes_key };
        const putRequest = store.put(encryptedData);

        putRequest.onsuccess = () => {
            console.log("WEBSITE READY");
        };

        putRequest.onerror = (e) => {
            console.error("Error storing data in IndexedDB:", e.target.error);
        };

        transaction.oncomplete = () => {
            db.close();
        };
    };

    request.onerror = (event) => {
        console.error("Error opening IndexedDB:", event.target.error);
    };
}

export async function fetchEncryptionKey() {
    return new Promise((resolve, reject) => {
        const dbName = "access_keys";
        const storeName = "access_keys";

        const request = indexedDB.open(dbName, 1);

        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction([storeName], "readonly");
            const store = transaction.objectStore(storeName);
            const getRequest = store.get("keys");

            getRequest.onsuccess = () => {
                if (getRequest.result) {
                    resolve(getRequest.result.aes_key);
                } else {
                    console.warn("No encryption key found in IndexedDB.");
                    resolve(null);
                }
            };

            getRequest.onerror = () => {
                console.error("Error retrieving encryption key from IndexedDB.");
                reject("Error retrieving encryption key");
            };
        };

        request.onerror = (event) => {
            console.error("Error opening IndexedDB:", event.target.error);
            reject("Error opening IndexedDB");
        };
    });
}

export async function deleteKeysFromIndexedDB() {
    const dbName = "access_keys";

    const request = indexedDB.open(dbName, 1);

    request.onsuccess = (event) => {
        const db = event.target.result;
        db.close();
        indexedDB.deleteDatabase(dbName);
        console.log("Keys deleted from IndexedDB.");
    };

    request.onerror = (event) => {
        console.error("Error opening IndexedDB:", event.target.error);
    };
}