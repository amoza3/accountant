'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { PlusCircle, Download, Trash2, Pencil } from 'lucide-react';
import {
  getAllProducts,
  deleteProduct,
  updateProduct,
  getExchangeRates,
} from '@/lib/db';
import type { Product, ExchangeRate } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { calculateTotalCostInToman, CURRENCY_SYMBOLS } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useI18n, useCurrentLocale } from '@/lib/i18n/client';

function EditProductForm({
  product,
  onSuccess,
  exchangeRates,
}: {
  product: Product;
  onSuccess: () => void;
  exchangeRates: ExchangeRate[];
}) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [name, setName] = useState(product.name);
  const [quantity, setQuantity] = useState(product.quantity);
  const [lowStockThreshold, setLowStockThreshold] = useState(product.lowStockThreshold);
  const [profitMargin, setProfitMargin] = useState(product.profitMargin);

  const totalCost = useMemo(() => calculateTotalCostInToman(product.costs, exchangeRates)
  , [product.costs, exchangeRates]);

  const sellingPrice = useMemo(() => {
    const profit = totalCost * (profitMargin / 100);
    return totalCost + profit;
  }, [totalCost, profitMargin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProduct({ 
        ...product, 
        name, 
        quantity, 
        lowStockThreshold,
        profitMargin,
        price: sellingPrice
      });
      toast({
        title: t('inventory.edit_product.toasts.success.title'),
        description: t('inventory.edit_product.toasts.success.description', { name }),
      });
      onSuccess();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('inventory.edit_product.toasts.error.title'),
        description: t('inventory.edit_product.toasts.error.description'),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="edit-name">{t('inventory.edit_product.form.product_name')}</Label>
        <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
            <Label htmlFor="edit-quantity">{t('inventory.edit_product.form.quantity')}</Label>
            <Input id="edit-quantity" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required />
        </div>
        <div>
            <Label htmlFor="edit-lowStockThreshold">{t('inventory.edit_product.form.low_stock_threshold')}</Label>
            <Input id="edit-lowStockThreshold" type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(Number(e.target.value))} required />
        </div>
      </div>
      <div>
        <Label>{t('inventory.edit_product.form.total_cost')}</Label>
        <p className="font-bold text-lg">{totalCost.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}</p>
      </div>
       <div>
        <Label htmlFor="edit-profitMargin">{t('inventory.edit_product.form.profit_margin')}</Label>
        <Input id="edit-profitMargin" type="number" value={profitMargin} onChange={(e) => setProfitMargin(Number(e.target.value))} required />
      </div>
       <div>
        <Label>{t('inventory.edit_product.form.final_selling_price')}</Label>
        <p className="font-bold text-xl">{sellingPrice.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}</p>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">{t('common.cancel')}</Button>
        </DialogClose>
        <Button type="submit">{t('common.save_changes')}</Button>
      </DialogFooter>
    </form>
  );
}

function ProductCard({
  product,
  onDelete,
  onUpdate,
  exchangeRates
}: {
  product: Product;
  onDelete: (id: string) => void;
  onUpdate: () => void;
  exchangeRates: ExchangeRate[];
}) {
  const { t } = useI18n();
  const isLowStock = product.quantity <= product.lowStockThreshold;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const totalCost = useMemo(() => 
    calculateTotalCostInToman(product.costs, exchangeRates),
    [product.costs, exchangeRates]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
        <CardDescription>{t('inventory.product_card.barcode')}: {product.id}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
            <div className="font-semibold text-2xl">{product.price.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}</div>
            <p className="text-xs text-muted-foreground">{t('inventory.product_card.selling_price')}</p>
        </div>
        <Separator/>
        <div className="grid gap-2">
            <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{t('inventory.product_card.total_cost')}</span>
                <span className="font-medium">{totalCost.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{t('inventory.product_card.profit_margin')}</span>
                <span className="font-medium">{product.profitMargin}%</span>
            </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">{t('inventory.product_card.stock')}</span>
                 <div className="flex items-center gap-2">
                    <span className="font-medium">{product.quantity}</span>
                    {isLowStock ? (
                        <Badge variant="destructive">{t('inventory.product_card.low_stock')}</Badge>
                    ) : (
                        <Badge className="bg-accent text-accent-foreground">{t('inventory.product_card.in_stock')}</Badge>
                    )}
                </div>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
         <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Pencil className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('inventory.edit_product.title')}</DialogTitle>
            </DialogHeader>
            <EditProductForm product={product} exchangeRates={exchangeRates} onSuccess={() => {
              onUpdate();
              setIsEditDialogOpen(false);
            }} />
          </DialogContent>
        </Dialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('common.are_you_sure')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('inventory.delete_dialog.description', { name: product.name })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(product.id)}>
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
}

export default function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const { toast } = useToast();
  const { t } = useI18n();
  const locale = useCurrentLocale();

  const fetchProducts = async () => {
    try {
      const [allProducts, rates] = await Promise.all([getAllProducts(), getExchangeRates()]);
      setProducts(allProducts.sort((a, b) => a.name.localeCompare(b.name)));
      setExchangeRates(rates);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('inventory.toasts.load_error.title'),
        description: t('inventory.toasts.load_error.description'),
      });
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      toast({
        title: t('inventory.toasts.delete_success.title'),
        description: t('inventory.toasts.delete_success.description'),
      });
      fetchProducts();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('inventory.toasts.delete_error.title'),
        description: t('inventory.toasts.delete_error.description'),
      });
    }
  };

  const exportToCSV = () => {
    const headers = ['ID', 'Name', 'Selling Price (TOMAN)', 'Quantity', 'Low Stock Threshold', 'Profit Margin (%)', 'Total Cost (TOMAN)'];
    const rows = products.map(p => {
        const totalCost = calculateTotalCostInToman(p.costs, exchangeRates);
        return [p.id, p.name, p.price, p.quantity, p.lowStockThreshold, p.profitMargin, totalCost];
    });

    let csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "inventory.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredProducts = useMemo(() => {
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('inventory.title')}</h1>
        <div className="flex gap-2">
           <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t('inventory.export_csv')}
          </Button>
          <Button asChild>
            <Link href={`/${locale}/dashboard/add-product`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('inventory.add_product')}
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Input
          placeholder={t('inventory.search_placeholder')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {filteredProducts.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onDelete={handleDelete}
              onUpdate={fetchProducts}
              exchangeRates={exchangeRates}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
          <div className="flex flex-col items-center gap-1 text-center">
            <h3 className="text-2xl font-bold tracking-tight">
              {t('inventory.no_products.title')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t('inventory.no_products.description')}
            </p>
            <Button className="mt-4" asChild>
              <Link href={`/${locale}/dashboard/add-product`}>{t('inventory.no_products.add_product_button')}</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
