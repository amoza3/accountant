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

function EditProductForm({
  product,
  onSuccess,
  exchangeRates,
}: {
  product: Product;
  onSuccess: () => void;
  exchangeRates: ExchangeRate[];
}) {
  const { toast } = useToast();
  const [name, setName] = useState(product.name);
  const [quantity, setQuantity] = useState(product.quantity);
  const [lowStockThreshold, setLowStockThreshold] = useState(product.lowStockThreshold);
  const [profitMargin, setProfitMargin] = useState(product.profitMargin);
  const [barcode, setBarcode] = useState(product.id);

  const totalCost = useMemo(() => calculateTotalCostInToman(product.costs, exchangeRates)
  , [product.costs, exchangeRates]);

  const sellingPrice = useMemo(() => {
    const profit = totalCost * (profitMargin / 100);
    return totalCost + profit;
  }, [totalCost, profitMargin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProduct(product.id, { 
        ...product, 
        id: barcode,
        name, 
        quantity, 
        lowStockThreshold,
        profitMargin,
        price: sellingPrice
      });
      toast({
        title: 'محصول ویرایش شد',
        description: `${name} با موفقیت به‌روزرسانی شد.`,
      });
      onSuccess();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'ویرایش محصول ناموفق بود.',
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
       <div>
        <Label htmlFor="edit-barcode">بارکد (شناسه)</Label>
        <Input id="edit-barcode" value={barcode} onChange={(e) => setBarcode(e.target.value)} required />
      </div>
      <div>
        <Label htmlFor="edit-name">نام محصول</Label>
        <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
            <Label htmlFor="edit-quantity">تعداد</Label>
            <Input id="edit-quantity" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} required />
        </div>
        <div>
            <Label htmlFor="edit-lowStockThreshold">آستانه هشدار موجودی</Label>
            <Input id="edit-lowStockThreshold" type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(Number(e.target.value))} required />
        </div>
      </div>
      <div>
        <Label>هزینه تمام‌شده</Label>
        <p className="font-bold text-lg">{totalCost.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}</p>
      </div>
       <div>
        <Label htmlFor="edit-profitMargin">حاشیه سود (%)</Label>
        <Input id="edit-profitMargin" type="number" value={profitMargin} onChange={(e) => setProfitMargin(Number(e.target.value))} required />
      </div>
       <div>
        <Label>قیمت نهایی فروش</Label>
        <p className="font-bold text-xl">{sellingPrice.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}</p>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">لغو</Button>
        </DialogClose>
        <Button type="submit">ذخیره تغییرات</Button>
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
        <CardDescription>بارکد: {product.id}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
            <div className="font-semibold text-2xl">{product.price.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}</div>
            <p className="text-xs text-muted-foreground">قیمت فروش</p>
        </div>
        <Separator/>
        <div className="grid gap-2">
            <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">هزینه تمام‌شده</span>
                <span className="font-medium">{totalCost.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">حاشیه سود</span>
                <span className="font-medium">{product.profitMargin}%</span>
            </div>
             <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">موجودی</span>
                 <div className="flex items-center gap-2">
                    <span className="font-medium">{product.quantity}</span>
                    {isLowStock ? (
                        <Badge variant="destructive">موجودی کم</Badge>
                    ) : (
                        <Badge className="bg-accent text-accent-foreground">موجود</Badge>
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
              <DialogTitle>ویرایش محصول</DialogTitle>
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
              <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
              <AlertDialogDescription>
                این عملیات غیرقابل بازگشت است. محصول '{product.name}' برای همیشه حذف خواهد شد.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>لغو</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(product.id)}>
                حذف
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

  const fetchProducts = async () => {
    try {
      const [allProducts, rates] = await Promise.all([getAllProducts(), getExchangeRates()]);
      setProducts(allProducts.sort((a, b) => a.name.localeCompare(b.name)));
      setExchangeRates(rates);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'بارگذاری محصولات از پایگاه داده ناموفق بود.',
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
        title: 'محصول حذف شد',
        description: 'محصول با موفقیت حذف شد.',
      });
      fetchProducts();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'حذف محصول ناموفق بود.',
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
        <h1 className="text-2xl font-bold">موجودی کالا</h1>
        <div className="flex gap-2">
           <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            خروجی CSV
          </Button>
          <Button asChild>
            <Link href={`/dashboard/add-product`}>
              <PlusCircle className="mr-2 h-4 w-4" />
              افزودن محصول
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Input
          placeholder="جستجوی محصول با نام یا بارکد..."
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
              محصولی یافت نشد
            </h3>
            <p className="text-sm text-muted-foreground">
              برای شروع، اولین محصول خود را اضافه کنید.
            </p>
            <Button className="mt-4" asChild>
              <Link href={`/dashboard/add-product`}>افزودن محصول</Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
