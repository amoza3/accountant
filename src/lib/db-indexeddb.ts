
'use client';

import type { Product, Sale, ExchangeRate, CostTitle, Customer, Expense, RecurringExpense, Employee, Attachment, Payment, AppSettings, UserProfile } from '@/lib/types';
import { calculateTotalCostInToman } from '@/lib/utils';
import { addMonths, addYears, isBefore, startOfDay, isEqual, endOfMonth } from 'date-fns';
import type { DataProvider } from './dataprovider';


const DB_NAME = 'EasyStockDB';
const DB_VERSION = 12; // Incremented version
const PRODUCT_STORE = 'products';
const SALE_STORE = 'sales';
const SETTINGS_STORE = 'settings';
const COST_TITLES_STORE = 'costTitles';
const CUSTOMER_STORE = 'customers';
const EXPENSE_STORE = 'expenses';
const RECURRING_EXPENSE_STORE = 'recurringExpenses';
const EMPLOYEE_STORE = 'employees';
const ATTACHMENT_STORE = 'attachments';
const PAYMENT_STORE = 'payments';
const USER_PROFILE_STORE = 'userProfiles'; // New store for user profiles


let db: IDBDatabase;

const openDB = (): Promise<IDBDatabase> => {
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
      if (!db.objectStoreNames.contains(CUSTOMER_STORE)) {
        db.createObjectStore(CUSTOMER_STORE, { keyPath: 'id' });
      }
       if (!db.objectStoreNames.contains(EXPENSE_STORE)) {
        db.createObjectStore(EXPENSE_STORE, { keyPath: 'id' });
      }
       if (!db.objectStoreNames.contains(RECURRING_EXPENSE_STORE)) {
        db.createObjectStore(RECURRING_EXPENSE_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(EMPLOYEE_STORE)) {
        db.createObjectStore(EMPLOYEE_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(ATTACHMENT_STORE)) {
        const attachmentStore = db.createObjectStore(ATTACHMENT_STORE, { keyPath: 'id' });
        attachmentStore.createIndex('sourceId', 'sourceId', { unique: false });
      }
       if (!db.objectStoreNames.contains(PAYMENT_STORE)) {
        db.createObjectStore(PAYMENT_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(USER_PROFILE_STORE)) {
        db.createObjectStore(USER_PROFILE_STORE, { keyPath: 'id' });
      }
    };
  });
};

const getStore = (storeName: string, mode: IDBTransactionMode) => {
  const tx = db.transaction(storeName, mode);
  return tx.objectStore(storeName);
};

const getAttachmentsBySourceId = (sourceId: string): Promise<Attachment[]> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(ATTACHMENT_STORE, 'readonly');
        const index = store.index('sourceId');
        const request = index.getAll(sourceId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const addPayment = async (paymentData: Omit<Payment, 'id' | 'attachmentIds'>, attachments: Omit<Attachment, 'id'| 'sourceId' | 'sourceType'>[]): Promise<string> => {
    const db = await openDB();
    const tx = db.transaction([PAYMENT_STORE, ATTACHMENT_STORE], 'readwrite');
    const paymentStore = tx.objectStore(PAYMENT_STORE);
    const attachmentStore = tx.objectStore(ATTACHMENT_STORE);
    
    const paymentId = Date.now().toString() + Math.random();
    
    const attachmentIds = attachments.map(att => {
        const attachmentId = Date.now().toString() + Math.random();
        const newAttachment: Attachment = {
            ...att,
            id: attachmentId,
            sourceId: paymentId,
            sourceType: 'payment',
        };
        attachmentStore.add(newAttachment);
        return attachmentId;
    });

    const newPayment: Payment = {
        ...paymentData,
        id: paymentId,
        attachmentIds: attachmentIds,
    };

    paymentStore.add(newPayment);

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve(paymentId);
        tx.onerror = () => reject(tx.error);
    });
};

const getPaymentsByIds = (ids: string[]): Promise<Payment[]> => {
    return new Promise(async (resolve, reject) => {
        const validIds = ids?.filter(id => !!id) || [];
        if (validIds.length === 0) return resolve([]);

        const db = await openDB();
        const store = getStore(PAYMENT_STORE, 'readonly');
        const results: Payment[] = [];
        let count = 0;
        
        if (validIds.length === 0) {
            resolve([]);
            return;
        }

        validIds.forEach(id => {
            const request = store.get(id);
            request.onsuccess = () => {
                if (request.result) {
                    results.push(request.result);
                }
                count++;
                if (count === validIds.length) {
                    resolve(results);
                }
            };
            request.onerror = () => reject(request.error);
        });
    });
};

