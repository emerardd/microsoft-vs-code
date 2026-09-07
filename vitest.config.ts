import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      ...configDefaults.exclude,
      'extension/dist/**',
      'e2e/**',
      'extension/src/test/suite/**',
    ],
  },
});
