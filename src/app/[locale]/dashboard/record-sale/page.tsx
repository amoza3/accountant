'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Barcode, Trash2, ShoppingCart, MinusCircle, PlusCircle } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { getProductById, addSale } from '@/lib/db';
import type { SaleItem } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useI18n, useCurrentLocale } from '@/lib/i18n/client';

export default function RecordSalePage() {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [barcode, setBarcode] = useState('');
  const barcodeRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useI18n();
  const locale = useCurrentLocale();

  useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  const handleBarcodeSubmit = async () => {
    if (!barcode) return;

    try {
      const product = await getProductById(barcode);
      if (product) {
        if(product.quantity <= 0) {
            toast({
                variant: 'destructive',
                title: t('record_sale.toasts.out_of_stock.title'),
                description: t('record_sale.toasts.out_of_stock.description', { name: product.name }),
            });
            return;
        }

        setCart((prevCart) => {
          const existingItem = prevCart.find((item) => item.productId === product.id);
          if (existingItem) {
            if (existingItem.quantity >= product.quantity) {
                toast({
                    variant: 'destructive',
                    title: t('record_sale.toasts.stock_limit_reached.title'),
                    description: t('record_sale.toasts.stock_limit_reached.description', { name: product.name }),
                });
                return prevCart;
            }
            return prevCart.map((item) =>
              item.productId === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
          } else {
            return [
              ...prevCart,
              {
                productId: product.id,
                productName: product.name,
                quantity: 1,
                price: product.price,
              },
            ];
          }
        });
      } else {
        toast({
          variant: 'destructive',
          title: t('record_sale.toasts.product_not_found.title'),
          description: t('record_sale.toasts.product_not_found.description', { barcode }),
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('record_sale.toasts.db_error.title'),
        description: t('record_sale.toasts.db_error.description'),
      });
    } finally {
      setBarcode('');
      barcodeRef.current?.focus();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeSubmit();
    }
  };

  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
      return;
    }

    setCart(cart.map(item => item.productId === productId ? { ...item, quantity: newQuantity } : item));
  };

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const completeSale = async () => {
    if (cart.length === 0) {
      toast({
        variant: 'destructive',
        title: t('record_sale.toasts.empty_cart.title'),
        description: t('record_sale.toasts.empty_cart.description'),
      });
      return;
    }

    try {
      await addSale({
        id: Date.now(),
        items: cart,
        total,
        date: new Date().toISOString(),
      });
      toast({
        title: t('record_sale.toasts.sale_complete.title'),
        description: t('record_sale.toasts.sale_complete.description', { total: total.toFixed(2) }),
        className: 'bg-accent text-accent-foreground border-accent',
      });
      setCart([]);
      router.push(`/${locale}/dashboard`);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('record_sale.toasts.error.title'),
        description: t('record_sale.toasts.error.description'),
      });
    }
  };


  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('record_sale.title')}</CardTitle>
            <CardDescription>{t('record_sale.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                ref={barcodeRef}
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('record_sale.barcode_placeholder')}
                className="pl-10"
              />
            </div>
            <div className="border rounded-md min-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('record_sale.cart_table.product')}</TableHead>
                    <TableHead className="text-center">{t('record_sale.cart_table.quantity')}</TableHead>
                    <TableHead className="text-right">{t('record_sale.cart_table.price')}</TableHead>
                    <TableHead className="text-right">{t('record_sale.cart_table.total')}</TableHead>
                    <TableHead className="text-right">{t('record_sale.cart_table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.length > 0 ? (
                    cart.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="text-center">
                          <div className='flex items-center justify-center gap-2'>
                            <Button size="icon" variant="ghost" onClick={() => updateQuantity(item.productId, item.quantity - 1)}><MinusCircle className="h-4 w-4" /></Button>
                            {item.quantity}
                            <Button size="icon" variant="ghost" onClick={() => updateQuantity(item.productId, item.quantity + 1)}><PlusCircle className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${(item.price * item.quantity).toFixed(2)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="destructive" size="icon" onClick={() => updateQuantity(item.productId, 0)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">
                        {t('record_sale.cart_table.empty')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-1">
        <Card className="sticky top-8">
          <CardHeader>
            <CardTitle>{t('record_sale.summary.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">{t('record_sale.summary.items')}</span>
              <span>{cart.reduce((acc, item) => acc + item.quantity, 0)}</span>
            </div>
             <div className="flex justify-between items-center text-2xl font-bold">
              <span>{t('record_sale.summary.total')}</span>
              <Badge className="text-2xl" variant="secondary">${total.toFixed(2)}</Badge>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg" onClick={completeSale}>
              <ShoppingCart className="mr-2 h-5 w-5" /> {t('record_sale.summary.complete_sale_button')}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
