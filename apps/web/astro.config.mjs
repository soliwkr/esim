import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  integrations: [react()],
  adapter: cloudflare({
    imageService: 'compile'
  }),
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('@mantine')) return 'control-room-mantine';
            if (id.includes('@tanstack')) return 'control-room-data';
            if (id.includes('react')) return 'control-room-react';
          }
        }
      }
    }
  }
});
