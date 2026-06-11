// Unit tests for state.js — AppState initializer and mutation functions (task 3.1)
import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  setFormat,
  setActiveFormation,
  applyFormation,
  setOwnTokenPosition,
  setBallPosition,
  setOpponentOverlay,
  setOpponentFormation,
  setOpponentTokenPosition,
  setSelectedToken,
  setActiveMoment,
  applyMoment,
  addCustomFormation,
  deleteCustomFormation,
  addSavedMoment,
  deleteSavedMoment,
} from '../src/state.js';
import { DEFAULT_FORMATION, getFormationById } from '../src/data.js';

// ---------------------------------------------------------------------------
// createInitialState
// ---------------------------------------------------------------------------

describe('createInitialState', () => {
  it('defaults to 11v11 format', () => {
    const state = createInitialState();
    expect(state.format).toBe('11v11');
  });

  it('accepts explicit format', () => {
    const state = createInitialState('7v7');
    expect(state.format).toBe('7v7');
  });

  it('applies default formation for the given format', () => {
    for (const format of ['7v7', '9v9', '11v11']) {
      const state = createInitialState(format);
      const defaultName = DEFAULT_FORMATION[format];
      expect(state.activeFormationName).toBe(defaultName);
    }
  });

  it('places correct number of own tokens for each format', () => {
    expect(createInitialState('7v7').ownTokens.length).toBe(7);
    expect(createInitialState('9v9').ownTokens.length).toBe(9);
    expect(createInitialState('11v11').ownTokens.length).toBe(11);
  });

  it('places ball at center', () => {
    const state = createInitialState();
    expect(state.ball).toEqual({ nx: 0.5, ny: 0.5 });
  });

  it('has opponentOverlayEnabled = false', () => {
    expect(createInitialState().opponentOverlayEnabled).toBe(false);
  });

  it('has empty opponentTokens', () => {
    expect(createInitialState().opponentTokens).toEqual([]);
  });

  it('has null selectedTokenId', () => {
    expect(createInitialState().selectedTokenId).toBeNull();
  });

  it('has empty customFormations', () => {
    expect(createInitialState().customFormations).toEqual([]);
  });

  it('has empty savedMoments', () => {
    expect(createInitialState().savedMoments).toEqual([]);
  });

  it('has null activeMomentKey', () => {
    expect(createInitialState().activeMomentKey).toBeNull();
  });

  it('own tokens have correct team property', () => {
    const state = createInitialState();
    state.ownTokens.forEach((t) => expect(t.team).toBe('own'));
  });

  it('own tokens have normalized nx/ny in [0,1]', () => {
    const state = createInitialState('11v11');
    state.ownTokens.forEach((t) => {
      expect(t.nx).toBeGreaterThanOrEqual(0);
      expect(t.nx).toBeLessThanOrEqual(1);
      expect(t.ny).toBeGreaterThanOrEqual(0);
      expect(t.ny).toBeLessThanOrEqual(1);
    });
  });
});

// ---------------------------------------------------------------------------
// setFormat
// ---------------------------------------------------------------------------

describe('setFormat', () => {
  it('changes format', () => {
    const s0 = createInitialState('11v11');
    const s1 = setFormat(s0, '7v7');
    expect(s1.format).toBe('7v7');
  });

  it('applies default formation for new format', () => {
    const s0 = createInitialState('11v11');
    const s1 = setFormat(s0, '9v9');
    expect(s1.activeFormationName).toBe(DEFAULT_FORMATION['9v9']);
  });

  it('sets correct own token count for new format', () => {
    const s0 = createInitialState('11v11');
    const s1 = setFormat(s0, '7v7');
    expect(s1.ownTokens.length).toBe(7);
  });

  it('resets ball to center', () => {
    const s0 = setBallPosition(createInitialState('11v11'), 0.1, 0.9);
    const s1 = setFormat(s0, '9v9');
    expect(s1.ball).toEqual({ nx: 0.5, ny: 0.5 });
  });

  it('disables opponent overlay', () => {
    let s0 = createInitialState('11v11');
    s0 = setOpponentOverlay(s0, true);
    const s1 = setFormat(s0, '7v7');
    expect(s1.opponentOverlayEnabled).toBe(false);
    expect(s1.opponentTokens).toEqual([]);
  });

  it('does not mutate original state', () => {
    const s0 = createInitialState('11v11');
    const format0 = s0.format;
    setFormat(s0, '7v7');
    expect(s0.format).toBe(format0);
  });
});

