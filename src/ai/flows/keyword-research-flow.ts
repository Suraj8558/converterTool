'use server';
/**
 * @fileOverview An AI-powered keyword research tool.
 *
 * - researchKeywords - A function that generates keyword ideas based on a topic.
 * - KeywordResearchInput - The input type for the researchKeywords function.
 * - KeywordResearchOutput - The return type for the researchKeywords function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const KeywordResearchInputSchema = z.object({
  topic: z
    .string()
    .describe('The main topic or seed keyword for research.'),
});
export type KeywordResearchInput = z.infer<typeof KeywordResearchInputSchema>;

const KeywordResearchOutputSchema = z.object({
  keywords: z.array(z.object({
    keyword: z.string().describe('The suggested keyword.'),
    volume: z.string().describe('An estimated monthly search volume (e.g., "1K - 10K", "500", "100K+").'),
    difficulty: z.string().describe('An estimated SEO difficulty score (e.g., "Low", "Medium", "High", "Very High").'),
  })).describe('A list of keyword suggestions with their estimated volume and difficulty.'),
});
export type KeywordResearchOutput = z.infer<typeof KeywordResearchOutputSchema>;

export async function researchKeywords(
  input: KeywordResearchInput
): Promise<KeywordResearchOutput> {
  return keywordResearchFlow(input);
}

const prompt = ai.definePrompt({
  name: 'keywordResearchPrompt',
  input: {schema: KeywordResearchInputSchema},
  output: {schema: KeywordResearchOutputSchema},
  prompt: `You are an expert SEO strategist specializing in keyword research.
  Based on the provided topic, generate a list of related keywords. For each keyword, provide an estimated monthly search volume and an SEO difficulty score.

  Topic: {{{topic}}}

  Instructions:
  1. Brainstorm a list of at least 15 relevant long-tail keywords, LSI keywords, and questions related to the topic.
  2. For each keyword, estimate a realistic monthly search volume (e.g., "100", "1K - 10K", "100K+").
  3. For each keyword, estimate the SEO difficulty on a scale of "Low", "Medium", "High", or "Very High".
  4. Return the list of keywords with their volume and difficulty.
  5. Respond in JSON format.

  Output:`,
});

const keywordResearchFlow = ai.defineFlow(
  {
    name: 'keywordResearchFlow',
    inputSchema: KeywordResearchInputSchema,
    outputSchema: KeywordResearchOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
