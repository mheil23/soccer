/**
 * storage.js — Versioned localStorage adapter
 * All keys use the "sft.v1.*" prefix.
 * Wraps all calls in try/catch; handles SecurityError, QuotaExceededError,
 * and corrupt / schema-invalid JSON entries.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const KEY_PREFIX = 'sft.v1';
const KEYS = {
  format: `${KEY_PREFIX}.format`,
  customFormations: `${KEY_PREFIX}.customFormations`,
  savedMoments: `${KEY_PREFIX}.savedMoments`,
  opponentState: `${KEY_PREFIX}.opponentState`,
};

const VALID_FORMATS = ['5v5', '7v7', '9v9', '11v11'];

// ---------------------------------------------------------------------------
// Custom Error
// ---------------------------------------------------------------------------

/**
 * Typed error thrown when localStorage quota is exceeded.
 */
export class StorageQuotaExceededError extends Error {
  constructor(message = 'Save failed: storage quota exceeded. Your existing saved data has not been affected.') {
    super(message);
    this.name = 'StorageQuotaExceededError';
  }
}

// ---------------------------------------------------------------------------
// Validation Helpers
// ---------------------------------------------------------------------------

/**
 * Check if a value is a number in [0, 1].
 * @param {*} val
 * @returns {boolean}
 */
function isNormalized(val) {
  return typeof val === 'number' && val >= 0 && val <= 1 && !Number.isNaN(val);
}

/**
 * Validate a single position object: { label: string, nx: number in [0,1], ny: number in [0,1] }
 * @param {*} pos
 * @returns {boolean}
 */
function isValidPosition(pos) {
  if (pos === null || typeof pos !== 'object') return false;
  if (typeof pos.label !== 'string') return false;
  if (!isNormalized(pos.nx) || !isNormalized(pos.ny)) return false;
  return true;
}

/**
 * Validate a ball position: { nx: number in [0,1], ny: number in [0,1] }
 * @param {*} bp
 * @returns {boolean}
 */
function isValidBallPosition(bp) {
  if (bp === null || typeof bp !== 'object') return false;
  if (!isNormalized(bp.nx) || !isNormalized(bp.ny)) return false;
  return true;
}

/**
 * Validate a CustomFormation object.
 * Required fields: id (string), name (string), format (valid format), positions (array of valid positions), savedAt (string).
 * @param {*} item
 * @returns {boolean}
 */
function isValidCustomFormation(item) {
  if (item === null || typeof item !== 'object') return false;
  if (typeof item.id !== 'string' || item.id === '') return false;
  if (typeof item.name !== 'string' || item.name === '') return false;
  if (!VALID_FORMATS.includes(item.format)) return false;
  if (!Array.isArray(item.positions) || item.positions.length === 0) return false;
  if (typeof item.savedAt !== 'string' || item.savedAt === '') return false;

  // Validate all positions
  for (const pos of item.positions) {
    if (!isValidPosition(pos)) return false;
  }

  return true;
}

/**
 * Validate a SituationalMoment object.
 * Required fields: id, name, isPredefined, format, ownPositions, ballPosition, savedAt.
 * @param {*} item
 * @returns {boolean}
 */
