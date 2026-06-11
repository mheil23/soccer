/**
 * Unit tests for storage.js — StorageAdapter
 * Tests: read/write with key prefix, error handling, loadAll validation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageAdapter, StorageQuotaExceededError } from '../src/storage.js';

// ---------------------------------------------------------------------------
// Mock localStorage
// ---------------------------------------------------------------------------

function createMockLocalStorage() {
  const store = {};
  return {
    getItem: vi.fn((key) => (key in store ? store[key] : null)),
    setItem: vi.fn((key, value) => { store[key] = String(value); }),
    removeItem: vi.fn((key) => { delete store[key]; }),
    _store: store,
  };
}

describe('StorageAdapter', () => {
  let mockStorage;
  let originalLocalStorage;

  beforeEach(() => {
    mockStorage = createMockLocalStorage();
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

  describe('isAvailable()', () => {
    it('returns true when localStorage is accessible', () => {
      const adapter = new StorageAdapter();
      expect(adapter.isAvailable()).toBe(true);
    });

    it('returns false when localStorage throws SecurityError', () => {
      mockStorage.setItem.mockImplementation(() => {
        const err = new DOMException('Access denied', 'SecurityError');
        throw err;
      });
      const adapter = new StorageAdapter();
      expect(adapter.isAvailable()).toBe(false);
    });
  });

  describe('read(key)', () => {
    it('reads from localStorage with sft.v1.* prefix', () => {
      mockStorage._store['sft.v1.format'] = '"11v11"';
      const adapter = new StorageAdapter();
      expect(adapter.read('format')).toBe('"11v11"');
      expect(mockStorage.getItem).toHaveBeenCalledWith('sft.v1.format');
    });

    it('returns null for non-existent key', () => {
      const adapter = new StorageAdapter();
      expect(adapter.read('nonexistent')).toBeNull();
    });

    it('returns null and sets available=false on SecurityError', () => {
      const adapter = new StorageAdapter();
      mockStorage.getItem.mockImplementation(() => {
        const err = new DOMException('Access denied', 'SecurityError');
        throw err;
      });
      expect(adapter.read('format')).toBeNull();
      expect(adapter.isAvailable()).toBe(false);
    });
  });

  describe('write(key, value)', () => {
    it('writes to localStorage with sft.v1.* prefix', () => {
      const adapter = new StorageAdapter();
      adapter.write('format', '11v11');
      expect(mockStorage.setItem).toHaveBeenCalledWith('sft.v1.format', '11v11');
    });

    it('throws StorageQuotaExceededError on quota exceeded', () => {
      const adapter = new StorageAdapter();
      mockStorage.setItem.mockImplementation((key, value) => {
        if (key !== 'sft.v1.__test__') {
          const err = new DOMException('Quota exceeded', 'QuotaExceededError');
          throw err;
        }
      });
      expect(() => adapter.write('format', '11v11')).toThrow(StorageQuotaExceededError);
      expect(() => adapter.write('format', '11v11')).toThrow(
        'Save failed: storage quota exceeded. Your existing saved data has not been affected.'
      );
    });

    it('sets available=false on SecurityError without throwing', () => {
      const adapter = new StorageAdapter();
      mockStorage.setItem.mockImplementation((key) => {
        if (key !== 'sft.v1.__test__') {
          const err = new DOMException('Access denied', 'SecurityError');
          throw err;
        }
      });
      // Should not throw
      adapter.write('format', '11v11');
      expect(adapter.isAvailable()).toBe(false);
    });

    it('does nothing when storage is not available', () => {
      mockStorage.setItem.mockImplementation(() => {
        const err = new DOMException('Access denied', 'SecurityError');
        throw err;
      });
      const adapter = new StorageAdapter();
      // Reset mock after constructor availability check
      mockStorage.setItem.mockClear();
      adapter.write('format', '11v11');
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });
  });

  describe('loadAll()', () => {
    it('returns defaults when localStorage is empty', () => {
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result).toEqual({
        format: null,
        customFormations: [],
        savedMoments: [],
        opponentState: null,
        discardedCount: 0,
      });
    });

    it('loads a valid format', () => {
      mockStorage._store['sft.v1.format'] = '9v9';
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.format).toBe('9v9');
      expect(result.discardedCount).toBe(0);
    });

    it('discards an invalid format', () => {
      mockStorage._store['sft.v1.format'] = '5v5';
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.format).toBeNull();
      expect(result.discardedCount).toBe(1);
    });

    it('loads valid custom formations', () => {
      const validFormation = {
        id: 'cf-1',
        name: 'My Formation',
        format: '11v11',
        positions: [
          { label: 'GK', nx: 0.5, ny: 0.95 },
          { label: 'CB', nx: 0.3, ny: 0.7 },
        ],
        savedAt: '2024-01-01T00:00:00.000Z',
      };
      mockStorage._store['sft.v1.customFormations'] = JSON.stringify([validFormation]);
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.customFormations).toEqual([validFormation]);
      expect(result.discardedCount).toBe(0);
    });

    it('discards custom formations with out-of-range coordinates', () => {
      const invalidFormation = {
        id: 'cf-2',
        name: 'Bad Formation',
        format: '11v11',
        positions: [
          { label: 'GK', nx: 1.5, ny: 0.95 }, // nx out of range
        ],
        savedAt: '2024-01-01T00:00:00.000Z',
      };
      mockStorage._store['sft.v1.customFormations'] = JSON.stringify([invalidFormation]);
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.customFormations).toEqual([]);
      expect(result.discardedCount).toBe(1);
    });

    it('discards formations with missing required fields', () => {
      const incompleteFormation = {
        id: 'cf-3',
        name: 'Incomplete',
        // missing: format, positions, savedAt
      };
      mockStorage._store['sft.v1.customFormations'] = JSON.stringify([incompleteFormation]);
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.customFormations).toEqual([]);
      expect(result.discardedCount).toBe(1);
    });

    it('retains valid entries and discards invalid ones in the same array', () => {
      const valid = {
        id: 'cf-valid',
        name: 'Good',
        format: '7v7',
        positions: [{ label: 'GK', nx: 0.5, ny: 0.9 }],
        savedAt: '2024-06-01T12:00:00.000Z',
      };
      const invalid = { id: 'cf-invalid' };
      mockStorage._store['sft.v1.customFormations'] = JSON.stringify([valid, invalid]);
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.customFormations).toEqual([valid]);
      expect(result.discardedCount).toBe(1);
    });

    it('handles corrupt JSON in customFormations', () => {
      mockStorage._store['sft.v1.customFormations'] = 'NOT_VALID_JSON{{{';
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.customFormations).toEqual([]);
      expect(result.discardedCount).toBe(1);
    });

    it('loads valid saved moments', () => {
      const validMoment = {
        id: 'sm-1',
        name: 'Corner Kick',
        isPredefined: false,
        format: '11v11',
        ownPositions: [{ label: 'GK', nx: 0.5, ny: 0.95 }],
        ballPosition: { nx: 0.0, ny: 0.0 },
        savedAt: '2024-01-01T00:00:00.000Z',
      };
      mockStorage._store['sft.v1.savedMoments'] = JSON.stringify([validMoment]);
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.savedMoments).toEqual([validMoment]);
      expect(result.discardedCount).toBe(0);
    });

    it('discards saved moments with out-of-range ball position', () => {
      const badMoment = {
        id: 'sm-bad',
        name: 'Bad Moment',
        isPredefined: false,
        format: '11v11',
        ownPositions: [{ label: 'GK', nx: 0.5, ny: 0.95 }],
        ballPosition: { nx: -0.1, ny: 0.5 }, // out of range
        savedAt: '2024-01-01T00:00:00.000Z',
      };
      mockStorage._store['sft.v1.savedMoments'] = JSON.stringify([badMoment]);
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.savedMoments).toEqual([]);
      expect(result.discardedCount).toBe(1);
    });

    it('loads valid opponent state', () => {
      const opponentState = { formationKey: '11v11-4-4-2', enabled: true };
      mockStorage._store['sft.v1.opponentState'] = JSON.stringify(opponentState);
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.opponentState).toEqual(opponentState);
      expect(result.discardedCount).toBe(0);
    });

    it('discards corrupt opponent state JSON', () => {
      mockStorage._store['sft.v1.opponentState'] = '{{invalid';
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.opponentState).toBeNull();
      expect(result.discardedCount).toBe(1);
    });

    it('discards opponent state that is not an object', () => {
      mockStorage._store['sft.v1.opponentState'] = JSON.stringify('just a string');
      const adapter = new StorageAdapter();
      const result = adapter.loadAll();
      expect(result.opponentState).toBeNull();
      expect(result.discardedCount).toBe(1);
    });
  });
});
