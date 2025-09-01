'use client';

import { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';
import { getAllSales } from '@/lib/db';
import type { Sale } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCY_SYMBOLS } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type TimeRange = 'all' | 'last_year' | 'this_year' | 'last_month' | 'this_month' | 'last_week' | 'this_week';

type ChartData = {
  name: string;
  فروش: number;
  سود: number;
};

export default function ReportsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('this_month');
  const { toast } = useToast();

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const allSales = await getAllSales();
        setSales(allSales);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'خطا',
          description: 'بارگذاری تاریخچه فروش ناموفق بود.',
        });
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [toast]);

  const filteredSales = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (timeRange) {
      case 'this_week':
        startDate = startOfWeek(now);
        break;
      case 'last_week':
        startDate = startOfWeek(subDays(now, 7));
        endDate = endOfWeek(subDays(now, 7));
        break;
      case 'this_month':
        startDate = startOfMonth(now);
        break;
      case 'last_month':
        startDate = startOfMonth(subDays(now, 30));
        endDate = endOfMonth(subDays(now, 30));
        break;
      case 'this_year':
        startDate = startOfYear(now);
        break;
      case 'last_year':
        startDate = startOfYear(subDays(now, 365));
        endDate = endOfYear(subDays(now, 365));
        break;
      case 'all':
      default:
        return sales;
    }
    
    return sales.filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= startDate && saleDate <= endDate;
    });

  }, [sales, timeRange]);

  const chartData = useMemo<ChartData[]>(() => {
    if (filteredSales.length === 0) return [];
    
    const dataMap = new Map<string, { فروش: number, سود: number }>();
    
    let dateFormat = "yyyy/MM/dd";
     if (timeRange === 'this_year' || timeRange === 'last_year' || (timeRange === 'all' && filteredSales.length > 30)) {
        dateFormat = "yyyy/MM";
    }

    filteredSales.forEach(sale => {
      const dateKey = format(new Date(sale.date), dateFormat);
      const saleProfit = sale.items.reduce((acc, item) => acc + (item.price * item.quantity - item.totalCost), 0);

      if (!dataMap.has(dateKey)) {
        dataMap.set(dateKey, { فروش: 0, سود: 0 });
      }
      const current = dataMap.get(dateKey)!;
      current.فروش += sale.total;
      current.سود += saleProfit;
    });

    return Array.from(dataMap.entries())
        .map(([name, values]) => ({ name, ...values }))
        .sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime());

  }, [filteredSales, timeRange]);

  const totalSales = useMemo(() => filteredSales.reduce((sum, sale) => sum + sale.total, 0), [filteredSales]);
  const totalProfit = useMemo(() => {
    return filteredSales.reduce((total, sale) => {
        const saleProfit = sale.items.reduce((acc, item) => acc + (item.price * item.quantity - item.totalCost), 0);
        return total + saleProfit;
    }, 0);
  }, [filteredSales]);

  const renderChart = (dataKey: 'فروش' | 'سود', title: string, color: string) => (
     <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => value.toLocaleString('fa-IR')} />
                    <Tooltip
                        contentStyle={{
                            background: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            direction: 'rtl',
                        }}
                         formatter={(value: number) => [value.toLocaleString('fa-IR'), dataKey]}
                    />
                    <Legend formatter={() => dataKey} />
                    <Bar dataKey={dataKey} fill={color} />
                </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
  );

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">گزارش‌ها</h1>
        <div className="w-48">
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                <SelectTrigger>
                    <SelectValue placeholder="بازه زمانی" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="this_week">هفته جاری</SelectItem>
                    <SelectItem value="last_week">هفته گذشته</SelectItem>
                    <SelectItem value="this_month">ماه جاری</SelectItem>
                    <SelectItem value="last_month">ماه گذشته</SelectItem>
                    <SelectItem value="this_year">سال جاری</SelectItem>
                    <SelectItem value="last_year">سال گذشته</SelectItem>
                    <SelectItem value="all">کل</SelectItem>
                </SelectContent>
            </Select>
        </div>
      </div>
        {isLoading ? (
             <div className="grid gap-4 md:grid-cols-2">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-96 w-full md:col-span-2" />
                <Skeleton className="h-96 w-full md:col-span-2" />
            </div>
        ) : filteredSales.length > 0 ? (
        <>
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>مجموع فروش</CardTitle>
                        <CardDescription>در بازه زمانی انتخاب شده</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-3xl font-bold">
                            {totalSales.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>سود خالص</CardTitle>
                        <CardDescription>در بازه زمانی انتخاب شده</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <p className="text-3xl font-bold">
                            {totalProfit.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}
                        </p>
                    </CardContent>
                </Card>
            </div>
             <div className="grid gap-8">
                {renderChart('فروش', 'نمودار فروش', 'hsl(var(--primary))')}
                {renderChart('سود', 'نمودار سود', 'hsl(var(--accent))')}
            </div>
        </>
        ) : (
            <Card>
                <CardContent className="flex flex-1 items-center justify-center p-10">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h3 className="text-2xl font-bold tracking-tight">
                        داده‌ای برای نمایش وجود ندارد
                        </h3>
                        <p className="text-sm text-muted-foreground">
                        هیچ فروشی در بازه زمانی انتخاب شده ثبت نشده است.
                        </p>
                    </div>
                </CardContent>
            </Card>
        )}
    </div>
  );
}
