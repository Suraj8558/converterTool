'use server';
/**
 * @fileOverview An AI-powered backlink checker.
 *
 * - checkBacklinks - A function that analyzes the backlink profile of a domain.
 * - BacklinkInput - The input type for the checkBacklinks function.
 * - BacklinkOutput - The return type for the checkBacklinks function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BacklinkInputSchema = z.object({
  domain: z.string().describe('The domain name to check for backlinks (e.g., example.com).'),
});
export type BacklinkInput = z.infer<typeof BacklinkInputSchema>;

const BacklinkOutputSchema = z.object({
  domainAuthority: z.number().min(0).max(100).describe('An estimated Domain Authority score from 0 to 100.'),
  totalBacklinks: z.number().describe('The estimated total number of backlinks found.'),
  referringDomains: z.number().describe('The estimated number of unique referring domains.'),
  backlinks: z.array(z.object({
    sourceUrl: z.string().describe('The full URL (starting with https://) of the page where the backlink was found.'),
    anchorText: z.string().describe('The anchor text of the backlink.'),
    domainAuthority: z.number().min(0).max(100).describe('The estimated Domain Authority of the referring domain.'),
  })).describe('A list of the top 10 backlinks found.'),
});
export type BacklinkOutput = z.infer<typeof BacklinkOutputSchema>;

export async function checkBacklinks(
  input: BacklinkInput
): Promise<BacklinkOutput> {
  return backlinkCheckerFlow(input);
}

const prompt = ai.definePrompt({
  name: 'backlinkCheckerPrompt',
  input: {schema: BacklinkInputSchema},
  output: {schema: BacklinkOutputSchema},
  prompt: `You are a powerful SEO backlink analysis tool. For the given domain, provide a simulated backlink profile.

  Domain to analyze: {{{domain}}}

  Instructions:
  1. Generate a realistic-looking but entirely simulated backlink profile for the domain.
  2. Create a plausible "domainAuthority" score between 1 and 100.
  3. Generate a plausible "totalBacklinks" count and a "referringDomains" count.
  4. Generate a list of exactly 10 simulated backlinks.
  5. For each backlink, provide a realistic-looking source URL (which must be a full URL starting with https://), anchor text, and the referring domain's authority score.
  6. The data must be plausible but entirely simulated. Do not perform a real web search.
  7. Respond in JSON format. Do not add any extra text or explanations.

  Output:`,
});

const backlinkCheckerFlow = ai.defineFlow(
  {
    name: 'backlinkCheckerFlow',
    inputSchema: BacklinkInputSchema,
    outputSchema: BacklinkOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