// ---------------------------------------------------------------------------
// setActiveFormation
// ---------------------------------------------------------------------------

describe('setActiveFormation', () => {
  it('updates activeFormationKey and activeFormationName', () => {
    const s0 = createInitialState();
    const s1 = setActiveFormation(s0, 'custom', 'My Custom');
    expect(s1.activeFormationKey).toBe('custom');
    expect(s1.activeFormationName).toBe('My Custom');
  });

  it('accepts null values', () => {
    const s0 = createInitialState();
    const s1 = setActiveFormation(s0, null, null);
    expect(s1.activeFormationKey).toBeNull();
    expect(s1.activeFormationName).toBeNull();
  });

  it('does not mutate original state', () => {
    const s0 = createInitialState();
    const key0 = s0.activeFormationKey;
    setActiveFormation(s0, 'custom', 'Custom');
    expect(s0.activeFormationKey).toBe(key0);
  });
});

// ---------------------------------------------------------------------------
// applyFormation
// ---------------------------------------------------------------------------

describe('applyFormation', () => {
  it('applies by full formation id', () => {
    const s0 = createInitialState('11v11');
    const s1 = applyFormation(s0, '11v11-4-4-2');
    expect(s1.activeFormationKey).toBe('11v11-4-4-2');
    expect(s1.activeFormationName).toBe('4-4-2');
    expect(s1.ownTokens.length).toBe(11);
  });

  it('applies by short name (prefixed with format)', () => {
    const s0 = createInitialState('7v7');
    const s1 = applyFormation(s0, '3-2-1');
    expect(s1.activeFormationKey).toBe('7v7-3-2-1');
    expect(s1.ownTokens.length).toBe(7);
  });

  it('trims excess tokens when switching to a smaller formation', () => {
    // 11v11-4-3-3 has 11 tokens; hypothetically switching to 7v7 would be
    // tested through setFormat, but we can test within same format size
    // Start with 11 own tokens (11v11-4-3-3), then apply 11v11-4-4-2 (also 11)
    const s0 = createInitialState('11v11');
    // Manually inject more tokens to test trimming
    const s0Extra = {
      ...s0,
      ownTokens: [
        ...s0.ownTokens,
        { id: 'own-extra', team: 'own', label: 'X', nx: 0.5, ny: 0.5, formationKey: 'X' },
        { id: 'own-extra2', team: 'own', label: 'Y', nx: 0.5, ny: 0.5, formationKey: 'Y' },
      ],
    };
    const s1 = applyFormation(s0Extra, '11v11-4-3-3');
    expect(s1.ownTokens.length).toBe(11);
  });

  it('adds tokens when switching to a larger formation (cross-format simulation)', () => {
    // Simulate having fewer tokens than target
    const s0 = createInitialState('11v11');
    const sFewerTokens = {
      ...s0,
      ownTokens: s0.ownTokens.slice(0, 5),
    };
    const s1 = applyFormation(sFewerTokens, '11v11-4-3-3');
    expect(s1.ownTokens.length).toBe(11);
  });

  it('resets ball to center', () => {
    const s0 = setBallPosition(createInitialState('11v11'), 0.1, 0.9);
    const s1 = applyFormation(s0, '11v11-4-4-2');
    expect(s1.ball).toEqual({ nx: 0.5, ny: 0.5 });
  });

  it('sets token positions from formation definition', () => {
    const s0 = createInitialState('11v11');
    const s1 = applyFormation(s0, '11v11-4-3-3');
    const formation = getFormationById('11v11-4-3-3');
    s1.ownTokens.forEach((token, i) => {
      expect(token.nx).toBeCloseTo(formation.positions[i].nx);
      expect(token.ny).toBeCloseTo(formation.positions[i].ny);
    });
  });

  it('returns same state for unknown formation id', () => {
    const s0 = createInitialState('11v11');
    const s1 = applyFormation(s0, 'nonexistent-formation');
    expect(s1).toBe(s0);
  });

  it('does not mutate original state', () => {
    const s0 = createInitialState('11v11');
    const tokens0 = s0.ownTokens;
    applyFormation(s0, '11v11-4-4-2');
    expect(s0.ownTokens).toBe(tokens0);
  });
});

