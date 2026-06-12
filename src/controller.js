/**
 * controller.js — Event hub and drag interaction (MVC: Controller)
 * Handles user events, calls state mutations, and triggers re-renders.
 * Implements Pointer Events API drag logic for tokens and ball.
 *
 * Requirements: 1.5, 4.5, 4.6, 4.7, 4.8, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6
 */

import { toNormalized, renderField, renderTokens, renderBall, renderArrows } from './renderer.js';
import {
  createInitialState,
  setFormat,
  setOwnTokenPosition,
  setOpponentTokenPosition,
  setBallPosition,
  setOpponentOverlay,
  setOpponentFormation,
  addCustomFormation,
  deleteCustomFormation,
  validateLabel,
  validateSaveName,
  applyFormation,
  applyMoment,
  setSelectedToken,
  addSavedMoment,
  deleteSavedMoment,
  addArrow,
  clearArrows,
  deleteArrow,
  updateArrow,
} from './state.js';
import { getFormationsForFormat, getFormationById, DEFAULT_FORMATION, getDescriptionById, getPredefinedMoments } from './data.js';
import { storage, StorageQuotaExceededError } from './storage.js';

// ─── Notification System (Requirements 8.4, 8.5, 8.6) ──────────────────────

/** @type {Array<{message: string, type: string, element: HTMLElement, timerId: number}>} */
const notificationQueue = [];

/**
 * Show a notification banner message. Multiple notifications queue (append, don't replace).
 * Each notification auto-dismisses after 5 seconds.
 *
 * @param {string} message - The notification text
 * @param {"info"|"warn"|"error"} [type="error"] - The notification type
 */
export function showNotification(message, type = 'error') {
  const banner = document.getElementById('notification-banner');
  if (!banner) return;

  const el = document.createElement('div');
  el.className = `notification ${type}`;
  el.textContent = message;
  banner.appendChild(el);

  const timerId = setTimeout(() => {
    dismissNotification(el);
  }, 5000);

  notificationQueue.push({ message, type, element: el, timerId });
}

/**
 * Remove a notification element from the DOM and the queue.
 * @param {HTMLElement} el
 */
function dismissNotification(el) {
  if (el.parentNode) {
    el.parentNode.removeChild(el);
  }
  const idx = notificationQueue.findIndex((n) => n.element === el);
  if (idx !== -1) {
    notificationQueue.splice(idx, 1);
  }
}

/**
 * Wraps a storage write call, catching QuotaExceededError and showing a notification.
 * @param {string} key
 * @param {string} value
 */
export function safeStorageWrite(key, value) {
  try {
    storage.write(key, value);
  } catch (e) {
    if (e instanceof StorageQuotaExceededError || (e && e.name === 'StorageQuotaExceededError')) {
      showNotification('Save failed: storage quota exceeded. Your existing saved data has not been affected.', 'error');
    }
  }
}

// ─── Application Bootstrap (Requirements 1.5, 8.3, 8.4, 8.5, 8.6) ─────────

/**
 * Bootstrap the application: load persisted data, build initial state,
 * show relevant notifications, perform first render, and initialize all handlers.
 *
 * This is the application entry point. Call once on DOMContentLoaded.
 *
 * @returns {{ getState: () => object, setState: (s: object) => void }}
 */
export function bootstrap() {
  // 1. Load all persisted data from storage
  const loaded = storage.loadAll();

  // 2. Check storage availability
  if (!storage.isAvailable()) {
    showNotification('Storage is unavailable in this browser. Your work will not be saved.', 'warn');
  }

  // 3. Notify about corrupt/discarded entries
  if (loaded.discardedCount > 0) {
    showNotification('Some saved data could not be loaded and was discarded.', 'warn');
  }

  // 4. Build initial state with loaded format (or "11v11" if no saved format)
  const format = loaded.format || '11v11';
  let state = createInitialState(format);

  // 5. Populate customFormations and savedMoments from loaded data
  state = {
    ...state,
    customFormations: loaded.customFormations || [],
    savedMoments: loaded.savedMoments || [],
  };

  // State accessors
  const svgEl = document.getElementById('field-svg');
  const getState = () => state;
  const setState = (newState) => {
    state = newState;
    // Re-render on every state change (rendering cycle: state mutation → renderer patch)
    if (svgEl) {
      renderTokens(svgEl, state.ownTokens, state.opponentTokens);
      renderBall(svgEl, state.ball);
      renderArrows(svgEl, state.arrows);
    }
    // Update player count indicator
    const playerCountEl = document.getElementById('player-count');
    if (playerCountEl) playerCountEl.textContent = `Players: ${state.ownTokens.length}`;
  };

  // 6. Initial render
  if (svgEl) {
    renderField(svgEl, format);
    renderTokens(svgEl, state.ownTokens, state.opponentTokens);
    renderBall(svgEl, state.ball);
    renderArrows(svgEl, state.arrows);
  }

  // Update player count indicator
  const playerCountEl = document.getElementById('player-count');
  if (playerCountEl) playerCountEl.textContent = `Players: ${state.ownTokens.length}`;

  // 7. Initialize all handlers
  if (svgEl) {
    initDragHandlers(svgEl, getState, setState);
  }
  initFormatSelector(getState, setState);
  const formationApi = initFormationSelector(getState, setState);
  initOpponentOverlay(getState, setState);
  initCustomFormationMode(getState, setState);
  initDescriptionPanel(getState, setState);
  const momentsApi = initMomentsSelector(getState, setState);
  initMomentSaveDelete(getState, setState, momentsApi);
  initResetHandler(getState, setState);
  initExportHandler(getState);
  initArrowMode(getState, setState);

  // Update format button states to match loaded format
  const formatButtons = document.querySelectorAll('.format-btn');
  formatButtons.forEach((btn) => {
    btn.setAttribute('aria-pressed', btn.dataset.format === format ? 'true' : 'false');
  });

  // Update format label
  const formatLabel = document.getElementById('active-format-label');
  if (formatLabel) {
    formatLabel.textContent = `Format: ${format}`;
  }

  // Enable opponent overlay by default
  const oppToggle = document.getElementById('opponent-toggle');
  if (oppToggle && !state.opponentOverlayEnabled) {
    oppToggle.checked = true;
    oppToggle.dispatchEvent(new Event('change'));
  }

  return { getState, setState };
}

// ─── Internal Helpers ───────────────────────────────────────────────────────

/**
 * Convert screen-space pointer coordinates to SVG viewBox coordinates
 * using the SVG element's CTM (Current Transformation Matrix).
 * @param {SVGSVGElement} svgEl
 * @param {number} clientX - pointer clientX
 * @param {number} clientY - pointer clientY
 * @returns {{ x: number, y: number }} coordinates in SVG viewBox space
 */
function screenToSVG(svgEl, clientX, clientY) {
  const point = svgEl.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const ctm = svgEl.getScreenCTM();
  if (!ctm) return { x: 0, y: 0 };
  const svgPoint = point.matrixTransform(ctm.inverse());
  return { x: svgPoint.x, y: svgPoint.y };
}

/**
 * Determine if raw SVG coordinates are within the field bounds (viewBox: 0 0 68 105).
 * @param {number} svgX
 * @param {number} svgY
 * @returns {boolean}
 */
function isWithinFieldBounds(svgX, svgY) {
  return svgX >= 0 && svgX <= 68 && svgY >= 0 && svgY <= 105;
}

/**
 * Determine the type and id of a draggable target element.
 * Returns null if the element is not draggable.
 * @param {Element} target
 * @returns {{ type: "own"|"opp"|"ball", id: string } | null}
 */
function identifyDraggable(target) {
  // Walk up to the group element (tokens are <g> with id)
  let el = target;
  while (el && el.tagName !== 'svg') {
    const id = el.getAttribute('id');
    if (id) {
      if (id === 'ball') return { type: 'ball', id };
      if (id.startsWith('own-')) return { type: 'own', id };
      if (id.startsWith('opp-')) return { type: 'opp', id };
    }
    el = el.parentElement;
  }
  return null;
}

// ─── Field Rect (viewBox dimensions) ────────────────────────────────────────

const FIELD_RECT = { width: 68, height: 105 };

// ─── Drag Handler ───────────────────────────────────────────────────────────

/**
 * Initialize pointer-event-based drag handlers for tokens and ball.
 *
 * @param {SVGSVGElement} svgEl - The root SVG element (#field-svg)
 * @param {() => object} getState - Returns current AppState
 * @param {(newState: object) => void} setState - Accepts new AppState and triggers re-render
 */
