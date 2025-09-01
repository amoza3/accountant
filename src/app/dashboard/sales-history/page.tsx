'use client';

import { useState, useEffect } from 'react';
import { getAllSales } from '@/lib/db';
import type { Sale, PaymentMethod } from '@/lib/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CURRENCY_SYMBOLS } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Paperclip } from 'lucide-react';

const paymentMethodLabels: Record<PaymentMethod, string> = {
    CASH: 'نقد',
    CARD: 'کارتخوان',
    ONLINE: 'آنلاین',
};

export default function SalesHistoryPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchSales() {
      try {
        const allSales = await getAllSales();
        setSales(allSales);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'خطا',
          description: 'بارگذاری تاریخچه فروش ناموفق بود.',
        });
      }
    }
    fetchSales();
  }, [toast]);

  const totalPaid = (sale: Sale) => sale.payments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">تاریخچه فروش</h1>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>فروش‌های ثبت‌شده</CardTitle>
            <CardDescription>برای دیدن جزئیات هر فروش، روی آن کلیک کنید.</CardDescription>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-[60vh]">
                {sales.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {sales.map((sale) => (
                    <AccordionItem value={`sale-${sale.id}`} key={sale.id}>
                        <AccordionTrigger>
                        <div className="flex justify-between items-center w-full pr-4">
                            <div className="flex flex-col items-start gap-1">
                                <span className="font-semibold">
                                فروش در تاریخ {new Date(sale.date).toLocaleDateString('fa-IR')}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                    مشتری: {sale.customerName || 'ناشناس'}
                                </span>
                            </div>
                            <div className="flex items-center gap-4">
                               {totalPaid(sale) < sale.total && <Badge variant="destructive">پرداخت نشده</Badge>}
                                <span className="font-semibold text-lg">
                                    {sale.total.toLocaleString('fa-IR')}{' '}
                                    {CURRENCY_SYMBOLS.TOMAN}
                                </span>
                            </div>
                        </div>
                        </AccordionTrigger>
                        <AccordionContent>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <h4 className="font-semibold mb-2">اقلام فروش</h4>
                                 <Table>
                                    <TableHeader>
                                    <TableRow>
                                        <TableHead>نام محصول</TableHead>
                                        <TableHead>تعداد</TableHead>
                                        <TableHead>قیمت واحد</TableHead>
                                        <TableHead>جمع</TableHead>
                                    </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                    {sale.items.map((item) => (
                                        <TableRow key={item.productId}>
                                        <TableCell>{item.productName}</TableCell>
                                        <TableCell>{item.quantity}</TableCell>
                                        <TableCell>
                                            {item.price.toLocaleString('fa-IR')}
                                        </TableCell>
                                        <TableCell>
                                            {(item.quantity * item.price).toLocaleString('fa-IR')}
                                        </TableCell>
                                        </TableRow>
                                    ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">پرداخت‌ها</h4>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>روش</TableHead>
                                            <TableHead>مبلغ</TableHead>
                                            <TableHead>رسید</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sale.payments.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell>{paymentMethodLabels[payment.method]}</TableCell>
                                                <TableCell>{payment.amount.toLocaleString('fa-IR')}</TableCell>
                                                <TableCell>
                                                    {payment.receiptNumber || '-'}
                                                    {payment.receiptImage && (
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="mr-2"><Paperclip className="h-4 w-4" /></Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader><DialogTitle>تصویر رسید</DialogTitle></DialogHeader>
                                                                <img src={payment.receiptImage} alt={`رسید ${payment.receiptNumber || ''}`} className="max-w-full h-auto rounded-md" />
                                                            </DialogContent>
                                                        </Dialog>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>

                        </AccordionContent>
                    </AccordionItem>
                    ))}
                </Accordion>
                ) : (
                <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm h-48">
                    <div className="flex flex-col items-center gap-1 text-center">
                    <h3 className="text-xl font-bold tracking-tight">
                        هیچ فروشی ثبت نشده است
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        برای مشاهده تاریخچه، ابتدا یک فروش ثبت کنید.
                    </p>
                    </div>
                </div>
                )}
            </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