const getAllEmployees = (): Promise<Employee[]> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(EMPLOYEE_STORE, 'readonly');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const deleteEmployee = async (id: string): Promise<void> => {
    const db = await openDB();
    const tx = db.transaction([EMPLOYEE_STORE, RECURRING_EXPENSE_STORE], 'readwrite');
    const employeeStore = tx.objectStore(EMPLOYEE_STORE);
    const recurringExpenseStore = tx.objectStore(RECURRING_EXPENSE_STORE);
    
    const employeeRequest = employeeStore.get(id);

    employeeRequest.onsuccess = () => {
        const employee: Employee = employeeRequest.result;
        if (employee && employee.recurringExpenseId) {
            recurringExpenseStore.delete(employee.recurringExpenseId);
        }
        employeeStore.delete(id);
    };

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = (event) => reject((event.target as IDBRequest).error);
    });
};

const addRecurringExpense = (expense: RecurringExpense): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(RECURRING_EXPENSE_STORE, 'readwrite');
        const request = store.add(expense);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

const getAllRecurringExpenses = (): Promise<RecurringExpense[]> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(RECURRING_EXPENSE_STORE, 'readonly');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const deleteRecurringExpense = (id: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(RECURRING_EXPENSE_STORE, 'readwrite');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

const addExpense = (expense: Omit<Expense, 'id'|'attachmentIds'>, attachments: Omit<Attachment, 'id' | 'sourceId' | 'sourceType'>[]): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const tx = db.transaction([EXPENSE_STORE, ATTACHMENT_STORE], 'readwrite');
    const expenseStore = tx.objectStore(EXPENSE_STORE);
    const attachmentStore = tx.objectStore(ATTACHMENT_STORE);
    
    const expenseId = Date.now().toString();

    const attachmentIds = attachments.map(att => {
        const attachmentId = Date.now().toString() + Math.random();
        const newAttachment: Attachment = { ...att, id: attachmentId, sourceId: expenseId, sourceType: 'expense' };
        attachmentStore.add(newAttachment);
        return attachmentId;
    });

    const newExpense: Expense = { ...expense, id: expenseId, attachmentIds };
    expenseStore.add(newExpense);

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

const getAllExpenses = (): Promise<Expense[]> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(EXPENSE_STORE, 'readonly');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        request.onerror = () => reject(request.error);
    });
};

const deleteExpense = (id: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const attachments = await getAttachmentsBySourceId(id);
        const tx = db.transaction([EXPENSE_STORE, ATTACHMENT_STORE], 'readwrite');
        const expenseStore = tx.objectStore(EXPENSE_STORE);
        const attachmentStore = tx.objectStore(ATTACHMENT_STORE);
        
        attachments.forEach(att => attachmentStore.delete(att.id));
        expenseStore.delete(id);

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
};

const addCustomer = (customer: Omit<Customer, 'id'>): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(CUSTOMER_STORE, 'readwrite');
        const id = Date.now().toString();
        const request = store.add({ ...customer, id });
        request.onsuccess = () => resolve(id);
        request.onerror = () => reject(request.error);
    });
};

const getAllCustomers = (): Promise<Customer[]> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(CUSTOMER_STORE, 'readonly');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const getCustomerById = (id: string): Promise<Customer | undefined> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(CUSTOMER_STORE, 'readonly');
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
};

const updateCustomer = (customer: Customer): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(CUSTOMER_STORE, 'readwrite');
        const request = store.put(customer);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

const deleteCustomer = (id: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(CUSTOMER_STORE, 'readwrite');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
};

const addProduct = (product: Product): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const store = getStore(PRODUCT_STORE, 'readwrite');
    const request = store.add(product);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const getAllProducts = (): Promise<Product[]> => {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const store = getStore(PRODUCT_STORE, 'readonly');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getProductById = (id: string): Promise<Product | undefined> => {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const store = getStore(PRODUCT_STORE, 'readonly');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const updateProduct = (originalId: string, product: Product): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const db = await openDB();
    const tx = db.transaction(PRODUCT_STORE, 'readwrite');
    const store = tx.objectStore(PRODUCT_STORE);
    
    const finish = () => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    }

    if (originalId !== product.id) {
      const deleteRequest = store.delete(originalId);
      deleteRequest.onsuccess = () => {
        const addRequest = store.add(product);
        addRequest.onerror = () => reject(addRequest.error);
      };
      deleteRequest.onerror = () => reject(deleteRequest.error);
    } else {
      const request = store.put(product);
      request.onerror = () => reject(request.error);
    }
    finish();
  });
};

