import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import path from "node:path"

// https://vite.dev/config/
export default defineConfig({
	plugins: [vue(), tailwindcss()],
	base: './', // Ensure relative paths work
	build: {
		outDir: 'dist',
		rollupOptions: {
			// Optional: configure input if you have multiple HTML files (e.g., options page)
			// input: {
			//   popup: resolve(__dirname, 'index.html'),
			//   // options: resolve(__dirname, 'options.html'), // If you have an options page
			// },
			output: {
				entryFileNames: 'assets/[name].js',
				chunkFileNames: 'assets/[name].js',
				assetFileNames: 'assets/[name].[ext]',
				// Optional: to disable hashing for specific assets if needed
				// entryFileNames: `assets/[name].js`,
				// chunkFileNames: `assets/[name].js`,
				// assetFileNames: `assets/[name].[ext]`
			},
		},
	},
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  }
})
