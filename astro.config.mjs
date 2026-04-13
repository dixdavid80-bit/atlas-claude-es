// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

export default defineConfig({
	integrations: [
		starlight({
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
			customCss: [],
			head: [
				{
					tag: 'meta',
					attrs: { name: 'og:locale', content: 'es_ES' },
				},
			],
		}),
	],
});
