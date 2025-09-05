'use client';

import { useEffect, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2, PlusCircle, Users, Database, Loader2, Store, Banknote, Tag } from 'lucide-react';

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

import type { ExchangeRate, CostTitle, Employee, AppSettings } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/components/app-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { StorageType } from '@/components/app-provider';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';

const appSettingsSchema = z.object({
  shopName: z.string().min(1, 'نام فروشگاه الزامی است'),
});

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


function AppSettingsForm() {
    const { toast } = useToast();
    const { db, settings, setSettings } = useAppContext();
    const form = useForm<z.infer<typeof appSettingsSchema>>({
        resolver: zodResolver(appSettingsSchema),
        defaultValues: {
            shopName: settings.shopName || '',
        },
    });
    
    const { formState: { isSubmitting } } = form;

    useEffect(() => {
        form.reset({ shopName: settings.shopName || '' });
    }, [settings, form]);

    const onSubmit = async (data: z.infer<typeof appSettingsSchema>) => {
        if(!db) return;
        try {
            const newSettings = { ...settings, ...data };
            await db.saveAppSettings(newSettings);
            setSettings(newSettings);
            toast({ title: 'تنظیمات ذخیره شد', description: 'نام فروشگاه با موفقیت به‌روزرسانی شد.' });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'خطا',
                description: 'ذخیره تنظیمات ناموفق بود.',
            });
        }
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>اطلاعات فروشگاه</CardTitle>
                <CardDescription>نام فروشگاه خود را برای نمایش در برنامه تنظیم کنید.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="shopName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>نام فروشگاه</FormLabel>
                                    <FormControl>
                                        <Input placeholder="نام فروشگاه شما" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" disabled={isSubmitting || !db}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? 'در حال ذخیره...' : 'ذخیره نام'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function ExchangeRatesForm() {
  const { toast } = useToast();
  const { db, setGlobalLoading } = useAppContext();
  const form = useForm<z.infer<typeof exchangeRatesSchema>>({
    resolver: zodResolver(exchangeRatesSchema),
    defaultValues: {
      rates: [],
    },
  });

  const { formState: { isSubmitting } } = form;

  useEffect(() => {
    if (!db) return;
    async function loadRates() {
      setGlobalLoading(true);
      const rates = await db.getExchangeRates();
      form.reset({ rates });
      setGlobalLoading(false);
    }
    loadRates();
  }, [form, db, setGlobalLoading]);

  const onSubmit = async (data: z.infer<typeof exchangeRatesSchema>) => {
    if (!db) return;
    try {
      await db.saveExchangeRates(data.rates as ExchangeRate[]);
      toast({ title: 'نرخ ارز ذخیره شد', description: 'نرخ‌های جدید با موفقیت در سیستم ثبت شد.' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'ذخیره نرخ ارز ناموفق بود.',
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
        <Button type="submit" disabled={isSubmitting || !db}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isSubmitting ? "در حال ذخیره..." : "ذخیره نرخ‌ها"}
        </Button>
      </form>
    </Form>
  );
}

function CostTitlesForm() {
  const { toast } = useToast();
  const { db, setGlobalLoading } = useAppContext();
  const [costTitles, setCostTitles] = useState<CostTitle[]>([]);
  const form = useForm<z.infer<typeof costTitleSchema>>({
    resolver: zodResolver(costTitleSchema),
    defaultValues: { title: '' },
  });

  const { formState: { isSubmitting } } = form;

  const fetchCostTitles = useCallback(async () => {
    if (!db) return;
    setGlobalLoading(true);
    const titles = await db.getCostTitles();
    setCostTitles(titles);
    setGlobalLoading(false);
  }, [db, setGlobalLoading]);

  useEffect(() => {
    fetchCostTitles();
  }, [fetchCostTitles]);

  const onSubmit = async (data: z.infer<typeof costTitleSchema>) => {
    if (!db) return;
    try {
      const newTitle = { id: Date.now().toString(), title: data.title };
      await db.addCostTitle(newTitle);
      toast({ title: 'عنوان هزینه افزوده شد', description: 'عنوان جدید برای هزینه‌ها ثبت شد.' });
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
                <FormLabel>عنوان جدید</FormLabel>
                <FormControl>
                  <Input placeholder="مثال: هزینه حمل و نقل" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isSubmitting || !db}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            {isSubmitting ? "در حال افزودن..." : "افزودن"}
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
  const { db, setGlobalLoading } = useAppContext();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { name: '', position: '', salary: 0 },
  });

  const { formState: { isSubmitting } } = form;

  const fetchEmployees = useCallback(async () => {
    if (!db) return;
    setGlobalLoading(true);
    const allEmployees = await db.getAllEmployees();
    setEmployees(allEmployees);
    setGlobalLoading(false);
  }, [db, setGlobalLoading]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const onSubmit = async (data: z.infer<typeof employeeSchema>) => {
    if (!db) return;
    try {
      await db.addEmployee(data);
      toast({ title: 'کارمند افزوده شد', description: 'کارمند جدید با موفقیت به سیستم اضافه شد.' });
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
                        <FormLabel>نام</FormLabel>
                        <FormControl>
                        <Input placeholder="نام کامل کارمند" {...field} />
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
          <Button type="submit" disabled={isSubmitting || !db}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <PlusCircle className="mr-2 h-4 w-4" />}
            {isSubmitting ? "در حال افزودن..." : "افزودن کارمند"}
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
          <p className="text-sm text-muted-foreground text-center p-4">هیچ کارمندی ثبت نشده است.</p>
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
            description: `داده‌ها اکنون در ${value === 'cloud' ? 'فضای ابری' : 'مرورگر شما'} ذخیره می‌شوند.`,
        });
        window.location.reload();
    }

    return (
        <div className="space-y-4">
            <Label>محل ذخیره‌سازی</Label>
            <Select value={storageType} onValueChange={handleStorageChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="انتخاب محل ذخیره" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="local">محلی (مرورگر)</SelectItem>
                    <SelectItem value="cloud">ابری (Firebase)</SelectItem>
                </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
                داده‌های برنامه را می‌توانید به صورت محلی در مرورگر خود یا در فضای ابری با استفاده از Firebase ذخیره کنید.
            </p>
        </div>
    );
}

