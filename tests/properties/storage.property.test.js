// Property-based tests for storage — Property 6, 15
// Feature: soccer-formations-tool
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fc from 'fast-check';
import { StorageAdapter } from '../../src/storage.js';

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
// Generators
// ---------------------------------------------------------------------------

/** Normalized coordinate in [0, 1] — no NaN, no Infinity */
const arbNx = fc.float({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true });

/** Valid position label (1–20 non-empty chars) */
const arbLabel = fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0);

/** Single position: { label, nx, ny } */
const arbPosition = fc.record({
  label: arbLabel,
  nx: arbNx,
  ny: arbNx,
});

/** Valid format */
const arbFormat = fc.constantFrom('7v7', '9v9', '11v11');

/** Valid name (1–50 chars, non-blank after trim) */
const arbName = fc.string({ minLength: 1, maxLength: 50 }).filter(s => s.trim().length > 0);

/** ISO 8601 timestamp string */
const arbIsoDate = fc.date({ min: new Date('2000-01-01'), max: new Date('2099-12-31') })
  .map(d => d.toISOString());

/** Valid CustomFormation object */
const arbCustomFormation = fc.record({
  id: fc.uuid(),
  name: arbName,
  format: arbFormat,
  positions: fc.array(arbPosition, { minLength: 1, maxLength: 11 }),
  savedAt: arbIsoDate,
});

/** Valid SituationalMoment object */
const arbSituationalMoment = fc.record({
  id: fc.uuid(),
  name: arbName,
  isPredefined: fc.constant(false),
  format: arbFormat,
  ownPositions: fc.array(arbPosition, { minLength: 1, maxLength: 11 }),
  ballPosition: fc.record({ nx: arbNx, ny: arbNx }),
  savedAt: arbIsoDate,
});