// ---------------------------------------------------------------------------
// setOwnTokenPosition
// ---------------------------------------------------------------------------

describe('setOwnTokenPosition', () => {
  it('updates nx and ny for the target token', () => {
    const s0 = createInitialState();
    const tokenId = s0.ownTokens[0].id;
    const s1 = setOwnTokenPosition(s0, tokenId, 0.3, 0.7);
    const updated = s1.ownTokens.find((t) => t.id === tokenId);
    expect(updated.nx).toBe(0.3);
    expect(updated.ny).toBe(0.7);
  });

  it('does not affect other tokens', () => {
    const s0 = createInitialState();
    const [first, second] = s0.ownTokens;
    const s1 = setOwnTokenPosition(s0, first.id, 0.1, 0.1);
    const secondAfter = s1.ownTokens.find((t) => t.id === second.id);
    expect(secondAfter.nx).toBe(second.nx);
    expect(secondAfter.ny).toBe(second.ny);
  });

  it('does not mutate original state', () => {
    const s0 = createInitialState();
    const tokenId = s0.ownTokens[0].id;
    const nx0 = s0.ownTokens[0].nx;
    setOwnTokenPosition(s0, tokenId, 0.9, 0.9);
    expect(s0.ownTokens[0].nx).toBe(nx0);
  });
});

// ---------------------------------------------------------------------------
// setBallPosition
// ---------------------------------------------------------------------------

describe('setBallPosition', () => {
  it('updates ball nx and ny', () => {
    const s0 = createInitialState();
    const s1 = setBallPosition(s0, 0.25, 0.75);
    expect(s1.ball).toEqual({ nx: 0.25, ny: 0.75 });
  });

  it('does not mutate original ball', () => {
    const s0 = createInitialState();
    const ball0 = s0.ball;
    setBallPosition(s0, 0.1, 0.1);
    expect(s0.ball).toBe(ball0);
  });
});

// ---------------------------------------------------------------------------
// setOpponentOverlay
// ---------------------------------------------------------------------------

describe('setOpponentOverlay', () => {
  it('enables overlay and populates opponent tokens', () => {
    const s0 = createInitialState('11v11');
    const s1 = setOpponentOverlay(s0, true);
    expect(s1.opponentOverlayEnabled).toBe(true);
    expect(s1.opponentTokens.length).toBe(11);
    s1.opponentTokens.forEach((t) => expect(t.team).toBe('opp'));
  });

  it('disables overlay and clears opponent tokens', () => {
    const s0 = createInitialState('11v11');
    const s1 = setOpponentOverlay(s0, true);
    const s2 = setOpponentOverlay(s1, false);
    expect(s2.opponentOverlayEnabled).toBe(false);
    expect(s2.opponentTokens).toEqual([]);
  });

  it('uses supplied formationKey when enabling', () => {
    const s0 = createInitialState('11v11');
    const s1 = setOpponentOverlay(s0, true, '11v11-4-4-2');
    expect(s1.opponentFormationKey).toBe('11v11-4-4-2');
    expect(s1.opponentTokens.length).toBe(11);
  });

  it('does not mutate original state', () => {
    const s0 = createInitialState('11v11');
    const enabled0 = s0.opponentOverlayEnabled;
    setOpponentOverlay(s0, true);
    expect(s0.opponentOverlayEnabled).toBe(enabled0);
  });
});

