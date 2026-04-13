// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://atlas-claude-es.vercel.app',
  integrations: [starlight({
			title: 'Atlas Claude ES',
			description: 'La referencia completa del ecosistema Claude en español',
			defaultLocale: 'root',
			locales: {
          root: { label: 'Español', lang: 'es' },
			},
			social: [
          { icon: 'github', label: 'GitHub', href: 'https://github.com/dixdavid80-bit/atlas-claude-es' },
			],
			sidebar: [
          {
              label: 'Empezar',
              autogenerate: { directory: 'empezar' },
          },
          {
              label: 'Automatizar',
              autogenerate: { directory: 'automatizar' },
          },
          {
              label: 'Conectar',
              autogenerate: { directory: 'conectar' },
          },
          {
              label: 'Escalar',
              autogenerate: { directory: 'escalar' },
          },
          {
              label: 'Producción',
              autogenerate: { directory: 'produccion' },
          },
			],
			customCss: ['./src/styles/editorial.css'],
			head: [
          {
              tag: 'meta',
              attrs: { name: 'og:locale', content: 'es_ES' },
          },
			],
  }), react()],

  vite: {
    plugins: [tailwindcss()],
  },
});