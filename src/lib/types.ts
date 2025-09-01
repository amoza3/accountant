export type Currency = 'TOMAN' | 'AED' | 'CNY' | 'USD';
export type PaymentMethod = 'CASH' | 'CARD' | 'ONLINE';

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
  totalCost: number; // Total cost at the time of sale
}

export interface Sale {
  id: number; // Timestamp of the sale
  items: SaleItem[];
  total: number;
  date: string;
  customerId?: string;
  customerName?: string;
  paymentMethod: PaymentMethod;
}

export interface ExchangeRate {
  currency: Exclude<Currency, 'TOMAN'>;
  rate: number; // Rate to convert to TOMAN
}

export interface CostTitle {
  id: string;
  title: string;
}
