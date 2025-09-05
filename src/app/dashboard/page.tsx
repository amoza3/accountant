
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, Download, Trash2, Pencil, BarChart2 } from 'lucide-react';
import type { Product, ExchangeRate, CostTitle } from '@/lib/types';
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
import { calculateTotalCostInToman, CURRENCY_SYMBOLS, calculateSellingPrice } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppContext } from '@/components/app-provider';
import { Skeleton } from '@/components/ui/skeleton';

const productSchema = z.object({
  id: z.string().min(1, 'بارکد الزامی است'),
  name: z.string().min(1, 'نام محصول الزامی است'),
  quantity: z.coerce.number().min(0, 'تعداد نمی‌تواند منفی باشد'),
  lowStockThreshold: z.coerce.number().min(0, 'آستانه نمی‌تواند منفی باشد'),
  profitMargin: z.coerce.number().min(0, 'حاشیه سود نمی‌تواند منفی باشد'),
   imageUrl: z.string().optional(),
  costs: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      amount: z.coerce.number().min(0, 'مبلغ نمی‌تواند منفی باشد'),
      currency: z.enum(['TOMAN', 'USD', 'AED', 'CNY']),
    })
  ),
});


function EditProductForm({
  product,
  onSuccess,
  exchangeRates,
  costTitles
}: {
  product: Product;
  onSuccess: () => void;
  exchangeRates: ExchangeRate[];
  costTitles: CostTitle[];
}) {
  const { toast } = useToast();
  const { db } = useAppContext();
  const [calculatedPrice, setCalculatedPrice] = useState(product.price);
  
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      ...product,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "costs",
  });

  const watchedValues = form.watch();

  useEffect(() => {
    const productData = {
        ...watchedValues,
        price: 0
    } as Product
    const newPrice = calculateSellingPrice(productData, exchangeRates);
    setCalculatedPrice(newPrice);
  }, [watchedValues, exchangeRates]);


  const handleSubmit = async (data: z.infer<typeof productSchema>) => {
    if(!db) return;
    try {
      const finalPrice = calculateSellingPrice({...data, price: 0} as Product, exchangeRates);
      await db.updateProduct(product.id, { 
        ...data,
        price: finalPrice
      });
      toast({
        title: 'محصول ویرایش شد',
        description: `'${data.name}' با موفقیت به‌روزرسانی شد.`,
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
    <Form {...form}>
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-4">
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>نام محصول</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>تعداد</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lowStockThreshold"
          render={({ field }) => (
            <FormItem>
              <FormLabel>آستانه هشدار موجودی</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator />

        <div className="space-y-4">
            <h3 className="text-lg font-medium">هزینه‌های محصول</h3>
            {fields.map((field, index) => (
                <div key={field.id} className="flex items-end gap-2 p-3 border rounded-md">
                    <FormField
                    control={form.control}
                    name={`costs.${index}.title`}
                    render={({ field: selectField }) => (
                        <FormItem className="w-1/3">
                            <FormLabel>عنوان هزینه</FormLabel>
                            <Select onValueChange={selectField.onChange} defaultValue={selectField.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="یک عنوان انتخاب کنید" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                {costTitles.map(ct => (
                                    <SelectItem key={ct.id} value={ct.title}>{ct.title}</SelectItem>
                                ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name={`costs.${index}.amount`}
                    render={({ field }) => (
                        <FormItem className="w-1/3">
                        <FormLabel>مبلغ</FormLabel>
                        <FormControl><Input type="number" placeholder="100" {...field} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                      control={form.control}
                      name={`costs.${index}.currency`}
                      render={({ field }) => (
                        <FormItem className="w-1/3">
                          <FormLabel>ارز</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="ارز را انتخاب کنید" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(CURRENCY_SYMBOLS).map(([code, symbol]) => (
                                <SelectItem key={code} value={code}>{code} ({symbol})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            ))}
            <Button
                type="button"
                variant="outline"
                onClick={() => append({ id: Date.now().toString(), title: costTitles[0]?.title || '', amount: 0, currency: 'TOMAN' })}
            >
                <PlusCircle className="mr-2 h-4 w-4" /> افزودن هزینه
            </Button>
        </div>

      <Separator />

      <FormField
        control={form.control}
        name="profitMargin"
        render={({ field }) => (
          <FormItem>
            <FormLabel>حاشیه سود (%)</FormLabel>
            <FormControl>
              <Input type="number" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

       <div className="p-4 border rounded-md bg-muted">
            <p className="text-sm text-muted-foreground">قیمت فروش محاسبه‌شده</p>
            <p className="text-2xl font-bold">
                {calculatedPrice.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}
            </p>
        </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">لغو</Button>
        </DialogClose>
        <Button type="submit">ذخیره تغییرات</Button>
      </DialogFooter>
    </form>
    </Form>
  );
}

function ProductCard({
  product,
  onDelete,
  onUpdate,
  exchangeRates,
  costTitles,
}: {
  product: Product;
  onDelete: (id: string) => void;
  onUpdate: () => void;
  exchangeRates: ExchangeRate[];
  costTitles: CostTitle[];
}) {
  const isLowStock = product.quantity <= product.lowStockThreshold;
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const totalCost = useMemo(() => 
    calculateTotalCostInToman(product.costs, exchangeRates),
    [product.costs, exchangeRates]
  );

  return (
    <Card className="flex flex-col">
       {product.imageUrl ? (
        <div className="relative w-full h-40">
           <Image src={product.imageUrl} alt={product.name} layout="fill" className="object-cover rounded-t-lg" />
        </div>
      ) : (
         <div className="flex items-center justify-center h-40 bg-muted rounded-t-lg">
          <ImageIcon className="w-12 h-12 text-muted-foreground" />
        </div>
      )}
      <CardHeader>
        <CardTitle>{product.name}</CardTitle>
        <CardDescription>بارکد: {product.id}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 flex-grow">
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
                        <Badge variant="secondary">موجود</Badge>
                    )}
                </div>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
         <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/products/${product.id}`}>
              <BarChart2 className="h-4 w-4" />
            </Link>
          </Button>
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
             <EditProductForm 
                product={product} 
                exchangeRates={exchangeRates} 
                costTitles={costTitles}
                onSuccess={() => {
                    onUpdate();
                    setIsEditDialogOpen(false);
                }} 
            />
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
  const { db, isLoading, setGlobalLoading } = useAppContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [costTitles, setCostTitles] = useState<CostTitle[]>([]);
  const { toast } = useToast();
  
  const fetchProducts = async () => {
    if (!db) return;
    setGlobalLoading(true);
    try {
      const [allProducts, rates, titles] = await Promise.all([
        db.getAllProducts(),
        db.getExchangeRates(),
        db.getCostTitles(),
      ]);
      setProducts(allProducts.sort((a, b) => a.name.localeCompare(b.name)));
      setExchangeRates(rates);
      setCostTitles(titles);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطا در بارگذاری',
        description: 'بارگذاری محصولات از پایگاه داده ناموفق بود.',
      });
    } finally {
      setGlobalLoading(false);
    }
  };

  useEffect(() => {
    if (db) {
        const checkRecurringExpenses = async () => {
            try {
                const addedCount = await db.applyRecurringExpenses();
                if (addedCount > 0) {
                    toast({
                        title: 'هزینه‌های دوره‌ای ثبت شد',
                        description: `${addedCount} هزینه دوره‌ای به طور خودکار به لیست مخارج اضافه شد.`,
                    });
                }
            } catch(error) {
                 console.error("Failed to apply recurring expenses:", error);
                 toast({
                    variant: 'destructive',
                    title: 'خطا در ثبت خودکار هزینه‌ها',
                    description: 'سیستم نتوانست هزینه‌های دوره‌ای را بررسی و ثبت کند.',
                });
            }
        };
        
        checkRecurringExpenses().then(() => fetchProducts());
    }
  }, [db]);

  const handleDelete = async (id: string) => {
    if (!db) return;
    try {
      await db.deleteProduct(id);
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

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-96 w-full" />)}
      </div>
    )
  }

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
              costTitles={costTitles}
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
