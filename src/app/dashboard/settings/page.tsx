'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Trash2, PlusCircle } from 'lucide-react';

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
} from '@/lib/db';
import type { ExchangeRate, CostTitle } from '@/lib/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

function ExchangeRatesForm() {
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
      toast({ title: 'موفق', description: 'نرخ ارز ذخیره شد.' });
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
                <FormLabel>{`۱ ${rate.currency} به تومان`}</FormLabel>
                <FormControl>
                  <Input type="number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
        <Button type="submit" disabled={form.formState.isSubmitting}>
          ذخیره نرخ ارز
        </Button>
      </form>
    </Form>
  );
}

function CostTitlesForm() {
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
      toast({ title: 'موفق', description: 'عنوان هزینه اضافه شد.' });
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
    try {
      await deleteCostTitle(id);
      toast({ title: 'موفق', description: 'عنوان هزینه حذف شد.' });
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
                  <Input placeholder="مثال: حمل از چین" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting}>
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
          <p className="text-sm text-muted-foreground">هنوز عنوان هزینه‌ای تعریف نشده است.</p>
        )}
      </div>
    </div>
  );
}


export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">تنظیمات</h1>
      <Tabs defaultValue="exchange-rates">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="exchange-rates">نرخ ارز</TabsTrigger>
          <TabsTrigger value="cost-titles">عناوین هزینه</TabsTrigger>
        </TabsList>
        <TabsContent value="exchange-rates">
          <Card>
            <CardHeader>
              <CardTitle>نرخ ارز</CardTitle>
              <CardDescription>
                ارزش ارزهای خارجی را نسبت به تومان تنظیم کنید.
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
                انواع هزینه‌هایی که می‌توانید به محصولات اضافه کنید را مدیریت کنید.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CostTitlesForm />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