// ---------------------------------------------------------------------------
// setOpponentFormation
// ---------------------------------------------------------------------------

describe('setOpponentFormation', () => {
  it('changes opponent formation and updates tokens', () => {
    const s0 = setOpponentOverlay(createInitialState('11v11'), true);
    const s1 = setOpponentFormation(s0, '11v11-4-4-2');
    expect(s1.opponentFormationKey).toBe('11v11-4-4-2');
    expect(s1.opponentTokens.length).toBe(11);
  });

  it('returns same state for unknown formation', () => {
    const s0 = setOpponentOverlay(createInitialState('11v11'), true);
    const s1 = setOpponentFormation(s0, 'unknown');
    expect(s1).toBe(s0);
  });

  it('does not mutate original state', () => {
    const s0 = setOpponentOverlay(createInitialState('11v11'), true);
    const key0 = s0.opponentFormationKey;
    setOpponentFormation(s0, '11v11-4-4-2');
    expect(s0.opponentFormationKey).toBe(key0);
  });
});

// ---------------------------------------------------------------------------
// setOpponentTokenPosition
// ---------------------------------------------------------------------------

describe('setOpponentTokenPosition', () => {
  it('updates opponent token position', () => {
    const s0 = setOpponentOverlay(createInitialState('11v11'), true);
    const tokenId = s0.opponentTokens[0].id;
    const s1 = setOpponentTokenPosition(s0, tokenId, 0.6, 0.8);
    const updated = s1.opponentTokens.find((t) => t.id === tokenId);
    expect(updated.nx).toBe(0.6);
    expect(updated.ny).toBe(0.8);
  });

  it('does not affect other opponent tokens', () => {
    const s0 = setOpponentOverlay(createInitialState('11v11'), true);
    const [first, second] = s0.opponentTokens;
    const s1 = setOpponentTokenPosition(s0, first.id, 0.1, 0.1);
    const secondAfter = s1.opponentTokens.find((t) => t.id === second.id);
    expect(secondAfter.nx).toBe(second.nx);
  });

  it('does not mutate original state', () => {
    const s0 = setOpponentOverlay(createInitialState('11v11'), true);
    const tokenId = s0.opponentTokens[0].id;
    const nx0 = s0.opponentTokens[0].nx;
    setOpponentTokenPosition(s0, tokenId, 0.9, 0.9);
    expect(s0.opponentTokens[0].nx).toBe(nx0);
  });
});

// ---------------------------------------------------------------------------
// setSelectedToken
// ---------------------------------------------------------------------------

