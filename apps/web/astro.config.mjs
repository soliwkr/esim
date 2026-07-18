import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

export default defineConfig({
  output: 'server',
  adapter: cloudflare({
    configPath: process.env.ASTRO_WRANGLER_CONFIG || '../../wrangler.jsonc',
    imageService: 'compile'
  }),
  integrations: [react()],
  site: 'https://senzaroaming.it'
});
