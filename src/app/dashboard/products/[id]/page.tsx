
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppContext } from '@/components/app-provider';
import type { Product, Sale } from '@/lib/types';
import { ImageIcon, ShoppingBag, TrendingUp, DollarSign } from 'lucide-react';
import { CURRENCY_SYMBOLS } from '@/lib/utils';

export default function ProductProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { db, setGlobalLoading, isLoading } = useAppContext();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);

  useEffect(() => {
    if (!db || !id) return;

    const fetchProductData = async () => {
      setGlobalLoading(true);
      try {
        const productId = Array.isArray(id) ? id[0] : id;
        const productData = await db.getProductById(productId);
        if (!productData) {
          router.push('/dashboard'); // Not found
          return;
        }
        setProduct(productData);

        const allSales = await db.getAllSales();
        const productSales = allSales.filter(sale => 
          sale.items.some(item => item.productId === productId)
        );
        setSales(productSales);
      } catch (error) {
        console.error('Failed to fetch product data:', error);
      } finally {
        setGlobalLoading(false);
      }
    };

    fetchProductData();
  }, [db, id, router, setGlobalLoading]);

  const stats = useMemo(() => {
    if (!product) return { totalSold: 0, totalRevenue: 0, grossProfit: 0 };
    
    let totalSoldCount = 0;
    let totalRevenue = 0;
    let grossProfit = 0;

    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (item.productId === product.id) {
          totalSoldCount += item.quantity;
          totalRevenue += item.quantity * item.price;
          grossProfit += (item.quantity * item.price) - item.totalCost;
        }
      });
    });

    return { totalSold: totalSoldCount, totalRevenue, grossProfit };
  }, [product, sales]);

  if (isLoading || !product) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row items-center gap-6 p-4 bg-card border rounded-lg">
        {product.imageUrl ? (
            <Image src={product.imageUrl} alt={product.name} width={128} height={128} className="rounded-lg object-cover w-32 h-32" />
        ) : (
            <div className="flex items-center justify-center w-32 h-32 bg-muted rounded-lg shrink-0">
                <ImageIcon className="w-16 h-16 text-muted-foreground" />
            </div>
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground">بارکد: {product.id}</p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">تعداد کل فروش</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSold.toLocaleString('fa-IR')} عدد</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">درآمد ناخالص</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">سود ناخالص</CardTitle>
             <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.grossProfit.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}</div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
          <CardHeader>
              <CardTitle>تاریخچه فروش</CardTitle>
          </CardHeader>
          <CardContent>
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead>تاریخ</TableHead>
                          <TableHead>مشتری</TableHead>
                          <TableHead>تعداد</TableHead>
                          <TableHead>قیمت فروش (واحد)</TableHead>
                          <TableHead>جمع کل</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {sales.length > 0 ? sales.map(sale => {
                        const item = sale.items.find(i => i.productId === product.id);
                        if (!item) return null;
                        return (
                           <TableRow key={sale.id}>
                              <TableCell>{new Date(sale.date).toLocaleDateString('fa-IR')}</TableCell>
                              <TableCell>{sale.customerName || 'ناشناس'}</TableCell>
                              <TableCell>{item.quantity}</TableCell>
                              <TableCell>{item.price.toLocaleString('fa-IR')}</TableCell>
                              <TableCell>{(item.quantity * item.price).toLocaleString('fa-IR')}</TableCell>
                          </TableRow>
                        )
                      }) : (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center h-24">
                               هیچ سابقه فروشی برای این محصول یافت نشد.
                            </TableCell>
                        </TableRow>
                      )}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>

    </div>
  );
}
