import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import raw from '../docs.config.ts';
import { contentPattern } from './lib/dev-languages.mjs';

// Every page of every language: content/<path>.md for the default language and content/<dir>/<path>.md for the others, with the file path (without .md) as the id. Menus and checks are in src/lib/content.mjs; this collection only renders the Markdown.
// The pattern is worked out on each load, because the dev server adds languages as they are requested (src/lib/dev-languages.mjs).
const docs = defineCollection({
  loader: { name: 'docs', load: context => glob({ pattern: contentPattern(raw.languages), base: './content', generateId: ({ entry }) => entry.replace(/\.md$/, '') }).load(context) },
  schema: z.object({ title: z.string(), description: z.string().optional(), metaDescription: z.string().optional(), status: z.string().optional() }),
});

export const collections = { docs };
