import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import Icons from 'unplugin-icons/vite';
import { execSync } from 'child_process';

function getGitCommitHash() {
	try {
		return execSync('git rev-parse --short HEAD').toString().trim();
	} catch {
		return 'unknown';
	}
}

function getBuildDate() {
	return new Date().toISOString().split('T')[0];
}

// https://vite.dev/config/
export default defineConfig({
	base: '/',
	plugins: [
		svelte(),
		tailwindcss(),
		Icons({
			compiler: 'svelte'
		})
	],
	assetsInclude: ['**/*.wasm'],
	build: {
		target: 'esnext',
		rollupOptions: {
			external: (id) =>
				id === 'ayumi-constants.js' ||
				id.endsWith('/ayumi-constants.js') ||
				id === '/ayumi-constants.js'
		}
	},
	define: {
		'import.meta.env.VITE_COMMIT_HASH': JSON.stringify(getGitCommitHash()),
		'import.meta.env.VITE_BUILD_DATE': JSON.stringify(getBuildDate())
	}
});