export function initDragHandlers(svgEl, getState, setState) {
  /** @type {{ type: string, id: string, startNx: number, startNy: number, pointerId: number } | null} */
  let dragContext = null;

  svgEl.addEventListener('pointerdown', (e) => {
    const draggable = identifyDraggable(e.target);
    if (!draggable) return;

    // Determine the starting normalized position from current state
    const state = getState();
    let startNx, startNy;

    if (draggable.type === 'ball') {
      startNx = state.ball.nx;
      startNy = state.ball.ny;
    } else if (draggable.type === 'own') {
      const token = state.ownTokens.find((t) => t.id === draggable.id);
      if (!token) return;
      startNx = token.nx;
      startNy = token.ny;
    } else if (draggable.type === 'opp') {
      const token = state.opponentTokens.find((t) => t.id === draggable.id);
      if (!token) return;
      startNx = token.nx;
      startNy = token.ny;
    } else {
      return;
    }

    // Capture pointer to this element so pointermove fires even outside the element
    const captureTarget = e.target;
    captureTarget.setPointerCapture(e.pointerId);

    dragContext = {
      type: draggable.type,
      id: draggable.id,
      startNx,
      startNy,
      pointerId: e.pointerId,
    };

    // Add dragging class for visual feedback
    const dragGroup = svgEl.querySelector(`[id="${draggable.id}"]`);
    if (dragGroup) dragGroup.classList.add('dragging');

    e.preventDefault();
  });

  svgEl.addEventListener('pointermove', (e) => {
    if (!dragContext) return;
    if (e.pointerId !== dragContext.pointerId) return;

    // Convert screen coordinates to SVG viewBox coordinates
    const svgCoords = screenToSVG(svgEl, e.clientX, e.clientY);

    // Convert SVG coordinates to normalized [0,1] using toNormalized (clamps)
    const { nx, ny } = toNormalized(svgCoords.x, svgCoords.y, FIELD_RECT);

    // Update state based on draggable type
    const state = getState();
    let newState;

    if (dragContext.type === 'ball') {
      newState = setBallPosition(state, nx, ny);
    } else if (dragContext.type === 'own') {
      newState = setOwnTokenPosition(state, dragContext.id, nx, ny);
    } else if (dragContext.type === 'opp') {
      newState = setOpponentTokenPosition(state, dragContext.id, nx, ny);
    } else {
      return;
    }

    // Commit state and trigger re-render (the setState callback handles rendering)
    setState(newState);
  });

  svgEl.addEventListener('pointerup', (e) => {
    if (!dragContext) return;
    if (e.pointerId !== dragContext.pointerId) return;

    // Remove dragging class
    const dragGroup = svgEl.querySelector(`[id="${dragContext.id}"]`);
    if (dragGroup) dragGroup.classList.remove('dragging');

    // Check if the final position is outside the field bounds (raw SVG coords)
    const svgCoords = screenToSVG(svgEl, e.clientX, e.clientY);
    const inBounds = isWithinFieldBounds(svgCoords.x, svgCoords.y);

    if (!inBounds) {
      // Snap back to start position
      const state = getState();
      let newState;

      if (dragContext.type === 'ball') {
        newState = setBallPosition(state, dragContext.startNx, dragContext.startNy);
      } else if (dragContext.type === 'own') {
        newState = setOwnTokenPosition(state, dragContext.id, dragContext.startNx, dragContext.startNy);
      } else if (dragContext.type === 'opp') {
        newState = setOpponentTokenPosition(state, dragContext.id, dragContext.startNx, dragContext.startNy);
      }

      if (newState) {
        setState(newState);
      }
    }

    dragContext = null;
  });

  // Handle pointer cancel (e.g., touch interrupted)
  svgEl.addEventListener('pointercancel', (e) => {
    if (!dragContext) return;
    if (e.pointerId !== dragContext.pointerId) return;

    // Remove dragging class
    const dragGroup = svgEl.querySelector(`[id="${dragContext.id}"]`);
    if (dragGroup) dragGroup.classList.remove('dragging');

    // Snap back to start position on cancel
    const state = getState();
    let newState;

    if (dragContext.type === 'ball') {
      newState = setBallPosition(state, dragContext.startNx, dragContext.startNy);
    } else if (dragContext.type === 'own') {
      newState = setOwnTokenPosition(state, dragContext.id, dragContext.startNx, dragContext.startNy);
    } else if (dragContext.type === 'opp') {
      newState = setOpponentTokenPosition(state, dragContext.id, dragContext.startNx, dragContext.startNy);
    }

    if (newState) {
      setState(newState);
    }

    dragContext = null;
  });
}

// ─── Confirmation Dialog Helper ─────────────────────────────────────────────

/**
 * Show the confirmation dialog and return a Promise<boolean>.
 * Resolves true when user confirms, false on cancel or dialog close.
 * @param {string} message - The message to display in the dialog
 * @returns {Promise<boolean>}
 */
export function showConfirmDialog(message) {
  const dialog = document.getElementById('confirm-dialog');
  const msgEl = document.getElementById('dialog-message');
  const confirmBtn = document.getElementById('dialog-confirm-btn');
  const cancelBtn = document.getElementById('dialog-cancel-btn');

  if (!dialog) return Promise.resolve(true);

  msgEl.textContent = message;
  dialog.showModal();

  return new Promise((resolve) => {
    function cleanup() {
      confirmBtn.removeEventListener('click', onConfirm);
      cancelBtn.removeEventListener('click', onCancel);
      dialog.removeEventListener('close', onClose);
    }

    function onConfirm() {
      cleanup();
      dialog.close();
      resolve(true);
    }

    function onCancel() {
      cleanup();
      dialog.close();
      resolve(false);
    }

    function onClose() {
      cleanup();
      resolve(false);
    }

    confirmBtn.addEventListener('click', onConfirm);
    cancelBtn.addEventListener('click', onCancel);
    dialog.addEventListener('close', onClose);
  });
}

// ─── Format Selector (Requirements 1.1, 1.2, 1.3, 1.4, 5.6) ───────────────

/**
 * Initialize the format selector buttons.
 * Wires click handlers to .format-btn buttons (#btn-7v7, #btn-9v9, #btn-11v11).
 *
 * @param {() => object} getState - Returns current app state
 * @param {(newState: object) => void} setState - Updates app state
 * @param {(message: string) => Promise<boolean>} confirmFn - Shows confirmation dialog, resolves boolean
 */
export function initFormatSelector(getState, setState, confirmFn = showConfirmDialog) {
  const formatButtons = document.querySelectorAll('.format-btn');
  const formatLabel = document.getElementById('active-format-label');
  const svgEl = document.getElementById('field-svg');

  formatButtons.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const newFormat = btn.dataset.format;
      const currentState = getState();

      // No-op if already on this format
      if (currentState.format === newFormat) return;

      // If custom formation mode is active and unsaved, confirm before switching
      if (currentState.activeFormationKey === 'custom' && !currentState._customSaved) {
        const confirmed = await confirmFn(
          'Changing the format will discard your unsaved custom formation. Continue?'
        );
        if (!confirmed) return;
      }

      // Apply the new format via state mutation
      const newState = setFormat(currentState, newFormat);
      setState(newState);

      // Update button aria-pressed states
      formatButtons.forEach((b) => {
        b.setAttribute('aria-pressed', b.dataset.format === newFormat ? 'true' : 'false');
      });

      // Update the active format label
      if (formatLabel) {
        formatLabel.textContent = `Format: ${newFormat}`;
      }

      // Re-render field (setState doesn't call renderField)
      if (svgEl) {
        renderField(svgEl, newFormat);
      }

      // Re-enable opponent overlay for the new format (keep it on)
      const oppToggle = document.getElementById('opponent-toggle');
      const oppSelect = document.getElementById('opponent-formation-select');
      if (oppToggle && oppToggle.checked) {
        // Re-apply opponent overlay with default formation for the new format
        const oppFormationKey = `${newFormat}-${DEFAULT_FORMATION[newFormat]}`;
        const oppState = setOpponentOverlay(getState(), true, oppFormationKey);
        setState(oppState);
        if (oppSelect) {
          populateOpponentSelect(oppSelect, newFormat, oppState.opponentFormationKey);
          oppSelect.disabled = false;
          oppSelect.style.display = '';
        }
      }

      // Refresh the formation dropdown for the new format
      const formationSelect = document.getElementById('formation-select');
      if (formationSelect) {
        formationSelect.innerHTML = '';
        const formations = getFormationsForFormat(newFormat);
        for (const f of formations) {
          const option = document.createElement('option');
          option.value = f.id;
          option.textContent = f.name;
          if (f.id === newState.activeFormationKey) {
            option.selected = true;
          }
          formationSelect.appendChild(option);
        }
        // Add "Saved" optgroup for user-saved custom formations
        const customFormationsForFormat = newState.customFormations.filter((f) => f.format === newFormat);
        if (customFormationsForFormat.length > 0) {
          const savedGroup = document.createElement('optgroup');
          savedGroup.label = 'Saved';
          for (const f of customFormationsForFormat) {
            const option = document.createElement('option');
            option.value = f.id;
            option.textContent = f.name;
            savedGroup.appendChild(option);
          }
          formationSelect.appendChild(savedGroup);
        }
        const customOption = document.createElement('option');
        customOption.value = 'custom';
        customOption.textContent = 'Custom';
        formationSelect.appendChild(customOption);
      }

      // Refresh the moments dropdown for the new format
      const momentsSelect = document.getElementById('moments-select');
      if (momentsSelect) {
        momentsSelect.innerHTML = '';
        const defaultOpt = document.createElement('option');
        defaultOpt.value = '';
        defaultOpt.textContent = '— Moments —';
        momentsSelect.appendChild(defaultOpt);

        const predefined = getPredefinedMoments(newFormat);
        if (predefined.length > 0) {
          const predefinedGroup = document.createElement('optgroup');
          predefinedGroup.label = 'Predefined';
          for (const moment of predefined) {
            const option = document.createElement('option');
            option.value = moment.id;
            option.textContent = moment.name;
            predefinedGroup.appendChild(option);
          }
          momentsSelect.appendChild(predefinedGroup);
        }

        const userMoments = newState.savedMoments.filter((m) => m.format === newFormat);
        if (userMoments.length > 0) {
          const userGroup = document.createElement('optgroup');
          userGroup.label = 'Saved';
          for (const moment of userMoments) {
            const option = document.createElement('option');
            option.value = moment.id;
            option.textContent = moment.name;
            userGroup.appendChild(option);
          }
          momentsSelect.appendChild(userGroup);
        }
      }

      // Persist the new format to localStorage
      safeStorageWrite('format', newFormat);
    });
  });
}


