import { defineConfig } from 'vitest/config';

// Sof mantiq (SRS, imtihon qulfi, dars raqamlash) uchun test — DOM kerak emas.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