describe('setSelectedToken', () => {
  it('sets selectedTokenId', () => {
    const s0 = createInitialState();
    const s1 = setSelectedToken(s0, 'own-0');
    expect(s1.selectedTokenId).toBe('own-0');
  });

  it('accepts null to deselect', () => {
    const s0 = { ...createInitialState(), selectedTokenId: 'own-0' };
    const s1 = setSelectedToken(s0, null);
    expect(s1.selectedTokenId).toBeNull();
  });

  it('does not mutate original state', () => {
    const s0 = createInitialState();
    setSelectedToken(s0, 'own-3');
    expect(s0.selectedTokenId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// setActiveMoment
// ---------------------------------------------------------------------------

describe('setActiveMoment', () => {
  it('sets activeMomentKey', () => {
    const s0 = createInitialState();
    const s1 = setActiveMoment(s0, 'corner-attacking-11v11');
    expect(s1.activeMomentKey).toBe('corner-attacking-11v11');
  });

  it('accepts null', () => {
    const s0 = { ...createInitialState(), activeMomentKey: 'some-key' };
    const s1 = setActiveMoment(s0, null);
    expect(s1.activeMomentKey).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// applyMoment
// ---------------------------------------------------------------------------

const sampleMoment = {
  id: 'test-moment',
  name: 'Test Moment',
  isPredefined: false,
  format: '11v11',
  ownPositions: [
    { label: 'GK', nx: 0.5, ny: 0.05 },
    { label: 'CB', nx: 0.3, ny: 0.2 },
    { label: 'ST', nx: 0.7, ny: 0.8 },
  ],
  ballPosition: { nx: 0.5, ny: 0.5 },
  savedAt: '2024-01-01T00:00:00.000Z',
};

describe('applyMoment', () => {
  it('updates own token positions from moment definition', () => {
    const s0 = createInitialState('11v11');
    const s1 = applyMoment(s0, sampleMoment);
    expect(s1.ownTokens.length).toBe(3);
    expect(s1.ownTokens[0].label).toBe('GK');
    expect(s1.ownTokens[0].nx).toBe(0.5);
    expect(s1.ownTokens[0].ny).toBe(0.05);
  });

  it('updates ball position from moment definition', () => {
    const s0 = createInitialState('11v11');
    const s1 = applyMoment(s0, sampleMoment);
    expect(s1.ball).toEqual({ nx: 0.5, ny: 0.5 });
  });

  it('sets activeMomentKey to the moment id', () => {
    const s0 = createInitialState('11v11');
    const s1 = applyMoment(s0, sampleMoment);
    expect(s1.activeMomentKey).toBe('test-moment');
  });

  it('stores a deep copy as activeMomentSnapshot', () => {
    const s0 = createInitialState('11v11');
    const s1 = applyMoment(s0, sampleMoment);
    expect(s1.activeMomentSnapshot).toBeDefined();
    // It should be a different object (deep clone)
    expect(s1.activeMomentSnapshot).not.toBe(sampleMoment);
    expect(s1.activeMomentSnapshot.id).toBe(sampleMoment.id);
  });

  it('snapshot is not mutated when state changes', () => {
    const s0 = createInitialState('11v11');
    const s1 = applyMoment(s0, sampleMoment);
    const snapNx = s1.activeMomentSnapshot.ownPositions[0].nx;
    // Move the token in state
    const tokenId = s1.ownTokens[0].id;
    const s2 = setOwnTokenPosition(s1, tokenId, 0.99, 0.99);
    // Snapshot should remain unchanged
    expect(s2.activeMomentSnapshot.ownPositions[0].nx).toBe(snapNx);
  });

  it('leaves opponent tokens unchanged', () => {
    const s0 = setOpponentOverlay(createInitialState('11v11'), true);
    const opponentsBefore = s0.opponentTokens.map((t) => ({ ...t }));
    const s1 = applyMoment(s0, sampleMoment);
    s1.opponentTokens.forEach((t, i) => {
      expect(t.nx).toBe(opponentsBefore[i].nx);
      expect(t.ny).toBe(opponentsBefore[i].ny);
    });
  });

  it('does not mutate original state', () => {
    const s0 = createInitialState('11v11');
    const tokens0 = s0.ownTokens;
    applyMoment(s0, sampleMoment);
    expect(s0.ownTokens).toBe(tokens0);
  });
});

// ---------------------------------------------------------------------------
// addCustomFormation / deleteCustomFormation
// ---------------------------------------------------------------------------

const sampleCustomFormation = {
  id: 'custom-uuid-1',
  name: 'My Formation',
  format: '11v11',
  positions: [
    { label: 'GK', nx: 0.5, ny: 0.05 },
  ],
  savedAt: '2024-01-01T00:00:00.000Z',
};

describe('addCustomFormation', () => {
  it('adds a custom formation to the array', () => {
    const s0 = createInitialState();
    const s1 = addCustomFormation(s0, sampleCustomFormation);
    expect(s1.customFormations).toHaveLength(1);
    expect(s1.customFormations[0]).toBe(sampleCustomFormation);
  });

  it('appends to existing formations', () => {
    const s0 = addCustomFormation(createInitialState(), sampleCustomFormation);
    const another = { ...sampleCustomFormation, id: 'custom-uuid-2', name: 'Another' };
    const s1 = addCustomFormation(s0, another);
    expect(s1.customFormations).toHaveLength(2);
  });

  it('does not mutate original state', () => {
    const s0 = createInitialState();
    addCustomFormation(s0, sampleCustomFormation);
    expect(s0.customFormations).toHaveLength(0);
  });
});

describe('deleteCustomFormation', () => {
  it('removes a custom formation by id', () => {
    const s0 = addCustomFormation(createInitialState(), sampleCustomFormation);
    const s1 = deleteCustomFormation(s0, 'custom-uuid-1');
    expect(s1.customFormations).toHaveLength(0);
  });

  it('leaves other formations intact', () => {
    let s = createInitialState();
    s = addCustomFormation(s, sampleCustomFormation);
    s = addCustomFormation(s, { ...sampleCustomFormation, id: 'custom-uuid-2', name: 'B' });
    const s1 = deleteCustomFormation(s, 'custom-uuid-1');
    expect(s1.customFormations).toHaveLength(1);
    expect(s1.customFormations[0].id).toBe('custom-uuid-2');
  });

  it('is a no-op for unknown id', () => {
    const s0 = addCustomFormation(createInitialState(), sampleCustomFormation);
    const s1 = deleteCustomFormation(s0, 'nonexistent');
    expect(s1.customFormations).toHaveLength(1);
  });

  it('does not mutate original state', () => {
    const s0 = addCustomFormation(createInitialState(), sampleCustomFormation);
    deleteCustomFormation(s0, 'custom-uuid-1');
    expect(s0.customFormations).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// addSavedMoment / deleteSavedMoment
// ---------------------------------------------------------------------------

const sampleSavedMoment = {
  id: 'saved-moment-1',
  name: 'My Corner Kick',
  isPredefined: false,
  format: '11v11',
  ownPositions: [{ label: 'GK', nx: 0.5, ny: 0.05 }],
  ballPosition: { nx: 0.9, ny: 0.95 },
  savedAt: '2024-01-01T00:00:00.000Z',
};

describe('addSavedMoment', () => {
  it('adds a moment to savedMoments', () => {
    const s0 = createInitialState();
    const s1 = addSavedMoment(s0, sampleSavedMoment);
    expect(s1.savedMoments).toHaveLength(1);
    expect(s1.savedMoments[0]).toBe(sampleSavedMoment);
  });

  it('appends to existing moments', () => {
    const s0 = addSavedMoment(createInitialState(), sampleSavedMoment);
    const another = { ...sampleSavedMoment, id: 'saved-moment-2', name: 'Free Kick' };
    const s1 = addSavedMoment(s0, another);
    expect(s1.savedMoments).toHaveLength(2);
  });

  it('does not mutate original state', () => {
    const s0 = createInitialState();
    addSavedMoment(s0, sampleSavedMoment);
    expect(s0.savedMoments).toHaveLength(0);
  });
});

describe('deleteSavedMoment', () => {
  it('removes a saved moment by id', () => {
    const s0 = addSavedMoment(createInitialState(), sampleSavedMoment);
    const s1 = deleteSavedMoment(s0, 'saved-moment-1');
    expect(s1.savedMoments).toHaveLength(0);
  });

  it('leaves other moments intact', () => {
    let s = createInitialState();
    s = addSavedMoment(s, sampleSavedMoment);
    s = addSavedMoment(s, { ...sampleSavedMoment, id: 'saved-moment-2', name: 'B' });
    const s1 = deleteSavedMoment(s, 'saved-moment-1');
    expect(s1.savedMoments).toHaveLength(1);
    expect(s1.savedMoments[0].id).toBe('saved-moment-2');
  });

  it('is a no-op for unknown id', () => {
    const s0 = addSavedMoment(createInitialState(), sampleSavedMoment);
    const s1 = deleteSavedMoment(s0, 'nonexistent');
    expect(s1.savedMoments).toHaveLength(1);
  });

  it('does not mutate original state', () => {
    const s0 = addSavedMoment(createInitialState(), sampleSavedMoment);
    deleteSavedMoment(s0, 'saved-moment-1');
    expect(s0.savedMoments).toHaveLength(1);
  });
});
