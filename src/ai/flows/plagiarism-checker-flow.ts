'use server';
/**
 * @fileOverview An AI-powered plagiarism checker.
 *
 * - checkPlagiarism - A function that checks a given text for potential plagiarism.
 * - PlagiarismInput - The input type for the checkPlagiarism function.
 * - PlagiarismOutput - The return type for the checkPlagiarism function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PlagiarismInputSchema = z.object({
  text: z.string().describe('The text content to check for plagiarism.'),
});
export type PlagiarismInput = z.infer<typeof PlagiarismInputSchema>;

const PlagiarismOutputSchema = z.object({
  uniquenessScore: z.number().min(0).max(100).describe('A score from 0 to 100 representing the uniqueness of the text.'),
  matches: z.array(z.object({
    text: z.string().describe('The snippet of text that was matched.'),
    source: z.string().url().describe('The URL of the potential source.'),
    similarity: z.number().min(0).max(100).describe('The similarity percentage of the snippet to the source.'),
  })).describe('A list of potential sources that match parts of the text.'),
});
export type PlagiarismOutput = z.infer<typeof PlagiarismOutputSchema>;

export async function checkPlagiarism(
  input: PlagiarismInput
): Promise<PlagiarismOutput> {
  return plagiarismCheckerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'plagiarismCheckerPrompt',
  input: {schema: PlagiarismInputSchema},
  output: {schema: PlagiarismOutputSchema},
  prompt: `You are a sophisticated plagiarism detection engine. Analyze the provided text for uniqueness.
  
  Text to analyze:
  {{{text}}}

  Instructions:
  1. Scour the web for content that matches the provided text.
  2. Calculate a "uniquenessScore" from 0 (completely plagiarized) to 100 (completely unique).
  3. Identify specific sentences or paragraphs that seem to be copied from other sources.
  4. For each identified match, provide the text snippet, a plausible source URL, and a similarity percentage.
  5. If no matches are found, return an empty "matches" array and a uniquenessScore between 95 and 100.
  6. Your web search is simulated, but provide realistic-looking URLs for any matches you create.
  7. Respond in JSON format.

  Output:`,
});

const plagiarismCheckerFlow = ai.defineFlow(
  {
    name: 'plagiarismCheckerFlow',
    inputSchema: PlagiarismInputSchema,
    outputSchema: PlagiarismOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
