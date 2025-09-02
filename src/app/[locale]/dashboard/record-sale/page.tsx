'use client';

import { useState, useRef, useEffect, KeyboardEvent, useMemo, useCallback } from 'react';
import { Barcode, Trash2, ShoppingCart, MinusCircle, PlusCircle, UserPlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import type { SaleItem, Product, Customer, Payment, Attachment, PaymentMethod } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { useI18n, useCurrentLocale } from '@/lib/i18n/client';
import { useAppContext } from '@/components/app-provider';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Command,
    CommandInput,
    CommandItem,
    CommandList,
  } from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CURRENCY_SYMBOLS } from '@/lib/utils';

const paymentMethodLabels: Record<PaymentMethod, string> = {
    CASH: 'نقد',
    CARD: 'کارتخوان',
    ONLINE: 'آنلاین',
};

const attachmentSchema = z.object({
  date: z.string().min(1, 'تاریخ سند الزامی است'),
  description: z.string().optional(),
  receiptNumber: z.string().optional(),
  receiptImage: z.string().optional(), // Base64
});

const paymentFormSchema = z.object({
  amount: z.coerce.number().min(1, 'مبلغ باید بزرگتر از صفر باشد'),
  method: z.enum(['CASH', 'CARD', 'ONLINE']),
  date: z.string().min(1, 'تاریخ پرداخت الزامی است'),
});

function AttachmentForm({ onAddAttachment }: { onAddAttachment: (data: z.infer<typeof attachmentSchema>) => void }) {
    const { t } = useI18n();
    const form = useForm<z.infer<typeof attachmentSchema>>({
        resolver: zodResolver(attachmentSchema),
        defaultValues: { description: '', receiptNumber: '', receiptImage: '', date: new Date().toISOString().slice(0, 16) },
    });
    
    const [preview, setPreview] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
                form.setValue('receiptImage', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = (data: z.infer<typeof attachmentSchema>) => {
        onAddAttachment(data);
        form.reset();
        setPreview('');
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 p-4 border rounded-md">
                 <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('expenses.attachment_form.date_label')}</FormLabel>
                        <FormControl>
                            <Input type="datetime-local" {...field} />
                        </FormControl>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('expenses.attachment_form.description_label')}</FormLabel>
                        <FormControl>
                            <Textarea placeholder={t('expenses.attachment_form.description_placeholder')} {...field} />
                        </FormControl>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="receiptNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('expenses.attachment_form.receipt_number_label')}</FormLabel>
                        <FormControl>
                            <Input placeholder="123456" {...field} />
                        </FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="receiptImage"
                    render={() => (
                        <FormItem>
                        <FormLabel>{t('expenses.attachment_form.receipt_image_label')}</FormLabel>
                        <FormControl>
                            <Input type="file" accept="image/*" onChange={handleFileChange} className="pt-2"/>
                        </FormControl>
                        </FormItem>
                    )}
                    />
                {preview && (
                    <div className="relative w-32 h-32">
                        <img src={preview} alt="پیش‌نمایش رسید" className="rounded-md object-cover w-full h-full" />
                        <Button type="button" size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6" onClick={() => { form.setValue('receiptImage', ''); setPreview(''); }}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                    </div>
                )}
                 <Button type="submit">{t('common.add')}</Button>
            </form>
        </Form>
    );
}

