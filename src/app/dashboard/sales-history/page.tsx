

'use client';

import { useState, useEffect } from 'react';
import type { Sale, PaymentMethod, Payment, Attachment } from '@/lib/types';
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
import { useAppContext } from '@/components/app-provider';
import { Skeleton } from '@/components/ui/skeleton';


const paymentMethodLabels: Record<PaymentMethod, string> = {
    CASH: 'نقد',
    CARD: 'کارتخوان',
    ONLINE: 'آنلاین',
};

type SaleWithDetails = Sale & {
    payments: (Payment & { attachments: Attachment[] })[];
}

export default function SalesHistoryPage() {
  const [salesWithDetails, setSalesWithDetails] = useState<SaleWithDetails[]>([]);
  const { toast } = useToast();
  const { db, isLoading, setGlobalLoading } = useAppContext();

  useEffect(() => {
    if (!db) return;
    async function fetchSales() {
      setGlobalLoading(true);
      try {
        const allSales = await db.getAllSales();
        const salesDetails: SaleWithDetails[] = await Promise.all(
            allSales.map(async (sale) => {
                const payments = await db.getPaymentsByIds(sale.paymentIds || []);
                const paymentsWithAttachments = await Promise.all(payments.map(async (payment) => {
                    const attachments = await db.getAttachmentsBySourceId(payment.id);
                    return { ...payment, attachments };
                }));
                return { ...sale, payments: paymentsWithAttachments };
            })
        );
        setSalesWithDetails(salesDetails);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'خطا',
          description: 'بارگذاری تاریخچه فروش ناموفق بود.',
        });
      } finally {
        setGlobalLoading(false);
      }
    }
    fetchSales();
  }, [db]);

  const totalPaid = (sale: SaleWithDetails) => sale.payments.reduce((acc, p) => acc + p.amount, 0);
  
  if (isLoading) {
    return (
        <div className="space-y-4">
             <Skeleton className="h-10 w-48" />
             <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                </CardHeader>
                 <CardContent className="space-y-2">
                     <Skeleton className="h-12 w-full" />
                     <Skeleton className="h-12 w-full" />
                     <Skeleton className="h-12 w-full" />
                 </CardContent>
            </Card>
        </div>
    )
  }

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
                {salesWithDetails.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {salesWithDetails.map((sale) => (
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
                               {totalPaid(sale) < sale.total && <Badge variant="destructive">بدهکار</Badge>}
                                <span className="font-semibold text-lg">
                                    {sale.total.toLocaleString('fa-IR')}{' '}
                                    {CURRENCY_SYMBOLS.TOMAN}
                                </span>
                            </div>
                        </div>
                        </AccordionTrigger>
                        <AccordionContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4">
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
                                {sale.payments.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>روش</TableHead>
                                            <TableHead>مبلغ</TableHead>
                                            <TableHead>اسناد</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {sale.payments.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell>{paymentMethodLabels[payment.method]}</TableCell>
                                                <TableCell>{payment.amount.toLocaleString('fa-IR')}</TableCell>
                                                <TableCell>
                                                   {payment.attachments && payment.attachments.length > 0 && (
                                                         <Dialog>
                                                            <DialogTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="mr-2"><Paperclip className="h-4 w-4" /></Button>
                                                            </DialogTrigger>
                                                            <DialogContent>
                                                                <DialogHeader><DialogTitle>اسناد پرداخت</DialogTitle></DialogHeader>
                                                                <ul className="space-y-2">
                                                                {payment.attachments.map(att => (
                                                                    <li key={att.id} className="border p-2 rounded-md">
                                                                        <p>{att.description || 'سند'}</p>
                                                                        <p className="text-xs text-muted-foreground">{new Date(att.date).toLocaleString('fa-IR', { dateStyle: 'short', timeStyle: 'short'})} - {att.receiptNumber}</p>
                                                                        {att.receiptImage && <img src={att.receiptImage} alt="رسید" className="mt-2 max-w-full h-auto rounded" />}
                                                                    </li>
                                                                ))}
                                                                </ul>
                                                            </DialogContent>
                                                        </Dialog>
                                                   )}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                ) : (<p className="text-sm text-muted-foreground">پرداختی ثبت نشده است.</p>)}
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

    