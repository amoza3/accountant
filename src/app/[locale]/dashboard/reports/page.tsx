'use client';

import { useState } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import { generateInventoryRecommendations } from '@/ai/flows/generate-inventory-recommendations';
import { getAllProducts, getAllSales } from '@/lib/db';
import type { Product, Sale } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/lib/i18n/client';

export default function ReportsPage() {
  const [recommendations, setRecommendations] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useI18n();

  const handleGenerateReport = async () => {
    setIsLoading(true);
    setRecommendations('');
    try {
      const products: Product[] = await getAllProducts();
      const sales: Sale[] = await getAllSales();

      if (products.length === 0 || sales.length === 0) {
        toast({
          variant: 'default',
          title: t('reports.toasts.not_enough_data.title'),
          description: t('reports.toasts.not_enough_data.description'),
        });
        setIsLoading(false);
        return;
      }

      const stockLevels = JSON.stringify(
        products.map((p) => ({ name: p.name, quantity: p.quantity, lowStockThreshold: p.lowStockThreshold }))
      );

      // To keep it concise, let's summarize sales data
      const salesSummary = sales.flatMap(s => s.items).reduce((acc, item) => {
        acc[item.productName] = (acc[item.productName] || 0) + item.quantity;
        return acc;
      }, {} as Record<string, number>);

      const salesData = JSON.stringify(salesSummary);

      const result = await generateInventoryRecommendations({ salesData, stockLevels });
      setRecommendations(result.recommendations);
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
      toast({
        variant: 'destructive',
        title: t('reports.toasts.error.title'),
        description: t('reports.toasts.error.description'),
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('reports.title')}</h1>
        <Button onClick={handleGenerateReport} disabled={isLoading}>
          {isLoading ? (
            t('reports.generating_button')
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" /> {t('reports.generate_button')}
            </>
          )}
        </Button>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0">
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <CardTitle>{t('reports.card.title')}</CardTitle>
            <CardDescription>
              {t('reports.card.description')}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="min-h-[300px] prose prose-sm max-w-none dark:prose-invert">
          {isLoading && (
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-[75%]" />
            </div>
          )}
          {!isLoading && recommendations && (
            <div dangerouslySetInnerHTML={{ __html: recommendations.replace(/\n/g, '<br />') }} />
          )}
          {!isLoading && !recommendations && (
             <div className="flex flex-1 items-center justify-center rounded-lg h-[300px]">
                <div className="flex flex-col items-center gap-1 text-center">
                    <h3 className="text-2xl font-bold tracking-tight">
                    {t('reports.card.empty.title')}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                    {t('reports.card.empty.description')}
                    </p>
                </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