function PaymentForm({ onAddPayment }: { onAddPayment: (payment: Omit<Payment, 'id'>, attachments: Omit<Attachment, 'id'|'sourceId'|'sourceType'>[]) => void }) {
    const { t } = useI18n();
    const [attachments, setAttachments] = useState<z.infer<typeof attachmentSchema>[]>([]);
    const form = useForm<z.infer<typeof paymentFormSchema>>({
        resolver: zodResolver(paymentFormSchema),
        defaultValues: { amount: 0, method: 'CARD', date: new Date().toISOString().slice(0, 16) }
    });

    const handleAddAttachment = (data: z.infer<typeof attachmentSchema>) => {
        setAttachments([...attachments, data]);
    }

    const handleSubmit = (data: z.infer<typeof paymentFormSchema>) => {
        onAddPayment({ ...data, attachmentIds: [] }, attachments);
        form.reset();
        setAttachments([]);
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 p-4 border rounded-md">
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="amount" render={({field}) => (
                        <FormItem>
                            <FormLabel>{t('record_sale.payment_form.amount_label')}</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage/>
                        </FormItem>
                    )}/>
                     <FormField control={form.control} name="date" render={({field}) => (
                        <FormItem>
                            <FormLabel>{t('record_sale.payment_form.date_label')}</FormLabel>
                            <FormControl><Input type="datetime-local" {...field} /></FormControl>
                             <FormMessage/>
                        </FormItem>
                    )}/>
                </div>
                <FormField control={form.control} name="method" render={({field}) => (
                        <FormItem>
                        <FormLabel>{t('record_sale.payment_form.method_label')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue/></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                {Object.entries(paymentMethodLabels).map(([method, label]) => (
                                    <SelectItem key={method} value={method}>{label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                         <FormMessage/>
                    </FormItem>
                )}/>
                <Separator />
                <div className="space-y-2">
                    <Label>{t('common.attachments')}</Label>
                    {attachments.map((att, i) => (
                         <div key={i} className="flex items-center justify-between p-2 border rounded-md bg-muted">
                            <span>{att.receiptNumber || att.description || 'سند'}</span>
                             <Button type="button" size="icon" variant="ghost" onClick={() => setAttachments(attachments.filter((_, idx) => idx !== i))}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                    <Dialog>
                        <DialogTrigger asChild><Button type="button" variant="outline" size="sm">{t('common.add_attachment')}</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>{t('record_sale.payment_form.add_attachment_title')}</DialogTitle></DialogHeader>
                            <AttachmentForm onAddAttachment={handleAddAttachment} />
                        </DialogContent>
                    </Dialog>
                </div>
                <Button type="submit" size="sm">{t('common.add_payment')}</Button>
            </form>
        </Form>
    );
}

export default function RecordSalePage() {
  const [cart, setCart] = useState<Omit<SaleItem, 'totalCost'>[]>([]);
  const [barcode, setBarcode] = useState('');
  const barcodeRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const { t } = useI18n();
  const locale = useCurrentLocale();
  const { db } = useAppContext();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productSearchTerm, setProductSearchTerm] = useState('');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  
  type TempPayment = Omit<Payment, 'id'> & { attachments: Omit<Attachment, 'id'|'sourceId'|'sourceType'>[] };
  const [payments, setPayments] = useState<TempPayment[]>([]);

  
  useEffect(() => {
    if (!db) return;
    barcodeRef.current?.focus();
    async function fetchData() {
        const [customersData, productsData] = await Promise.all([
            db.getAllCustomers(),
            db.getAllProducts()
        ]);
        setCustomers(customersData);
        setAllProducts(productsData);
    }
    fetchData();
  }, [db]);

  const total = useMemo(() => cart.reduce((acc, item) => acc + item.price * item.quantity, 0), [cart]);
  const totalPaid = useMemo(() => payments.reduce((acc, p) => acc + p.amount, 0), [payments]);
  const remainingAmount = useMemo(() => total - totalPaid, [total, totalPaid]);

  const handleAddProductToCart = useCallback((product: Product) => {
     if (product.quantity <= 0) {
        toast({
            variant: 'destructive',
            title: t('record_sale.toasts.out_of_stock.title'),
            description: t('record_sale.toasts.out_of_stock.description', { name: product.name }),
        });
        return;
    }

    setCart((prevCart) => {
        const existingItem = prevCart.find((item) => item.productId === product.id);
        if (existingItem) {
        if (existingItem.quantity >= product.quantity) {
            toast({
                variant: 'destructive',
                title: t('record_sale.toasts.stock_limit_reached.title'),
                description: t('record_sale.toasts.stock_limit_reached.description', { name: product.name }),
            });
            return prevCart;
        }
        return prevCart.map((item) =>
            item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        } else {
        return [
            ...prevCart,
            {
            productId: product.id,
            productName: product.name,
            quantity: 1,
            price: product.price,
            },
        ];
        }
    });
  }, [toast, t]);

  const handleBarcodeAdd = async (scannedBarcode: string) => {
    if (!scannedBarcode || !db) return;

    try {
      const product = await db.getProductById(scannedBarcode);
      if (product) {
        handleAddProductToCart(product);
      } else {
        toast({
          variant: 'destructive',
          title: t('record_sale.toasts.product_not_found.title'),
          description: t('record_sale.toasts.product_not_found.description', { barcode: scannedBarcode }),
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: t('record_sale.toasts.db_error.title'),
        description: t('record_sale.toasts.db_error.description'),
      });
    } finally {
      setBarcode('');
      barcodeRef.current?.focus();
    }
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBarcodeAdd(barcode);
    }
  };


  const updateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setCart(cart.filter(item => item.productId !== productId));
      return;
    }

    setCart(cart.map(item => item.productId === productId ? { ...item, quantity: newQuantity } : item));
  };
  
  const handleAddPayment = (payment: Omit<Payment, 'id'>, attachments: Omit<Attachment, 'id'|'sourceId'|'sourceType'>[]) => {
      setPayments([...payments, { ...payment, attachments }]);
  }

  const completeSale = async () => {
    if (!db) return;
    if (cart.length === 0) {
      toast({
        variant: 'destructive',
        title: t('record_sale.toasts.empty_cart.title'),
        description: t('record_sale.toasts.empty_cart.description'),
      });
      return;
    }

    try {
        let newCustomerNameToAdd: string | undefined = undefined;
        if (customerSearch && !selectedCustomer) {
            newCustomerNameToAdd = customerSearch;
        }
        
        const paymentIds = await Promise.all(
            payments.map(p => {
                const { attachments, ...paymentData } = p;
                return db.addPayment(paymentData, attachments);
            })
        );

        await db.addSale({
            items: cart,
            total,
            date: new Date().toISOString(),
            customerId: selectedCustomer?.id,
            customerName: selectedCustomer?.name,
            paymentIds: paymentIds,
        }, newCustomerNameToAdd);

        toast({
            title: t('record_sale.toasts.sale_complete.title'),
            description: t('record_sale.toasts.sale_complete.description', { total: total.toLocaleString('fa-IR') }),
            className: 'bg-accent text-accent-foreground border-accent',
        });
        setCart([]);
        setSelectedCustomer(null);
        setCustomerSearch('');
        setPayments([]);
        router.push(`/${locale}/dashboard`);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: t('record_sale.toasts.error.title'),
        description: t('record_sale.toasts.error.description'),
      });
    }
  };
  
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers;
    return customers.filter(
        c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
             c.phone?.includes(customerSearch)
    );
  }, [customerSearch, customers]);

  const filteredProducts = useMemo(() => {
    return allProducts.filter(
        product => product.name.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
                   product.id.toLowerCase().includes(productSearchTerm.toLowerCase())
    );
  }, [allProducts, productSearchTerm]);


  return (
    <div className="grid md:grid-cols-5 gap-8 items-start">
        {/* Cart and Summary - Left Column */}
      <div className="md:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle>{t('record_sale.cart_title')}</CardTitle>
            <CardDescription>{t('record_sale.cart_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-md min-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('record_sale.cart_table.product')}</TableHead>
                    <TableHead className="text-center">{t('record_sale.cart_table.quantity')}</TableHead>
                    <TableHead className="text-left">{t('record_sale.cart_table.price')}</TableHead>
                    <TableHead className="text-left">{t('record_sale.cart_table.total')}</TableHead>
                    <TableHead className="text-left">{t('record_sale.cart_table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.length > 0 ? (
                    cart.map((item) => (
                      <TableRow key={item.productId}>
                        <TableCell className="font-medium">{item.productName}</TableCell>
                        <TableCell className="text-center">
                          <div className='flex items-center justify-center gap-2'>
                            <Button size="icon" variant="ghost" onClick={() => updateQuantity(item.productId, item.quantity - 1)}><MinusCircle className="h-4 w-4" /></Button>
                            {item.quantity}
                            <Button size="icon" variant="ghost" onClick={() => updateQuantity(item.productId, item.quantity + 1)}><PlusCircle className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-left">{item.price.toLocaleString('fa-IR')}</TableCell>
                        <TableCell className="text-left">{(item.price * item.quantity).toLocaleString('fa-IR')}</TableCell>
                        <TableCell className="text-left">
                          <Button variant="destructive" size="icon" onClick={() => updateQuantity(item.productId, 0)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center h-24">
                        {t('record_sale.cart_table.empty')}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <Separator className="my-6"/>
            <Card className="sticky top-8">
                <CardHeader>
                    <CardTitle>{t('record_sale.summary.title')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="flex justify-between items-baseline text-2xl font-bold">
                            <span>{t('record_sale.summary.total')}:</span>
                            <Badge className="text-2xl" variant="secondary">{total.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}</Badge>
                        </div>
                         <div className="flex justify-between items-baseline text-lg">
                            <span className="text-green-600">{t('record_sale.summary.paid')}:</span>
                            <span className="font-semibold text-green-600">{totalPaid.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}</span>
                        </div>
                         <div className="flex justify-between items-baseline text-lg">
                            <span className="text-red-600">{t('record_sale.summary.remaining')}:</span>
                            <span className="font-semibold text-red-600">{remainingAmount.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}</span>
                        </div>
                    </div>
                    <Separator/>
                    <div>
                        <h4 className="font-medium mb-2">{t('record_sale.summary.new_payment_title')}</h4>
                        <PaymentForm onAddPayment={handleAddPayment}/>
                    </div>

                     {payments.length > 0 && (
                        <div>
                             <h4 className="font-medium mb-2">{t('record_sale.summary.registered_payments_title')}</h4>
                            <div className="space-y-2">
                                {payments.map((p, i) => (
                                    <div key={i} className="flex justify-between items-center p-2 border rounded-md bg-muted">
                                        <span>{paymentMethodLabels[p.method]}: {p.amount.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}</span>
                                        <Button variant="ghost" size="icon" onClick={() => setPayments(payments.filter((_, idx) => idx !== i))}>
                                            <Trash2 className="w-4 h-4 text-destructive"/>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    <Separator/>

                    <div>
                        <Label>{t('record_sale.summary.customer_label')}</Label>
                        <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button variant="outline" role="combobox" aria-expanded={isCustomerPopoverOpen} className="w-full justify-between">
                                    {selectedCustomer ? selectedCustomer.name : t('record_sale.summary.select_customer_placeholder')}
                                    <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] p-0">
                                <Command>
                                    <CommandInput 
                                        placeholder={t('record_sale.summary.search_customer_placeholder')}
                                        value={customerSearch}
                                        onValueChange={setCustomerSearch}
                                    />
                                    <CommandList>
                                        {filteredCustomers.length === 0 && customerSearch && (
                                            <CommandItem
                                                onSelect={() => {
                                                    setSelectedCustomer({ id: '', name: customerSearch });
                                                    setIsCustomerPopoverOpen(false);
                                                }}
                                                className="flex items-center gap-2"
                                            >
                                                <UserPlus className="h-4 w-4" />
                                                <span>{t('record_sale.summary.add_new_customer', {name: customerSearch})}</span>
                                            </CommandItem>
                                        )}
                                        {filteredCustomers.map((customer) => (
                                        <CommandItem
                                            key={customer.id}
                                            value={customer.name}
                                            onSelect={() => {
                                                setSelectedCustomer(customer);
                                                setCustomerSearch(customer.name);
                                                setIsCustomerPopoverOpen(false);
                                            }}
                                        >
                                            {customer.name} {customer.phone && `(${customer.phone})`}
                                        </CommandItem>
                                        ))}
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" size="lg" onClick={completeSale} disabled={!db}>
                    <ShoppingCart className="mr-2 h-5 w-5" /> {t('record_sale.summary.complete_sale_button')}
                    </Button>
                </CardFooter>
            </Card>
          </CardContent>
        </Card>
      </div>

       {/* Product List - Right Column */}
      <div className="md:col-span-2">
        <Card>
            <CardHeader>
                <CardTitle>{t('record_sale.product_list.title')}</CardTitle>
                <CardDescription>{t('record_sale.product_list.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        placeholder={t('record_sale.product_list.search_placeholder')}
                        value={productSearchTerm}
                        onChange={(e) => setProductSearchTerm(e.target.value)}
                        className="pr-10"
                    />
                </div>
                 <div className="relative">
                    <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                        ref={barcodeRef}
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('record_sale.barcode_placeholder')}
                        className="pr-10"
                    />
                </div>
                <ScrollArea className="h-[60vh] border rounded-md">
                   <div className="p-2">
                     {filteredProducts.length > 0 ? (
                        filteredProducts.map(product => (
                            <div key={product.id} onClick={() => handleAddProductToCart(product)} className="flex justify-between items-center p-2 rounded-md hover:bg-muted cursor-pointer">
                                <div>
                                    <p className="font-semibold">{product.name}</p>
                                    <p className="text-sm text-muted-foreground">{t('record_sale.product_list.stock_label')}: {product.quantity}</p>
                                </div>
                                <span className="font-mono">{product.price.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}</span>
                            </div>
                        ))
                     ) : (
                         <div className="text-center text-muted-foreground p-4">{t('record_sale.product_list.not_found')}</div>
                     )}
                   </div>
                </ScrollArea>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
