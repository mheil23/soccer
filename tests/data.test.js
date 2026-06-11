// Unit tests for data.js — preset formations catalogue (task 2.1)
import { describe, it, expect } from 'vitest';
import {
  DEFAULT_FORMATION,
  getFormationsForFormat,
  getFormationById,
} from '../src/data.js';

const FORMATS = ['7v7', '9v9', '11v11'];
const PLAYER_COUNT = { '7v7': 7, '9v9': 9, '11v11': 11 };

const EXPECTED_FORMATIONS = {
  '7v7':   ['7v7-2-3-1', '7v7-3-2-1', '7v7-2-2-2', '7v7-1-2-1-2', '7v7-3-1-2'],
  '9v9':   ['9v9-3-3-2', '9v9-3-2-3', '9v9-4-3-1'],
  '11v11': ['11v11-4-3-3', '11v11-4-4-2', '11v11-4-2-3-1', '11v11-3-5-2', '11v11-5-3-2'],
};

describe('DEFAULT_FORMATION', () => {
  it('has the correct defaults for all formats', () => {
    expect(DEFAULT_FORMATION['7v7']).toBe('2-3-1');
    expect(DEFAULT_FORMATION['9v9']).toBe('3-3-2');
    expect(DEFAULT_FORMATION['11v11']).toBe('4-3-3');
  });
});

describe('getFormationsForFormat', () => {
  FORMATS.forEach((format) => {
    it(`returns all formations for ${format}`, () => {
      const formations = getFormationsForFormat(format);
      const expectedIds = EXPECTED_FORMATIONS[format];
      expect(formations.map((f) => f.id)).toEqual(expect.arrayContaining(expectedIds));
      expect(formations.length).toBe(expectedIds.length);
    });

    it(`all ${format} formations have exactly ${PLAYER_COUNT[format]} positions`, () => {
      const formations = getFormationsForFormat(format);
      formations.forEach((f) => {
        expect(f.positions.length).toBe(PLAYER_COUNT[format]);
      });
    });

    it(`all ${format} formations have format property set correctly`, () => {
      const formations = getFormationsForFormat(format);
      formations.forEach((f) => {
        expect(f.format).toBe(format);
      });
    });
  });
});

describe('getFormationById', () => {
  it('returns the correct formation by full id', () => {
    const f = getFormationById('11v11-4-3-3');
    expect(f).toBeDefined();
    expect(f.name).toBe('4-3-3');
    expect(f.format).toBe('11v11');
    expect(f.positions.length).toBe(11);
  });

  it('returns undefined for unknown id', () => {
    expect(getFormationById('11v11-9-9-9')).toBeUndefined();
  });

  // Verify all expected ids are retrievable
  Object.values(EXPECTED_FORMATIONS).flat().forEach((id) => {
    it(`can retrieve formation by id: ${id}`, () => {
      expect(getFormationById(id)).toBeDefined();
    });
  });
});

describe('Formation position data integrity', () => {
  FORMATS.forEach((format) => {
    it(`all ${format} positions have normalized nx in [0,1]`, () => {
      getFormationsForFormat(format).forEach((f) => {
        f.positions.forEach((p) => {
          expect(p.nx).toBeGreaterThanOrEqual(0);
          expect(p.nx).toBeLessThanOrEqual(1);
        });
      });
    });

    it(`all ${format} positions have normalized ny in [0,1]`, () => {
      getFormationsForFormat(format).forEach((f) => {
        f.positions.forEach((p) => {
          expect(p.ny).toBeGreaterThanOrEqual(0);
          expect(p.ny).toBeLessThanOrEqual(1);
        });
      });
    });

    it(`all ${format} positions have non-empty key, label, and descriptionId`, () => {
      getFormationsForFormat(format).forEach((f) => {
        f.positions.forEach((p) => {
          expect(p.key.length).toBeGreaterThan(0);
          expect(p.label.length).toBeGreaterThan(0);
          expect(p.descriptionId.length).toBeGreaterThan(0);
        });
      });
    });

    it(`all ${format} formation position keys are unique within each formation`, () => {
      getFormationsForFormat(format).forEach((f) => {
        const keys = f.positions.map((p) => p.key);
        const unique = new Set(keys);
        expect(unique.size).toBe(keys.length);
      });
    });

    it(`each ${format} formation contains exactly one GK`, () => {
      getFormationsForFormat(format).forEach((f) => {
        const gks = f.positions.filter((p) => p.key === 'GK');
        expect(gks.length).toBe(1);
      });
    });
  });

  it('default formations map to valid getFormationById results', () => {
    FORMATS.forEach((format) => {
      const defaultName = DEFAULT_FORMATION[format];
      const id = `${format}-${defaultName}`;
      const formation = getFormationById(id);
      expect(formation).toBeDefined();
      expect(formation.name).toBe(defaultName);
    });
  });
});
