// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Change this to the real domain once it's deployed (used for canonical URLs, OG tags and the sitemap).
const SITE = 'https://abhishekjha.vercel.app';

export default defineConfig({
  site: SITE,
  // /projects and /library are just redirects into the notebook now, so keep them out of the sitemap.
  integrations: [sitemap({ filter: (page) => !/\/(projects|library)(\/|$)/.test(new URL(page).pathname) })],
});
