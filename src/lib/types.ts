export type Currency = 'TOMAN' | 'AED' | 'CNY' | 'USD';
export type PaymentMethod = 'CASH' | 'CARD' | 'ONLINE';
export type RecurringExpenseFrequency = 'monthly' | 'yearly';
export type AttachmentSource = 'sale' | 'expense' | 'payment';

export interface Attachment {
  id: string; // unique id
  sourceId: string; // id of sale, expense, or payment
  sourceType: AttachmentSource;
  date: string; // ISO string
  description?: string;
  receiptNumber?: string;
  receiptImage?: string; // URL to the image in storage
}

export interface ProductCost {
  id: string;
  title: string;
  amount: number;
  currency: Currency;
}

export interface Product {
  id: string; // Corresponds to the barcode
  name: string;
  price: number;
  quantity: number;
  lowStockThreshold: number;
  costs: ProductCost[];
  profitMargin: number; // Percentage
}

export interface Customer {
    id: string;
    name: string;
    phone?: string;
    address?: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number; // Price at the time of sale
  totalCost: number; // Total cost at the time of sale for the quantity
}

export interface Payment {
  id: string; // Unique ID for the payment
  amount: number;
  method: PaymentMethod;
  date: string; // ISO date string
  attachmentIds: string[];
}

export interface Sale {
  id: number; // Timestamp of the sale
  items: SaleItem[];
  total: number;
  paymentIds: string[];
  date: string;
  customerId?: string;
  customerName?: string;
}

export interface ExchangeRate {
  currency: Exclude<Currency, 'TOMAN'>;
  rate: number; // Rate to convert to TOMAN
}

export interface CostTitle {
  id: string;
  title: string;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  salary: number; // Monthly salary in TOMAN
  recurringExpenseId: string; // The ID of the corresponding recurring expense
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  date: string;
  attachmentIds: string[];
}

export interface RecurringExpense {
  id: string;
  title: string;
  amount: number;
  frequency: RecurringExpenseFrequency;
  startDate: string; // ISO date string
  lastAppliedDate?: string; // ISO date string
}

export interface FirebaseConfig {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
}
