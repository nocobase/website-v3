import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Every page of every language: content/<path>.md for the default language and content/<dir>/<path>.md for the others, with the file path (without .md) as the id. Menus and checks are in src/lib/content.mjs; this collection only renders the Markdown.
const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content', generateId: ({ entry }) => entry.replace(/\.md$/, '') }),
  schema: z.object({ title: z.string(), description: z.string().optional(), metaDescription: z.string().optional(), status: z.string().optional() }),
});

export const collections = { docs };
