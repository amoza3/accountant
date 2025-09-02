'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2, PlusCircle, Users } from 'lucide-react';

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
import {
  getExchangeRates,
  saveExchangeRates,
  getCostTitles,
  addCostTitle,
  deleteCostTitle,
  addEmployee,
  getAllEmployees,
  deleteEmployee
} from '@/lib/db';
import type { ExchangeRate, CostTitle, Employee } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

function ExchangeRatesForm() {
  const { t } = useI18n();
  const { toast } = useToast();
  const form = useForm<z.infer<typeof exchangeRatesSchema>>({
    resolver: zodResolver(exchangeRatesSchema),
    defaultValues: {
      rates: [],
    },
  });

  useEffect(() => {
    async function loadRates() {
      const rates = await getExchangeRates();
      form.reset({ rates });
    }
    loadRates();
  }, [form]);

  const onSubmit = async (data: z.infer<typeof exchangeRatesSchema>) => {
    try {
      await saveExchangeRates(data.rates as ExchangeRate[]);
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
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {t('settings.exchange_rates.form.save_button')}
        </Button>
      </form>
    </Form>
  );
}

function CostTitlesForm() {
  const { t } = useI18n();
  const { toast } = useToast();
  const [costTitles, setCostTitles] = useState<CostTitle[]>([]);
  const form = useForm<z.infer<typeof costTitleSchema>>({
    resolver: zodResolver(costTitleSchema),
    defaultValues: { title: '' },
  });

  const fetchCostTitles = async () => {
    const titles = await getCostTitles();
    setCostTitles(titles);
  };

  useEffect(() => {
    fetchCostTitles();
  }, []);

  const onSubmit = async (data: z.infer<typeof costTitleSchema>) => {
    try {
      const newTitle = { id: Date.now().toString(), title: data.title };
      await addCostTitle(newTitle);
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
    try {
      await deleteCostTitle(id);
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
          <Button type="submit" disabled={form.formState.isSubmitting}>
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const form = useForm<z.infer<typeof employeeSchema>>({
    resolver: zodResolver(employeeSchema),
    defaultValues: { name: '', position: '', salary: 0 },
  });

  const fetchEmployees = async () => {
    const allEmployees = await getAllEmployees();
    setEmployees(allEmployees);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const onSubmit = async (data: z.infer<typeof employeeSchema>) => {
    try {
      await addEmployee(data);
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
    try {
      await deleteEmployee(id);
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
          <Button type="submit" disabled={form.formState.isSubmitting}>
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


export default function SettingsPage() {
  const { t } = useI18n();
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">{t('settings.title')}</h1>
      <Tabs defaultValue="exchange-rates">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="exchange-rates">{t('settings.exchange_rates.tab')}</TabsTrigger>
          <TabsTrigger value="cost-titles">{t('settings.cost_titles.tab')}</TabsTrigger>
          <TabsTrigger value="employees">{t('settings.employees.tab')}</TabsTrigger>
        </TabsList>
        <TabsContent value="exchange-rates">
          <Card>
            <CardHeader>
              <CardTitle>{t('settings.exchange_rates.title')}</CardTitle>
              <CardDescription>
                {t('settings.exchange_rates.description')}
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
              <CardTitle>{t('settings.cost_titles.title')}</CardTitle>
              <CardDescription>
                {t('settings.cost_titles.description')}
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
              <CardTitle>{t('settings.employees.title')}</CardTitle>
              <CardDescription>
                {t('settings.employees.description')}
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
