import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      reporter: ['text', 'html'],
      // The badge everyone screenshots for the sprint review.
      thresholds: { lines: 100, branches: 100, functions: 100, statements: 100 },
    },
  },
});
