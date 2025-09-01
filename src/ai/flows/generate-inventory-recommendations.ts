'use server';

/**
 * @fileOverview A flow that provides inventory recommendations based on sales and stock levels.
 *
 * - generateInventoryRecommendations - A function that generates inventory recommendations.
 * - GenerateInventoryRecommendationsInput - The input type for the generateInventoryRecommendations function.
 * - GenerateInventoryRecommendationsOutput - The return type for the generateInventoryRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInventoryRecommendationsInputSchema = z.object({
  salesData: z.string().describe('Sales data in JSON format, including product name and quantity sold.'),
  stockLevels: z.string().describe('Stock levels in JSON format, including product name and quantity in stock.'),
});
export type GenerateInventoryRecommendationsInput = z.infer<typeof GenerateInventoryRecommendationsInputSchema>;

const GenerateInventoryRecommendationsOutputSchema = z.object({
  recommendations: z.string().describe('Recommendations for next steps, such as restocking or promotions.'),
});
export type GenerateInventoryRecommendationsOutput = z.infer<
  typeof GenerateInventoryRecommendationsOutputSchema
>;

export async function generateInventoryRecommendations(
  input: GenerateInventoryRecommendationsInput
): Promise<GenerateInventoryRecommendationsOutput> {
  return generateInventoryRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInventoryRecommendationsPrompt',
  input: {schema: GenerateInventoryRecommendationsInputSchema},
  output: {schema: GenerateInventoryRecommendationsOutputSchema},
  prompt: `You are an expert inventory management assistant.

  Based on the following sales data and stock levels, provide recommendations for next steps, such as restocking or promotions.

  Sales Data: {{{salesData}}}
  Stock Levels: {{{stockLevels}}}

  Provide clear and concise recommendations.
  `,
});

const generateInventoryRecommendationsFlow = ai.defineFlow(
  {
    name: 'generateInventoryRecommendationsFlow',
    inputSchema: GenerateInventoryRecommendationsInputSchema,
    outputSchema: GenerateInventoryRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
