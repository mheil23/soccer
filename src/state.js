/**
 * state.js — Application state model (MVC: Model)
 * Holds the single source of truth for app state.
 * All mutation functions return a new state object — no in-place mutation.
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
 */

import { getFormationById, DEFAULT_FORMATION } from './data.js';

// ---------------------------------------------------------------------------
// Validation Helpers (exported for property testing)
// ---------------------------------------------------------------------------

/**
 * Validate and resolve a token label.
 * Returns { valid: true, label: resolvedLabel } if acceptable,
 * or { valid: false, reason: string } if the label exceeds 20 characters.
 *
 * Rules:
 * - If trimmed label is non-blank and ≤ 20 chars → use trimmed label
 * - If trimmed label is empty (blank/whitespace-only) → use positional number
 * - If trimmed label exceeds 20 chars → reject
 *
 * @param {string} label - the raw label input
 * @param {number} positionalNumber - fallback label when input is blank
 * @returns {{ valid: true, label: string } | { valid: false, reason: string }}
 */
export function validateLabel(label, positionalNumber) {
  const trimmed = label.trim();
  if (trimmed.length > 20) {
    return { valid: false, reason: 'Label exceeds 20 characters' };
  }
  if (trimmed.length === 0) {
    return { valid: true, label: String(positionalNumber) };
  }
  return { valid: true, label: trimmed };
}

/**
 * Validate a save name for custom formations or situational moments.
 * Returns { valid: true, name: trimmedName } if acceptable,
 * or { valid: false, reason: string } if invalid.
 *
 * Rules:
 * - After trimming, the name must be between 1 and 50 characters (inclusive)
 * - Empty or whitespace-only names are rejected
 * - Names exceeding 50 characters (after trimming) are rejected
 *
 * @param {string} name - the raw name input
 * @returns {{ valid: true, name: string } | { valid: false, reason: string }}
 */
export function validateSaveName(name) {
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, reason: 'Name is empty' };
  }
  if (trimmed.length > 50) {
    return { valid: false, reason: 'Name exceeds 50 characters' };
  }
  return { valid: true, name: trimmed };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build PositionToken array from a PresetFormation's positions.
 * @param {import('./data.types').PresetFormation} formation
 * @param {"own"|"opp"} team
 * @returns {Array<{id:string,team:string,label:string,nx:number,ny:number,formationKey:string}>}
 */
function tokensFromFormation(formation, team) {
  return formation.positions.map((pos, i) => ({
    id: `${team}-${i}`,
    team,
    label: pos.label,
    nx: pos.nx,
    ny: team === 'opp' ? 1 - pos.ny : pos.ny,
    formationKey: pos.key,
  }));
}

/**
 * Resolve a formation id string (short name like "4-3-3") or full id
 * ("11v11-4-3-3") for the given format.
 * Returns the PresetFormation or undefined.
 * @param {string} formationId
 * @param {string} format
 * @returns {import('./data.types').PresetFormation|undefined}
 */
function resolveFormation(formationId, format) {
  // Try direct lookup first (full id like "11v11-4-3-3")
  let formation = getFormationById(formationId);
  if (!formation) {
    // Try prefixed lookup (short name like "4-3-3")
    formation = getFormationById(`${format}-${formationId}`);
  }
  return formation;
}

// ---------------------------------------------------------------------------
// createInitialState
// ---------------------------------------------------------------------------

/**
 * Creates the initial AppState for the given format (defaults to "11v11").
 * Applies the default preset formation for the format.
 *
 * @param {"7v7"|"9v9"|"11v11"} [format="11v11"]
 * @returns {AppState}
 */
export function createInitialState(format = '11v11') {
  const defaultFormationName = DEFAULT_FORMATION[format];
  const formationId = `${format}-${defaultFormationName}`;
  const formation = getFormationById(formationId);

  const ownTokens = formation ? tokensFromFormation(formation, 'own') : [];

  return {
    format,
    activeFormationKey: formation ? formation.id : null,
    activeFormationName: formation ? formation.name : null,
    ownTokens,
    ball: { nx: 0.5, ny: 0.5 },
    opponentOverlayEnabled: false,
    opponentFormationKey: null,
    opponentTokens: [],
    selectedTokenId: null,
    customFormations: [],
    savedMoments: [],
    activeMomentKey: null,
    arrows: [],
  };
}

// ---------------------------------------------------------------------------
// Pure mutation functions
// ---------------------------------------------------------------------------

/**
 * Change the active game format.
 * Resets opponent overlay, applies the default formation for the new format,
 * and resets the ball to center.
 *
 * @param {AppState} state
 * @param {"7v7"|"9v9"|"11v11"} format
 * @returns {AppState}
 */
export function setFormat(state, format) {
  const defaultFormationName = DEFAULT_FORMATION[format];
  const formationId = `${format}-${defaultFormationName}`;
  const formation = getFormationById(formationId);

  const ownTokens = formation ? tokensFromFormation(formation, 'own') : [];

  return {
    ...state,
    format,
    activeFormationKey: formation ? formation.id : null,
    activeFormationName: formation ? formation.name : null,
    ownTokens,
    ball: { nx: 0.5, ny: 0.5 },
    opponentOverlayEnabled: false,
    opponentTokens: [],
    selectedTokenId: null,
    activeMomentKey: null,
  };
}