export default function SettingsPage() {
  const { isLoading } = useAppContext();
  
  if(isLoading) {
      return (
          <div className="max-w-4xl mx-auto space-y-6">
              <Skeleton className="h-10 w-32" />
              <div className="space-y-4">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-64 w-full" />
              </div>
          </div>
      )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">تنظیمات</h1>
      <Tabs defaultValue="general" dir="rtl">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="general"><Store className="w-4 h-4 ml-1" />عمومی</TabsTrigger>
          <TabsTrigger value="data-storage"><Database className="w-4 h-4 ml-1" />ذخیره‌سازی</TabsTrigger>
          <TabsTrigger value="exchange-rates"><Banknote className="w-4 h-4 ml-1" />نرخ‌های ارز</TabsTrigger>
          <TabsTrigger value="cost-titles"><Tag className="w-4 h-4 ml-1" />عناوین هزینه</TabsTrigger>
          <TabsTrigger value="employees"><Users className="w-4 h-4 ml-1" />کارمندان</TabsTrigger>
        </TabsList>
        <TabsContent value="general">
            <AppSettingsForm />
        </TabsContent>
         <TabsContent value="data-storage">
            <Card>
                <CardHeader>
                <CardTitle>محل ذخیره‌سازی داده‌ها</CardTitle>
                <CardDescription>
                    انتخاب کنید که داده‌های برنامه در مرورگر شما (محلی) یا در فضای ابری (Firebase Firestore) ذخیره شوند.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-8">
                    <StorageSettingsForm />
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="exchange-rates">
          <Card>
            <CardHeader>
              <CardTitle>تنظیم نرخ ارز</CardTitle>
              <CardDescription>
                نرخ تبدیل ارزهای مختلف به تومان را برای محاسبه هزینه‌ها وارد کنید.
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
              <CardTitle>مدیریت عناوین هزینه</CardTitle>
              <CardDescription>
                عناوین هزینه‌های پرتکرار را برای دسته‌بندی بهتر تعریف کنید.
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
                اطلاعات کارمندان و حقوق آن‌ها را برای ثبت خودکار هزینه‌ها وارد کنید.
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
