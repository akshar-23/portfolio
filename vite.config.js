import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import mdx from '@mdx-js/rollup';

export default defineConfig({
  base: '/portfolio/',
  plugins: [
    // project pages are MDX: markdown with React components in it
    { enforce: 'pre', ...mdx({ providerImportSource: '@mdx-js/react' }) },
    react({ include: /\.(mdx|js|jsx)$/ }),
  ],
});
