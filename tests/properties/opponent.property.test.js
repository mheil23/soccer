// Feature: soccer-formations-tool, Property 9: Opponent overlay re-enable restores last formation
import { describe, test, expect } from 'vitest';
import fc from 'fast-check';
import { getFormationsForFormat, getFormationById } from '../../src/data.js';
import {
  createInitialState,
  setOpponentOverlay,
  setOpponentFormation,
} from '../../src/state.js';

// ---------------------------------------------------------------------------
// Generators
// ---------------------------------------------------------------------------

const ALL_FORMATS = ['7v7', '9v9', '11v11'];

/**
 * Generates a tuple of [format, formationId] where the formation belongs
 * to the given format.
 */
const arbFormatAndFormation = fc
  .constantFrom(...ALL_FORMATS)
  .chain((format) => {
    const formations = getFormationsForFormat(format);
    return fc
      .constantFrom(...formations.map((f) => f.id))
      .map((formationId) => ({ format, formationId }));
  });

// ---------------------------------------------------------------------------
// Property 9: Opponent overlay re-enable restores last formation
// **Validates: Requirements 5.7**
//
// For any opponent formation F that was active before the overlay was disabled,
// re-enabling the overlay for the same format should restore F as the active
// opponent formation and position opponent tokens according to F's position data.
// ---------------------------------------------------------------------------
describe('Property 9: Opponent overlay re-enable restores last formation', () => {
  test('re-enabling opponent overlay restores the last selected formation', () => {
    fc.assert(
      fc.property(arbFormatAndFormation, ({ format, formationId }) => {
        const formation = getFormationById(formationId);

        // 1. Create initial state for the given format
        let state = createInitialState(format);

        // 2. Enable opponent overlay (starts with default formation)
        state = setOpponentOverlay(state, true);

        // 3. Set a specific opponent formation F
        state = setOpponentFormation(state, formationId);

        // Verify formation F is active
        expect(state.opponentFormationKey).toBe(formation.id);
        expect(state.opponentTokens.length).toBe(formation.positions.length);

        // 4. Disable the overlay
        state = setOpponentOverlay(state, false);

        // Verify overlay is disabled and tokens are removed
        expect(state.opponentOverlayEnabled).toBe(false);
        expect(state.opponentTokens.length).toBe(0);

        // 5. Re-enable the overlay (should restore formation F)
        state = setOpponentOverlay(state, true);

        // Verify formation F is restored
        expect(state.opponentOverlayEnabled).toBe(true);
        expect(state.opponentFormationKey).toBe(formation.id);
        expect(state.opponentTokens.length).toBe(formation.positions.length);

        // Verify opponent tokens are positioned mirrored (ny flipped) per F's position data
        for (let i = 0; i < formation.positions.length; i++) {
          const expectedPos = formation.positions[i];
          const token = state.opponentTokens[i];

          expect(token.nx).toBeCloseTo(expectedPos.nx, 10);
          expect(token.ny).toBeCloseTo(1 - expectedPos.ny, 10);
          expect(token.label).toBe(expectedPos.label);
          expect(token.team).toBe('opp');
        }
      }),
      { numRuns: 100 }
    );
  });
});
