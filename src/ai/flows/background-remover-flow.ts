'use server';
/**
 * @fileOverview An AI-powered image background remover.
 *
 * - removeBackground - A function that removes the background from an image.
 * - BackgroundRemoverInput - The input type for the removeBackground function.
 * - BackgroundRemoverOutput - The return type for the removeBackground function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const BackgroundRemoverInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of an object or person, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type BackgroundRemoverInput = z.infer<typeof BackgroundRemoverInputSchema>;

const BackgroundRemoverOutputSchema = z.object({
    processedPhotoDataUri: z.string().describe('The processed photo with the background removed, as a PNG data URI.')
});
export type BackgroundRemoverOutput = z.infer<typeof BackgroundRemoverOutputSchema>;

export async function removeBackground(
  input: BackgroundRemoverInput
): Promise<BackgroundRemoverOutput> {
  return removeBackgroundFlow(input);
}

const removeBackgroundFlow = ai.defineFlow(
  {
    name: 'removeBackgroundFlow',
    inputSchema: BackgroundRemoverInputSchema,
    outputSchema: BackgroundRemoverOutputSchema,
  },
  async (input) => {
    const {media} = await ai.generate({
        model: 'googleai/gemini-2.0-flash-preview-image-generation',
        prompt: [
            {media: {url: input.photoDataUri}},
            {text: 'Generate a new PNG image containing only the main subject from the provided image, with a transparent background.'}
        ],
        config: {
            responseModalities: ['TEXT', 'IMAGE'],
            safetySettings: [
              {
                category: 'HARM_CATEGORY_HATE_SPEECH',
                threshold: 'BLOCK_NONE',
              },
              {
                category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                threshold: 'BLOCK_NONE',
              },
              {
                category: 'HARM_CATEGORY_HARASSMENT',
                threshold: 'BLOCK_NONE',
              },
              {
                category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
                threshold: 'BLOCK_NONE',
              },
            ],
        },
    });

    if (!media?.url) {
        throw new Error('Failed to remove background. No image was generated.');
    }

    return { processedPhotoDataUri: media.url };
  }
);
