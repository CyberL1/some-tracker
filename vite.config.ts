import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import Icons from 'unplugin-icons/vite';

// https://vite.dev/config/
export default defineConfig({
	base: '/bitphase/',
	plugins: [
		svelte(),
		tailwindcss(),
		Icons({
			compiler: 'svelte'
		})
	],
	assetsInclude: ['**/*.wasm'],
	build: {
		target: 'esnext'
	}
});
