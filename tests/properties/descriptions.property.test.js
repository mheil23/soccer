// Feature: soccer-formations-tool, Property 10: Position description structural validity
// Validates: Requirements 6.3
// Feature: soccer-formations-tool, Property 11: Dismiss description panel leaves token positions unchanged
// Validates: Requirements 6.5
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { getFormationsForFormat, getDescriptionById } from '../../src/data.js';
import { createInitialState, setSelectedToken, setOwnTokenPosition } from '../../src/state.js';

// Collect all unique descriptionIds referenced by all formations across all formats
const FORMATS = ['7v7', '9v9', '11v11'];
const allDescriptionIds = [
  ...new Set(
    FORMATS.flatMap((format) =>
      getFormationsForFormat(format).flatMap((f) =>
        f.positions.map((p) => p.descriptionId)
      )
    )
  ),
];

describe('Property 10: Position description structural validity', () => {
  it('every formation position descriptionId has a matching description', () => {
    // Verify completeness: every referenced descriptionId resolves to a description
    FORMATS.forEach((format) => {
      getFormationsForFormat(format).forEach((formation) => {
        formation.positions.forEach((pos) => {
          const desc = getDescriptionById(pos.descriptionId);
          expect(
            desc,
            `Formation "${formation.name}" position "${pos.key}" references descriptionId "${pos.descriptionId}" which has no matching description`
          ).toBeDefined();
        });
      });
    });
  });

  it('all position descriptions satisfy structural constraints', () => {
    fc.assert(
      fc.property(fc.constantFrom(...allDescriptionIds), (descriptionId) => {
        const desc = getDescriptionById(descriptionId);

        // Description must exist
        expect(desc).toBeDefined();

        // positionName must be a non-empty string
        expect(typeof desc.positionName).toBe('string');
        expect(desc.positionName.length).toBeGreaterThan(0);

        // roleDescription must be a non-empty string
        expect(typeof desc.roleDescription).toBe('string');
        expect(desc.roleDescription.length).toBeGreaterThan(0);

        // keyAttributes must be an array with 1-5 non-empty strings
        expect(Array.isArray(desc.keyAttributes)).toBe(true);
        expect(desc.keyAttributes.length).toBeGreaterThanOrEqual(1);
        expect(desc.keyAttributes.length).toBeLessThanOrEqual(5);
        desc.keyAttributes.forEach((attr) => {
          expect(typeof attr).toBe('string');
          expect(attr.length).toBeGreaterThan(0);
        });

        // responsibilities must be a non-empty string
        expect(typeof desc.responsibilities).toBe('string');
        expect(desc.responsibilities.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: soccer-formations-tool, Property 11: Dismiss description panel leaves token positions unchanged
// **Validates: Requirements 6.5**
describe('Property 11: Dismiss description panel leaves token positions unchanged', () => {
  const FORMATS = ['7v7', '9v9', '11v11'];

  // Arbitrary format
  const arbFormat = fc.constantFrom(...FORMATS);

  // Arbitrary normalized coordinate in [0, 1]
  const arbNx = fc.float({ min: 0, max: 1, noNaN: true });

  it('dismissing the description panel does not change any token positions', () => {
    fc.assert(
      fc.property(
        arbFormat,
        fc.array(
          fc.record({ nx: arbNx, ny: arbNx }),
          { minLength: 1, maxLength: 11 }
        ),
        (format, positions) => {
          // Create initial state and place tokens at arbitrary positions
          let state = createInitialState(format);

          // Override ownTokens with arbitrary positions
          state = {
            ...state,
            ownTokens: positions.map((pos, i) => ({
              id: `own-${i}`,
              team: 'own',
              label: String(i + 1),
              nx: pos.nx,
              ny: pos.ny,
              formationKey: `pos-${i}`,
            })),
          };

          // Select a token (simulate opening the description panel)
          const selectedId = state.ownTokens[0].id;
          state = setSelectedToken(state, selectedId);

          // Record positions before dismissal
          const positionsBefore = state.ownTokens.map((t) => ({
            nx: t.nx,
            ny: t.ny,
          }));

          // Dismiss the description panel (set selectedTokenId to null)
          const stateAfterDismiss = setSelectedToken(state, null);

          // Verify all token positions remain unchanged
          expect(stateAfterDismiss.ownTokens.length).toBe(positionsBefore.length);
          stateAfterDismiss.ownTokens.forEach((token, i) => {
            expect(token.nx).toBe(positionsBefore[i].nx);
            expect(token.ny).toBe(positionsBefore[i].ny);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});
