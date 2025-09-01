import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Product, ExchangeRate, ProductCost, Currency } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calculateTotalCostInToman(costs: ProductCost[], rates: ExchangeRate[]): number {
  return costs.reduce((total, cost) => {
    if (cost.currency === 'TOMAN') {
      return total + cost.amount;
    }
    const rate = rates.find(r => r.currency === cost.currency)?.rate || 0;
    return total + (cost.amount * rate);
  }, 0);
};

export function calculateSellingPrice(product: Product, rates: ExchangeRate[]): number {
  const totalCost = calculateTotalCostInToman(product.costs, rates);
  const profit = totalCost * (product.profitMargin / 100);
  return totalCost + profit;
}

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  TOMAN: 'تومان',
  USD: '$',
  AED: 'درهم',
  CNY: '¥',
};