function isValidSavedMoment(item) {
  if (item === null || typeof item !== 'object') return false;
  if (typeof item.id !== 'string' || item.id === '') return false;
  if (typeof item.name !== 'string' || item.name === '') return false;
  if (typeof item.isPredefined !== 'boolean') return false;
  if (!VALID_FORMATS.includes(item.format)) return false;
  if (!Array.isArray(item.ownPositions) || item.ownPositions.length === 0) return false;
  if (!isValidBallPosition(item.ballPosition)) return false;
  if (typeof item.savedAt !== 'string' || item.savedAt === '') return false;

  // Validate all own positions
  for (const pos of item.ownPositions) {
    if (!isValidPosition(pos)) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// StorageAdapter Class
// ---------------------------------------------------------------------------

export class StorageAdapter {
  constructor() {
    this._available = true;
    // Check availability immediately
    this._checkAvailability();
  }

  /**
   * Probe localStorage to determine if it's accessible.
   * Sets _available = false on SecurityError or ReferenceError.
   */
  _checkAvailability() {
    try {
      const testKey = `${KEY_PREFIX}.__test__`;
      localStorage.setItem(testKey, '1');
      localStorage.removeItem(testKey);
    } catch (err) {
      if (err instanceof DOMException || err instanceof ReferenceError) {
        this._available = false;
      }
    }
  }

  /**
   * Returns whether localStorage is available.
   * @returns {boolean}
   */
  isAvailable() {
    return this._available;
  }

  /**
   * Read a raw value from localStorage with the versioned key prefix.
   * Returns null if unavailable, key not found, or read fails.
   * @param {string} key - The key suffix (e.g., "format", "customFormations")
   * @returns {string|null}
   */
  read(key) {
    if (!this._available) return null;
    try {
      return localStorage.getItem(`${KEY_PREFIX}.${key}`);
    } catch (err) {
      if (err.name === 'SecurityError' || err instanceof ReferenceError) {
        this._available = false;
      }
      return null;
    }
  }

  /**
   * Write a value to localStorage with the versioned key prefix.
   * On QuotaExceededError (or NS_ERROR_DOM_QUOTA_REACHED in Firefox), throws StorageQuotaExceededError.
   * On SecurityError/ReferenceError, sets available=false silently.
   * @param {string} key - The key suffix (e.g., "format", "customFormations")
   * @param {string} value - The string value to store
   * @throws {StorageQuotaExceededError}
   */
  write(key, value) {
    if (!this._available) return;
    try {
      localStorage.setItem(`${KEY_PREFIX}.${key}`, value);
    } catch (err) {
      if (
        err.name === 'QuotaExceededError' ||
        err.code === 22 || // Legacy quota exceeded code
        err.code === 1014 || // Firefox NS_ERROR_DOM_QUOTA_REACHED
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      ) {
        throw new StorageQuotaExceededError();
      }
      if (err.name === 'SecurityError' || err instanceof ReferenceError) {
        this._available = false;
      }
    }
  }

  /**
   * Load all application data from localStorage.
   * Returns validated data and a count of discarded items.
   *
   * @returns {{ format: string|null, customFormations: Array, savedMoments: Array, opponentState: object|null, discardedCount: number }}
   */
  loadAll() {
    let discardedCount = 0;

    // --- format ---
    let format = null;
    const rawFormat = this.read('format');
    if (rawFormat !== null) {
      if (VALID_FORMATS.includes(rawFormat)) {
        format = rawFormat;
      } else {
        discardedCount++;
      }
    }

    // --- customFormations ---
    let customFormations = [];
    const rawFormations = this.read('customFormations');
    if (rawFormations !== null) {
      let parsed;
      try {
        parsed = JSON.parse(rawFormations);
      } catch {
        discardedCount++;
        parsed = null;
      }
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (isValidCustomFormation(item)) {
            customFormations.push(item);
          } else {
            discardedCount++;
          }
        }
      } else if (parsed !== null) {
        // Not an array — discard the entire value
        discardedCount++;
      }
    }

    // --- savedMoments ---
    let savedMoments = [];
    const rawMoments = this.read('savedMoments');
    if (rawMoments !== null) {
      let parsed;
      try {
        parsed = JSON.parse(rawMoments);
      } catch {
        discardedCount++;
        parsed = null;
      }
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (isValidSavedMoment(item)) {
            savedMoments.push(item);
          } else {
            discardedCount++;
          }
        }
      } else if (parsed !== null) {
        discardedCount++;
      }
    }

    // --- opponentState ---
    let opponentState = null;
    const rawOpponent = this.read('opponentState');
    if (rawOpponent !== null) {
      try {
        const parsed = JSON.parse(rawOpponent);
        if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
          opponentState = parsed;
        } else {
          discardedCount++;
        }
      } catch {
        discardedCount++;
      }
    }

    return {
      format,
      customFormations,
      savedMoments,
      opponentState,
      discardedCount,
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton Export
// ---------------------------------------------------------------------------

export const storage = new StorageAdapter();
