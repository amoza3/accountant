'use client';

import type { Product, Sale, ExchangeRate, CostTitle } from '@/lib/types';

const DB_NAME = 'EasyStockDB';
const DB_VERSION = 2; // Incremented version
const PRODUCT_STORE = 'products';
const SALE_STORE = 'sales';
const SETTINGS_STORE = 'settings';
const COST_TITLES_STORE = 'costTitles';


let db: IDBDatabase;

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      return resolve(db);
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Error opening DB', request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(PRODUCT_STORE)) {
        db.createObjectStore(PRODUCT_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SALE_STORE)) {
        db.createObjectStore(SALE_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(COST_TITLES_STORE)) {
        db.createObjectStore(COST_TITLES_STORE, { keyPath: 'id' });
      }
    };
  });
};

const getStore = (storeName: string, mode: IDBTransactionMode) => {
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
};

// Product Operations
export const addProduct = (product: Product): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const store = getStore(PRODUCT_STORE, 'readwrite');
    const request = store.add(product);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getAllProducts = (): Promise<Product[]> => {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const store = getStore(PRODUCT_STORE, 'readonly');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const getProductById = (id: string): Promise<Product | undefined> => {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const store = getStore(PRODUCT_STORE, 'readonly');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};


export const updateProduct = (product: Product): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const store = getStore(PRODUCT_STORE, 'readwrite');
    const request = store.put(product);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const deleteProduct = (id: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const store = getStore(PRODUCT_STORE, 'readwrite');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Sale Operations
export const addSale = (sale: Sale): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      const db = await openDB();
      const tx = db.transaction([SALE_STORE, PRODUCT_STORE], 'readwrite');
      const saleStore = tx.objectStore(SALE_STORE);
      const productStore = tx.objectStore(PRODUCT_STORE);
  
      saleStore.add(sale).onerror = () => reject(tx.error);
  
      const productUpdates = sale.items.map(item => {
        return new Promise<void>((resolveUpdate, rejectUpdate) => {
          const getRequest = productStore.get(item.productId);
          getRequest.onsuccess = () => {
            const product = getRequest.result;
            if (product) {
              product.quantity -= item.quantity;
              productStore.put(product).onsuccess = () => resolveUpdate();
              productStore.put(product).onerror = () => rejectUpdate(tx.error);
            } else {
                // Product might have been deleted but was in a sale
                resolveUpdate();
            }
          };
          getRequest.onerror = () => rejectUpdate(tx.error);
        });
      });
  
      Promise.all(productUpdates)
        .then(() => {
          tx.oncomplete = () => resolve();
        })
        .catch(error => {
          tx.abort();
          reject(error);
        });
    });
  };
  
  export const getAllSales = (): Promise<Sale[]> => {
    return new Promise(async (resolve, reject) => {
      const db = await openDB();
      const store = getStore(SALE_STORE, 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result.sort((a,b) => b.id - a.id));
      request.onerror = () => reject(request.error);
    });
  };

// Settings Operations
const EXCHANGE_RATES_KEY = 'exchangeRates';
const COST_TITLES_KEY = 'costTitles';

export const getExchangeRates = (): Promise<ExchangeRate[]> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(SETTINGS_STORE, 'readonly');
        const request = store.get(EXCHANGE_RATES_KEY);
        request.onsuccess = () => {
            resolve(request.result?.value || [
                { currency: 'USD', rate: 50000 },
                { currency: 'AED', rate: 13600 },
                { currency: 'CNY', rate: 7000 },
            ]);
        };
        request.onerror = () => reject(request.error);
    });
};

export const saveExchangeRates = (rates: ExchangeRate[]): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(SETTINGS_STORE, 'readwrite');
        const request = store.put({ key: EXCHANGE_RATES_KEY, value: rates });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const getCostTitles = (): Promise<CostTitle[]> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(COST_TITLES_STORE, 'readonly');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

export const addCostTitle = (costTitle: CostTitle): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(COST_TITLES_STORE, 'readwrite');
        const request = store.add(costTitle);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

export const deleteCostTitle = (id: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(COST_TITLES_STORE, 'readwrite');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};