// ─── Opponent Overlay Toggle (Requirements 5.1–5.7) ─────────────────────────

/**
 * Initialize the opponent overlay toggle and formation selector.
 * Wires the #opponent-toggle checkbox and #opponent-formation-select.
 *
 * @param {() => object} getState - Returns current app state
 * @param {(newState: object) => void} setState - Updates app state and triggers re-render
 */
export function initOpponentOverlay(getState, setState) {
  const toggle = document.getElementById('opponent-toggle');
  const select = document.getElementById('opponent-formation-select');
  const svgEl = document.getElementById('field-svg');

  if (!toggle || !select) return;

  // ─── Toggle enable/disable ────────────────────────────────────────────
  toggle.addEventListener('change', () => {
    const state = getState();

    if (toggle.checked) {
      // Enable: load last formation from storage for current format, or use default
      let formationKey = null;
      const rawOpponentState = storage.read('opponentState');
      if (rawOpponentState) {
        try {
          const parsed = JSON.parse(rawOpponentState);
          if (parsed && typeof parsed === 'object' && parsed[state.format]) {
            formationKey = parsed[state.format];
          }
        } catch {
          // Ignore corrupt data
        }
      }

      if (!formationKey) {
        formationKey = `${state.format}-${DEFAULT_FORMATION[state.format]}`;
      }

      // Apply overlay and formation
      let newState = setOpponentOverlay(state, true, formationKey);
      setState(newState);

      // Populate and enable select
      populateOpponentSelect(select, newState.format, newState.opponentFormationKey);
      select.disabled = false;
      select.style.display = '';
    } else {
      // Disable: save current opponent formation to storage, then clear
      const currentOpponentKey = state.opponentFormationKey;

      // Save to storage
      if (currentOpponentKey) {
        let opponentState = {};
        const rawOpponentState = storage.read('opponentState');
        if (rawOpponentState) {
          try {
            const parsed = JSON.parse(rawOpponentState);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
              opponentState = parsed;
            }
          } catch {
            // Start fresh if corrupt
          }
        }
        opponentState[state.format] = currentOpponentKey;
        safeStorageWrite('opponentState', JSON.stringify(opponentState));
      }

      // Clear overlay
      const newState = setOpponentOverlay(state, false);
      setState(newState);

      // Disable select
      select.disabled = true;
      select.style.display = 'none';
    }
  });

  // ─── Formation select change ──────────────────────────────────────────
  select.addEventListener('change', () => {
    const state = getState();
    const formationId = select.value;

    if (!state.opponentOverlayEnabled || !formationId) return;

    const newState = setOpponentFormation(state, formationId);
    setState(newState);
  });
}

/**
 * Populate the opponent formation <select> with formations for the given format.
 * @param {HTMLSelectElement} select
 * @param {string} format
 * @param {string|null} activeKey - currently active opponent formation key
 */
function populateOpponentSelect(select, format, activeKey) {
  select.innerHTML = '';
  const formations = getFormationsForFormat(format);
  for (const f of formations) {
    const option = document.createElement('option');
    option.value = f.id;
    option.textContent = f.name;
    if (f.id === activeKey) {
      option.selected = true;
    }
    select.appendChild(option);
  }
}

// ─── Custom Formation Mode (Requirements 3.1–3.6) ──────────────────────────

/**
 * Token count for each format.
 */
const FORMAT_TOKEN_COUNT = { '7v7': 7, '9v9': 9, '11v11': 11 };

/**
 * Generate evenly distributed token positions across the own half.
 * Own half is y ≈ 0.55 to 0.92 (bottom portion of the field, own goal side).
 * Tokens are placed in a grid pattern for even spacing.
 *
 * @param {number} count - Number of tokens to place
 * @returns {Array<{nx: number, ny: number}>}
 */
export function generateCustomPositions(count) {
  const positions = [];
  const yMin = 0.55;
  const yMax = 0.92;

  // Determine grid dimensions: try to distribute evenly
  const cols = Math.ceil(Math.sqrt(count));
  const rows = Math.ceil(count / cols);

  let idx = 0;
  for (let r = 0; r < rows && idx < count; r++) {
    const tokensInRow = Math.min(cols, count - idx);
    const ny = rows === 1 ? (yMin + yMax) / 2 : yMin + (r / (rows - 1)) * (yMax - yMin);

    for (let c = 0; c < tokensInRow; c++) {
      const nx = tokensInRow === 1 ? 0.5 : 0.15 + (c / (tokensInRow - 1)) * 0.7;
      positions.push({ nx, ny });
      idx++;
    }
  }

  return positions;
}

/**
 * Enter custom formation mode: set activeFormationKey to "custom",
 * place tokens evenly across the own half.
 *
 * @param {object} state - Current app state
 * @returns {object} New app state with custom tokens placed
 */
export function enterCustomMode(state) {
  const count = FORMAT_TOKEN_COUNT[state.format] || 11;
  const positions = generateCustomPositions(count);

  const ownTokens = positions.map((pos, i) => ({
    id: `own-${i}`,
    team: 'own',
    label: String(i + 1),
    nx: pos.nx,
    ny: pos.ny,
    formationKey: '',
  }));

  return {
    ...state,
    activeFormationKey: 'custom',
    activeFormationName: 'Custom',
    ownTokens,
    ball: { nx: 0.5, ny: 0.5 },
    _customSaved: false,
    activeMomentKey: null,
  };
}

/**
 * Update a token's label in the state. Applies validation:
 * - If blank/whitespace → use positional number
 * - If > 20 chars → reject (return unchanged state)
 *
 * @param {object} state - Current app state
 * @param {string} tokenId - The token id to update
 * @param {string} rawLabel - The raw label input
 * @returns {object} New app state
 */
export function updateTokenLabel(state, tokenId, rawLabel) {
  const tokenIndex = state.ownTokens.findIndex((t) => t.id === tokenId);
  if (tokenIndex === -1) return state;

  const positionalNumber = tokenIndex + 1;
  const result = validateLabel(rawLabel, positionalNumber);

  if (!result.valid) return state;

  const ownTokens = state.ownTokens.map((t, i) =>
    i === tokenIndex ? { ...t, label: result.label } : t
  );

  return { ...state, ownTokens };
}

/**
 * Show the name conflict dialog. Returns a promise that resolves to:
 * - "overwrite" if the user chose to overwrite
 * - "rename" if the user chose to rename
 * - null if cancelled
 *
 * @param {string} name - The conflicting name
 * @returns {Promise<"overwrite"|"rename"|null>}
 */
export function showNameConflictDialog(name) {
  const dialog = document.getElementById('name-conflict-dialog');
  if (!dialog) return Promise.resolve(null);

  const msgEl = dialog.querySelector('#conflict-message');
  const overwriteBtn = dialog.querySelector('#conflict-overwrite-btn');
  const renameBtn = dialog.querySelector('#conflict-rename-btn');
  const cancelBtn = dialog.querySelector('#conflict-cancel-btn');

  if (msgEl) {
    msgEl.textContent = `A formation named "${name}" already exists. Overwrite or use a different name?`;
  }

  dialog.showModal();

  return new Promise((resolve) => {
    function cleanup() {
      overwriteBtn.removeEventListener('click', onOverwrite);
      renameBtn.removeEventListener('click', onRename);
      if (cancelBtn) cancelBtn.removeEventListener('click', onCancel);
      dialog.removeEventListener('close', onClose);
    }

    function onOverwrite() {
      cleanup();
      dialog.close();
      resolve('overwrite');
    }

    function onRename() {
      cleanup();
      dialog.close();
      resolve('rename');
    }

    function onCancel() {
      cleanup();
      dialog.close();
      resolve(null);
    }

    function onClose() {
      cleanup();
      resolve(null);
    }

    overwriteBtn.addEventListener('click', onOverwrite);
    renameBtn.addEventListener('click', onRename);
    if (cancelBtn) cancelBtn.addEventListener('click', onCancel);
    dialog.addEventListener('close', onClose);
  });
}

