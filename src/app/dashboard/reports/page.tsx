
'use client';

import { useState, useEffect, useMemo } from 'react';
import { generateInventoryRecommendations } from '@/ai/flows/generate-inventory-recommendations';
import type { Product, Sale, Expense, Payment } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppContext } from '@/components/app-provider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CURRENCY_SYMBOLS } from '@/lib/utils';
import { Bot, Sparkles } from 'lucide-react';

type TimeRange = 'all' | 'last_year' | 'this_year' | 'last_month' | 'this_month' | 'last_week' | 'this_week';

type ChartData = {
  name: string;
  فروش: number;
  'سود ناخالص': number;
  مخارج: number;
  'سود خالص': number;
};

export default function ReportsPage() {
  const [recommendations, setRecommendations] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const { toast } = useToast();
  const { db, isLoading, setGlobalLoading } = useAppContext();
  const [timeRange, setTimeRange] = useState<TimeRange>('this_month');

  useEffect(() => {
    if (!db) return;
    async function fetchData() {
      setGlobalLoading(true);
      try {
        const [allSales, allExpenses, allProducts] = await Promise.all([db.getAllSales(), db.getAllExpenses(), db.getAllProducts()]);
        const paymentIds = allSales.flatMap(s => s.paymentIds || []);
        const allPayments = await db.getPaymentsByIds(paymentIds);
        setSales(allSales);
        setExpenses(allExpenses);
        setPayments(allPayments);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'خطا در بارگذاری داده',
          description: 'بارگذاری اطلاعات فروش و مخارج با مشکل مواجه شد.',
        });
      } finally {
        setGlobalLoading(false);
      }
    }
    fetchData();
  }, [db]);
  
  const handleGenerateReport = async () => {
    if (!db) return;
    setIsAiLoading(true);
    setRecommendations('');
    try {
      const products: Product[] = await db.getAllProducts();
      const salesData: Sale[] = await db.getAllSales();

      if (products.length === 0 || salesData.length === 0) {
        toast({
          variant: 'default',
          title: 'داده کافی نیست',
          description: 'برای تولید گزارش هوشمند، به داده‌های بیشتری از فروش و موجودی نیاز است.',
        });
        setIsAiLoading(false);
        return;
      }

      const stockLevels = JSON.stringify(
        products.map((p) => ({ name: p.name, quantity: p.quantity, lowStockThreshold: p.lowStockThreshold }))
      );

      const salesSummary = salesData.flatMap(s => s.items).reduce((acc, item) => {
        acc[item.productName] = (acc[item.productName] || 0) + item.quantity;
        return acc;
      }, {} as Record<string, number>);

      const salesDataString = JSON.stringify(salesSummary);

      const result = await generateInventoryRecommendations({ salesData: salesDataString, stockLevels });
      setRecommendations(result.recommendations);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      toast({
        variant: 'destructive',
        title: 'خطا در تولید گزارش',
        description: 'متاسفانه تولید گزارش هوشمند با مشکل مواجه شد.',
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const { filteredSales, filteredExpenses } = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    let isAll = false;

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
        isAll = true;
        startDate = new Date(0); 
        endDate = new Date();
        break;
    }

    const filterByDate = <T extends { date: string }>(items: T[]) => {
      if (isAll) return items;
      return items.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
      });
    };

    return {
      filteredSales: filterByDate(sales),
      filteredExpenses: filterByDate(expenses),
    };
  }, [sales, expenses, timeRange]);

  const chartData = useMemo<ChartData[]>(() => {
    if (filteredSales.length === 0 && filteredExpenses.length === 0) return [];
    
    const dataMap = new Map<string, { فروش: number, 'سود ناخالص': number, مخارج: number }>();
    
    let dateFormat = "yyyy/MM/dd";
    if (timeRange === 'this_year' || timeRange === 'last_year' || (timeRange === 'all' && (sales.length > 30 || expenses.length > 30))) {
        dateFormat = "yyyy/MM";
    }

    filteredSales.forEach(sale => {
      const dateKey = format(new Date(sale.date), dateFormat);
      const saleItemsCost = sale.items.reduce((acc, item) => acc + (item.totalCost || 0), 0);
      const saleGrossProfit = sale.total - saleItemsCost;
      
      const current = dataMap.get(dateKey) || { فروش: 0, 'سود ناخالص': 0, مخارج: 0 };
      current.فروش += sale.total;
      current['سود ناخالص'] += saleGrossProfit;
      dataMap.set(dateKey, current);
    });

    filteredExpenses.forEach(expense => {
      const dateKey = format(new Date(expense.date), dateFormat);
      const current = dataMap.get(dateKey) || { فروش: 0, 'سود ناخالص': 0, مخارج: 0 };
      current.مخارج += expense.amount;
      dataMap.set(dateKey, current);
    });

    return Array.from(dataMap.entries())
        .map(([name, values]) => ({ 
            name,
            ...values,
            'سود خالص': values['سود ناخالص'] - values.مخارج,
        }))
        .sort((a,b) => new Date(a.name).getTime() - new Date(b.name).getTime());

  }, [filteredSales, filteredExpenses, timeRange, sales, expenses]);

  const { totalSales, totalGrossProfit, totalExpenses, totalNetProfit, totalReceivables } = useMemo(() => {
    const grossProfit = filteredSales.reduce((total, sale) => {
        const saleItemsCost = sale.items.reduce((acc, item) => acc + (item.totalCost || 0), 0);
        return total + (sale.total - saleItemsCost);
    }, 0);
    const expensesSum = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const totalPaid = filteredSales.reduce((total, sale) => {
        const salePayments = payments.filter(p => (sale.paymentIds || []).includes(p.id));
        return total + salePayments.reduce((sum, p) => sum + p.amount, 0);
    }, 0);
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);

    return {
        totalSales: totalRevenue,
        totalGrossProfit: grossProfit,
        totalExpenses: expensesSum,
        totalNetProfit: grossProfit - expensesSum,
        totalReceivables: totalRevenue - totalPaid,
    };
  }, [filteredSales, filteredExpenses, payments]);
  
  const renderChart = (data: ChartData[], title: string) => (
     <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => value.toLocaleString('fa-IR')} />
                    <Tooltip
                        contentStyle={{
                            background: "hsl(var(--card))",
                            borderColor: "hsl(var(--border))",
                            direction: 'rtl',
                        }}
                         formatter={(value: number, name: string) => [value.toLocaleString('fa-IR'), name]}
                    />
                    <Legend />
                    <Bar dataKey="فروش" fill="hsl(var(--primary))" />
                    <Bar dataKey="سود خالص" fill="hsl(var(--chart-2))" />
                    <Bar dataKey="مخارج" fill="hsl(var(--destructive))" />
                </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
  );

  const timeRangeLabels: Record<TimeRange, string> = {
    this_week: 'هفته جاری',
    last_week: 'هفته گذشته',
    this_month: 'ماه جاری',
    last_month: 'ماه گذشته',
    this_year: 'سال جاری',
    last_year: 'سال گذشته',
    all: 'کل بازه',
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">گزارش‌ها</h1>
        <div className="w-48">
            <Select value={timeRange} onValueChange={(value: TimeRange) => setTimeRange(value)}>
                <SelectTrigger>
                    <SelectValue placeholder="انتخاب بازه زمانی" />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(timeRangeLabels).map(([key, label]) => (
                         <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>
        {isLoading ? (
             <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-96 w-full lg:col-span-5" />
            </div>
        ) : sales.length > 0 || expenses.length > 0 ? (
        <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
                        <CardTitle>سود ناخالص</CardTitle>
                        <CardDescription>(فروش - قیمت خرید)</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <p className="text-3xl font-bold">
                            {totalGrossProfit.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>مجموع مخارج</CardTitle>
                        <CardDescription>هزینه‌های جاری ثبت‌شده</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <p className="text-3xl font-bold text-destructive">
                            {totalExpenses.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>سود خالص</CardTitle>
                        <CardDescription>(سود ناخالص - مخارج)</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <p className="text-3xl font-bold text-green-600">
                            {totalNetProfit.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}
                        </p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>مجموع مطالبات</CardTitle>
                        <CardDescription>مبالغ پرداخت نشده</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <p className="text-3xl font-bold text-orange-500">
                            {totalReceivables.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}
                        </p>
                    </CardContent>
                </Card>
            </div>
             <div className="grid gap-8">
                {renderChart(chartData, 'نمودار جامع فروش، سود و مخارج')}
            </div>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                        <Bot className="h-6 w-6" />
                    </div>
                    <div>
                        <CardTitle>دستیار هوشمند انبار</CardTitle>
                        <CardDescription>
                        برای دریافت پیشنهادهای هوشمند درباره وضعیت موجودی و فروش کلیک کنید.
                        </CardDescription>
                    </div>
                </div>
                <Button onClick={handleGenerateReport} disabled={isAiLoading}>
                    {isAiLoading ? (
                        'در حال تولید...'
                    ) : (
                        <>
                        <Sparkles className="mr-2 h-4 w-4" /> تولید گزارش
                        </>
                    )}
                    </Button>
                </CardHeader>
                <CardContent className="min-h-[200px] prose prose-sm max-w-none dark:prose-invert">
                {isAiLoading && (
                    <div className="space-y-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[75%]" />
                    </div>
                )}
                {!isAiLoading && recommendations && (
                    <div dangerouslySetInnerHTML={{ __html: recommendations.replace(/\n/g, '<br />') }} />
                )}
                {!isAiLoading && !recommendations && (
                    <div className="flex flex-1 items-center justify-center rounded-lg h-[200px]">
                        <div className="flex flex-col items-center gap-1 text-center">
                            <h3 className="text-2xl font-bold tracking-tight">
                            آماده برای تحلیل
                            </h3>
                            <p className="text-sm text-muted-foreground">
                            برای شروع، روی دکمه "تولید گزارش" کلیک کنید.
                            </p>
                        </div>
                    </div>
                )}
                </CardContent>
            </Card>
        </>
        ) : (
            <Card>
                <CardContent className="flex flex-1 items-center justify-center p-10">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <h3 className="text-2xl font-bold tracking-tight">
                        داده‌ای برای نمایش وجود ندارد
                        </h3>
                        <p className="text-sm text-muted-foreground">
                        هیچ فروش یا هزینه‌ای در بازه زمانی انتخاب شده ثبت نشده است.
                        </p>
                    </div>
                </CardContent>
            </Card>
        )}
    </div>
  );
}

    