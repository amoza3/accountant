'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { PlusCircle, Trash2, Receipt, Repeat, RefreshCw, Paperclip, Pencil } from 'lucide-react';
import {
  getAllExpenses,
  addExpense,
  deleteExpense,
  getAllRecurringExpenses,
  addRecurringExpense,
  deleteRecurringExpense,
  applyRecurringExpenses,
  addAttachment,
  getAttachmentsBySourceId,
  deleteAttachment,
  updateExpense
} from '@/lib/db';
import type { Expense, RecurringExpense, RecurringExpenseFrequency, Attachment } from '@/lib/types';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const attachmentSchema = z.object({
  description: z.string().optional(),
  receiptNumber: z.string().optional(),
  receiptImage: z.string().optional(), // Base64
  date: z.string().min(1, 'تاریخ سند الزامی است'),
});

const expenseSchema = z.object({
  title: z.string().min(1, 'عنوان هزینه الزامی است'),
  amount: z.coerce.number().min(1, 'مبلغ باید بزرگتر از صفر باشد'),
  date: z.string().min(1, 'تاریخ هزینه الزامی است'),
});

const recurringExpenseSchema = z.object({
  title: z.string().min(1, 'عنوان هزینه الزامی است'),
  amount: z.coerce.number().min(1, 'مبلغ باید بزرگتر از صفر باشد'),
  frequency: z.enum(['monthly', 'yearly'], { required_error: 'دوره تکرار الزامی است' }),
  startDate: z.string().min(1, 'تاریخ شروع الزامی است'),
});


