import { sveltekit } from '@sveltejs/kit/vite';
import { voidPlugin } from 'void';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [voidPlugin(), sveltekit()],
	envPrefix: 'PB',
});