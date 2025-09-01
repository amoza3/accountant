'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Trash2, Receipt, Repeat } from 'lucide-react';
import {
  getAllExpenses,
  addExpense,
  deleteExpense,
  getAllRecurringExpenses,
  addRecurringExpense,
  deleteRecurringExpense,
} from '@/lib/db';
import type { Expense, RecurringExpense, RecurringExpenseFrequency } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CURRENCY_SYMBOLS } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const expenseSchema = z.object({
  title: z.string().min(1, 'عنوان هزینه الزامی است'),
  amount: z.coerce.number().min(1, 'مبلغ باید بزرگتر از صفر باشد'),
});

const recurringExpenseSchema = z.object({
  title: z.string().min(1, 'عنوان هزینه الزامی است'),
  amount: z.coerce.number().min(1, 'مبلغ باید بزرگتر از صفر باشد'),
  frequency: z.enum(['monthly', 'yearly'], { required_error: 'دوره تکرار الزامی است' }),
  startDate: z.string().min(1, 'تاریخ شروع الزامی است'),
});

function OneTimeExpenseForm({ onExpenseAdded }: { onExpenseAdded: () => void }) {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { title: '', amount: 0 },
  });

  const onSubmit = async (data: z.infer<typeof expenseSchema>) => {
    try {
      const newExpense: Expense = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        ...data,
      };
      await addExpense(newExpense);
      toast({ title: 'موفق', description: 'هزینه جدید با موفقیت ثبت شد.' });
      form.reset();
      onExpenseAdded();
    } catch (error) {
      toast({ variant: 'destructive', title: 'خطا', description: 'ثبت هزینه ناموفق بود.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>ثبت هزینه لحظه‌ای</CardTitle>
        <CardDescription>هزینه‌های جاری و غیرتکراری خود را در این قسمت وارد کنید.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان هزینه</FormLabel>
                  <FormControl>
                    <Input placeholder="مثال: خرید ملزومات" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>مبلغ (تومان)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="500,000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              ثبت هزینه
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function RecurringExpenseForm({ onRecurringExpenseAdded }: { onRecurringExpenseAdded: () => void }) {
    const { toast } = useToast();
    const [recurringExpenses, setRecurringExpenses] = useState<RecurringExpense[]>([]);

    const fetchRecurringExpenses = async () => {
        const expenses = await getAllRecurringExpenses();
        setRecurringExpenses(expenses);
    };

    useEffect(() => {
        fetchRecurringExpenses();
    }, []);

    const form = useForm<z.infer<typeof recurringExpenseSchema>>({
        resolver: zodResolver(recurringExpenseSchema),
        defaultValues: { title: '', amount: 0, startDate: new Date().toISOString().split('T')[0] },
    });

    const onSubmit = async (data: z.infer<typeof recurringExpenseSchema>) => {
        try {
        const newRecurringExpense: RecurringExpense = {
            id: Date.now().toString(),
            ...data,
            frequency: data.frequency as RecurringExpenseFrequency,
            startDate: new Date(data.startDate).toISOString(),
        };
        await addRecurringExpense(newRecurringExpense);
        toast({ title: 'موفق', description: 'هزینه دوره‌ای جدید تعریف شد.' });
        form.reset({ title: '', amount: 0, startDate: new Date().toISOString().split('T')[0] });
        fetchRecurringExpenses();
        } catch (error) {
        toast({ variant: 'destructive', title: 'خطا', description: 'تعریف هزینه دوره‌ای ناموفق بود.' });
        }
    };
    
    const handleDelete = async (id: string) => {
        try {
            await deleteRecurringExpense(id);
            toast({ title: 'موفق', description: 'هزینه دوره‌ای حذف شد.' });
            fetchRecurringExpenses();
        } catch (error) {
            toast({ variant: 'destructive', title: 'خطا', description: 'حذف هزینه دوره‌ای ناموفق بود.' });
        }
    };

    return (
        <Card>
        <CardHeader>
            <CardTitle>تعریف هزینه دوره‌ای</CardTitle>
            <CardDescription>هزینه‌های ثابت مانند اجاره را تعریف کنید تا به طور خودکار ثبت شوند.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>عنوان هزینه</FormLabel>
                        <FormControl>
                            <Input placeholder="مثال: اجاره مغازه" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>مبلغ (تومان)</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="10,000,000" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="frequency"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>دوره تکرار</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="انتخاب کنید" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="monthly">ماهانه</SelectItem>
                                    <SelectItem value="yearly">سالانه</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>تاریخ اولین پرداخت</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                </div>
                <Button type="submit" className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                افزودن هزینه دوره‌ای
                </Button>
            </form>
            </Form>
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">هزینه‌های دوره‌ای تعریف‌شده</h3>
                 {recurringExpenses.length > 0 ? (
                    <ul className="rounded-md border">
                        {recurringExpenses.map((item) => (
                        <li key={item.id} className="flex items-center justify-between p-2 border-b last:border-b-0">
                            <div>
                                <p>{item.title} - {item.amount.toLocaleString('fa-IR')} تومان</p>
                                <p className="text-xs text-muted-foreground">
                                    تکرار: {item.frequency === 'monthly' ? 'ماهانه' : 'سالانه'} - 
                                    شروع از: {new Date(item.startDate).toLocaleDateString('fa-IR')}
                                </p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </li>
                        ))}
                    </ul>
                    ) : (
                    <p className="text-sm text-muted-foreground p-4 text-center">هنوز هزینه دوره‌ای تعریف نشده است.</p>
                    )}
            </div>
        </CardContent>
        </Card>
    );
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const { toast } = useToast();

  const fetchExpenses = async () => {
    try {
      const allExpenses = await getAllExpenses();
      setExpenses(allExpenses);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'بارگذاری لیست مخارج ناموفق بود.',
      });
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await deleteExpense(id);
      toast({
        title: 'هزینه حذف شد',
        description: 'هزینه با موفقیت حذف شد.',
      });
      fetchExpenses();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطا',
        description: 'حذف هزینه ناموفق بود.',
      });
    }
  };
  
  return (
    <div className="grid md:grid-cols-3 gap-8">
       <div className="md:col-span-1">
         <Tabs defaultValue="one-time">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="one-time"><Receipt className="w-4 h-4 ml-1" />لحظه‌ای</TabsTrigger>
                <TabsTrigger value="recurring"><Repeat className="w-4 h-4 ml-1" />دوره‌ای</TabsTrigger>
            </TabsList>
            <TabsContent value="one-time">
                <OneTimeExpenseForm onExpenseAdded={fetchExpenses} />
            </TabsContent>
             <TabsContent value="recurring">
                <RecurringExpenseForm onRecurringExpenseAdded={fetchExpenses} />
            </TabsContent>
        </Tabs>
      </div>
      <div className="md:col-span-2">
        <h1 className="text-2xl font-bold mb-6">لیست مخارج ثبت‌شده</h1>
        <Card>
          <CardContent className="p-0">
             <ScrollArea className="h-[70vh]">
                {expenses.length > 0 ? (
                <ul className="divide-y divide-border">
                    {expenses.map((expense) => (
                    <li key={expense.id} className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2 rounded-full bg-muted text-muted-foreground">
                                <Receipt className="h-5 w-5" />
                            </div>
                            <div>
                                <p className="font-semibold">{expense.title}</p>
                                <p className="text-sm text-muted-foreground">
                                    {new Date(expense.date).toLocaleDateString('fa-IR')}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                           <span className="font-bold text-red-600">
                             {expense.amount.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}
                           </span>
                           <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>آیا مطمئن هستید؟</AlertDialogTitle>
                                <AlertDialogDescription>
                                    این عملیات غیرقابل بازگشت است. هزینه '{expense.title}' برای همیشه حذف خواهد شد.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>لغو</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(expense.id)}>
                                    حذف
                                </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    </li>
                    ))}
                </ul>
                ) : (
                <div className="flex flex-1 items-center justify-center p-10 text-center h-[70vh]">
                    <div>
                        <h3 className="text-xl font-bold tracking-tight">
                        هنوز هزینه‌ای ثبت نشده است
                        </h3>
                        <p className="text-sm text-muted-foreground mt-2">
                        برای شروع، اولین هزینه خود را از فرم کنار صفحه ثبت کنید.
                        </p>
                    </div>
                </div>
                )}
             </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
