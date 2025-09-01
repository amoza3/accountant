'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Trash2, Receipt } from 'lucide-react';
import {
  getAllExpenses,
  addExpense,
  deleteExpense,
} from '@/lib/db';
import type { Expense } from '@/lib/types';
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

const expenseSchema = z.object({
  title: z.string().min(1, 'عنوان هزینه الزامی است'),
  amount: z.coerce.number().min(1, 'مبلغ باید بزرگتر از صفر باشد'),
});

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const { toast } = useToast();
  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: '',
      amount: 0,
    },
  });

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
  
  const onSubmit = async (data: z.infer<typeof expenseSchema>) => {
    try {
        const newExpense: Expense = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            ...data
        }
        await addExpense(newExpense);
        toast({ title: 'موفق', description: 'هزینه جدید با موفقیت ثبت شد.' });
        form.reset();
        fetchExpenses();
    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'خطا',
            description: 'ثبت هزینه ناموفق بود.',
        });
    }
  };


  return (
    <div className="grid md:grid-cols-3 gap-8">
       <div className="md:col-span-1">
        <Card>
            <CardHeader>
                <CardTitle>ثبت هزینه جدید</CardTitle>
                <CardDescription>هزینه‌های جاری خود را در این قسمت وارد کنید.</CardDescription>
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
                                <Input type="number" placeholder="5,000,000" {...field} />
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
      </div>
      <div className="md:col-span-2">
        <h1 className="text-2xl font-bold mb-6">لیست مخارج</h1>
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
                <div className="flex flex-1 items-center justify-center p-10 text-center">
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