/**
 * Initialize custom formation mode controller.
 * Handles:
 * - Entering custom mode (placing tokens evenly)
 * - Per-token label editing via inline input
 * - "Save Formation" button with name validation and conflict detection
 *
 * @param {() => object} getState - Returns current app state
 * @param {(newState: object) => void} setState - Updates app state and triggers re-render
 * @param {(name: string) => Promise<"overwrite"|"rename"|null>} [conflictDialogFn] - conflict dialog function
 */
export function initCustomFormationMode(getState, setState, conflictDialogFn = showNameConflictDialog) {
  const svgEl = document.getElementById('field-svg');
  const saveBtn = document.getElementById('save-formation-btn');
  const saveNameInput = document.getElementById('save-formation-name');
  const labelInput = document.getElementById('token-label-input');

  // ─── Token label editing (dblclick on desktop, long-press on mobile) ──
  if (svgEl && labelInput) {
    // Desktop: double-click
    svgEl.addEventListener('dblclick', (e) => {
      const state = getState();
      if (state.activeFormationKey !== 'custom') return;

      let el = e.target;
      while (el && el.tagName !== 'svg') {
        const id = el.getAttribute('id');
        if (id && id.startsWith('own-')) {
          showLabelEditor(id, getState, setState, labelInput, svgEl);
          return;
        }
        el = el.parentElement;
      }
    });

    // Mobile: long-press (500ms hold)
    let longPressTimer = null;
    let longPressTarget = null;

    svgEl.addEventListener('touchstart', (e) => {
      const state = getState();
      if (state.activeFormationKey !== 'custom') return;

      // Find the token being touched
      let el = e.target;
      while (el && el.tagName !== 'svg') {
        const id = el.getAttribute('id');
        if (id && id.startsWith('own-')) {
          longPressTarget = id;
          longPressTimer = setTimeout(() => {
            showLabelEditor(longPressTarget, getState, setState, labelInput, svgEl);
            longPressTarget = null;
          }, 500);
          return;
        }
        el = el.parentElement;
      }
    }, { passive: true });

    svgEl.addEventListener('touchmove', () => {
      // Cancel long-press if finger moves (it's a drag, not a hold)
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }, { passive: true });

    svgEl.addEventListener('touchend', () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }, { passive: true });
  }

  // ─── Save Formation Button ────────────────────────────────────────────
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const state = getState();
      if (state.activeFormationKey !== 'custom') return;

      // Get the name from input
      const rawName = saveNameInput ? saveNameInput.value : '';
      const nameResult = validateSaveName(rawName);

      if (!nameResult.valid) {
        // Show validation error (could use notification in future)
        if (saveNameInput) {
          saveNameInput.setCustomValidity(nameResult.reason);
          saveNameInput.reportValidity();
        }
        return;
      }

      const trimmedName = nameResult.name;

      // Check for name conflict
      const existingIndex = state.customFormations.findIndex(
        (f) => f.name === trimmedName && f.format === state.format
      );

      if (existingIndex !== -1) {
        const choice = await conflictDialogFn(trimmedName);
        if (choice === 'overwrite') {
          // Remove the existing formation before adding new one
          const updatedFormations = state.customFormations.filter(
            (f, i) => i !== existingIndex
          );
          const formationData = buildCustomFormationData(state, trimmedName);
          const newState = {
            ...state,
            customFormations: [...updatedFormations, formationData],
            _customSaved: true,
          };
          setState(newState);
          persistCustomFormations(newState.customFormations);
          refreshFormationDropdown(newState);
        } else if (choice === 'rename') {
          // User wants to pick a different name — refocus the input
          if (saveNameInput) {
            saveNameInput.value = '';
            saveNameInput.focus();
          }
        }
        // null = cancelled, do nothing
        return;
      }

      // No conflict — save directly
      const formationData = buildCustomFormationData(state, trimmedName);
      const newState = addCustomFormation(state, formationData);
      const finalState = { ...newState, _customSaved: true };
      setState(finalState);
      persistCustomFormations(finalState.customFormations);

      // Refresh formation dropdown to show the new saved formation
      refreshFormationDropdown(finalState);

      // Clear the name input after successful save
      if (saveNameInput) {
        saveNameInput.value = '';
      }
    });
  }

  // Clear custom validity on input change
  if (saveNameInput) {
    saveNameInput.addEventListener('input', () => {
      saveNameInput.setCustomValidity('');
    });
  }
}

/**
 * Show an inline label editor for a token.
 * @param {string} tokenId
 * @param {() => object} getState
 * @param {(newState: object) => void} setState
 * @param {HTMLInputElement} inputEl
 * @param {SVGSVGElement} svgEl
 */
function showLabelEditor(tokenId, getState, setState, inputEl, svgEl) {
  const state = getState();
  const token = state.ownTokens.find((t) => t.id === tokenId);
  if (!token) return;

  // Position the input over the token
  const fieldContainer = svgEl.parentElement;
  if (!fieldContainer) return;

  const svgRect = svgEl.getBoundingClientRect();
  const containerRect = fieldContainer.getBoundingClientRect();
  const px = (token.nx * svgRect.width) + (svgRect.left - containerRect.left);
  const py = (token.ny * svgRect.height) + (svgRect.top - containerRect.top);

  inputEl.style.position = 'absolute';
  inputEl.style.left = `${px - 40}px`;
  inputEl.style.top = `${py - 12}px`;
  inputEl.style.display = 'block';
  inputEl.value = token.label;
  inputEl.maxLength = 20;
  inputEl.dataset.tokenId = tokenId;
  inputEl.focus();
  inputEl.select();

  function commitLabel() {
    const rawLabel = inputEl.value;
    const currentState = getState();
    const newState = updateTokenLabel(currentState, tokenId, rawLabel);
    setState(newState);
    inputEl.style.display = 'none';
    inputEl.removeEventListener('blur', commitLabel);
    inputEl.removeEventListener('keydown', onKeyDown);

    // Re-render tokens
    if (svgEl) {
      renderTokens(svgEl, newState.ownTokens, newState.opponentTokens);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitLabel();
    } else if (e.key === 'Escape') {
      inputEl.style.display = 'none';
      inputEl.removeEventListener('blur', commitLabel);
      inputEl.removeEventListener('keydown', onKeyDown);
    }
  }

  inputEl.addEventListener('blur', commitLabel);
  inputEl.addEventListener('keydown', onKeyDown);
}

/**
 * Refresh the formation dropdown to reflect current state (presets + saved + custom).
 * @param {object} state - Current app state
 */
function refreshFormationDropdown(state) {
  const select = document.getElementById('formation-select');
  if (!select) return;

  select.innerHTML = '';

  // Preset formations for the active format
  const formations = getFormationsForFormat(state.format);
  for (const f of formations) {
    const option = document.createElement('option');
    option.value = f.id;
    option.textContent = f.name;
    if (f.id === state.activeFormationKey) option.selected = true;
    select.appendChild(option);
  }

  // Saved custom formations for the active format
  const customForFormat = state.customFormations.filter((f) => f.format === state.format);
  if (customForFormat.length > 0) {
    const savedGroup = document.createElement('optgroup');
    savedGroup.label = 'Saved';
    for (const f of customForFormat) {
      const option = document.createElement('option');
      option.value = f.id;
      option.textContent = f.name;
      if (f.id === state.activeFormationKey) option.selected = true;
      savedGroup.appendChild(option);
    }
    select.appendChild(savedGroup);
  }

  // Custom entry
  const customOption = document.createElement('option');
  customOption.value = 'custom';
  customOption.textContent = 'Custom';
  if (state.activeFormationKey === 'custom') customOption.selected = true;
  select.appendChild(customOption);
}

/**
 * Build a CustomFormation data object from the current state.
 * @param {object} state
 * @param {string} name
 * @returns {object} CustomFormation
 */
function buildCustomFormationData(state, name) {
  return {
    id: generateId(),
    name,
    format: state.format,
    positions: state.ownTokens.map((t) => ({
      label: t.label,
      nx: t.nx,
      ny: t.ny,
    })),
    savedAt: new Date().toISOString(),
  };
}

/**
 * Persist custom formations array to localStorage.
 * @param {Array} customFormations
 */
function persistCustomFormations(customFormations) {
  safeStorageWrite('customFormations', JSON.stringify(customFormations));
}

/**
 * Generate a simple unique identifier.
 * @returns {string}
 */
