import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      ...configDefaults.exclude,
      'extension/dist/**',
      'extension/src/test/suite/**',
    ],
  },
});
