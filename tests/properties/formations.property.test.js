// Property-based tests for formations — Properties 2, 3, 6
// Feature: soccer-formations-tool
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { createInitialState, applyFormation } from '../../src/state.js';
import { getFormationsForFormat, getFormationById } from '../../src/data.js';
import { StorageAdapter } from '../../src/storage.js';

// ---------------------------------------------------------------------------
// Collect all preset formation IDs across all formats
// ---------------------------------------------------------------------------
const ALL_FORMATS = ['7v7', '9v9', '11v11'];
const allFormationIds = ALL_FORMATS.flatMap((format) =>
  getFormationsForFormat(format).map((f) => f.id)
);

// ---------------------------------------------------------------------------
// Property 2: Preset formation application sets token positions to formation definition
// **Validates: Requirements 2.2**
//
// For any preset formation F, applying F to the field should result in every
// own-team token being placed at the normalized position defined by F's position
// data — no token should be placed at a position not defined in F, and every
// position defined in F should have a corresponding token.
// ---------------------------------------------------------------------------
describe('Property 2: Preset formation application sets token positions to formation definition', () => {
  it.each(Array.from({ length: 1 }, () => ({})))(
    'every own-team token matches formation position data',
    () => {
      fc.assert(
        fc.property(fc.constantFrom(...allFormationIds), (formationId) => {
          const formation = getFormationById(formationId);
          const state = createInitialState(formation.format);
          const result = applyFormation(state, formationId);

          // Every position defined in F should have a corresponding token
          expect(result.ownTokens.length).toBe(formation.positions.length);

          // Each token should be placed at the normalized position defined by F
          for (let i = 0; i < formation.positions.length; i++) {
            const expectedPos = formation.positions[i];
            const token = result.ownTokens[i];

            expect(token.nx).toBeCloseTo(expectedPos.nx, 10);
            expect(token.ny).toBeCloseTo(expectedPos.ny, 10);
            expect(token.label).toBe(expectedPos.label);
            expect(token.formationKey).toBe(expectedPos.key);
          }

          // No token should be placed at a position not defined in F
          const definedPositions = new Set(
            formation.positions.map((p) => `${p.nx},${p.ny}`)
          );
          for (const token of result.ownTokens) {
            expect(definedPositions.has(`${token.nx},${token.ny}`)).toBe(true);
          }
        }),
        { numRuns: 100 }
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Property 3: Formation token count reconciliation
// **Validates: Requirements 2.5, 2.6**
//
// For any preset formation F and any initial own-team token count N (whether
// N < F.size or N > F.size), applying F should result in exactly F.size
// own-team tokens on the field.
// ---------------------------------------------------------------------------
describe('Property 3: Formation token count reconciliation', () => {
  it.each(Array.from({ length: 1 }, () => ({})))(
    'applying formation always results in exactly F.size own-team tokens',
    () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...allFormationIds),
          fc.integer({ min: 0, max: 20 }),
          (formationId, initialTokenCount) => {
            const formation = getFormationById(formationId);
            const state = createInitialState(formation.format);

            // Create a state with a custom number of initial own-team tokens
            const customTokens = Array.from({ length: initialTokenCount }, (_, i) => ({
              id: `own-${i}`,
              team: 'own',
              label: `P${i}`,
              nx: Math.random(),
              ny: Math.random(),
              formationKey: `pos-${i}`,
            }));

            const stateWithCustomTokens = {
              ...state,
              ownTokens: customTokens,
            };

            const result = applyFormation(stateWithCustomTokens, formationId);

            // Applying F should result in exactly F.size own-team tokens
            expect(result.ownTokens.length).toBe(formation.positions.length);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});


// ---------------------------------------------------------------------------
// Mock localStorage using a Map-based implementation
// ---------------------------------------------------------------------------

function createMapLocalStorage() {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
    clear() { store.clear(); },
    _store: store,
  };
}

// ---------------------------------------------------------------------------
// Generators for Property 6
// ---------------------------------------------------------------------------

const arbNx = fc.float({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true });
const arbLabel = fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0);
const arbPosition = fc.record({ label: arbLabel, nx: arbNx, ny: arbNx });
const arbFormat = fc.constantFrom('7v7', '9v9', '11v11');
const arbName = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);
const arbIsoDate = fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') })
  .map(d => d.toISOString());

const arbCustomFormation = fc.record({
  id: fc.uuid(),
  name: arbName,
  format: arbFormat,
  positions: fc.array(arbPosition, { minLength: 1, maxLength: 11 }),
  savedAt: arbIsoDate,
});

// ---------------------------------------------------------------------------
// Property 6: Persistence round-trip (custom formations)
// **Validates: Requirements 3.5, 7.5**
//
// For any valid custom formation M, saving M to localStorage and then reading
// it back should produce an object that is structurally equivalent to M
// (same name, same format, same positions with equal normalized coordinates,
// same labels).
// ---------------------------------------------------------------------------
describe('Property 6: Persistence round-trip (formations)', () => {
  let mockStorage;
  let originalLocalStorage;

  beforeEach(() => {
    mockStorage = createMapLocalStorage();
    originalLocalStorage = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockStorage,
      configurable: true,
      writable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      configurable: true,
      writable: true,
    });
  });

  it('saving and reloading a custom formation returns a structurally equivalent object', () => {
    fc.assert(
      fc.property(arbCustomFormation, (formation) => {
        const adapter = new StorageAdapter();

        // Write the formation to storage
        adapter.write('customFormations', JSON.stringify([formation]));

        // Read it back via loadAll
        const loaded = adapter.loadAll();

        // Should have exactly one custom formation
        expect(loaded.customFormations.length).toBe(1);

        const restored = loaded.customFormations[0];

        // Structural equivalence
        expect(restored.id).toBe(formation.id);
        expect(restored.name).toBe(formation.name);
        expect(restored.format).toBe(formation.format);
        expect(restored.savedAt).toBe(formation.savedAt);
        expect(restored.positions.length).toBe(formation.positions.length);

        for (let i = 0; i < formation.positions.length; i++) {
          expect(restored.positions[i].label).toBe(formation.positions[i].label);
          expect(restored.positions[i].nx).toBeCloseTo(formation.positions[i].nx, 5);
          expect(restored.positions[i].ny).toBeCloseTo(formation.positions[i].ny, 5);
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 4: Token label validation
// **Validates: Requirements 3.3**
//
// For any label string input, the stored and displayed label should be:
// - the trimmed string if it is non-blank and ≤ 20 characters;
// - the token's positional number if the trimmed string is empty or consists
//   only of whitespace;
// - and the string should not be accepted if it exceeds 20 characters.
// ---------------------------------------------------------------------------
import { validateLabel, validateSaveName } from '../../src/state.js';

describe('Property 4: Token label validation', () => {
  it.each(Array.from({ length: 1 }, () => ({})))(
    'validates label according to trimming and length rules',
    () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 30 }),
          fc.integer({ min: 1, max: 99 }),
          (label, positionalNumber) => {
            const result = validateLabel(label, positionalNumber);
            const trimmed = label.trim();

            if (trimmed.length > 20) {
              // Should be rejected
              expect(result.valid).toBe(false);
              expect(result.reason).toBeDefined();
            } else if (trimmed.length === 0) {
              // Should fall back to positional number
              expect(result.valid).toBe(true);
              expect(result.label).toBe(String(positionalNumber));
            } else {
              // Should use the trimmed label
              expect(result.valid).toBe(true);
              expect(result.label).toBe(trimmed);
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it.each(Array.from({ length: 1 }, () => ({})))(
    'whitespace-only labels fall back to positional number',
    () => {
      fc.assert(
        fc.property(
          fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 20 }),
          fc.integer({ min: 1, max: 99 }),
          (whitespaceLabel, positionalNumber) => {
            const result = validateLabel(whitespaceLabel, positionalNumber);
            expect(result.valid).toBe(true);
            expect(result.label).toBe(String(positionalNumber));
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it.each(Array.from({ length: 1 }, () => ({})))(
    'labels exceeding 20 characters after trimming are rejected',
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 21, maxLength: 30 }).filter((s) => s.trim().length > 20),
          fc.integer({ min: 1, max: 99 }),
          (longLabel, positionalNumber) => {
            const result = validateLabel(longLabel, positionalNumber);
            expect(result.valid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Property 5: Save name validation
// **Validates: Requirements 3.4, 7.4**
//
// For any name string provided when saving a custom formation or situational
// moment, the save operation should succeed if and only if the name has between
// 1 and 50 characters (after trimming); it should be rejected if the name is
// empty or exceeds 50 characters.
// ---------------------------------------------------------------------------
describe('Property 5: Save name validation', () => {
  it.each(Array.from({ length: 1 }, () => ({})))(
    'accepts names between 1 and 50 characters after trimming',
    () => {
      fc.assert(
        fc.property(
          fc.string({ maxLength: 60 }),
          (name) => {
            const result = validateSaveName(name);
            const trimmed = name.trim();

            if (trimmed.length >= 1 && trimmed.length <= 50) {
              // Should succeed
              expect(result.valid).toBe(true);
              expect(result.name).toBe(trimmed);
            } else {
              // Should be rejected (empty or > 50 chars)
              expect(result.valid).toBe(false);
              expect(result.reason).toBeDefined();
            }
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it.each(Array.from({ length: 1 }, () => ({})))(
    'rejects empty or whitespace-only names',
    () => {
      fc.assert(
        fc.property(
          fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 0, maxLength: 20 }),
          (emptyName) => {
            const result = validateSaveName(emptyName);
            expect(result.valid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    }
  );

  it.each(Array.from({ length: 1 }, () => ({})))(
    'rejects names exceeding 50 characters after trimming',
    () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 51, maxLength: 60 }).filter((s) => s.trim().length > 50),
          (longName) => {
            const result = validateSaveName(longName);
            expect(result.valid).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