// ---------------------------------------------------------------------------
// Property 6: Persistence round-trip
// **Validates: Requirements 3.5, 7.5**
//
// For any valid custom formation or situational moment M, saving M to
// localStorage and then reading it back should produce an object that is
// structurally equivalent to M (same name, same format, same positions with
// equal normalized coordinates, same labels).
// ---------------------------------------------------------------------------
describe('Property 6: Persistence round-trip', () => {
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

        // Structural equivalence checks
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

  it('saving and reloading a situational moment returns a structurally equivalent object', () => {
    fc.assert(
      fc.property(arbSituationalMoment, (moment) => {
        const adapter = new StorageAdapter();

        // Write the moment to storage
        adapter.write('savedMoments', JSON.stringify([moment]));

        // Read it back via loadAll
        const loaded = adapter.loadAll();

        // Should have exactly one saved moment
        expect(loaded.savedMoments.length).toBe(1);

        const restored = loaded.savedMoments[0];

        // Structural equivalence checks
        expect(restored.id).toBe(moment.id);
        expect(restored.name).toBe(moment.name);
        expect(restored.isPredefined).toBe(moment.isPredefined);
        expect(restored.format).toBe(moment.format);
        expect(restored.savedAt).toBe(moment.savedAt);

        // Ball position
        expect(restored.ballPosition.nx).toBeCloseTo(moment.ballPosition.nx, 5);
        expect(restored.ballPosition.ny).toBeCloseTo(moment.ballPosition.ny, 5);

        // Own positions
        expect(restored.ownPositions.length).toBe(moment.ownPositions.length);
        for (let i = 0; i < moment.ownPositions.length; i++) {
          expect(restored.ownPositions[i].label).toBe(moment.ownPositions[i].label);
          expect(restored.ownPositions[i].nx).toBeCloseTo(moment.ownPositions[i].nx, 5);
          expect(restored.ownPositions[i].ny).toBeCloseTo(moment.ownPositions[i].ny, 5);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('round-trip works for multiple custom formations saved together', () => {
    fc.assert(
      fc.property(
        fc.array(arbCustomFormation, { minLength: 1, maxLength: 5 }),
        (formations) => {
          const adapter = new StorageAdapter();

          // Write all formations
          adapter.write('customFormations', JSON.stringify(formations));

          // Read back
          const loaded = adapter.loadAll();

          expect(loaded.customFormations.length).toBe(formations.length);

          for (let i = 0; i < formations.length; i++) {
            const original = formations[i];
            const restored = loaded.customFormations[i];

            expect(restored.id).toBe(original.id);
            expect(restored.name).toBe(original.name);
            expect(restored.format).toBe(original.format);
            expect(restored.positions.length).toBe(original.positions.length);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('round-trip works for multiple situational moments saved together', () => {
    fc.assert(
      fc.property(
        fc.array(arbSituationalMoment, { minLength: 1, maxLength: 5 }),
        (moments) => {
          const adapter = new StorageAdapter();

          // Write all moments
          adapter.write('savedMoments', JSON.stringify(moments));

          // Read back
          const loaded = adapter.loadAll();

          expect(loaded.savedMoments.length).toBe(moments.length);

          for (let i = 0; i < moments.length; i++) {
            const original = moments[i];
            const restored = loaded.savedMoments[i];

            expect(restored.id).toBe(original.id);
            expect(restored.name).toBe(original.name);
            expect(restored.format).toBe(original.format);
            expect(restored.ownPositions.length).toBe(original.ownPositions.length);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 15: Corrupt localStorage entries are discarded, valid entries are retained
// **Validates: Requirements 8.6**
//
// For any combination of valid and corrupt (unparseable JSON) entries in
// localStorage under the application's keys, loading the application should
// produce a state that contains exactly all the valid entries and none of the
// corrupt ones, and should display a notification when at least one corrupt
// entry was encountered.
// ---------------------------------------------------------------------------
describe('Property 15: Corrupt localStorage entries are discarded, valid entries are retained', () => {
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

  // --- Generators for corrupt entries ---

  /** Generates strings that are not valid JSON */
  const arbCorruptString = fc.oneof(
    fc.constant('NOT_JSON{{{'),
    fc.constant('{invalid'),
    fc.constant('[[[broken'),
    fc.constant('undefined'),
    fc.constant('{\"name\": }'),
    fc.constant(''),
    fc.string({ minLength: 1, maxLength: 50 }).filter(s => {
      try { JSON.parse(s); return false; } catch { return true; }
    })
  );

  /** Generates an invalid formation object (missing required fields or wrong types) */
  const arbInvalidFormationItem = fc.oneof(
    fc.constant(null),
    fc.constant(42),
    fc.constant('a string'),
    fc.record({ id: fc.constant(''), name: arbName, format: arbFormat, positions: fc.array(arbPosition, { minLength: 1, maxLength: 3 }), savedAt: arbIsoDate }),
    fc.record({ id: fc.uuid(), name: fc.constant(''), format: arbFormat, positions: fc.array(arbPosition, { minLength: 1, maxLength: 3 }), savedAt: arbIsoDate }),
    fc.record({ id: fc.uuid(), name: arbName, format: fc.constant('invalid_format'), positions: fc.array(arbPosition, { minLength: 1, maxLength: 3 }), savedAt: arbIsoDate }),
    fc.record({ id: fc.uuid(), name: arbName, format: arbFormat, positions: fc.constant([]), savedAt: arbIsoDate }),
  );

  /** Generates an invalid moment object (missing required fields or wrong types) */
  const arbInvalidMomentItem = fc.oneof(
    fc.constant(null),
    fc.constant(42),
    fc.constant('a string'),
    fc.record({ id: fc.constant(''), name: arbName, isPredefined: fc.constant(false), format: arbFormat, ownPositions: fc.array(arbPosition, { minLength: 1, maxLength: 3 }), ballPosition: fc.record({ nx: arbNx, ny: arbNx }), savedAt: arbIsoDate }),
    fc.record({ id: fc.uuid(), name: arbName, isPredefined: fc.constant(false), format: fc.constant('bad'), ownPositions: fc.array(arbPosition, { minLength: 1, maxLength: 3 }), ballPosition: fc.record({ nx: arbNx, ny: arbNx }), savedAt: arbIsoDate }),
    fc.record({ id: fc.uuid(), name: arbName, isPredefined: fc.constant(false), format: arbFormat, ownPositions: fc.constant([]), ballPosition: fc.record({ nx: arbNx, ny: arbNx }), savedAt: arbIsoDate }),
  );

  // --- Test: Entirely corrupt customFormations key ---
  it('discards entirely corrupt customFormations JSON and reports discardedCount > 0', () => {
    fc.assert(
      fc.property(arbCorruptString, (corruptJson) => {
        const adapter = new StorageAdapter();

        // Write corrupt JSON directly to the customFormations key
        mockStorage.setItem('sft.v1.customFormations', corruptJson);

        const loaded = adapter.loadAll();

        // No valid formations should be returned
        expect(loaded.customFormations).toEqual([]);
        // At least one corrupt entry was discarded
        expect(loaded.discardedCount).toBeGreaterThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });

  // --- Test: Entirely corrupt savedMoments key ---
  it('discards entirely corrupt savedMoments JSON and reports discardedCount > 0', () => {
    fc.assert(
      fc.property(arbCorruptString, (corruptJson) => {
        const adapter = new StorageAdapter();

        // Write corrupt JSON directly to the savedMoments key
        mockStorage.setItem('sft.v1.savedMoments', corruptJson);

        const loaded = adapter.loadAll();

        // No valid moments should be returned
        expect(loaded.savedMoments).toEqual([]);
        // At least one corrupt entry was discarded
        expect(loaded.discardedCount).toBeGreaterThanOrEqual(1);
      }),
      { numRuns: 100 }
    );
  });

  // --- Test: Mixed valid and invalid items within customFormations array ---
  it('retains valid formations and discards invalid ones from a mixed array', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            arbCustomFormation.map(f => ({ valid: true, item: f })),
            arbInvalidFormationItem.map(f => ({ valid: false, item: f }))
          ),
          { minLength: 1, maxLength: 10 }
        ),
        (entries) => {
          const adapter = new StorageAdapter();

          // Build a JSON array that includes both valid and invalid items
          const rawArray = entries.map(e => e.item);
          mockStorage.setItem('sft.v1.customFormations', JSON.stringify(rawArray));

          const loaded = adapter.loadAll();

          // Count expected valid items
          const expectedValid = entries.filter(e => e.valid);
          const expectedInvalid = entries.filter(e => !e.valid);

          // Returned formations should match valid entries exactly (in order)
          expect(loaded.customFormations.length).toBe(expectedValid.length);

          for (let i = 0; i < expectedValid.length; i++) {
            expect(loaded.customFormations[i].id).toBe(expectedValid[i].item.id);
            expect(loaded.customFormations[i].name).toBe(expectedValid[i].item.name);
            expect(loaded.customFormations[i].format).toBe(expectedValid[i].item.format);
          }

          // discardedCount should account for the invalid entries
          expect(loaded.discardedCount).toBe(expectedInvalid.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // --- Test: Mixed valid and invalid items within savedMoments array ---
  it('retains valid moments and discards invalid ones from a mixed array', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            arbSituationalMoment.map(m => ({ valid: true, item: m })),
            arbInvalidMomentItem.map(m => ({ valid: false, item: m }))
          ),
          { minLength: 1, maxLength: 10 }
        ),
        (entries) => {
          const adapter = new StorageAdapter();

          // Build a JSON array with mixed valid/invalid moment items
          const rawArray = entries.map(e => e.item);
          mockStorage.setItem('sft.v1.savedMoments', JSON.stringify(rawArray));

          const loaded = adapter.loadAll();

          // Count expected valid moments
          const expectedValid = entries.filter(e => e.valid);
          const expectedInvalid = entries.filter(e => !e.valid);

          // Returned moments should match valid entries exactly (in order)
          expect(loaded.savedMoments.length).toBe(expectedValid.length);

          for (let i = 0; i < expectedValid.length; i++) {
            expect(loaded.savedMoments[i].id).toBe(expectedValid[i].item.id);
            expect(loaded.savedMoments[i].name).toBe(expectedValid[i].item.name);
            expect(loaded.savedMoments[i].format).toBe(expectedValid[i].item.format);
          }

          // discardedCount should account for the invalid entries
          expect(loaded.discardedCount).toBe(expectedInvalid.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // --- Test: Multiple keys corrupt simultaneously ---
  it('handles corrupt data across multiple keys and reports total discardedCount', () => {
    fc.assert(
      fc.property(
        arbCorruptString,
        arbCorruptString,
        (corruptFormations, corruptMoments) => {
          const adapter = new StorageAdapter();

          // Both keys have corrupt JSON
          mockStorage.setItem('sft.v1.customFormations', corruptFormations);
          mockStorage.setItem('sft.v1.savedMoments', corruptMoments);

          const loaded = adapter.loadAll();

          // No valid data returned
          expect(loaded.customFormations).toEqual([]);
          expect(loaded.savedMoments).toEqual([]);
          // At least 2 discarded (one for each corrupt key)
          expect(loaded.discardedCount).toBeGreaterThanOrEqual(2);
        }
      ),
      { numRuns: 100 }
    );
  });

  // --- Test: Valid entries survive alongside corrupt keys ---
  it('valid formations survive when savedMoments key is corrupt', () => {
    fc.assert(
      fc.property(
        fc.array(arbCustomFormation, { minLength: 1, maxLength: 5 }),
        arbCorruptString,
        (validFormations, corruptMoments) => {
          const adapter = new StorageAdapter();

          // Valid formations, but corrupt moments
          mockStorage.setItem('sft.v1.customFormations', JSON.stringify(validFormations));
          mockStorage.setItem('sft.v1.savedMoments', corruptMoments);

          const loaded = adapter.loadAll();

          // All valid formations should be retained
          expect(loaded.customFormations.length).toBe(validFormations.length);
          for (let i = 0; i < validFormations.length; i++) {
            expect(loaded.customFormations[i].id).toBe(validFormations[i].id);
          }

          // Moments should be empty (corrupt)
          expect(loaded.savedMoments).toEqual([]);
          // At least 1 discarded (from corrupt moments)
          expect(loaded.discardedCount).toBeGreaterThanOrEqual(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
