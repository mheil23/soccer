// vitest.config.js — Zero-config ESM-native setup for Vitest
// No build step required; tests run directly as ES modules.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    environmentMatchGlobs: [
      // Tests that need DOM access use jsdom
      ['tests/renderer.test.js', 'jsdom'],
      ['tests/controller.test.js', 'jsdom'],
      ['tests/custom-formation.test.js', 'jsdom'],
      ['tests/bootstrap.test.js', 'jsdom'],
      ['tests/properties/drag.property.test.js', 'jsdom'],
    ],
  },
});
