'use client';

import { useRef, useEffect, useState } from 'react';
import { useForm, useFieldArray, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Barcode, PlusCircle, Trash2 } from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { Product, CostTitle, ExchangeRate, ProductCost } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { calculateSellingPrice, CURRENCY_SYMBOLS, calculateTotalCostInToman } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { useI18n, useCurrentLocale } from '@/lib/i18n/client';
import { useAppContext } from '@/components/app-provider';

const productSchema = z.object({
  id: z.string().min(1, 'Barcode is required'),
  name: z.string().min(1, 'Product name is required'),
  quantity: z.coerce.number().min(0, 'Quantity cannot be negative'),
  lowStockThreshold: z.coerce.number().min(0, 'Threshold cannot be negative'),
  profitMargin: z.coerce.number().min(0, 'Profit margin cannot be negative'),
  costs: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      amount: z.coerce.number().min(0, 'Amount cannot be negative'),
      currency: z.enum(['TOMAN', 'USD', 'AED', 'CNY']),
    })
  ),
});

export default function AddProductPage() {
  const barcodeRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const locale = useCurrentLocale();
  const [costTitles, setCostTitles] = useState<CostTitle[]>([]);
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const { t } = useI18n();
  const { db } = useAppContext();

  useEffect(() => {
    barcodeRef.current?.focus();
    async function fetchData() {
        if (!db) return;
      const [titles, rates] = await Promise.all([db.getCostTitles(), db.getExchangeRates()]);
      setCostTitles(titles);
      setExchangeRates(rates);
    }
    fetchData();
  }, [db]);

  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      id: '',
      name: '',
      quantity: 0,
      lowStockThreshold: 10,
      profitMargin: 20,
      costs: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'costs',
  });
  
  const watchedValues = form.watch();

  useEffect(() => {
    const productData = {
        ...watchedValues,
        price: 0 // price is calculated, not a form field
    } as Product
    const newPrice = calculateSellingPrice(productData, exchangeRates);
    setCalculatedPrice(newPrice);
  }, [watchedValues, exchangeRates]);

  const onSubmit: SubmitHandler<z.infer<typeof productSchema>> = async (data) => {
    if (!db) return;
    try {
      const existingProduct = await db.getProductById(data.id);
      if (existingProduct) {
        toast({
          variant: 'destructive',
          title: t('add_product.toasts.product_exists.title'),
          description: t('add_product.toasts.product_exists.description', { barcode: data.id }),
        });
        return;
      }
      
      const finalPrice = calculateSellingPrice({...data, price: 0} as Product, exchangeRates);

      const newProduct: Product = {
        ...data,
        price: finalPrice,
      };

      await db.addProduct(newProduct);

      toast({
        title: t('add_product.toasts.product_added.title'),
        description: t('add_product.toasts.product_added.description', { name: data.name }),
      });
      form.reset();
      barcodeRef.current?.focus();
      router.push(`/${locale}/dashboard`);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('add_product.toasts.error.title'),
        description: t('add_product.toasts.error.description'),
      });
    }
  };

  const totalCost = calculateTotalCostInToman(watchedValues.costs as ProductCost[], exchangeRates);

  return (
    <div className="flex justify-center items-start pt-10">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">{t('add_product.title')}</CardTitle>
          <CardDescription>
            {t('add_product.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Core Product Details */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('add_product.form.barcode.label')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder={t('add_product.form.barcode.placeholder')}
                            {...field}
                            ref={barcodeRef}
                            className="pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('add_product.form.product_name.label')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('add_product.form.product_name.placeholder')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('add_product.form.initial_quantity.label')}</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lowStockThreshold"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('add_product.form.low_stock_threshold.label')}</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <Separator />

              {/* Costs Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">{t('add_product.costs_section.title')}</h3>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-end gap-2 p-3 border rounded-md">
                     <FormField
                        control={form.control}
                        name={`costs.${index}.title`}
                        render={({ field: selectField }) => (
                           <FormItem className="w-1/3">
                                <FormLabel>{t('add_product.costs_section.cost_title.label')}</FormLabel>
                                <Select onValueChange={selectField.onChange} defaultValue={selectField.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('add_product.costs_section.cost_title.placeholder')} />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {costTitles.map(ct => (
                                        <SelectItem key={ct.id} value={ct.title}>{ct.title}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                      control={form.control}
                      name={`costs.${index}.amount`}
                      render={({ field }) => (
                        <FormItem className="w-1/3">
                          <FormLabel>{t('add_product.costs_section.amount.label')}</FormLabel>
                          <FormControl><Input type="number" placeholder="100" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`costs.${index}.currency`}
                      render={({ field }) => (
                        <FormItem className="w-1/3">
                          <FormLabel>{t('add_product.costs_section.currency.label')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder={t('add_product.costs_section.currency.placeholder')} /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(CURRENCY_SYMBOLS).map(([code, symbol]) => (
                                <SelectItem key={code} value={code}>{code} ({symbol})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => append({ id: Date.now().toString(), title: costTitles[0]?.title || '', amount: 0, currency: 'TOMAN' })}
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> {t('add_product.costs_section.add_cost_button')}
                </Button>
                {costTitles.length === 0 && (
                    <FormDescription>
                        {t('add_product.costs_section.no_cost_titles_message_1')} <a href={`/${locale}/dashboard/settings`} className="underline">{t('add_product.costs_section.no_cost_titles_message_2')}</a>.
                    </FormDescription>
                )}
              </div>

              <Separator />
              
              {/* Pricing Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-medium">{t('add_product.pricing_section.title')}</h3>
                     <FormField
                        control={form.control}
                        name="profitMargin"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t('add_product.pricing_section.profit_margin.label')}</FormLabel>
                            <FormControl>
                                <Input type="number" placeholder="20" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <div className="p-4 border rounded-md bg-muted">
                        <p className="text-sm text-muted-foreground">{t('add_product.pricing_section.calculated_price.label')}</p>
                        <p className="text-2xl font-bold">
                            {calculatedPrice.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}
                        </p>
                         <FormDescription>
                            {t('add_product.pricing_section.calculated_price.description', { totalCost: totalCost.toLocaleString('fa-IR'), profitMargin: watchedValues.profitMargin })}
                        </FormDescription>
                    </div>
                </div>


              <Button type="submit" className="w-full" disabled={form.formState.isSubmitting || !db}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {form.formState.isSubmitting ? t('add_product.form.adding_button') : t('add_product.form.add_button')}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
