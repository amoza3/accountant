'use client';

import { useState, useRef, useEffect, useCallback, useTransition, useMemo } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
    Command,
    CommandInput,
    CommandItem,
    CommandList,
  } from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { getProductById, addSale, getAllCustomers } from '@/lib/db';
import type { SaleItem, Customer, PaymentMethod } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import { Label } from '@/components/ui/label';

export default function RecordSalePage() {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [barcode, setBarcode] = useState('');
  const barcodeRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerPopoverOpen, setIsCustomerPopoverOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CARD');
  
  const paymentMethodLabels: Record<PaymentMethod, string> = {
    CASH: 'نقد',
    CARD: 'کارتخوان',
    ONLINE: 'آنلاین',
  };

  useEffect(() => {
    barcodeRef.current?.focus();
    async function fetchCustomers() {
        const allCustomers = await getAllCustomers();
        setCustomers(allCustomers);
    }
    fetchCustomers();
  }, []);

  const handleBarcodeAdd = useCallback(async (scannedBarcode: string) => {
    if (!scannedBarcode) return;

    try {
      const product = await getProductById(scannedBarcode);
      if (product) {
        if (product.quantity <= 0) {
          toast({
            variant: 'destructive',
            title: 'موجودی تمام شد',
            description: `موجودی '${product.name}' به اتمام رسیده است.`,
          });
          return;
        }

        setCart((prevCart) => {
          const existingItem = prevCart.find((item) => item.productId === product.id);
          if (existingItem) {
            if (existingItem.quantity >= product.quantity) {
              toast({
                variant: 'destructive',
                title: 'تعداد بیش از موجودی',
                description: `امکان افزودن تعداد بیشتری از '${product.name}' وجود ندارد.`,
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
      } else {
        toast({
          variant: 'destructive',
          title: 'محصول یافت نشد',
          description: `محصولی با بارکد ${scannedBarcode} یافت نشد.`,
        });
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطای پایگاه داده',
        description: 'امکان بازیابی اطلاعات محصول وجود نداشت.',
      });
    } finally {
      setBarcode('');
      barcodeRef.current?.focus();
    }
  }, [toast]);

  const handleBarcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBarcode = e.target.value;
    setBarcode(newBarcode);
    startTransition(() => {
        handleBarcodeAdd(newBarcode);
    });
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

  const total = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const completeSale = async () => {
    if (cart.length === 0) {
      toast({
        variant: 'destructive',
        title: 'سبد خرید خالی',
        description: 'برای تکمیل فروش، کالاها را به سبد خرید اضافه کنید.',
      });
      return;
    }

    try {
        let newCustomerNameToAdd: string | undefined = undefined;
        if (customerSearch && !selectedCustomer) {
            newCustomerNameToAdd = customerSearch;
        }

      await addSale({
        id: Date.now(),
        items: cart,
        total,
        date: new Date().toISOString(),
        customerId: selectedCustomer?.id,
        customerName: selectedCustomer?.name,
        paymentMethod: paymentMethod,
      }, newCustomerNameToAdd);

      toast({
        title: 'فروش تکمیل شد!',
        description: `فروش به مبلغ ${total.toLocaleString('fa-IR')} تومان با موفقیت ثبت شد.`,
        className: 'bg-accent text-accent-foreground border-accent',
      });
      setCart([]);
      setSelectedCustomer(null);
      setCustomerSearch('');
      router.push(`/dashboard`);
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'تکمیل فروش ناموفق بود. موجودی به‌روزرسانی نشد.',
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


  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>فروش فعلی</CardTitle>
            <CardDescription>برای افزودن کالاها به فروش، بارکد را اسکن یا وارد کنید.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative mb-4">
              <Barcode className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                ref={barcodeRef}
                value={barcode}
                onChange={handleBarcodeChange}
                onKeyDown={handleKeyDown}
                placeholder="بارکد را اسکن یا وارد کنید..."
                className="pr-10"
              />
            </div>
            <div className="border rounded-md min-h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>محصول</TableHead>
                    <TableHead className="text-center">تعداد</TableHead>
                    <TableHead className="text-left">قیمت</TableHead>
                    <TableHead className="text-left">جمع کل</TableHead>
                    <TableHead className="text-left">عملیات</TableHead>
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
                        سبد خرید خالی است
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="md:col-span-1">
        <Card className="sticky top-8">
          <CardHeader>
            <CardTitle>خلاصه</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">

             <div>
                <Label>مشتری</Label>
                 <Popover open={isCustomerPopoverOpen} onOpenChange={setIsCustomerPopoverOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" aria-expanded={isCustomerPopoverOpen} className="w-full justify-between">
                            {selectedCustomer ? selectedCustomer.name : 'انتخاب مشتری...'}
                            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0">
                        <Command>
                            <CommandInput 
                                placeholder="جستجوی نام یا شماره مشتری..."
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
                                        <span>افزودن مشتری جدید: "{customerSearch}"</span>
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
            
            <div>
                <Label>روش پرداخت</Label>
                <Select value={paymentMethod} onValueChange={(value: PaymentMethod) => setPaymentMethod(value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="روش پرداخت را انتخاب کنید" />
                    </SelectTrigger>
                    <SelectContent>
                        {Object.entries(paymentMethodLabels).map(([method, label]) => (
                            <SelectItem key={method} value={method}>{label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Separator/>

            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">تعداد اقلام</span>
              <span>{cart.reduce((acc, item) => acc + item.quantity, 0)}</span>
            </div>
             <div className="flex justify-between items-center text-2xl font-bold">
              <span>جمع کل</span>
              <Badge className="text-2xl" variant="secondary">{total.toLocaleString('fa-IR')} تومان</Badge>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" size="lg" onClick={completeSale}>
              <ShoppingCart className="mr-2 h-5 w-5" /> تکمیل فروش
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