/**
 * Set the active formation key and name without reconciling tokens.
 * (Use applyFormation to also reconcile token count and positions.)
 *
 * @param {AppState} state
 * @param {string|null} formationKey  - full formation id or null
 * @param {string|null} formationName - display name or null
 * @returns {AppState}
 */
export function setActiveFormation(state, formationKey, formationName) {
  return {
    ...state,
    activeFormationKey: formationKey,
    activeFormationName: formationName,
  };
}

/**
 * Apply a preset formation to the own team:
 *  - Reconciles token count (add/remove to match formation size)
 *  - Sets token positions from formation definition
 *  - Resets ball to center
 *
 * @param {AppState} state
 * @param {string} formationId  - full id (e.g. "11v11-4-3-3") or short name (e.g. "4-3-3")
 * @returns {AppState}
 */
export function applyFormation(state, formationId) {
  const formation = resolveFormation(formationId, state.format);
  if (!formation) {
    return state;
  }

  const targetCount = formation.positions.length;
  const current = state.ownTokens;

  let ownTokens;

  if (current.length <= targetCount) {
    // Keep existing tokens up to targetCount, then add any missing ones
    ownTokens = formation.positions.map((pos, i) => {
      // Reuse the existing token's id if available, or generate one
      const existingId = current[i] ? current[i].id : `own-${i}`;
      return {
        id: existingId,
        team: 'own',
        label: pos.label,
        nx: pos.nx,
        ny: pos.ny,
        formationKey: pos.key,
      };
    });
  } else {
    // Trim excess tokens (remove from end), update positions of retained ones
    ownTokens = formation.positions.map((pos, i) => {
      const existingId = current[i] ? current[i].id : `own-${i}`;
      return {
        id: existingId,
        team: 'own',
        label: pos.label,
        nx: pos.nx,
        ny: pos.ny,
        formationKey: pos.key,
      };
    });
  }

  return {
    ...state,
    activeFormationKey: formation.id,
    activeFormationName: formation.name,
    ownTokens,
    ball: { nx: 0.5, ny: 0.5 },
    activeMomentKey: null,
    activeMomentSnapshot: null,
  };
}

/**
 * Update the position of a single own-team token by id.
 *
 * @param {AppState} state
 * @param {string} tokenId
 * @param {number} nx
 * @param {number} ny
 * @returns {AppState}
 */
export function setOwnTokenPosition(state, tokenId, nx, ny) {
  const ownTokens = state.ownTokens.map((t) =>
    t.id === tokenId ? { ...t, nx, ny } : t
  );
  return { ...state, ownTokens };
}

/**
 * Update the ball position.
 *
 * @param {AppState} state
 * @param {number} nx
 * @param {number} ny
 * @returns {AppState}
 */
export function setBallPosition(state, nx, ny) {
  return { ...state, ball: { nx, ny } };
}

/**
 * Enable or disable the opponent overlay.
 * When enabling, applies the given formationKey (or the last-used opponent
 * formation key if omitted) and renders opponent tokens.
 * When disabling, clears opponent tokens.
 *
 * @param {AppState} state
 * @param {boolean} enabled
 * @param {string|null} [formationKey] - formation id to use when enabling
 * @returns {AppState}
 */
export function setOpponentOverlay(state, enabled, formationKey) {
  if (!enabled) {
    return {
      ...state,
      opponentOverlayEnabled: false,
      opponentTokens: [],
    };
  }

  // Resolve which formation to use
  const keyToUse = formationKey ?? state.opponentFormationKey ?? `${state.format}-${DEFAULT_FORMATION[state.format]}`;
  const formation = resolveFormation(keyToUse, state.format);
  const opponentTokens = formation ? tokensFromFormation(formation, 'opp') : [];

  return {
    ...state,
    opponentOverlayEnabled: true,
    opponentFormationKey: formation ? formation.id : (keyToUse ?? null),
    opponentTokens,
  };
}

/**
 * Change the opponent formation while the overlay is enabled.
 * Reconciles opponent tokens to match the new formation.
 *
 * @param {AppState} state
 * @param {string} formationId - full id or short name
 * @returns {AppState}
 */
export function setOpponentFormation(state, formationId) {
  const formation = resolveFormation(formationId, state.format);
  if (!formation) {
    return state;
  }

  const opponentTokens = tokensFromFormation(formation, 'opp');

  return {
    ...state,
    opponentFormationKey: formation.id,
    opponentTokens,
  };
}

/**
 * Update the position of a single opponent token by id.
 *
 * @param {AppState} state
 * @param {string} tokenId
 * @param {number} nx
 * @param {number} ny
 * @returns {AppState}
 */
export function setOpponentTokenPosition(state, tokenId, nx, ny) {
  const opponentTokens = state.opponentTokens.map((t) =>
    t.id === tokenId ? { ...t, nx, ny } : t
  );
  return { ...state, opponentTokens };
}

