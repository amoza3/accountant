export type Currency = 'TOMAN' | 'AED' | 'CNY' | 'USD';

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

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number; // Price at the time of sale
}

export interface Sale {
  id: number; // Timestamp of the sale
  items: SaleItem[];
  total: number;
  date: string;
}

export interface ExchangeRate {
  currency: Exclude<Currency, 'TOMAN'>;
  rate: number; // Rate to convert to TOMAN
}

export interface CostTitle {
  id: string;
  title: string;
}
