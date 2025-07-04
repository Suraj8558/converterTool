'use server';
/**
 * @fileOverview An AI-powered meta tag generator.
 *
 * - generateMetaTags - A function that generates meta tags based on keywords and website content.
 * - AiMetaTagInput - The input type for the generateMetaTags function.
 * - AiMetaTagOutput - The return type for the generateMetaTags function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiMetaTagInputSchema = z.object({
  keywords: z
    .string()
    .describe('The primary keywords related to the website content.'),
  websiteContent: z
    .string()
    .describe('The content of the website to be analyzed.'),
});
export type AiMetaTagInput = z.infer<typeof AiMetaTagInputSchema>;

const AiMetaTagOutputSchema = z.object({
  title: z.string().describe('The generated meta title for the website.'),
  description: z
    .string()
    .describe('The generated meta description for the website.'),
  keywords: z
    .string()
    .describe('The generated meta keywords for the website.'),
});
export type AiMetaTagOutput = z.infer<typeof AiMetaTagOutputSchema>;

export async function generateMetaTags(
  input: AiMetaTagInput
): Promise<AiMetaTagOutput> {
  return generateMetaTagsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiMetaTagPrompt',
  input: {schema: AiMetaTagInputSchema},
  output: {schema: AiMetaTagOutputSchema},
  prompt: `You are an expert SEO specialist.
  Based on the provided keywords and website content, generate optimized meta tags for the website.

  Keywords: {{{keywords}}}
  Website Content: {{{websiteContent}}}

  Instructions:
  1. Analyze the keywords and website content to understand the main topics and themes.
  2. Generate a compelling and concise meta title that includes relevant keywords.
  3. Create a meta description that accurately summarizes the website content and entices users to click.
  4. Generate a list of relevant meta keywords, including the primary keywords and related terms.
  5. Respond in JSON format.

  Output:`,
});

const generateMetaTagsFlow = ai.defineFlow(
  {
    name: 'generateMetaTagsFlow',
    inputSchema: AiMetaTagInputSchema,
    outputSchema: AiMetaTagOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