function generateId() {
  return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Formation Selector (Requirements 2.1, 2.2, 2.3, 2.5, 2.6) ─────────────

/**
 * Initialize the preset formation selector.
 * Renders a <select> dropdown (#formation-select) populated with formations for
 * the active format, plus a "Custom" entry.
 * On selection: applies the formation (reconciling token count), re-renders tokens,
 * and updates the #active-formation-label.
 *
 * @param {() => object} getState - Returns current app state
 * @param {(newState: object) => void} setState - Updates app state and triggers re-render
 * @returns {{ refreshFormations: (format?: string) => void }} API for repopulating on format change
 */
export function initFormationSelector(getState, setState) {
  const select = document.getElementById('formation-select');
  const label = document.getElementById('active-formation-label');
  const svgEl = document.getElementById('field-svg');
  const deleteFormationBtn = document.getElementById('delete-formation-btn');

  if (!select) return { refreshFormations() {} };

  /**
   * Populate the formation dropdown with formations for the given format.
   * @param {string} [format] - Format to use; defaults to current state format
   */
  function refreshFormations(format) {
    const state = getState();
    const activeFormat = format || state.format;

    select.innerHTML = '';

    // Add preset formations for the active format
    const formations = getFormationsForFormat(activeFormat);
    for (const f of formations) {
      const option = document.createElement('option');
      option.value = f.id;
      option.textContent = f.name;
      if (f.id === state.activeFormationKey) {
        option.selected = true;
      }
      select.appendChild(option);
    }

    // Add "Saved" optgroup for user-saved custom formations
    const customFormationsForFormat = state.customFormations.filter((f) => f.format === activeFormat);
    if (customFormationsForFormat.length > 0) {
      const savedGroup = document.createElement('optgroup');
      savedGroup.label = 'Saved';
      for (const f of customFormationsForFormat) {
        const option = document.createElement('option');
        option.value = f.id;
        option.textContent = f.name;
        if (f.id === state.activeFormationKey) {
          option.selected = true;
        }
        savedGroup.appendChild(option);
      }
      select.appendChild(savedGroup);
    }

    // Add the "Custom" entry
    const customOption = document.createElement('option');
    customOption.value = 'custom';
    customOption.textContent = 'Custom';
    if (state.activeFormationKey === 'custom') {
      customOption.selected = true;
    }
    select.appendChild(customOption);

    // Update the label
    updateFormationLabel(state);
  }

  /**
   * Update the #active-formation-label text based on current state.
   * @param {object} state
   */
  function updateFormationLabel(state) {
    if (!label) return;
    if (state.activeFormationKey && state.activeFormationName) {
      label.textContent = `Formation: ${state.activeFormationName}`;
    } else if (state.activeFormationKey === 'custom') {
      label.textContent = 'Formation: Custom';
    } else {
      label.textContent = 'No formation selected';
    }
  }

  // ─── Handle selection change ──────────────────────────────────────────
  select.addEventListener('change', () => {
    const formationId = select.value;
    const state = getState();

    // Show/hide delete button based on whether a user-saved custom formation is selected
    if (deleteFormationBtn) {
      const isUserCustom = state.customFormations.some((f) => f.id === formationId);
      deleteFormationBtn.style.display = isUserCustom ? 'inline-block' : 'none';
    }

    if (formationId === 'custom') {
      // Enter custom mode — handled by task 10.3
      const newState = enterCustomMode(state);
      setState(newState);

      updateFormationLabel(newState);

      // Show custom formation save controls
      const customControls = document.getElementById('custom-formation-controls');
      if (customControls) customControls.style.display = '';

      return;
    }

    // Apply preset formation (reconciles token count per Property 3)
    // First check if it's a user-saved custom formation
    const customFormation = state.customFormations.find((f) => f.id === formationId);
    let newState;

    if (customFormation) {
      // Apply saved custom formation from state
      const ownTokens = customFormation.positions.map((pos, i) => ({
        id: `own-${i}`,
        team: 'own',
        label: pos.label,
        nx: pos.nx,
        ny: pos.ny,
        formationKey: '',
      }));

      newState = {
        ...state,
        activeFormationKey: customFormation.id,
        activeFormationName: customFormation.name,
        ownTokens,
        ball: { nx: 0.5, ny: 0.5 },
        activeMomentKey: null,
        activeMomentSnapshot: null,
      };
    } else {
      // Apply preset formation
      newState = applyFormation(state, formationId);
    }

    setState(newState);

    updateFormationLabel(newState);

    // Hide custom formation controls when switching to a preset
    const customControls = document.getElementById('custom-formation-controls');
    if (customControls) customControls.style.display = 'none';
  });

  // ─── Delete formation button ──────────────────────────────────────────
  if (deleteFormationBtn) {
    deleteFormationBtn.addEventListener('click', async () => {
      const state = getState();
      const formationId = select.value;

      // Only allow deletion of user-saved custom formations
      const formationToDelete = state.customFormations.find((f) => f.id === formationId);
      if (!formationToDelete) return;

      const confirmed = await showConfirmDialog(
        `Delete formation "${formationToDelete.name}"? This cannot be undone.`
      );
      if (!confirmed) return;

      // Remove from state and persist
      const newState = deleteCustomFormation(state, formationId);

      // Apply the default formation for the current format
      const defaultFormationId = `${newState.format}-${DEFAULT_FORMATION[newState.format]}`;
      const resetState = applyFormation(newState, defaultFormationId);
      setState(resetState);

      persistCustomFormations(newState.customFormations);
      refreshFormations();

      // Hide the delete button
      deleteFormationBtn.style.display = 'none';
    });
  }

  // Initial population
  refreshFormations();

  return { refreshFormations };
}


// ─── Moments Selector (Requirements 7.1, 7.2, 7.3, 7.7) ────────────────────

/**
 * Initialize the situational moments selector.
 * Populates a <select> dropdown (#moments-select) with:
 *  - Predefined moments for the active format (not deletable)
 *  - User-saved moments for the active format (deletable)
 * On selection: applies the moment via applyMoment, re-renders tokens and ball.
 *
 * @param {() => object} getState - Returns current app state
 * @param {(newState: object) => void} setState - Updates app state and triggers re-render
 * @returns {{ refreshMoments: (format?: string) => void }} API for repopulating on format change
 */
export function initMomentsSelector(getState, setState) {
  const select = document.getElementById('moments-select');
  const svgEl = document.getElementById('field-svg');

  if (!select) return { refreshMoments() {} };

  /**
   * Populate the moments dropdown with predefined and user-saved moments
   * for the given format.
   * @param {string} [format] - Format to use; defaults to current state format
   */
  function refreshMoments(format) {
    const state = getState();
    const activeFormat = format || state.format;

    select.innerHTML = '';

    // Default "no selection" option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '— Moments —';
    select.appendChild(defaultOption);

    // Add predefined moments (isPredefined: true, no delete)
    const predefined = getPredefinedMoments(activeFormat);
    if (predefined.length > 0) {
      const predefinedGroup = document.createElement('optgroup');
      predefinedGroup.label = 'Predefined';
      for (const moment of predefined) {
        const option = document.createElement('option');
        option.value = moment.id;
        option.textContent = moment.name;
        option.dataset.predefined = 'true';
        if (moment.id === state.activeMomentKey) {
          option.selected = true;
        }
        predefinedGroup.appendChild(option);
      }
      select.appendChild(predefinedGroup);
    }

    // Add user-saved moments (isPredefined: false, deletable)
    const userMoments = state.savedMoments.filter((m) => m.format === activeFormat);
    if (userMoments.length > 0) {
      const userGroup = document.createElement('optgroup');
      userGroup.label = 'Saved';
      for (const moment of userMoments) {
        const option = document.createElement('option');
        option.value = moment.id;
        option.textContent = moment.name;
        option.dataset.predefined = 'false';
        if (moment.id === state.activeMomentKey) {
          option.selected = true;
        }
        userGroup.appendChild(option);
      }
      select.appendChild(userGroup);
    }
  }

  // ─── Handle selection change ──────────────────────────────────────────
  select.addEventListener('change', () => {
    const momentId = select.value;
    const state = getState();

    // If the default "— Moments —" option was selected, clear the moment and restore formation
    if (!momentId) {
      if (state.activeMomentKey) {
        // Re-apply the current formation to restore standard positions
        const newState = applyFormation(state, state.activeFormationKey);
        setState(newState);
      }
      return;
    }

    // Find the moment definition — check predefined first, then user-saved
    const predefined = getPredefinedMoments(state.format);
    let momentDef = predefined.find((m) => m.id === momentId);

    if (!momentDef) {
      momentDef = state.savedMoments.find((m) => m.id === momentId);
    }

    if (!momentDef) return;

    // Apply moment: updates own tokens and ball, stores deep copy, leaves opponent unchanged
    const newState = applyMoment(state, momentDef);
    setState(newState);
  });

  // Initial population
  refreshMoments();

  return { refreshMoments };
}

// ─── Moment Save/Delete (Requirements 7.4–7.8) ─────────────────────────────

/**
 * Show the moment name conflict dialog. Returns a promise that resolves to:
 * - "overwrite" if the user chose to overwrite
 * - "rename" if the user chose to rename
 * - null if cancelled
 *
 * @param {string} name - The conflicting name
 * @returns {Promise<"overwrite"|"rename"|null>}
 */
export function showMomentConflictDialog(name) {
  const dialog = document.getElementById('moment-conflict-dialog');
  if (!dialog) return Promise.resolve(null);

  const msgEl = dialog.querySelector('#moment-conflict-message');
  const overwriteBtn = dialog.querySelector('#moment-conflict-overwrite-btn');
  const renameBtn = dialog.querySelector('#moment-conflict-rename-btn');
  const cancelBtn = dialog.querySelector('#moment-conflict-cancel-btn');

  if (msgEl) {
    msgEl.textContent = `A moment named "${name}" already exists. Overwrite or use a different name?`;
  }

  dialog.showModal();

  return new Promise((resolve) => {
    function cleanup() {
      overwriteBtn.removeEventListener('click', onOverwrite);
      renameBtn.removeEventListener('click', onRename);
      if (cancelBtn) cancelBtn.removeEventListener('click', onCancel);
      dialog.removeEventListener('close', onClose);
    }

    function onOverwrite() {
      cleanup();
      dialog.close();
      resolve('overwrite');
    }

    function onRename() {
      cleanup();
      dialog.close();
      resolve('rename');
    }

    function onCancel() {
      cleanup();
      dialog.close();
      resolve(null);
    }

    function onClose() {
      cleanup();
      resolve(null);
    }

    overwriteBtn.addEventListener('click', onOverwrite);
    renameBtn.addEventListener('click', onRename);
    if (cancelBtn) cancelBtn.addEventListener('click', onCancel);
    dialog.addEventListener('close', onClose);
  });
}

/**
 * Initialize save and delete controls for user moments.
 *
 * Save as Moment:
 *  - Validates name (1–50 chars)
 *  - Checks for name conflicts among user-saved moments in the same format
 *  - On conflict: shows overwrite-or-rename dialog
 *  - Persists via storage.write within 1 second
 *
 * Delete Moment:
 *  - Only shown for user-saved moments (isPredefined: false)
 *  - Shows confirmation dialog before deletion
 *  - On confirm: removes from state and storage
 *
 * @param {() => object} getState - Returns current app state
 * @param {(newState: object) => void} setState - Updates app state
 * @param {{ refreshMoments: () => void }} momentsApi - API from initMomentsSelector
 * @param {(name: string) => Promise<"overwrite"|"rename"|null>} [conflictDialogFn] - conflict dialog
 * @param {(message: string) => Promise<boolean>} [confirmFn] - confirmation dialog
 */
export function initMomentSaveDelete(getState, setState, momentsApi, conflictDialogFn = showMomentConflictDialog, confirmFn = showConfirmDialog) {
  const saveBtn = document.getElementById('save-moment-btn');
  const saveNameInput = document.getElementById('save-moment-name');
  const deleteBtn = document.getElementById('delete-moment-btn');
  const momentsSelect = document.getElementById('moments-select');

  // ─── Save as Moment ───────────────────────────────────────────────────
  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const state = getState();

      // Get the name from input
      const rawName = saveNameInput ? saveNameInput.value : '';
      const nameResult = validateSaveName(rawName);

      if (!nameResult.valid) {
        if (saveNameInput) {
          saveNameInput.setCustomValidity(nameResult.reason);
          saveNameInput.reportValidity();
        }
        return;
      }

      const trimmedName = nameResult.name;

      // Check for name conflict among user-saved moments for the current format
      const existingIndex = state.savedMoments.findIndex(
        (m) => m.name === trimmedName && m.format === state.format
      );

      if (existingIndex !== -1) {
        const choice = await conflictDialogFn(trimmedName);
        if (choice === 'overwrite') {
          // Remove the existing moment before adding new one
          const updatedMoments = state.savedMoments.filter(
            (_, i) => i !== existingIndex
          );
          const momentData = buildMomentData(state, trimmedName);
          const newState = {
            ...state,
            savedMoments: [...updatedMoments, momentData],
            activeMomentKey: momentData.id,
          };
          setState(newState);
          persistSavedMoments(newState.savedMoments);
          momentsApi.refreshMoments();
        } else if (choice === 'rename') {
          // User wants to pick a different name — refocus the input
          if (saveNameInput) {
            saveNameInput.value = '';
            saveNameInput.focus();
          }
        }
        // null = cancelled, do nothing
        return;
      }

      // No conflict — save directly
      const momentData = buildMomentData(state, trimmedName);
      const newState = addSavedMoment(state, momentData);
      const finalState = { ...newState, activeMomentKey: momentData.id };
      setState(finalState);
      persistSavedMoments(finalState.savedMoments);
      momentsApi.refreshMoments();

      // Clear the name input after successful save
      if (saveNameInput) {
        saveNameInput.value = '';
      }
    });
  }

  // Clear custom validity on input change
  if (saveNameInput) {
    saveNameInput.addEventListener('input', () => {
      saveNameInput.setCustomValidity('');
    });
  }

  // ─── Delete Moment ────────────────────────────────────────────────────
  if (deleteBtn && momentsSelect) {
    // Show/hide delete button based on selected moment
    momentsSelect.addEventListener('change', () => {
      const state = getState();
      const momentId = momentsSelect.value;

      if (!momentId) {
        deleteBtn.style.display = 'none';
        return;
      }

      // Check if the selected moment is a user-saved moment (not predefined)
      const predefined = getPredefinedMoments(state.format);
      const isPredefinedMoment = predefined.some((m) => m.id === momentId);

      if (isPredefinedMoment) {
        deleteBtn.style.display = 'none';
      } else {
        const isUserMoment = state.savedMoments.some((m) => m.id === momentId);
        deleteBtn.style.display = isUserMoment ? 'inline-block' : 'none';
      }
    });

    deleteBtn.addEventListener('click', async () => {
      const state = getState();
      const momentId = momentsSelect.value;

      if (!momentId) return;

      // Only allow deletion of user-saved moments
      const predefined = getPredefinedMoments(state.format);
      if (predefined.some((m) => m.id === momentId)) return;

      const momentToDelete = state.savedMoments.find((m) => m.id === momentId);
      if (!momentToDelete) return;

      const confirmed = await confirmFn(
        `Delete moment "${momentToDelete.name}"? This cannot be undone.`
      );
      if (!confirmed) return;

      // Remove from state and persist
      const newState = deleteSavedMoment(state, momentId);
      // Clear active moment key if it was the deleted one
      if (newState.activeMomentKey === momentId) {
        newState.activeMomentKey = null;
      }
      setState(newState);
      persistSavedMoments(newState.savedMoments);
      momentsApi.refreshMoments();

      // Hide the delete button
      deleteBtn.style.display = 'none';
    });
  }

  // ─── Duplicate Moment ─────────────────────────────────────────────────
  const duplicateBtn = document.getElementById('duplicate-moment-btn');
  if (duplicateBtn && momentsSelect) {
    // Show duplicate button when a moment is selected
    momentsSelect.addEventListener('change', () => {
      const momentId = momentsSelect.value;
      duplicateBtn.style.display = momentId ? '' : 'none';
    });

    duplicateBtn.addEventListener('click', () => {
      const state = getState();
      const momentId = momentsSelect.value;
      if (!momentId) return;

      // Find the moment name (predefined or user-saved)
      const predefined = getPredefinedMoments(state.format);
      let momentDef = predefined.find((m) => m.id === momentId);
      if (!momentDef) {
        momentDef = state.savedMoments.find((m) => m.id === momentId);
      }
      if (!momentDef) return;

      // Pre-fill the save name with "Copy of [name]"
      if (saveNameInput) {
        const copyName = `Copy of ${momentDef.name}`.slice(0, 50);
        saveNameInput.value = copyName;
        saveNameInput.focus();
        saveNameInput.select();
      }
    });
  }
}

