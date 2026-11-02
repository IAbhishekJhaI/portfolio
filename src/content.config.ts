import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { yamlList } from './lib/yamlList';

// An empty string in YAML means "not filled in yet"; treat it as missing.
const optionalUrl = z.preprocess((v) => (v === '' ? undefined : v), z.string().url().optional());

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    category: z.enum(['software', 'electronics', 'other']),
    stack: z.array(z.string()).default([]),
    period: z.coerce.string(),
    highlights: z.array(z.string()).default([]),
    links: z
      .object({ live: optionalUrl, repo: optionalUrl, writeup: optionalUrl })
      .default({}),
    cover: z.string().optional(),
    coverAlt: z.string().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(100),
    draft: z.boolean().default(false),
  }),
});

const experience = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/experience' }),
  schema: z.object({
    org: z.string(),
    role: z.string(),
    period: z.coerce.string(),
    location: z.string().optional(),
    track: z.enum(['tech', 'other']),
    url: optionalUrl,
    order: z.number().default(100),
    draft: z.boolean().default(false),
  }),
});

const books = defineCollection({
  loader: yamlList('src/data/books.yaml'),
  schema: z.object({
    title: z.string(),
    author: z.string(),
    status: z.enum(['read', 'reading']).default('read'),
    year: z.number().optional(),
    note: z.string().optional(),
    url: optionalUrl,
  }),
});

const articles = defineCollection({
  loader: yamlList('src/data/articles.yaml'),
  schema: z.object({
    title: z.string(),
    url: z.string().url(),
    kind: z.enum(['written', 'recommended']),
    source: z.string().optional(),
    date: z.string().optional(),
    note: z.string().optional(),
  }),
});

const playlists = defineCollection({
  loader: yamlList('src/data/playlists.yaml'),
  schema: z.object({
    title: z.string(),
    channel: z.string(),
    url: z.string().url(),
    topic: z.string().optional(),
    note: z.string().optional(),
  }),
});

const certifications = defineCollection({
  loader: yamlList('src/data/certifications.yaml'),
  schema: z.object({
    title: z.string(),
    issuer: z.string(),
    platform: z.string().default('Coursera'),
    date: z.string(),
    url: optionalUrl,
    hidden: z.boolean().default(false),
    order: z.number().default(100),
  }),
});

const coursework = defineCollection({
  loader: yamlList('src/data/coursework.yaml'),
  schema: z.object({
    name: z.string(),
    group: z.enum(['CS core', 'Systems', 'Math', 'Electronics', 'AI / ML']),
  }),
});

export const collections = { projects, experience, books, articles, playlists, certifications, coursework };
