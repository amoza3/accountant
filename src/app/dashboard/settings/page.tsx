'use client';

import { useEffect, useState, useCallback } from 'react';
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

import type { ExchangeRate, CostTitle, Employee, FirebaseConfig } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/components/app-provider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { StorageType } from '@/hooks/use-db';
import { Label } from '@/components/ui/label';
import { useI18n } from '@/lib/i18n/client';

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

const firebaseConfigSchema = z.object({
  apiKey: z.string().min(1, 'API Key is required'),
  authDomain: z.string().min(1, 'Auth Domain is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  storageBucket: z.string().min(1, 'Storage Bucket is required'),
  messagingSenderId: z.string().min(1, 'Messaging Sender ID is required'),
  appId: z.string().min(1, 'App ID is required'),
});

function ExchangeRatesForm() {
    const { toast } = useToast();
  const { db } = useAppContext();
  const { t } = useI18n();
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
      toast({ title: t('settings.exchange_rates.toasts.success.title'), description: t('settings.exchange_rates.toasts.success.description') });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('settings.exchange_rates.toasts.error.title'),
        description: t('settings.exchange_rates.toasts.error.description'),
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
                <FormLabel>{t('settings.exchange_rates.form.label', { currency: rate.currency })}</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button type="submit" disabled={form.formState.isSubmitting || !db}>
          {t('settings.exchange_rates.form.save_button')}
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

  const fetchCostTitles = useCallback(async () => {
    if (!db) return;
    const titles = await db.getCostTitles();
    setCostTitles(titles);
  }, [db]);

  useEffect(() => {
    fetchCostTitles();
  }, [fetchCostTitles]);

  const onSubmit = async (data: z.infer<typeof costTitleSchema>) => {
    if (!db) return;
    try {
      const newTitle = { id: Date.now().toString(), title: data.title };
      await db.addCostTitle(newTitle);
      toast({ title: t('settings.cost_titles.toasts.success_add.title'), description: t('settings.cost_titles.toasts.success_add.description') });
      form.reset();
      fetchCostTitles();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('settings.cost_titles.toasts.error_add.title'),
        description: t('settings.cost_titles.toasts.error_add.description'),
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    try {
      await db.deleteCostTitle(id);
      toast({ title: t('settings.cost_titles.toasts.success_delete.title'), description: t('settings.cost_titles.toasts.success_delete.description') });
      fetchCostTitles();
    } catch (error) {
       toast({
        variant: 'destructive',
        title: t('settings.cost_titles.toasts.error_delete.title'),
        description: t('settings.cost_titles.toasts.error_delete.description'),
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
                <FormLabel>{t('settings.cost_titles.form.new_title_label')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('settings.cost_titles.form.new_title_placeholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting || !db}>
            <PlusCircle className="mr-2" /> {t('settings.cost_titles.form.add_button')}
          </Button>
        </form>
      </Form>
      <div className="space-y-2">
        <h3 className="font-medium">{t('settings.cost_titles.existing_titles_label')}</h3>
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
          <p className="text-sm text-muted-foreground">{t('settings.cost_titles.no_titles_message')}</p>
        )}
      </div>
    </div>
  );
}

function EmployeeForm() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { db } = useAppContext();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { name: '', position: '', salary: 0 },
  });

  const fetchEmployees = useCallback(async () => {
    if (!db) return;
    const allEmployees = await db.getAllEmployees();
    setEmployees(allEmployees);
  }, [db]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const onSubmit = async (data: z.infer<typeof employeeSchema>) => {
    if (!db) return;
    try {
      await db.addEmployee(data);
      toast({ title: t('settings.employees.toasts.success_add.title'), description: t('settings.employees.toasts.success_add.description') });
      form.reset();
      fetchEmployees();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('settings.employees.toasts.error_add.title'),
        description: t('settings.employees.toasts.error_add.description'),
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!db) return;
    try {
      await db.deleteEmployee(id);
      toast({ title: t('settings.employees.toasts.success_delete.title'), description: t('settings.employees.toasts.success_delete.description') });
      fetchEmployees();
    } catch (error) {
       toast({
        variant: 'destructive',
        title: t('settings.employees.toasts.error_delete.title'),
        description: t('settings.employees.toasts.error_delete.description'),
      });
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-md">
           <h3 className="text-lg font-medium">{t('settings.employees.add_form.title')}</h3>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('settings.employees.add_form.name_label')}</FormLabel>
                        <FormControl>
                        <Input placeholder={t('settings.employees.add_form.name_placeholder')} {...field} />
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
                        <FormLabel>{t('settings.employees.add_form.position_label')}</FormLabel>
                        <FormControl>
                        <Input placeholder={t('settings.employees.add_form.position_placeholder')} {...field} />
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
                        <FormLabel>{t('settings.employees.add_form.salary_label')}</FormLabel>
                        <FormControl>
                        <Input type="number" placeholder={t('settings.employees.add_form.salary_placeholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
           </div>
          <Button type="submit" disabled={form.formState.isSubmitting || !db}>
            <PlusCircle className="mr-2" /> {t('settings.employees.add_form.add_button')}
          </Button>
        </form>
      </Form>
      <div className="space-y-2">
        <h3 className="font-medium">{t('settings.employees.list.title')}</h3>
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
          <p className="text-sm text-muted-foreground text-center p-4">{t('settings.employees.list.no_employees')}</p>
        )}
      </div>
    </div>
  );
}

function StorageSettingsForm() {
    const { t } = useI18n();
    const { toast } = useToast();
    const { storageType, changeStorageType } = useAppContext();

    const handleStorageChange = (value: StorageType) => {
        changeStorageType(value);
        toast({
            title: t('settings.data_storage.toasts.success.title'),
            description: t('settings.data_storage.toasts.success.description', {
                storage: value === 'cloud' ? t('settings.data_storage.form.cloud') : t('settings.data_storage.form.local')
            }),
        });
        window.location.reload();
    }

    return (
        <div className="space-y-4">
            <Label>{t('settings.data_storage.form.label')}</Label>
            <Select value={storageType} onValueChange={handleStorageChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('settings.data_storage.form.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="local">{t('settings.data_storage.form.local')}</SelectItem>
                    <SelectItem value="cloud">{t('settings.data_storage.form.cloud')}</SelectItem>
                </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
                {t('settings.data_storage.form.description')}
            </p>
        </div>
    );
}

const defaultConfig: FirebaseConfig = {
    projectId: 'easystock-wlf7q',
    appId: '1:757179151003:web:a83f3727b9373d0b400c3e',
    storageBucket: 'easystock-wlf7q.appspot.com',
    apiKey: 'AIzaSyD2e_mFdDS8H0ltLT-W4vw57isQfPvzZz4',
    authDomain: 'easystock-wlf7q.firebaseapp.com',
    messagingSenderId: '757179151003',
};

function FirebaseSettingsForm() {
    const { t } = useI18n();
    const { toast } = useToast();
    
    const form = useForm<FirebaseConfig>({
        resolver: zodResolver(firebaseConfigSchema),
        defaultValues: defaultConfig,
    });

    useEffect(() => {
        const savedConfig = localStorage.getItem('firebaseConfig');
        if (savedConfig) {
            form.reset(JSON.parse(savedConfig));
        } else {
            form.reset(defaultConfig);
        }
    }, [form]);

    const onSubmit = (data: FirebaseConfig) => {
        localStorage.setItem('firebaseConfig', JSON.stringify(data));
        toast({
            title: t('settings.firebase.toasts.success.title'),
            description: t('settings.firebase.toasts.success.description')
        });
        // Optionally, force a reload to apply the new config
        setTimeout(() => window.location.reload(), 1500);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField control={form.control} name="projectId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Project ID</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="appId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>App ID</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="apiKey" render={({ field }) => (
                    <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="authDomain" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Auth Domain</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="storageBucket" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Storage Bucket</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                 <FormField control={form.control} name="messagingSenderId" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Messaging Sender ID</FormLabel>
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <Button type="submit">{t('common.save_changes')}</Button>
            </form>
        </Form>
    );
}

export default function SettingsPage() {
  const { t } = useI18n();
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">تنظیمات</h1>
      <Tabs defaultValue="exchange-rates">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="data-storage">ذخیره‌سازی داده</TabsTrigger>
          <TabsTrigger value="firebase-config">اتصال Firebase</TabsTrigger>
          <TabsTrigger value="exchange-rates">نرخ‌های ارز</TabsTrigger>
          <TabsTrigger value="cost-titles">عناوین هزینه</TabsTrigger>
          <TabsTrigger value="employees">کارمندان</TabsTrigger>
        </TabsList>
         <TabsContent value="data-storage">
            <Card>
                <CardHeader>
                <CardTitle>محل ذخیره‌سازی داده‌ها</CardTitle>
                <CardDescription>
                    انتخاب کنید که داده‌های برنامه در مرورگر شما (محلی) یا در فضای ابری (Firebase Firestore) ذخیره شوند.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <StorageSettingsForm />
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="firebase-config">
            <Card>
                <CardHeader>
                <CardTitle>تنظیمات اتصال Firebase</CardTitle>
                <CardDescription>
                    اگر از حالت ذخیره‌سازی ابری استفاده می‌کنید، مشخصات پروژه Firebase خود را در این قسمت وارد کنید.
                </CardDescription>
                </CardHeader>
                <CardContent>
                    <FirebaseSettingsForm />
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