/**
 * Build a SituationalMoment data object from the current field state.
 * @param {object} state - Current app state
 * @param {string} name - User-provided moment name
 * @returns {object} SituationalMoment
 */
function buildMomentData(state, name) {
  const momentData = {
    id: `moment-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    name,
    isPredefined: false,
    format: state.format,
    ownPositions: state.ownTokens.map((t) => ({
      label: t.label,
      nx: t.nx,
      ny: t.ny,
    })),
    ballPosition: { nx: state.ball.nx, ny: state.ball.ny },
    arrows: state.arrows || [],
    savedAt: new Date().toISOString(),
  };

  // Include opponent positions if the overlay is enabled
  if (state.opponentOverlayEnabled && state.opponentTokens.length > 0) {
    momentData.opponentPositions = state.opponentTokens.map((t) => ({
      label: t.label,
      nx: t.nx,
      ny: t.ny,
    }));
  }

  return momentData;
}

/**
 * Persist savedMoments array to localStorage.
 * @param {Array} savedMoments
 */
function persistSavedMoments(savedMoments) {
  safeStorageWrite('savedMoments', JSON.stringify(savedMoments));
}

// ─── Description Panel (Requirements 6.1–6.6) ──────────────────────────────

/**
 * Initialize the position description panel.
 * On click of an own-team token <g> element:
 *   - Sets selectedTokenId in state
 *   - Looks up PositionDescription via the token's formationKey
 *   - Renders the description content (or "no description" message)
 *   - Shows the panel
 * On dismiss button click:
 *   - Sets selectedTokenId to null
 *   - Hides the panel
 *   - Does NOT change any token positions
 *
 * @param {() => object} getState - Returns current app state
 * @param {(newState: object) => void} setState - Updates app state
 */
export function initDescriptionPanel(getState, setState) {
  const svgEl = document.getElementById('field-svg');
  const panel = document.getElementById('description-panel');
  const content = document.getElementById('description-content');
  const dismissBtn = document.getElementById('dismiss-panel-btn');
  const toggleBtn = document.getElementById('toggle-info-btn');

  if (!svgEl || !panel || !content || !dismissBtn) return;

  // Panel enabled state (default: disabled — user enables intentionally)
  let panelEnabled = false;

  // ─── Toggle button ────────────────────────────────────────────────────
  if (toggleBtn) {
    toggleBtn.setAttribute('aria-pressed', 'false');
    toggleBtn.style.opacity = '0.5';
    toggleBtn.addEventListener('click', () => {
      panelEnabled = !panelEnabled;
      toggleBtn.setAttribute('aria-pressed', String(panelEnabled));
      toggleBtn.style.opacity = panelEnabled ? '1' : '0.5';

      // If disabling, hide the panel immediately
      if (!panelEnabled) {
        panel.classList.remove('visible');
        panel.setAttribute('aria-hidden', 'true');
        const state = getState();
        const newState = setSelectedToken(state, null);
        setState(newState);
      }
    });
  }

  // ─── Token click → show panel ─────────────────────────────────────────
  svgEl.addEventListener('click', (e) => {
    if (!panelEnabled) return;

    // Walk up from the click target to find an own-team token <g>
    let el = e.target;
    while (el && el !== svgEl) {
      const id = el.getAttribute && el.getAttribute('id');
      if (id && id.startsWith('own-')) {
        const state = getState();
        const token = state.ownTokens.find((t) => t.id === id);
        if (!token) return;

        // Update selected token in state
        const newState = setSelectedToken(state, id);
        setState(newState);

        // Look up description — resolve descriptionId from formation data
        let descriptionId = token.formationKey;
        if (state.activeFormationKey && state.activeFormationKey !== 'custom') {
          const formation = getFormationById(state.activeFormationKey);
          if (formation) {
            const pos = formation.positions.find((p) => p.key === token.formationKey);
            if (pos) descriptionId = pos.descriptionId;
          }
        }
        const description = getDescriptionById(descriptionId);

        // Render panel content
        if (description) {
          content.innerHTML = renderDescriptionHTML(description);
        } else {
          content.innerHTML = '<p class="no-desc">No description is available for this position.</p>';
        }

        // Show the panel
        panel.classList.add('visible');
        panel.setAttribute('aria-hidden', 'false');
        return;
      }
      el = el.parentElement;
    }
  });

  // ─── Dismiss button → hide panel ─────────────────────────────────────
  dismissBtn.addEventListener('click', () => {
    const state = getState();
    const newState = setSelectedToken(state, null);
    setState(newState);

    // Hide the panel
    panel.classList.remove('visible');
    panel.setAttribute('aria-hidden', 'true');
  });
}

/**
 * Render the HTML content for a PositionDescription.
 * @param {object} description - A PositionDescription object
 * @returns {string} HTML string
 */
function renderDescriptionHTML(description) {
  const attributesHTML = description.keyAttributes
    .map((attr) => `<li>${attr}</li>`)
    .join('');

  return `
    <h2>${description.positionName}</h2>
    <p class="role-desc">${description.roleDescription}</p>
    <h3>Key Attributes</h3>
    <ul class="attributes-list">${attributesHTML}</ul>
    <h3>Responsibilities</h3>
    <p class="responsibilities">${description.responsibilities}</p>
  `;
}

// ─── Reset Handler (Requirements 9.1, 9.2, 9.3, 9.4) ───────────────────────

/**
 * Initialize the reset button handler.
 * On #reset-btn click: shows a confirmation dialog.
 * On confirm:
 *  - If activeMomentKey is set and activeMomentSnapshot exists: reposition own tokens
 *    and ball from the snapshot
 *  - Otherwise: reposition from the active formation definition (getFormationById)
 *  - If opponentOverlayEnabled: reposition opponent tokens from their formation defaults
 * On cancel: leave all positions unchanged (no-op).
 *
 * @param {() => object} getState - Returns current app state
 * @param {(newState: object) => void} setState - Updates app state and triggers re-render
 * @param {(message: string) => Promise<boolean>} [confirmFn] - Confirmation dialog function
 */
export function initResetHandler(getState, setState, confirmFn = showConfirmDialog) {
  const resetBtn = document.getElementById('reset-btn');
  const svgEl = document.getElementById('field-svg');

  if (!resetBtn) return;

  resetBtn.addEventListener('click', async () => {
    const confirmed = await confirmFn('Reset all positions to formation defaults?');
    if (!confirmed) return;

    const state = getState();
    let newOwnTokens;
    let newBall;

    // Determine source for own tokens and ball
    if (state.activeMomentKey && state.activeMomentSnapshot) {
      // Reset from the moment snapshot
      const snapshot = state.activeMomentSnapshot;
      const currentOwn = state.ownTokens;

      newOwnTokens = snapshot.ownPositions.map((pos, i) => {
        const existingId = currentOwn[i] ? currentOwn[i].id : `own-${i}`;
        return {
          id: existingId,
          team: 'own',
          label: pos.label,
          nx: pos.nx,
          ny: pos.ny,
          formationKey: currentOwn[i] ? currentOwn[i].formationKey : '',
        };
      });

      newBall = { nx: snapshot.ballPosition.nx, ny: snapshot.ballPosition.ny };
    } else {
      // Reset from active formation definition
      const formation = getFormationById(state.activeFormationKey);
      if (formation) {
        const currentOwn = state.ownTokens;
        newOwnTokens = formation.positions.map((pos, i) => {
          const existingId = currentOwn[i] ? currentOwn[i].id : `own-${i}`;
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
        // No valid formation to reset to — keep current tokens
        newOwnTokens = state.ownTokens;
      }
      // Ball goes to center for formation resets
      newBall = { nx: 0.5, ny: 0.5 };
    }

    // Handle opponent tokens reset
    let newOpponentTokens = state.opponentTokens;
    if (state.opponentOverlayEnabled && state.opponentFormationKey) {
      const oppFormation = getFormationById(state.opponentFormationKey);
      if (oppFormation) {
        newOpponentTokens = oppFormation.positions.map((pos, i) => ({
          id: `opp-${i}`,
          team: 'opp',
          label: pos.label,
          nx: pos.nx,
          ny: 1 - pos.ny,
          formationKey: pos.key,
        }));
      }
    }

    const newState = {
      ...state,
      ownTokens: newOwnTokens,
      ball: newBall,
      opponentTokens: newOpponentTokens,
    };

    setState(newState);
  });
}


// ─── Arrow Mode (Movement Arrows) ───────────────────────────────────────────

/**
 * Initialize arrow drawing mode.
 * Provides a toggle button to enter/exit arrow mode, and a clear button.
 * In arrow mode:
 *  - First click captures start point (shows a small dot indicator)
 *  - Second click captures end point and creates the arrow
 *
 * @param {() => object} getState - Returns current app state
 * @param {(newState: object) => void} setState - Updates app state and triggers re-render
 */
export function initArrowMode(getState, setState) {
  const arrowModeBtn = document.getElementById('arrow-mode-btn');
  const clearArrowsBtn = document.getElementById('clear-arrows-btn');
  const svgEl = document.getElementById('field-svg');

  if (!arrowModeBtn || !svgEl) return;

  let arrowModeActive = false;
  let pendingStart = null; // { nx, ny } — first click captured
  let startIndicator = null; // SVG element showing the start point dot
  let selectedArrowId = null; // Currently selected arrow for delete/drag

  function activateArrowMode() {
    arrowModeActive = true;
    arrowModeBtn.setAttribute('aria-pressed', 'true');
    arrowModeBtn.style.background = '#1E6FE8';
    arrowModeBtn.style.color = '#fff';
    arrowModeBtn.style.borderColor = '#1E6FE8';
    if (clearArrowsBtn) clearArrowsBtn.style.display = '';
    svgEl.style.cursor = 'crosshair';
  }

  function deactivateArrowMode() {
    arrowModeActive = false;
    arrowModeBtn.setAttribute('aria-pressed', 'false');
    arrowModeBtn.style.background = '';
    arrowModeBtn.style.color = '';
    arrowModeBtn.style.borderColor = '';
    svgEl.style.cursor = '';
    clearPendingStart();
    deselectArrow();
    // Hide clear button only if there are no arrows
    if (clearArrowsBtn) {
      const state = getState();
      clearArrowsBtn.style.display = (state.arrows && state.arrows.length > 0) ? '' : 'none';
    }
  }

  function clearPendingStart() {
    pendingStart = null;
    if (startIndicator && startIndicator.parentNode) {
      startIndicator.parentNode.removeChild(startIndicator);
    }
    startIndicator = null;
  }

  const deleteArrowBtn = document.getElementById('delete-arrow-btn');

  function selectArrow(arrowId) {
    deselectArrow();
    selectedArrowId = arrowId;
    // Highlight the selected arrow
    const arrowGroup = svgEl.querySelector(`[data-arrow-id="${arrowId}"]`);
    if (arrowGroup) {
      const visiblePath = arrowGroup.querySelectorAll('path')[1];
      if (visiblePath) {
        visiblePath.setAttribute('stroke', '#ffdd44');
        visiblePath.setAttribute('stroke-width', '0.7');
        visiblePath.setAttribute('opacity', '1');
      }
    }
    // Show delete button
    if (deleteArrowBtn) deleteArrowBtn.style.display = '';
  }

  function deselectArrow() {
    if (selectedArrowId) {
      const arrowGroup = svgEl.querySelector(`[data-arrow-id="${selectedArrowId}"]`);
      if (arrowGroup) {
        const visiblePath = arrowGroup.querySelectorAll('path')[1];
        if (visiblePath) {
          visiblePath.setAttribute('stroke', '#f0c040');
          visiblePath.setAttribute('stroke-width', '0.4');
          visiblePath.setAttribute('opacity', '0.85');
        }
      }
      selectedArrowId = null;
    }
    // Hide delete button
    if (deleteArrowBtn) deleteArrowBtn.style.display = 'none';
  }

  // Delete arrow button (for mobile — no keyboard Delete key)
  if (deleteArrowBtn) {
    deleteArrowBtn.addEventListener('click', () => {
      if (!selectedArrowId) return;
      const state = getState();
      const newState = deleteArrow(state, selectedArrowId);
      selectedArrowId = null;
      setState(newState);
      if (deleteArrowBtn) deleteArrowBtn.style.display = 'none';
      if (clearArrowsBtn && newState.arrows.length === 0) {
        clearArrowsBtn.style.display = 'none';
      }
    });
  }

  // Toggle arrow mode
  arrowModeBtn.addEventListener('click', () => {
    if (arrowModeActive) {
      deactivateArrowMode();
    } else {
      activateArrowMode();
    }
  });

  // Clear arrows button
  if (clearArrowsBtn) {
    clearArrowsBtn.addEventListener('click', () => {
      const state = getState();
      const newState = clearArrows(state);
      setState(newState);
      selectedArrowId = null;
      clearArrowsBtn.style.display = 'none';
    });
  }

  // Keyboard handler for Delete/Backspace to remove selected arrow
  document.addEventListener('keydown', (e) => {
    if (!selectedArrowId) return;
    if (e.key === 'Delete' || e.key === 'Backspace') {
      // Don't delete if focused on an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      e.preventDefault();
      const state = getState();
      const newState = deleteArrow(state, selectedArrowId);
      selectedArrowId = null;
      setState(newState);
      // Hide clear button if no arrows left
      if (clearArrowsBtn && newState.arrows.length === 0) {
        clearArrowsBtn.style.display = 'none';
      }
    }
  });

  // Click handler on SVG for arrow drawing and selection
  svgEl.addEventListener('click', (e) => {
    // Check if clicking on an existing arrow (for selection)
    let el = e.target;
    while (el && el !== svgEl) {
      const arrowId = el.getAttribute && el.getAttribute('data-arrow-id');
      if (arrowId) {
        // Clicked on an arrow — select it
        selectArrow(arrowId);
        clearPendingStart();
        return;
      }
      el = el.parentElement;
    }

    // If not in arrow mode, deselect any selected arrow
    if (!arrowModeActive) {
      deselectArrow();
      return;
    }

    // Don't capture clicks on tokens or ball (let drag handlers work)
    el = e.target;
    while (el && el !== svgEl) {
      const id = el.getAttribute && el.getAttribute('id');
      if (id && (id.startsWith('own-') || id.startsWith('opp-') || id === 'ball')) {
        return; // Don't capture on draggable elements
      }
      el = el.parentElement;
    }

    // Deselect any currently selected arrow when drawing new ones
    deselectArrow();

    // Convert click position to normalized coordinates
    const point = svgEl.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return;
    const svgPoint = point.matrixTransform(ctm.inverse());

    const nx = Math.max(0, Math.min(1, svgPoint.x / 68));
    const ny = Math.max(0, Math.min(1, svgPoint.y / 105));

    if (!pendingStart) {
      // First click — capture start point
      pendingStart = { nx, ny };

      // Show a small indicator dot at the start position
      const arrowsLayer = svgEl.querySelector('#arrows-layer');
      if (arrowsLayer) {
        startIndicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        startIndicator.setAttribute('cx', String(svgPoint.x));
        startIndicator.setAttribute('cy', String(svgPoint.y));
        startIndicator.setAttribute('r', '1');
        startIndicator.setAttribute('fill', '#f0c040');
        startIndicator.setAttribute('opacity', '0.7');
        startIndicator.setAttribute('class', 'arrow-start-indicator');
        arrowsLayer.appendChild(startIndicator);
      }
    } else {
      // Second click — create the arrow
      const arrowData = {
        id: `arrow-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        startNx: pendingStart.nx,
        startNy: pendingStart.ny,
        endNx: nx,
        endNy: ny,
      };

      const state = getState();
      const newState = addArrow(state, arrowData);
      setState(newState);

      // Clear start indicator and reset pending state
      clearPendingStart();

      // Show clear button
      if (clearArrowsBtn) clearArrowsBtn.style.display = '';
    }
  });

  // Drag handler for moving selected arrows
  let arrowDragContext = null;

  svgEl.addEventListener('pointerdown', (e) => {
    if (!selectedArrowId) return;

    // Check if clicking on the selected arrow
    let el = e.target;
    while (el && el !== svgEl) {
      const arrowId = el.getAttribute && el.getAttribute('data-arrow-id');
      if (arrowId === selectedArrowId) {
        // Start dragging the selected arrow
        const point = svgEl.createSVGPoint();
        point.x = e.clientX;
        point.y = e.clientY;
        const ctm = svgEl.getScreenCTM();
        if (!ctm) return;
        const svgPoint = point.matrixTransform(ctm.inverse());

        arrowDragContext = {
          arrowId: selectedArrowId,
          startSvgX: svgPoint.x,
          startSvgY: svgPoint.y,
        };

        e.target.setPointerCapture(e.pointerId);
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      el = el.parentElement;
    }
  });

  svgEl.addEventListener('pointermove', (e) => {
    if (!arrowDragContext) return;

    const point = svgEl.createSVGPoint();
    point.x = e.clientX;
    point.y = e.clientY;
    const ctm = svgEl.getScreenCTM();
    if (!ctm) return;
    const svgPoint = point.matrixTransform(ctm.inverse());

    const deltaNx = (svgPoint.x - arrowDragContext.startSvgX) / 68;
    const deltaNy = (svgPoint.y - arrowDragContext.startSvgY) / 105;

    const state = getState();
    const arrow = state.arrows.find((a) => a.id === arrowDragContext.arrowId);
    if (!arrow) return;

    const newState = updateArrow(state, arrowDragContext.arrowId, {
      startNx: Math.max(0, Math.min(1, arrow.startNx + deltaNx)),
      startNy: Math.max(0, Math.min(1, arrow.startNy + deltaNy)),
      endNx: Math.max(0, Math.min(1, arrow.endNx + deltaNx)),
      endNy: Math.max(0, Math.min(1, arrow.endNy + deltaNy)),
    });

    setState(newState);

    // Update drag reference point
    arrowDragContext.startSvgX = svgPoint.x;
    arrowDragContext.startSvgY = svgPoint.y;
  });

  svgEl.addEventListener('pointerup', (e) => {
    if (arrowDragContext) {
      arrowDragContext = null;
      // Re-select the arrow to restore highlight after re-render
      if (selectedArrowId) {
        setTimeout(() => selectArrow(selectedArrowId), 0);
      }
    }
  });
}


