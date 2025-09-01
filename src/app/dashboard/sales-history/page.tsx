'use client';

import { useState, useEffect } from 'react';
import { getAllSales } from '@/lib/db';
import type { Sale } from '@/lib/types';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CURRENCY_SYMBOLS } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">تاریخچه فروش</h1>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>فروش‌های ثبت‌شده</CardTitle>
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-[60vh]">
                {sales.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                    {sales.map((sale) => (
                    <AccordionItem value={`sale-${sale.id}`} key={sale.id}>
                        <AccordionTrigger>
                        <div className="flex justify-between w-full pr-4">
                            <span>
                            فروش شماره {sale.id} -{' '}
                            {new Date(sale.date).toLocaleDateString('fa-IR')}
                            </span>
                            <span className="font-semibold">
                            مبلغ کل: {sale.total.toLocaleString('fa-IR')}{' '}
                            {CURRENCY_SYMBOLS.TOMAN}
                            </span>
                        </div>
                        </AccordionTrigger>
                        <AccordionContent>
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