/**
 * Set the currently selected token id (for the description panel).
 * Pass null to deselect.
 *
 * @param {AppState} state
 * @param {string|null} tokenId
 * @returns {AppState}
 */
export function setSelectedToken(state, tokenId) {
  return { ...state, selectedTokenId: tokenId };
}

/**
 * Set the active moment key (by id).
 *
 * @param {AppState} state
 * @param {string|null} momentKey
 * @returns {AppState}
 */
export function setActiveMoment(state, momentKey) {
  return { ...state, activeMomentKey: momentKey };
}

/**
 * Apply a situational moment to the field:
 *  - Updates own token positions and ball position from the moment definition
 *  - Stores a deep copy of the moment as activeMomentSnapshot (immutable reference)
 *  - Leaves opponent tokens unchanged
 *
 * @param {AppState} state
 * @param {SituationalMoment} moment
 * @returns {AppState}
 */
export function applyMoment(state, moment) {
  // Deep copy the moment definition to prevent external mutation
  const snapshot = structuredClone(moment);

  // Reconcile own tokens to match moment's ownPositions
  const targetPositions = moment.ownPositions;
  const current = state.ownTokens;

  const ownTokens = targetPositions.map((pos, i) => {
    const existingId = current[i] ? current[i].id : `own-${i}`;
    return {
      id: existingId,
      team: 'own',
      label: pos.label,
      nx: pos.nx,
      ny: pos.ny,
      formationKey: current[i] ? current[i].formationKey : '',
    };
  });

  // Handle opponent positions if the moment defines them and overlay is enabled
  let opponentTokens = state.opponentTokens;
  if (state.opponentOverlayEnabled && moment.opponentPositions && moment.opponentPositions.length > 0) {
    opponentTokens = moment.opponentPositions.map((pos, i) => ({
      id: `opp-${i}`,
      team: 'opp',
      label: pos.label,
      nx: pos.nx,
      ny: pos.ny,
      formationKey: '',
    }));
  }

  return {
    ...state,
    ownTokens,
    opponentTokens,
    ball: { nx: moment.ballPosition.nx, ny: moment.ballPosition.ny },
    activeMomentKey: moment.id,
    activeMomentSnapshot: snapshot,
    arrows: moment.arrows || [],
  };
}

/**
 * Add a custom formation to the state's customFormations array.
 *
 * @param {AppState} state
 * @param {CustomFormation} formation
 * @returns {AppState}
 */
export function addCustomFormation(state, formation) {
  return {
    ...state,
    customFormations: [...state.customFormations, formation],
  };
}

/**
 * Delete a custom formation from the state by id.
 *
 * @param {AppState} state
 * @param {string} formationId
 * @returns {AppState}
 */
export function deleteCustomFormation(state, formationId) {
  return {
    ...state,
    customFormations: state.customFormations.filter((f) => f.id !== formationId),
  };
}

/**
 * Add a user-saved moment to the state's savedMoments array.
 *
 * @param {AppState} state
 * @param {SituationalMoment} moment
 * @returns {AppState}
 */
export function addSavedMoment(state, moment) {
  return {
    ...state,
    savedMoments: [...state.savedMoments, moment],
  };
}

/**
 * Delete a user-saved moment from the state by id.
 * Only user-saved moments (isPredefined: false) should be passed here;
 * predefined moments are not stored in savedMoments.
 *
 * @param {AppState} state
 * @param {string} momentId
 * @returns {AppState}
 */
export function deleteSavedMoment(state, momentId) {
  return {
    ...state,
    savedMoments: state.savedMoments.filter((m) => m.id !== momentId),
  };
}

// ---------------------------------------------------------------------------
// Arrow mutations
// ---------------------------------------------------------------------------

/**
 * Add an arrow to the state's arrows array.
 * Each arrow has: { id, startNx, startNy, endNx, endNy }
 *
 * @param {AppState} state
 * @param {{ id: string, startNx: number, startNy: number, endNx: number, endNy: number }} arrow
 * @returns {AppState}
 */
export function addArrow(state, arrow) {
  return {
    ...state,
    arrows: [...state.arrows, arrow],
  };
}

/**
 * Clear all arrows from the state.
 *
 * @param {AppState} state
 * @returns {AppState}
 */
export function clearArrows(state) {
  return {
    ...state,
    arrows: [],
  };
}

/**
 * Delete a single arrow by id.
 *
 * @param {AppState} state
 * @param {string} arrowId
 * @returns {AppState}
 */
export function deleteArrow(state, arrowId) {
  return {
    ...state,
    arrows: state.arrows.filter((a) => a.id !== arrowId),
  };
}

/**
 * Update an arrow's start and end positions.
 *
 * @param {AppState} state
 * @param {string} arrowId
 * @param {{ startNx?: number, startNy?: number, endNx?: number, endNy?: number }} updates
 * @returns {AppState}
 */
export function updateArrow(state, arrowId, updates) {
  return {
    ...state,
    arrows: state.arrows.map((a) =>
      a.id === arrowId ? { ...a, ...updates } : a
    ),
  };
}
