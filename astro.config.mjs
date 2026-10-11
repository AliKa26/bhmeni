// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';

import preact from '@astrojs/preact';
import sitemap from '@astrojs/sitemap';

// SITE_URL dolazi iz okruženja (.env lokalno, Cloudflare env varijabla pri deployu).
// Fallback je privremena workers.dev adresa (zamijeniti kad se zna tačna subdomena).
const { SITE_URL } = loadEnv(process.env.NODE_ENV ?? 'production', process.cwd(), '');
const FALLBACK_SITE_URL = 'https://bhmeni.workers.dev';

// https://astro.build/config
export default defineConfig({
  site: SITE_URL || FALLBACK_SITE_URL,
  output: 'static',
  integrations: [preact(), sitemap()],
});
