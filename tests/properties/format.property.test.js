// Feature: soccer-formations-tool, Property 1: Format selection yields the correct default formation
import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { DEFAULT_FORMATION } from '../../src/data.js';
import { createInitialState, setFormat } from '../../src/state.js';

/**
 * Validates: Requirements 1.3
 *
 * For any supported format value, selecting that format should set the active
 * formation to exactly the formation defined as that format's default
 * (2-3-1 for 7v7, 3-3-2 for 9v9, 4-3-3 for 11v11).
 */
describe('Property 1: Format selection yields the correct default formation', () => {
  test('createInitialState sets activeFormationName to the default formation for the given format', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('7v7', '9v9', '11v11'),
        (format) => {
          const state = createInitialState(format);
          expect(state.activeFormationName).toBe(DEFAULT_FORMATION[format]);
        }
      ),
      { numRuns: 100 }
    );
  });

  test('setFormat sets activeFormationName to the default formation for the given format', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('7v7', '9v9', '11v11'),
        (format) => {
          // Start from a different format to ensure we're testing the transition
          const startFormat = format === '11v11' ? '7v7' : '11v11';
          const initialState = createInitialState(startFormat);
          const newState = setFormat(initialState, format);
          expect(newState.activeFormationName).toBe(DEFAULT_FORMATION[format]);
        }
      ),
      { numRuns: 100 }
    );
  });
});