const EXCHANGE_RATES_KEY = 'exchangeRates';
const APP_SETTINGS_KEY = 'appSettings';

const getExchangeRates = (): Promise<ExchangeRate[]> => {
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

const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const IndexedDBDataProvider: DataProvider = {
  addProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct: (id: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      const db = await openDB();
      const store = getStore(PRODUCT_STORE, 'readwrite');
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  },
  addSale: async (saleData, newCustomerName) => {
    const db = await openDB();
    const tx = db.transaction([SALE_STORE, PRODUCT_STORE, CUSTOMER_STORE, SETTINGS_STORE], 'readwrite');
    const saleStore = tx.objectStore(SALE_STORE);
    const productStore = tx.objectStore(PRODUCT_STORE);
    const customerStore = tx.objectStore(CUSTOMER_STORE);

    let saleToSave: Sale = { ...saleData, id: Date.now(), items: [] };

    if (newCustomerName && !saleData.customerId) {
        const newCustomer: Customer = {
            id: Date.now().toString(),
            name: newCustomerName,
            phone: '',
            address: ''
        };
        const addCustomerReq = customerStore.add(newCustomer);
        await new Promise<void>((resolve, reject) => {
            addCustomerReq.onsuccess = () => {
                saleToSave.customerId = newCustomer.id;
                saleToSave.customerName = newCustomer.name;
                resolve();
            };
            addCustomerReq.onerror = () => reject(addCustomerReq.error);
        });
    }

    const rates = await getExchangeRates();

    const productUpdatePromises = saleData.items.map(item => {
        return new Promise<void>((resolveUpdate, rejectUpdate) => {
            const getRequest = productStore.get(item.productId);
            getRequest.onsuccess = () => {
                const product = getRequest.result as Product | undefined;
                if (product) {
                    const totalCostPerUnit = calculateTotalCostInToman(product.costs, rates);
                    
                    saleToSave.items.push({
                        ...item,
                        totalCost: totalCostPerUnit * item.quantity
                    });

                    product.quantity -= item.quantity;
                    const putRequest = productStore.put(product);
                    putRequest.onsuccess = () => resolveUpdate();
                    putRequest.onerror = () => rejectUpdate(putRequest.error);
                } else {
                     saleToSave.items.push({
                        ...item,
                        totalCost: 0
                    });
                    resolveUpdate();
                }
            };
            getRequest.onerror = () => rejectUpdate(getRequest.error);
        });
    });

    await Promise.all(productUpdatePromises);
    
    saleStore.add(saleToSave);
    return new Promise((resolve, reject) => {
         tx.oncomplete = () => resolve();
         tx.onerror = () => reject(tx.error);
    });
  },
  getAllSales: (): Promise<Sale[]> => {
    return new Promise(async (resolve, reject) => {
      const db = await openDB();
      const store = getStore(SALE_STORE, 'readonly');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result.sort((a,b) => b.id - a.id));
      request.onerror = () => reject(request.error);
    });
  },
  getExchangeRates,
  saveExchangeRates: (rates: ExchangeRate[]): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(SETTINGS_STORE, 'readwrite');
        const request = store.put({ key: EXCHANGE_RATES_KEY, value: rates });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
  },
  getCostTitles: (): Promise<CostTitle[]> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(COST_TITLES_STORE, 'readonly');
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
  },
  addCostTitle: (costTitle: CostTitle): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(COST_TITLES_STORE, 'readwrite');
        const request = store.add(costTitle);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
  },
  deleteCostTitle: (id: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(COST_TITLES_STORE, 'readwrite');
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
  },
  getAppSettings: (): Promise<AppSettings> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(SETTINGS_STORE, 'readonly');
        const request = store.get(APP_SETTINGS_KEY);
        request.onsuccess = () => {
            resolve(request.result?.value || { shopName: 'حسابدار آنلاین آموزا' });
        };
        request.onerror = () => reject(request.error);
    });
  },
  saveAppSettings: (settings: AppSettings): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(SETTINGS_STORE, 'readwrite');
        const request = store.put({ key: APP_SETTINGS_KEY, value: settings });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
  },
  addCustomer: (customer) => addCustomer(customer).then(() => customer.id),
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
  addExpense,
  updateExpense: async (expense, newAttachments, deletedAttachmentIds) => {
    const db = await openDB();
    const tx = db.transaction([EXPENSE_STORE, ATTACHMENT_STORE], 'readwrite');
    const expenseStore = tx.objectStore(EXPENSE_STORE);
    const attachmentStore = tx.objectStore(ATTACHMENT_STORE);

    // Delete attachments
    deletedAttachmentIds.forEach(id => attachmentStore.delete(id));

    // Add new attachments
    const newAttachmentIds = newAttachments.map(att => {
        const attachmentId = Date.now().toString() + Math.random();
        const newAttachment: Attachment = { ...att, id: attachmentId, sourceId: expense.id, sourceType: 'expense' };
        attachmentStore.add(newAttachment);
        return attachmentId;
    });

    const existingAttachmentIds = (expense.attachmentIds || [])
      .filter(id => !deletedAttachmentIds.includes(id));
      
    const finalAttachmentIds = existingAttachmentIds.concat(newAttachmentIds);

    const updatedExpense: Expense = { ...expense, attachmentIds: finalAttachmentIds };
    expenseStore.put(updatedExpense);
    
    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
  },
  getAllExpenses,
  deleteExpense,
  addRecurringExpense,
  getAllRecurringExpenses,
  deleteRecurringExpense,
  applyRecurringExpenses: async (): Promise<number> => {
    const db = await openDB();
    const allRecurring = await getAllRecurringExpenses();
    const today = startOfDay(new Date());
    let expensesAddedCount = 0;

    for (const re of allRecurring) {
        let lastApplied = re.lastAppliedDate ? startOfDay(new Date(re.lastAppliedDate)) : startOfDay(new Date(re.startDate));
        let nextDueDate: Date;
        
        while (true) {
             if (re.frequency === 'monthly') {
                nextDueDate = addMonths(lastApplied, 1);
            } else {
                nextDueDate = addYears(lastApplied, 1);
            }
            
            if (isBefore(nextDueDate, today) || isEqual(nextDueDate, today)) {
                if(re.lastAppliedDate && startOfDay(new Date(re.lastAppliedDate)) >= nextDueDate) {
                     lastApplied = nextDueDate;
                     continue;
                }
                const newExpense: Omit<Expense, 'id'|'attachmentIds'> = {
                    title: re.title,
                    amount: re.amount,
                    date: nextDueDate.toISOString(),
                };
                await addExpense(newExpense, []);
                expensesAddedCount++;

                const tx = db.transaction(RECURRING_EXPENSE_STORE, 'readwrite');
                const store = tx.objectStore(RECURRING_EXPENSE_STORE);
                store.put({ ...re, lastAppliedDate: nextDueDate.toISOString() });
                
                await new Promise<void>(res => { tx.oncomplete = () => res(); });
                lastApplied = nextDueDate;
            } else {
                break;
            }
        }
    }
    return expensesAddedCount;
  },
  addEmployee: async (employeeData) => {
    const db = await openDB();
    const tx = db.transaction([EMPLOYEE_STORE, RECURRING_EXPENSE_STORE], 'readwrite');
    const employeeStore = tx.objectStore(EMPLOYEE_STORE);
    const recurringExpenseStore = tx.objectStore(RECURRING_EXPENSE_STORE);
    
    const employeeId = Date.now().toString();
    const recurringExpenseId = `salary-${employeeId}`;

    const salaryExpense: RecurringExpense = {
        id: recurringExpenseId,
        title: `حقوق ${employeeData.name}`,
        amount: employeeData.salary,
        frequency: 'monthly',
        startDate: endOfMonth(new Date()).toISOString(),
    };

    const newEmployee: Employee = {
        id: employeeId,
        ...employeeData,
        recurringExpenseId,
    };

    employeeStore.add(newEmployee);
    recurringExpenseStore.add(salaryExpense);

    return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
    });
  },
  getAllEmployees,
  deleteEmployee,
  getAttachmentsBySourceId,
  addPayment,
  getPaymentsByIds,
  uploadFile: async (file) => {
    return fileToBase64(file);
  },
  getUserProfile: (userId: string): Promise<UserProfile | null> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(USER_PROFILE_STORE, 'readonly');
        const request = store.get(userId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
  },
  saveUserProfile: (profile: UserProfile): Promise<void> => {
    return new Promise(async (resolve, reject) => {
        const db = await openDB();
        const store = getStore(USER_PROFILE_STORE, 'readwrite');
        const request = store.put(profile);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
  },
  getAllUsers: async (): Promise<UserProfile[]> => {
    return Promise.resolve([]);
  },
};
