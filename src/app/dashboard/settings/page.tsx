'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2, PlusCircle, Users, Database } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

import type { ExchangeRate, CostTitle, Employee } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useI18n } from '@/lib/i18n/client';
import { useAppContext } from '@/components/app-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { StorageType } from '@/hooks/use-db';
import { Label } from '@/components/ui/label';

const exchangeRatesSchema = z.object({
  rates: z.array(
    z.object({
      currency: z.enum(['USD', 'AED', 'CNY']),
      rate: z.coerce.number().min(0, 'نرخ باید مثبت باشد'),
    })
  ),
});

const costTitleSchema = z.object({
  title: z.string().min(1, 'عنوان الزامی است'),
});

const employeeSchema = z.object({
  name: z.string().min(1, 'نام کارمند الزامی است'),
  position: z.string().min(1, 'سمت الزامی است'),
  salary: z.coerce.number().min(0, 'حقوق نمی‌تواند منفی باشد'),
});

function ExchangeRatesForm() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { db } = useAppContext();
  const form = useForm<z.infer<typeof exchangeRatesSchema>>({
    resolver: zodResolver(exchangeRatesSchema),
    defaultValues: {
      rates: [],
    },
  });

  useEffect(() => {
    if (!db) return;
    async function loadRates() {
      const rates = await db.getExchangeRates();
      form.reset({ rates });
    }
    loadRates();
  }, [form, db]);

  const onSubmit = async (data: z.infer<typeof exchangeRatesSchema>) => {
    if (!db) return;
    try {
      await db.saveExchangeRates(data.rates as ExchangeRate[]);
      toast({ title: 'نرخ‌ها ذخیره شد', description: 'نرخ‌های جدید ارز با موفقیت ذخیره شدند.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'ذخیره نرخ‌های ارز ناموفق بود.',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {form.watch('rates').map((rate, index) => (
          <FormField
            key={index}
            control={form.control}
            name={`rates.${index}.rate`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{`نرخ ${rate.currency} به تومان`}</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button type="submit" disabled={form.formState.isSubmitting || !db}>
          ذخیره نرخ‌ها
        </Button>
      </form>
    </Form>
  );
}

function CostTitlesForm() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { db } = useAppContext();
  const [costTitles, setCostTitles] = useState<CostTitle[]>([]);
  const form = useForm<z.infer<typeof costTitleSchema>>({
    resolver: zodResolver(costTitleSchema),
    defaultValues: { title: '' },
  });

  const fetchCostTitles = async () => {
    if (!db) return;
    const titles = await db.getCostTitles();
    setCostTitles(titles);
  };

  useEffect(() => {
    fetchCostTitles();
  }, [db]);

  const onSubmit = async (data: z.infer<typeof costTitleSchema>) => {
    if (!db) return;
    try {
      const newTitle = { id: Date.now().toString(), title: data.title };
      await db.addCostTitle(newTitle);
      toast({ title: 'عنوان جدید اضافه شد', description: 'عنوان هزینه جدید با موفقیت اضافه شد.' });
      form.reset();
      fetchCostTitles();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'افزودن عنوان هزینه ناموفق بود.',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    try {
      await db.deleteCostTitle(id);
      toast({ title: 'عنوان هزینه حذف شد', description: 'عنوان هزینه با موفقیت حذف شد.' });
      fetchCostTitles();
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'حذف عنوان هزینه ناموفق بود.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-end gap-2">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormLabel>عنوان هزینه جدید</FormLabel>
                <FormControl>
                  <Input placeholder="مثال: هزینه حمل" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting || !db}>
            <PlusCircle className="mr-2" /> افزودن
          </Button>
        </form>
      </Form>
      <div className="space-y-2">
        <h3 className="font-medium">عناوین هزینه موجود</h3>
        {costTitles.length > 0 ? (
          <ul className="rounded-md border">
            {costTitles.map((item) => (
              <li key={item.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                {item.title}
                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">هیچ عنوان هزینه‌ای یافت نشد.</p>
        )}
      </div>
    </div>
  );
}

function EmployeeForm() {
  const { toast } = useToast();
  const { db } = useAppContext();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { name: '', position: '', salary: 0 },
  });

  const fetchEmployees = async () => {
    if (!db) return;
    const allEmployees = await db.getAllEmployees();
    setEmployees(allEmployees);
  };

  useEffect(() => {
    fetchEmployees();
  }, [db]);

  const onSubmit = async (data: z.infer<typeof employeeSchema>) => {
    if (!db) return;
    try {
      await db.addEmployee(data);
      toast({ title: 'کارمند اضافه شد', description: 'کارمند جدید با موفقیت اضافه شد.' });
      form.reset();
      fetchEmployees();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'افزودن کارمند ناموفق بود.',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    try {
      await db.deleteEmployee(id);
      toast({ title: 'کارمند حذف شد', description: 'کارمند با موفقیت حذف شد.' });
      fetchEmployees();
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'حذف کارمند ناموفق بود.',
      });
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-md">
           <h3 className="text-lg font-medium">افزودن کارمند جدید</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>نام کامل</FormLabel>
                        <FormControl>
                        <Input placeholder="مثال: علی رضایی" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="position"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>سمت</FormLabel>
                        <FormControl>
                        <Input placeholder="مثال: فروشنده" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="salary"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>حقوق ماهانه (تومان)</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder="10,000,000" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
           </div>
          <Button type="submit" disabled={form.formState.isSubmitting || !db}>
            <PlusCircle className="mr-2" /> افزودن کارمند
          </Button>
        </form>
      </Form>
      <div className="space-y-2">
        <h3 className="font-medium">لیست کارمندان</h3>
        {employees.length > 0 ? (
          <ul className="rounded-md border">
            {employees.map((item) => (
              <li key={item.id} className="flex items-center justify-between p-3 border-b last:border-b-0">
                <div className="flex items-center gap-3">
                   <div className="p-2 rounded-full bg-muted">
                        <Users className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{item.position}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className="font-mono text-sm">{item.salary.toLocaleString('fa-IR')} تومان</span>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground text-center p-4">هنوز کارمندی ثبت نشده است.</p>
        )}
      </div>
    </div>
  );
}

function StorageSettingsForm() {
    const { toast } = useToast();
    const { storageType, changeStorageType } = useAppContext();

    const handleStorageChange = (value: StorageType) => {
        changeStorageType(value);
        toast({
            title: 'محل ذخیره‌سازی تغییر کرد',
            description: `داده‌ها اکنون در ${value === 'cloud' ? 'فضای ابری (Firestore)' : 'مرورگر شما'} ذخیره می‌شوند.`,
        });
        window.location.reload();
    }

    return (
        <div className="space-y-4">
            <Label>محل ذخیره‌سازی داده‌ها</Label>
            <Select value={storageType} onValueChange={handleStorageChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="انتخاب محل ذخیره‌سازی" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="local">محلی (مرورگر)</SelectItem>
                    <SelectItem value="cloud">ابری (Firestore)</SelectItem>
                </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
                با انتخاب "ابری"، داده‌های شما در Firebase Firestore ذخیره می‌شوند و از هر دستگاهی قابل دسترس خواهند بود.
            </p>
        </div>
    );
}


export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">تنظیمات</h1>
      <Tabs defaultValue="exchange-rates">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="data-storage">ذخیره‌سازی داده</TabsTrigger>
          <TabsTrigger value="exchange-rates">نرخ ارز</TabsTrigger>
          <TabsTrigger value="cost-titles">عناوین هزینه</TabsTrigger>
          <TabsTrigger value="employees">کارمندان</TabsTrigger>
        </TabsList>
         <TabsContent value="data-storage">
            <Card>
                <CardHeader>
                <CardTitle>ذخیره‌سازی داده‌ها</CardTitle>
                <CardDescription>
                    محل ذخیره‌سازی اطلاعات برنامه خود را انتخاب کنید.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <StorageSettingsForm />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="exchange-rates">
          <Card>
            <CardHeader>
              <CardTitle>نرخ ارز</CardTitle>
              <CardDescription>
                نرخ تبدیل ارزهای دیگر به تومان را برای محاسبه قیمت تمام‌شده وارد کنید.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ExchangeRatesForm />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="cost-titles">
          <Card>
            <CardHeader>
              <CardTitle>عناوین هزینه</CardTitle>
              <CardDescription>
                عناوین هزینه‌های متداول خود را برای دسترسی سریع‌تر تعریف کنید.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CostTitlesForm />
            </CardContent>
          </Card>
        </TabsContent>
         <TabsContent value="employees">
          <Card>
            <CardHeader>
              <CardTitle>مدیریت کارمندان</CardTitle>
              <CardDescription>
                اطلاعات کارمندان و حقوق آن‌ها را برای محاسبه خودکار در هزینه‌ها وارد کنید.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EmployeeForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