function AttachmentForm({ onAddAttachment }: { onAddAttachment: (data: z.infer<typeof attachmentSchema>) => void }) {
    const form = useForm<z.infer<typeof attachmentSchema>>({
        resolver: zodResolver(attachmentSchema),
        defaultValues: { description: '', receiptNumber: '', receiptImage: '', date: new Date().toISOString().split('T')[0] },
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
                        <FormLabel>تاریخ سند</FormLabel>
                        <FormControl>
                            <Input type="date" {...field} />
                        </FormControl>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>توضیحات (اختیاری)</FormLabel>
                        <FormControl>
                            <Textarea placeholder="جزئیات بیشتر..." {...field} />
                        </FormControl>
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="receiptNumber"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>شماره رسید/سند (اختیاری)</FormLabel>
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
                        <FormLabel>تصویر رسید (اختیاری)</FormLabel>
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
                 <Button type="submit">افزودن سند</Button>
            </form>
        </Form>
    );
}

function ExpenseForm({ onExpenseAdded, expenseToEdit, onExpenseUpdated }: { onExpenseAdded: () => void, expenseToEdit?: Expense & { attachments?: Attachment[]}, onExpenseUpdated?: () => void }) {
  const { toast } = useToast();
  const [attachments, setAttachments] = useState<Partial<Attachment>[]>(expenseToEdit?.attachments || []);
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<string[]>([]);
  const form = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: expenseToEdit || { title: '', amount: 0, date: new Date().toISOString().split('T')[0] },
  });

  const handleAddAttachment = (data: z.infer<typeof attachmentSchema>) => {
      setAttachments([...attachments, { ...data, id: Date.now().toString()}]);
  }
  
  const handleRemoveAttachment = (id: string) => {
      setAttachments(attachments.filter(att => att.id !== id));
      if(!id.startsWith('new-')) { // Only track deletions of existing attachments
          setDeletedAttachmentIds([...deletedAttachmentIds, id]);
      }
  }

  const onSubmit = async (data: z.infer<typeof expenseSchema>) => {
    try {
        const attachmentData = attachments.map(({id, ...rest}) => rest);
        if (expenseToEdit && onExpenseUpdated) {
            const newAttachments = attachmentData.filter(att => !expenseToEdit.attachmentIds.includes((att as Attachment).id)) as Omit<Attachment, 'id'|'sourceId'|'sourceType'>[];
            await updateExpense({ ...expenseToEdit, ...data}, newAttachments, deletedAttachmentIds);
            toast({ title: 'موفق', description: 'هزینه با موفقیت بروزرسانی شد.' });
            onExpenseUpdated();
        } else {
            await addExpense({
                ...data,
            }, attachmentData);
            toast({ title: 'موفق', description: 'هزینه جدید با موفقیت ثبت شد.' });
            form.reset();
            setAttachments([]);
            onExpenseAdded();
        }
    } catch (error) {
      console.error(error)
      toast({ variant: 'destructive', title: 'خطا', description: 'عملیات ناموفق بود.' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{expenseToEdit ? 'ویرایش هزینه' : 'ثبت هزینه لحظه‌ای'}</CardTitle>
        <CardDescription>{expenseToEdit ? 'جزئیات هزینه را ویرایش کنید.' : 'هزینه‌های جاری و غیرتکراری خود را در این قسمت وارد کنید.'}</CardDescription>
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
            <div className="grid grid-cols-2 gap-4">
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
                 <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>تاریخ هزینه</FormLabel>
                    <FormControl>
                        <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            
            <div className="space-y-4">
                <Label>اسناد پیوست</Label>
                <div className="space-y-2">
                    {attachments.map(att => (
                        <div key={att.id} className="flex items-center justify-between p-2 border rounded-md">
                            <span>{att.receiptNumber || att.description || 'سند بدون عنوان'}</span>
                             <Button type="button" size="icon" variant="ghost" onClick={() => handleRemoveAttachment(att.id!)}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                        </div>
                    ))}
                </div>
                 <Dialog>
                    <DialogTrigger asChild>
                        <Button type="button" variant="outline"><PlusCircle className="mr-2 h-4 w-4" />افزودن سند</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>افزودن سند جدید</DialogTitle>
                        </DialogHeader>
                        <AttachmentForm onAddAttachment={handleAddAttachment} />
                    </DialogContent>
                </Dialog>
            </div>

            <Button type="submit" className="w-full">
              <PlusCircle className="mr-2 h-4 w-4" />
              {expenseToEdit ? 'ذخیره تغییرات' : 'ثبت هزینه'}
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
        onRecurringExpenseAdded();
        } catch (error) {
        toast({ variant: 'destructive', title: 'خطا', description: 'تعریف هزینه دوره‌ای ناموفق بود.' });
        }
    };
    
    const handleDelete = async (id: string) => {
        try {
            await deleteRecurringExpense(id);
            toast({ title: 'موفق', description: 'هزینه دوره‌ای حذف شد.' });
            fetchRecurringExpenses();
             onRecurringExpenseAdded();
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

function ExpenseListItem({ expense, onUpdate }: { expense: Expense & { attachments: Attachment[] }, onUpdate: () => void }) {
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    return (
        <li className="flex items-center justify-between p-4">
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
            <div className="flex items-center gap-2">
                {expense.attachments && expense.attachments.length > 0 && (
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="icon"><Paperclip className="h-4 w-4" /></Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>اسناد پیوست: {expense.title}</DialogTitle>
                            </DialogHeader>
                            <ul className="space-y-2">
                                {expense.attachments.map(att => (
                                    <li key={att.id} className="border p-2 rounded-md">
                                        <p>{att.description || 'سند'}</p>
                                        <p className="text-xs text-muted-foreground">{att.receiptNumber}</p>
                                        {att.receiptImage && <img src={att.receiptImage} alt="رسید" className="mt-2 max-w-full h-auto rounded" />}
                                    </li>
                                ))}
                            </ul>
                        </DialogContent>
                    </Dialog>
                )}
                <span className="font-bold text-red-600">
                    {expense.amount.toLocaleString('fa-IR')} {CURRENCY_SYMBOLS.TOMAN}
                </span>
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                         <DialogHeader>
                            <DialogTitle>ویرایش هزینه</DialogTitle>
                        </DialogHeader>
                        <ExpenseForm expenseToEdit={expense} onExpenseUpdated={() => {
                            onUpdate();
                            setIsEditDialogOpen(false);
                        }} onExpenseAdded={() => {}} />
                    </DialogContent>
                </Dialog>
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
                            <AlertDialogAction onClick={() => (window as any).handleDeleteExpense(expense.id)}>
                                حذف
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </li>
    );
}

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<(Expense & { attachments: Attachment[] })[]>([]);
  const [isProcessingRecurring, setIsProcessingRecurring] = useState(false);
  const { toast } = useToast();

  const fetchExpenses = async () => {
    try {
        const allExpenses = await getAllExpenses();
        const expensesWithAttachments = await Promise.all(allExpenses.map(async (exp) => {
            const attachments = await getAttachmentsBySourceId(exp.id);
            return { ...exp, attachments };
        }));
        setExpenses(expensesWithAttachments);
    } catch (error) {
         toast({
            variant: 'destructive',
            title: 'خطا',
            description: 'بارگذاری لیست مخارج ناموفق بود.',
        });
    }
  };
  
  const handleApplyRecurring = async () => {
      setIsProcessingRecurring(true);
      try {
        const addedCount = await applyRecurringExpenses();
        if (addedCount > 0) {
            toast({
                title: 'هزینه‌های دوره‌ای اعمال شد',
                description: `${addedCount} هزینه دوره‌ای به طور خودکار به لیست مخارج اضافه شد.`,
            });
        } else {
             toast({
                title: 'به‌روز',
                description: 'هیچ هزینه دوره‌ای جدیدی برای ثبت وجود نداشت.',
            });
        }
        fetchExpenses();
      } catch (error) {
         console.error(error);
         toast({
            variant: 'destructive',
            title: 'خطا در پردازش',
            description: 'اعمال هزینه‌های دوره‌ای ناموفق بود.',
        });
      } finally {
          setIsProcessingRecurring(false);
      }
  }

  useEffect(() => {
    fetchExpenses();
    
    (window as any).handleDeleteExpense = async (id: string) => {
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

    return () => {
        delete (window as any).handleDeleteExpense;
    }
  }, []);

  return (
    <div className="grid md:grid-cols-3 gap-8">
       <div className="md:col-span-1">
         <Tabs defaultValue="one-time">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="one-time"><Receipt className="w-4 h-4 ml-1" />لحظه‌ای</TabsTrigger>
                <TabsTrigger value="recurring"><Repeat className="w-4 h-4 ml-1" />دوره‌ای</TabsTrigger>
            </TabsList>
            <TabsContent value="one-time">
                <ExpenseForm onExpenseAdded={fetchExpenses} onExpenseUpdated={fetchExpenses} />
            </TabsContent>
             <TabsContent value="recurring">
                <RecurringExpenseForm onRecurringExpenseAdded={fetchExpenses} />
            </TabsContent>
        </Tabs>
      </div>
      <div className="md:col-span-2">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">لیست مخارج ثبت‌شده</h1>
          <Button 
            onClick={handleApplyRecurring} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
            disabled={isProcessingRecurring}
          >
            <RefreshCw className={`h-4 w-4 ${isProcessingRecurring ? 'animate-spin' : ''}`} />
            {isProcessingRecurring ? 'در حال پردازش...' : 'بررسی و ثبت هزینه‌های دوره‌ای'}
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
             <ScrollArea className="h-[70vh]">
                {expenses.length > 0 ? (
                <ul className="divide-y divide-border">
                    {expenses.map((expense) => (
                       <ExpenseListItem key={expense.id} expense={expense} onUpdate={fetchExpenses} />
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