// ─── Export as Image (PNG) ───────────────────────────────────────────────────

/**
 * Initialize the export button handler.
 * On #export-btn click:
 *  - Clones the #field-svg element
 *  - Serializes it to an SVG string
 *  - Draws it onto a canvas at 10x resolution (680×1050)
 *  - Converts to PNG and triggers a download
 *
 * @param {() => object} getState - Returns current app state
 */
export function initExportHandler(getState) {
  const exportBtn = document.getElementById('export-btn');
  if (!exportBtn) return;

  exportBtn.addEventListener('click', () => {
    const svgEl = document.getElementById('field-svg');
    if (!svgEl) return;

    // Clone the SVG to avoid modifying the live DOM
    const clone = svgEl.cloneNode(true);

    // Set explicit width/height attributes for the canvas rendering
    clone.setAttribute('width', '680');
    clone.setAttribute('height', '1050');
    // Remove any CSS sizing that might interfere
    clone.removeAttribute('class');
    clone.removeAttribute('style');

    // Serialize the SVG to a string
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(clone);

    // Create a Blob from the SVG string
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    // Create a canvas at 10x the viewBox resolution
    const canvas = document.createElement('canvas');
    canvas.width = 680;
    canvas.height = 1050;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
      // Draw the SVG image onto the canvas
      ctx.drawImage(img, 0, 0, 680, 1050);
      URL.revokeObjectURL(url);

      // Generate filename: formation-{format}-{timestamp}.png
      const state = getState();
      const timestamp = Date.now();
      const filename = `formation-${state.format}-${timestamp}.png`;

      // Convert canvas to PNG blob and trigger download
      canvas.toBlob((blob) => {
        if (!blob) return;
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      showNotification('Export failed: could not render the field image.', 'error');
    };

    img.src = url;
  });
}

// ─── Application Entry Point ────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  bootstrap();
});
