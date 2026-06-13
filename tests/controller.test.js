/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock renderer and storage before importing controller
vi.mock('../src/renderer.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    renderField: vi.fn(),
    renderTokens: vi.fn(),
    renderBall: vi.fn(),
  };
});

vi.mock('../src/storage.js', () => ({
  storage: {
    write: vi.fn(),
    read: vi.fn(() => null),
  },
}));

const { initFormatSelector, showConfirmDialog } = await import('../src/controller.js');
const { createInitialState } = await import('../src/state.js');
const { renderField, renderTokens, renderBall } = await import('../src/renderer.js');
const { storage } = await import('../src/storage.js');

function setupDOM() {
  document.body.innerHTML = `
    <select id="format-select" aria-label="Game format">
      <option value="7v7">7v7</option>
      <option value="9v9">9v9</option>
      <option value="11v11" selected>11v11</option>
    </select>
    <span id="active-format-label">Format: 11v11</span>
    <svg id="field-svg" viewBox="0 0 68 105">
      <g id="field-markings"></g>
      <g id="tokens-layer"></g>
      <g id="ball-layer"></g>
    </svg>
    <dialog id="confirm-dialog">
      <p id="dialog-message"></p>
      <button id="dialog-cancel-btn">Cancel</button>
      <button id="dialog-confirm-btn">Confirm</button>
    </dialog>
  `;
}

describe('initFormatSelector', () => {
  let state;
  let getState;
  let setState;

  beforeEach(() => {
    setupDOM();
    vi.clearAllMocks();
    state = createInitialState('11v11');
    getState = () => state;
    setState = (newState) => {
      state = newState;
      const svgEl = document.getElementById('field-svg');
      if (svgEl) {
        renderTokens(svgEl, state.ownTokens, state.opponentTokens);
        renderBall(svgEl, state.ball);
      }
    };
  });

  it('renders a format select dropdown with three options', () => {
    initFormatSelector(getState, setState);
    const select = document.getElementById('format-select');
    expect(select).not.toBeNull();
    expect(select.options).toHaveLength(3);
  });

  it('changes format when select value changes', async () => {
    initFormatSelector(getState, setState);
    const select = document.getElementById('format-select');
    select.value = '7v7';
    select.dispatchEvent(new Event('change'));
    await new Promise((r) => setTimeout(r, 0));

    expect(state.format).toBe('7v7');
    expect(state.ownTokens).toHaveLength(7);
  });

  it('calls setFormat and updates state when format is changed', async () => {
    initFormatSelector(getState, setState);
    const select = document.getElementById('format-select');
    select.value = '7v7';
    select.dispatchEvent(new Event('change'));
    await new Promise((r) => setTimeout(r, 0));

    expect(state.format).toBe('7v7');
    expect(state.ownTokens).toHaveLength(7);
  });

  it('updates the active format label text', async () => {
    initFormatSelector(getState, setState);
    const select = document.getElementById('format-select');
    select.value = '9v9';
    select.dispatchEvent(new Event('change'));
    await new Promise((r) => setTimeout(r, 0));

    const label = document.getElementById('active-format-label');
    expect(label.textContent).toBe('Format: 9v9');
  });

  it('re-renders field, tokens, and ball after format change', async () => {
    initFormatSelector(getState, setState);
    const select = document.getElementById('format-select');
    select.value = '7v7';
    select.dispatchEvent(new Event('change'));
    await new Promise((r) => setTimeout(r, 0));

    expect(renderField).toHaveBeenCalledOnce();
    expect(renderTokens).toHaveBeenCalledOnce();
    expect(renderBall).toHaveBeenCalledOnce();
  });

  it('persists the new format via storage.write', async () => {
    initFormatSelector(getState, setState);
    const select = document.getElementById('format-select');
    select.value = '9v9';
    select.dispatchEvent(new Event('change'));
    await new Promise((r) => setTimeout(r, 0));

    expect(storage.write).toHaveBeenCalledWith('format', '9v9');
  });

  it('disables opponent overlay on format change', async () => {
    // Start with opponent overlay enabled
    state = { ...state, opponentOverlayEnabled: true, opponentTokens: [{ id: 'opp-0' }] };
    initFormatSelector(getState, setState);
    const select = document.getElementById('format-select');
    select.value = '7v7';
    select.dispatchEvent(new Event('change'));
    await new Promise((r) => setTimeout(r, 0));

    expect(state.opponentOverlayEnabled).toBe(false);
    expect(state.opponentTokens).toHaveLength(0);
  });

  it('is a no-op if selecting the already active format', async () => {
    initFormatSelector(getState, setState);
    const select = document.getElementById('format-select');
    select.value = '11v11';
    select.dispatchEvent(new Event('change'));
    await new Promise((r) => setTimeout(r, 0));

    // No re-render should have happened
    expect(renderField).not.toHaveBeenCalled();
  });

  it('shows confirmation dialog if custom formation is unsaved', async () => {
    state = { ...state, activeFormationKey: 'custom', _customSaved: false };
    const confirmFn = vi.fn().mockResolvedValue(true);
    initFormatSelector(getState, setState, confirmFn);

    const select = document.getElementById('format-select');
    select.value = '7v7';
    select.dispatchEvent(new Event('change'));
    await new Promise((r) => setTimeout(r, 0));

    expect(confirmFn).toHaveBeenCalledWith(
      'Changing the format will discard your unsaved custom formation. Continue?'
    );
    expect(state.format).toBe('7v7');
  });

  it('aborts format change if user cancels confirmation', async () => {
    state = { ...state, activeFormationKey: 'custom', _customSaved: false };
    const confirmFn = vi.fn().mockResolvedValue(false);
    initFormatSelector(getState, setState, confirmFn);

    const select = document.getElementById('format-select');
    select.value = '7v7';
    select.dispatchEvent(new Event('change'));
    await new Promise((r) => setTimeout(r, 0));

    expect(state.format).toBe('11v11');
    expect(renderField).not.toHaveBeenCalled();
  });

  it('applies the correct default formation for each format', async () => {
    initFormatSelector(getState, setState);
    const select = document.getElementById('format-select');

    // Switch to 7v7
    select.value = '7v7';
    select.dispatchEvent(new Event('change'));
    await new Promise((r) => setTimeout(r, 0));
    expect(state.format).toBe('7v7');
    expect(state.ownTokens).toHaveLength(7);
    expect(state.activeFormationName).toBe('2-3-1');

    // Switch to 9v9
    select.value = '9v9';
    select.dispatchEvent(new Event('change'));
    await new Promise((r) => setTimeout(r, 0));
    expect(state.format).toBe('9v9');
    expect(state.ownTokens).toHaveLength(9);
    expect(state.activeFormationName).toBe('3-3-2');

    // Switch to 11v11
    select.value = '11v11';
    select.dispatchEvent(new Event('change'));
    await new Promise((r) => setTimeout(r, 0));
    expect(state.format).toBe('11v11');
    expect(state.ownTokens).toHaveLength(11);
    expect(state.activeFormationName).toBe('4-3-3');
  });
});


// ─── Task 8.1: Pointer Events Drag Handler Tests ────────────────────────────

describe('initDragHandlers', () => {
  let svgEl;
  let state;
  let setStateFn;
  let initDragHandlersFn;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Import the real initDragHandlers (not mocked)
    const controllerModule = await import('../src/controller.js');
    initDragHandlersFn = controllerModule.initDragHandlers;

    const { createInitialState: createState, setOpponentOverlay: setOppOverlay } = await import('../src/state.js');

    state = createState('11v11');

    document.body.innerHTML = `
      <svg id="field-svg" viewBox="0 0 68 105" xmlns="http://www.w3.org/2000/svg">
        <g id="field-markings"></g>
        <g id="tokens-layer"></g>
        <g id="ball-layer"></g>
      </svg>
    `;

    svgEl = document.querySelector('#field-svg');
    const tokensLayer = svgEl.querySelector('#tokens-layer');
    const ballLayer = svgEl.querySelector('#ball-layer');

    // Render own tokens into the DOM
    for (const token of state.ownTokens) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('id', token.id);
      g.setPointerCapture = vi.fn();
      g.releasePointerCapture = vi.fn();
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setPointerCapture = vi.fn();
      circle.releasePointerCapture = vi.fn();
      g.appendChild(circle);
      tokensLayer.appendChild(g);
    }

    // Render ball
    const ballPolygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    ballPolygon.setAttribute('id', 'ball');
    ballPolygon.setPointerCapture = vi.fn();
    ballPolygon.releasePointerCapture = vi.fn();
    ballLayer.appendChild(ballPolygon);

    // Mock getScreenCTM — identity matrix scaled: 1 viewBox unit = 10 screen pixels
    const scaleFactor = 10;
    svgEl.getScreenCTM = () => ({
      a: scaleFactor, b: 0, c: 0, d: scaleFactor, e: 0, f: 0,
      inverse: () => ({
        a: 1 / scaleFactor, b: 0, c: 0, d: 1 / scaleFactor, e: 0, f: 0,
      }),
    });

    // Mock createSVGPoint
    svgEl.createSVGPoint = () => {
      let x = 0, y = 0;
      return {
        get x() { return x; },
        set x(v) { x = v; },
        get y() { return y; },
        set y(v) { y = v; },
        matrixTransform(matrix) {
          return {
            x: x * matrix.a + y * matrix.c + matrix.e,
            y: x * matrix.b + y * matrix.d + matrix.f,
          };
        },
      };
    };

    setStateFn = vi.fn((newState) => {
      state = newState;
    });

    initDragHandlersFn(svgEl, () => state, setStateFn);
  });

  it('captures the pointer on pointerdown on a token', () => {
    const tokenCircle = svgEl.querySelector('#own-0 circle');
    const event = new PointerEvent('pointerdown', {
      clientX: 100, clientY: 100, pointerId: 1, bubbles: true, cancelable: true,
    });
    tokenCircle.dispatchEvent(event);

    expect(tokenCircle.setPointerCapture).toHaveBeenCalledWith(1);
  });

  it('does not call setState on pointerdown alone', () => {
    const tokenCircle = svgEl.querySelector('#own-0 circle');
    const event = new PointerEvent('pointerdown', {
      clientX: 100, clientY: 100, pointerId: 1, bubbles: true, cancelable: true,
    });
    tokenCircle.dispatchEvent(event);

    expect(setStateFn).not.toHaveBeenCalled();
  });

  it('updates own token position on pointermove', () => {
    const tokenCircle = svgEl.querySelector('#own-0 circle');

    // Start drag
    tokenCircle.dispatchEvent(new PointerEvent('pointerdown', {
      clientX: 50, clientY: 340, pointerId: 1, bubbles: true, cancelable: true,
    }));

    // Move to center of field: 34 viewBox x => 340 screen px, 52.5 viewBox y => 525 screen px
    svgEl.dispatchEvent(new PointerEvent('pointermove', {
      clientX: 340, clientY: 525, pointerId: 1, bubbles: true,
    }));

    expect(setStateFn).toHaveBeenCalled();
    const newState = setStateFn.mock.calls[0][0];
    const movedToken = newState.ownTokens.find((t) => t.id === 'own-0');
    expect(movedToken.nx).toBe(0.5);
    expect(movedToken.ny).toBe(0.5);
  });

  it('updates ball position on pointermove', () => {
    const ballEl = svgEl.querySelector('#ball');

    // Start drag on ball
    ballEl.dispatchEvent(new PointerEvent('pointerdown', {
      clientX: 525, clientY: 340, pointerId: 2, bubbles: true, cancelable: true,
    }));

    // Move ball to (0.7, 0.3) => 47.6 viewBox x => 476px, 31.5 viewBox y => 315px
    svgEl.dispatchEvent(new PointerEvent('pointermove', {
      clientX: 476, clientY: 315, pointerId: 2, bubbles: true,
    }));

    expect(setStateFn).toHaveBeenCalled();
    const newState = setStateFn.mock.calls[0][0];
    expect(newState.ball.nx).toBeCloseTo(0.7, 5);
    expect(newState.ball.ny).toBeCloseTo(0.3, 5);
  });

  it('does not update state on pointermove without prior pointerdown', () => {
    svgEl.dispatchEvent(new PointerEvent('pointermove', {
      clientX: 525, clientY: 340, pointerId: 99, bubbles: true,
    }));
    expect(setStateFn).not.toHaveBeenCalled();
  });

  it('does not snap back when drop is within field bounds', () => {
    const tokenCircle = svgEl.querySelector('#own-0 circle');

    // Start drag
    tokenCircle.dispatchEvent(new PointerEvent('pointerdown', {
      clientX: 50, clientY: 340, pointerId: 1, bubbles: true, cancelable: true,
    }));

    // Move within bounds
    svgEl.dispatchEvent(new PointerEvent('pointermove', {
      clientX: 340, clientY: 525, pointerId: 1, bubbles: true,
    }));

    // End drag within bounds
    svgEl.dispatchEvent(new PointerEvent('pointerup', {
      clientX: 340, clientY: 525, pointerId: 1, bubbles: true,
    }));

    // Last setState should be the pointermove position (0.5, 0.5), not a snap-back
    const lastCall = setStateFn.mock.calls[setStateFn.mock.calls.length - 1][0];
    const token = lastCall.ownTokens.find((t) => t.id === 'own-0');
    expect(token.nx).toBe(0.5);
    expect(token.ny).toBe(0.5);
  });

  it('snaps back to start position when drop is outside field (right)', () => {
    const tokenCircle = svgEl.querySelector('#own-0 circle');
    const originalNx = state.ownTokens[0].nx;
    const originalNy = state.ownTokens[0].ny;

    // Start drag
    tokenCircle.dispatchEvent(new PointerEvent('pointerdown', {
      clientX: 50, clientY: 340, pointerId: 1, bubbles: true, cancelable: true,
    }));

    // Move to valid position
    svgEl.dispatchEvent(new PointerEvent('pointermove', {
      clientX: 340, clientY: 525, pointerId: 1, bubbles: true,
    }));

    // End drag outside bounds (1200px screen = 120 viewBox x > 68)
    svgEl.dispatchEvent(new PointerEvent('pointerup', {
      clientX: 1200, clientY: 340, pointerId: 1, bubbles: true,
    }));

    // Should have snapped back
    const lastCall = setStateFn.mock.calls[setStateFn.mock.calls.length - 1][0];
    const token = lastCall.ownTokens.find((t) => t.id === 'own-0');
    expect(token.nx).toBe(originalNx);
    expect(token.ny).toBe(originalNy);
  });

  it('snaps back to start position when drop is outside field (negative)', () => {
    const ballEl = svgEl.querySelector('#ball');
    const originalNx = state.ball.nx;
    const originalNy = state.ball.ny;

    // Start drag on ball
    ballEl.dispatchEvent(new PointerEvent('pointerdown', {
      clientX: 525, clientY: 340, pointerId: 1, bubbles: true, cancelable: true,
    }));

    // Move to valid position
    svgEl.dispatchEvent(new PointerEvent('pointermove', {
      clientX: 300, clientY: 200, pointerId: 1, bubbles: true,
    }));

    // End drag outside bounds (negative coordinates)
    svgEl.dispatchEvent(new PointerEvent('pointerup', {
      clientX: -50, clientY: -50, pointerId: 1, bubbles: true,
    }));

    // Should have snapped back
    const lastCall = setStateFn.mock.calls[setStateFn.mock.calls.length - 1][0];
    expect(lastCall.ball.nx).toBe(originalNx);
    expect(lastCall.ball.ny).toBe(originalNy);
  });

  it('snaps back to start position on pointercancel', () => {
    const tokenCircle = svgEl.querySelector('#own-0 circle');
    const originalNx = state.ownTokens[0].nx;
    const originalNy = state.ownTokens[0].ny;

    // Start drag
    tokenCircle.dispatchEvent(new PointerEvent('pointerdown', {
      clientX: 50, clientY: 340, pointerId: 1, bubbles: true, cancelable: true,
    }));

    // Move
    svgEl.dispatchEvent(new PointerEvent('pointermove', {
      clientX: 340, clientY: 525, pointerId: 1, bubbles: true,
    }));

    // Cancel
    svgEl.dispatchEvent(new PointerEvent('pointercancel', {
      clientX: 340, clientY: 525, pointerId: 1, bubbles: true,
    }));

    // Should have snapped back
    const lastCall = setStateFn.mock.calls[setStateFn.mock.calls.length - 1][0];
    const token = lastCall.ownTokens.find((t) => t.id === 'own-0');
    expect(token.nx).toBe(originalNx);
    expect(token.ny).toBe(originalNy);
  });

  it('updates opponent token position on pointermove', async () => {
    // Enable opponent overlay and add opponent tokens to state
    const { setOpponentOverlay } = await import('../src/state.js');
    state = setOpponentOverlay(state, true);

    // Render opponent tokens into the DOM
    const tokensLayer = svgEl.querySelector('#tokens-layer');
    for (const token of state.opponentTokens) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('id', token.id);
      g.setPointerCapture = vi.fn();
      g.releasePointerCapture = vi.fn();
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setPointerCapture = vi.fn();
      circle.releasePointerCapture = vi.fn();
      g.appendChild(circle);
      tokensLayer.appendChild(g);
    }

    const oppCircle = svgEl.querySelector('#opp-0 circle');

    // Start drag
    oppCircle.dispatchEvent(new PointerEvent('pointerdown', {
      clientX: 50, clientY: 340, pointerId: 3, bubbles: true, cancelable: true,
    }));

    // Move to (0.5, 0.5) — center of field
    svgEl.dispatchEvent(new PointerEvent('pointermove', {
      clientX: 340, clientY: 525, pointerId: 3, bubbles: true,
    }));

    expect(setStateFn).toHaveBeenCalled();
    const newState = setStateFn.mock.calls[setStateFn.mock.calls.length - 1][0];
    const movedToken = newState.opponentTokens.find((t) => t.id === 'opp-0');
    expect(movedToken.nx).toBe(0.5);
    expect(movedToken.ny).toBe(0.5);
  });

  it('does not initiate drag on non-draggable elements', () => {
    // Add a marking element (no draggable id)
    const markingsGroup = svgEl.querySelector('#field-markings');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setPointerCapture = vi.fn();
    markingsGroup.appendChild(rect);

    rect.dispatchEvent(new PointerEvent('pointerdown', {
      clientX: 200, clientY: 200, pointerId: 1, bubbles: true, cancelable: true,
    }));
    svgEl.dispatchEvent(new PointerEvent('pointermove', {
      clientX: 300, clientY: 300, pointerId: 1, bubbles: true,
    }));

    expect(setStateFn).not.toHaveBeenCalled();
  });
});


// ─── Task 11.1: Opponent Overlay Toggle & Formation Selector ────────────────

describe('initOpponentOverlay', () => {
  let state;
  let getState;
  let setState;
  let initOpponentOverlayFn;

  beforeEach(async () => {
    vi.clearAllMocks();

    const controllerModule = await import('../src/controller.js');
    initOpponentOverlayFn = controllerModule.initOpponentOverlay;

    const { createInitialState } = await import('../src/state.js');
    state = createInitialState('11v11');
    getState = () => state;
    setState = (newState) => {
      state = newState;
      const svgEl = document.getElementById('field-svg');
      if (svgEl) {
        renderTokens(svgEl, state.ownTokens, state.opponentTokens);
        renderBall(svgEl, state.ball);
      }
    };

    document.body.innerHTML = `
      <label id="opponent-toggle-label">
        <input type="checkbox" id="opponent-toggle" aria-label="Toggle opponent overlay" />
        Opponent
      </label>
      <select id="opponent-formation-select" aria-label="Opponent formation" disabled></select>
      <svg id="field-svg" viewBox="0 0 68 105">
        <g id="field-markings"></g>
        <g id="tokens-layer"></g>
        <g id="ball-layer"></g>
      </svg>
    `;

    storage.read.mockReturnValue(null);
  });

  it('enables opponent overlay when toggle is checked', () => {
    initOpponentOverlayFn(getState, setState);
    const toggle = document.getElementById('opponent-toggle');

    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));

    expect(state.opponentOverlayEnabled).toBe(true);
    expect(state.opponentTokens.length).toBeGreaterThan(0);
  });

  it('disables opponent overlay when toggle is unchecked', () => {
    // Start with overlay enabled
    const { setOpponentOverlay } = require('../src/state.js');
    state = setOpponentOverlay(state, true);

    initOpponentOverlayFn(getState, setState);
    const toggle = document.getElementById('opponent-toggle');

    toggle.checked = false;
    toggle.dispatchEvent(new Event('change'));

    expect(state.opponentOverlayEnabled).toBe(false);
    expect(state.opponentTokens).toHaveLength(0);
  });

  it('uses default formation when no saved opponent state exists', () => {
    storage.read.mockReturnValue(null);
    initOpponentOverlayFn(getState, setState);
    const toggle = document.getElementById('opponent-toggle');

    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));

    expect(state.opponentFormationKey).toBe('11v11-4-3-3');
    expect(state.opponentTokens).toHaveLength(11);
  });

  it('restores last saved opponent formation on re-enable', () => {
    storage.read.mockReturnValue(JSON.stringify({ '11v11': '11v11-4-4-2' }));
    initOpponentOverlayFn(getState, setState);
    const toggle = document.getElementById('opponent-toggle');

    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));

    expect(state.opponentFormationKey).toBe('11v11-4-4-2');
    expect(state.opponentTokens).toHaveLength(11);
  });

  it('enables the formation select when overlay is enabled', () => {
    initOpponentOverlayFn(getState, setState);
    const toggle = document.getElementById('opponent-toggle');
    const select = document.getElementById('opponent-formation-select');

    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));

    expect(select.disabled).toBe(false);
  });

  it('disables the formation select when overlay is disabled', () => {
    initOpponentOverlayFn(getState, setState);
    const toggle = document.getElementById('opponent-toggle');
    const select = document.getElementById('opponent-formation-select');

    // Enable first
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));
    expect(select.disabled).toBe(false);

    // Now disable
    toggle.checked = false;
    toggle.dispatchEvent(new Event('change'));
    expect(select.disabled).toBe(true);
  });

  it('populates select with formations for the active format', () => {
    initOpponentOverlayFn(getState, setState);
    const toggle = document.getElementById('opponent-toggle');
    const select = document.getElementById('opponent-formation-select');

    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));

    // 11v11 has 5 preset formations
    expect(select.options.length).toBe(5);
    const names = Array.from(select.options).map((o) => o.textContent);
    expect(names).toContain('4-3-3');
    expect(names).toContain('4-4-2');
    expect(names).toContain('4-2-3-1');
    expect(names).toContain('3-5-2');
    expect(names).toContain('5-3-2');
  });

  it('changes opponent formation when select value changes', () => {
    initOpponentOverlayFn(getState, setState);
    const toggle = document.getElementById('opponent-toggle');
    const select = document.getElementById('opponent-formation-select');

    // Enable overlay
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));

    // Change to 4-4-2
    select.value = '11v11-4-4-2';
    select.dispatchEvent(new Event('change'));

    expect(state.opponentFormationKey).toBe('11v11-4-4-2');
  });

  it('saves opponent formation to storage on disable', () => {
    storage.read.mockReturnValue(null);
    initOpponentOverlayFn(getState, setState);
    const toggle = document.getElementById('opponent-toggle');

    // Enable
    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));

    // Disable
    toggle.checked = false;
    toggle.dispatchEvent(new Event('change'));

    expect(storage.write).toHaveBeenCalledWith(
      'opponentState',
      expect.any(String)
    );
    const savedData = JSON.parse(storage.write.mock.calls[0][1]);
    expect(savedData['11v11']).toBe('11v11-4-3-3');
  });

  it('renders opponent tokens on enable', () => {
    initOpponentOverlayFn(getState, setState);
    const toggle = document.getElementById('opponent-toggle');

    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));

    expect(renderTokens).toHaveBeenCalled();
    const lastCall = renderTokens.mock.calls[renderTokens.mock.calls.length - 1];
    // Second arg is ownTokens, third is opponentTokens
    expect(lastCall[2].length).toBeGreaterThan(0);
  });

  it('renders with empty opponent tokens on disable', () => {
    const { setOpponentOverlay } = require('../src/state.js');
    state = setOpponentOverlay(state, true);

    initOpponentOverlayFn(getState, setState);
    const toggle = document.getElementById('opponent-toggle');

    toggle.checked = false;
    toggle.dispatchEvent(new Event('change'));

    expect(renderTokens).toHaveBeenCalled();
    const lastCall = renderTokens.mock.calls[renderTokens.mock.calls.length - 1];
    expect(lastCall[2]).toHaveLength(0);
  });

  it('does not change formation on select if overlay is disabled', () => {
    initOpponentOverlayFn(getState, setState);
    const select = document.getElementById('opponent-formation-select');

    // Manually add an option and trigger change without enabling
    const option = document.createElement('option');
    option.value = '11v11-4-4-2';
    select.appendChild(option);
    select.value = '11v11-4-4-2';
    select.dispatchEvent(new Event('change'));

    expect(state.opponentOverlayEnabled).toBe(false);
    expect(state.opponentFormationKey).toBeNull();
  });
});


// ─── Task 10.2: Preset Formation Selector Tests ─────────────────────────────

describe('initFormationSelector', () => {
  let state;
  let getState;
  let setState;
  let initFormationSelectorFn;

  beforeEach(async () => {
    vi.clearAllMocks();

    const controllerModule = await import('../src/controller.js');
    initFormationSelectorFn = controllerModule.initFormationSelector;

    const { createInitialState: createState } = await import('../src/state.js');
    state = createState('11v11');

    document.body.innerHTML = `
      <select id="format-select" aria-label="Game format">
        <option value="7v7">7v7</option>
        <option value="9v9">9v9</option>
        <option value="11v11" selected>11v11</option>
      </select>
      <span id="active-format-label">Format: 11v11</span>
      <select id="formation-select" aria-label="Select formation"></select>
      <span id="active-formation-label" aria-live="polite">No formation selected</span>
      <svg id="field-svg" viewBox="0 0 68 105">
        <g id="field-markings"></g>
        <g id="tokens-layer"></g>
        <g id="ball-layer"></g>
      </svg>
    `;

    getState = () => state;
    setState = (newState) => {
      state = newState;
      const svgEl = document.getElementById('field-svg');
      if (svgEl) {
        renderTokens(svgEl, state.ownTokens, state.opponentTokens);
        renderBall(svgEl, state.ball);
      }
    };
  });

  it('populates the formation select with formations for the active format', () => {
    initFormationSelectorFn(getState, setState);
    const select = document.getElementById('formation-select');
    const options = select.querySelectorAll('option');

    // 11v11 has 5 presets + 1 Custom = 6 options
    expect(options.length).toBe(6);
    expect(options[0].textContent).toBe('4-3-3');
    expect(options[options.length - 1].textContent).toBe('Custom');
    expect(options[options.length - 1].value).toBe('custom');
  });

  it('marks the active formation as selected in the dropdown', () => {
    // Initial state has 4-3-3 as active (default for 11v11)
    initFormationSelectorFn(getState, setState);
    const select = document.getElementById('formation-select');

    expect(select.value).toBe('11v11-4-3-3');
  });

  it('applies a formation on selection change and updates state', () => {
    initFormationSelectorFn(getState, setState);
    const select = document.getElementById('formation-select');

    // Change to 4-4-2
    select.value = '11v11-4-4-2';
    select.dispatchEvent(new Event('change'));

    expect(state.activeFormationKey).toBe('11v11-4-4-2');
    expect(state.activeFormationName).toBe('4-4-2');
    expect(state.ownTokens).toHaveLength(11);
  });

  it('reconciles token count when switching formations (Property 3)', () => {
    // Start with a modified state that has fewer tokens
    state = { ...state, ownTokens: state.ownTokens.slice(0, 5) };

    initFormationSelectorFn(getState, setState);
    const select = document.getElementById('formation-select');

    // Apply 4-3-3 which needs 11 tokens
    select.value = '11v11-4-3-3';
    select.dispatchEvent(new Event('change'));

    expect(state.ownTokens).toHaveLength(11);
  });

  it('updates the #active-formation-label when a formation is selected', () => {
    initFormationSelectorFn(getState, setState);
    const select = document.getElementById('formation-select');
    const label = document.getElementById('active-formation-label');

    select.value = '11v11-4-4-2';
    select.dispatchEvent(new Event('change'));

    expect(label.textContent).toBe('Formation: 4-4-2');
  });

  it('shows "No formation selected" when state has no active formation', () => {
    state = { ...state, activeFormationKey: null, activeFormationName: null };
    initFormationSelectorFn(getState, setState);
    const label = document.getElementById('active-formation-label');

    expect(label.textContent).toBe('No formation selected');
  });

  it('shows "Formation: Custom" when custom is the active formation key', () => {
    state = { ...state, activeFormationKey: 'custom', activeFormationName: 'Custom' };
    initFormationSelectorFn(getState, setState);
    const label = document.getElementById('active-formation-label');

    expect(label.textContent).toBe('Formation: Custom');
  });

  it('includes a "Custom" option in the dropdown', () => {
    initFormationSelectorFn(getState, setState);
    const select = document.getElementById('formation-select');
    const options = Array.from(select.querySelectorAll('option'));
    const customOption = options.find((o) => o.value === 'custom');

    expect(customOption).toBeDefined();
    expect(customOption.textContent).toBe('Custom');
  });

  it('enters custom mode when "Custom" is selected', () => {
    initFormationSelectorFn(getState, setState);
    const select = document.getElementById('formation-select');

    select.value = 'custom';
    select.dispatchEvent(new Event('change'));

    expect(state.activeFormationKey).toBe('custom');
    expect(state.activeFormationName).toBe('Custom');
  });

  it('re-renders tokens after formation selection', () => {
    initFormationSelectorFn(getState, setState);
    const select = document.getElementById('formation-select');

    select.value = '11v11-4-4-2';
    select.dispatchEvent(new Event('change'));

    expect(renderTokens).toHaveBeenCalled();
    expect(renderBall).toHaveBeenCalled();
  });

  it('refreshFormations repopulates dropdown for a new format', () => {
    const { refreshFormations } = initFormationSelectorFn(getState, setState);
    const select = document.getElementById('formation-select');

    // Initial: 11v11 has 5 presets + Custom
    expect(select.querySelectorAll('option').length).toBe(6);

    // Simulate format change to 7v7
    state = { ...state, format: '7v7', activeFormationKey: '7v7-2-3-1', activeFormationName: '2-3-1' };
    refreshFormations('7v7');

    const options = select.querySelectorAll('option');
    // 7v7 has 5 presets + Custom = 6
    expect(options.length).toBe(6);
    expect(options[0].textContent).toBe('2-3-1');
    expect(options[options.length - 1].textContent).toBe('Custom');
  });

  it('sets correct token positions per formation definition (Property 2)', () => {
    initFormationSelectorFn(getState, setState);
    const select = document.getElementById('formation-select');

    select.value = '11v11-4-4-2';
    select.dispatchEvent(new Event('change'));

    // Verify that token positions match the 4-4-2 formation
    expect(state.ownTokens[0].nx).toBe(0.5);  // GK
    expect(state.ownTokens[0].ny).toBe(0.95);
    expect(state.ownTokens[0].label).toBe('GK');
  });

  it('resets ball to center when applying a formation', () => {
    // Move ball away from center first
    state = { ...state, ball: { nx: 0.8, ny: 0.8 } };

    initFormationSelectorFn(getState, setState);
    const select = document.getElementById('formation-select');

    select.value = '11v11-4-4-2';
    select.dispatchEvent(new Event('change'));

    expect(state.ball.nx).toBe(0.5);
    expect(state.ball.ny).toBe(0.5);
  });
});


// ─── Task 13.1: Moments Selector Tests ──────────────────────────────────────

describe('initMomentsSelector', () => {
  let state;
  let getState;
  let setState;
  let initMomentsSelectorFn;

  beforeEach(async () => {
    vi.clearAllMocks();

    const controllerModule = await import('../src/controller.js');
    initMomentsSelectorFn = controllerModule.initMomentsSelector;

    const { createInitialState } = await import('../src/state.js');
    state = createInitialState('11v11');
    getState = () => state;
    setState = (newState) => {
      state = newState;
      const svgEl = document.getElementById('field-svg');
      if (svgEl) {
        renderTokens(svgEl, state.ownTokens, state.opponentTokens);
        renderBall(svgEl, state.ball);
      }
    };

    document.body.innerHTML = `
      <select id="moments-select" aria-label="Select situational moment">
        <option value="">— Moments —</option>
      </select>
      <svg id="field-svg" viewBox="0 0 68 105">
        <g id="field-markings"></g>
        <g id="tokens-layer"></g>
        <g id="ball-layer"></g>
      </svg>
    `;
  });

  it('populates the moments select with predefined moments for the active format', () => {
    initMomentsSelectorFn(getState, setState);
    const select = document.getElementById('moments-select');

    // Should have a default option plus predefined moments in an optgroup
    const predefinedGroup = select.querySelector('optgroup[label="Predefined"]');
    expect(predefinedGroup).not.toBeNull();
    expect(predefinedGroup.querySelectorAll('option').length).toBeGreaterThan(0);
  });

  it('shows user-saved moments in a separate "Saved" optgroup', () => {
    state = {
      ...state,
      savedMoments: [
        {
          id: 'user-moment-1',
          name: 'My Corner Kick',
          isPredefined: false,
          format: '11v11',
          ownPositions: state.ownTokens.map((t) => ({ label: t.label, nx: t.nx, ny: t.ny })),
          ballPosition: { nx: 0.5, ny: 0.5 },
          savedAt: '2024-01-01T00:00:00Z',
        },
      ],
    };
    initMomentsSelectorFn(getState, setState);
    const select = document.getElementById('moments-select');

    const savedGroup = select.querySelector('optgroup[label="Saved"]');
    expect(savedGroup).not.toBeNull();
    expect(savedGroup.querySelectorAll('option').length).toBe(1);
    expect(savedGroup.querySelector('option').textContent).toBe('My Corner Kick');
  });

  it('does not show user-saved moments from a different format', () => {
    state = {
      ...state,
      savedMoments: [
        {
          id: 'user-moment-7v7',
          name: '7v7 Moment',
          isPredefined: false,
          format: '7v7',
          ownPositions: [{ label: 'GK', nx: 0.5, ny: 0.05 }],
          ballPosition: { nx: 0.5, ny: 0.5 },
          savedAt: '2024-01-01T00:00:00Z',
        },
      ],
    };
    initMomentsSelectorFn(getState, setState);
    const select = document.getElementById('moments-select');

    const savedGroup = select.querySelector('optgroup[label="Saved"]');
    expect(savedGroup).toBeNull();
  });

  it('applies a predefined moment on selection and updates own tokens', () => {
    initMomentsSelectorFn(getState, setState);
    const select = document.getElementById('moments-select');

    // Select the first predefined moment (corner-attacking-11v11)
    select.value = 'corner-attacking-11v11';
    select.dispatchEvent(new Event('change'));

    expect(state.activeMomentKey).toBe('corner-attacking-11v11');
    // Ball should be at (1.0, 0.0) for attacking corner kick (opponent's corner, top)
    expect(state.ball.nx).toBe(1.0);
    expect(state.ball.ny).toBe(0.0);
    // Own tokens should match the moment's ownPositions
    expect(state.ownTokens[0].label).toBe('GK');
    expect(state.ownTokens[0].nx).toBe(0.5);
    expect(state.ownTokens[0].ny).toBe(0.95);
  });

  it('sets opponent tokens from moment opponentPositions when overlay is enabled (Property 12)', () => {
    const { setOpponentOverlay } = require('../src/state.js');
    state = setOpponentOverlay(state, true);

    initMomentsSelectorFn(getState, setState);
    const select = document.getElementById('moments-select');

    select.value = 'corner-attacking-11v11';
    select.dispatchEvent(new Event('change'));

    // Opponent tokens should now match the moment's opponentPositions
    expect(state.opponentTokens.length).toBe(11);
    expect(state.opponentTokens[0].label).toBe('GK');
    expect(state.opponentTokens[0].ny).toBeCloseTo(0.05, 1);
  });

  it('stores a deep copy of the moment as activeMomentSnapshot (Property 13)', () => {
    initMomentsSelectorFn(getState, setState);
    const select = document.getElementById('moments-select');

    select.value = 'corner-attacking-11v11';
    select.dispatchEvent(new Event('change'));

    // Verify that activeMomentSnapshot exists and is a deep copy
    expect(state.activeMomentSnapshot).toBeDefined();
    expect(state.activeMomentSnapshot.id).toBe('corner-attacking-11v11');

    // Mutating state's ownTokens should not affect the snapshot
    const originalSnapshotPos = state.activeMomentSnapshot.ownPositions[0].nx;
    state.ownTokens[0].nx = 0.99;
    expect(state.activeMomentSnapshot.ownPositions[0].nx).toBe(originalSnapshotPos);
  });

  it('does nothing when the default "— Moments —" option is selected', () => {
    initMomentsSelectorFn(getState, setState);
    const select = document.getElementById('moments-select');

    const stateBefore = { ...state };
    select.value = '';
    select.dispatchEvent(new Event('change'));

    expect(state.activeMomentKey).toBe(stateBefore.activeMomentKey);
  });

  it('re-renders tokens and ball after moment selection', () => {
    initMomentsSelectorFn(getState, setState);
    const select = document.getElementById('moments-select');

    select.value = 'corner-attacking-11v11';
    select.dispatchEvent(new Event('change'));

    expect(renderTokens).toHaveBeenCalled();
    expect(renderBall).toHaveBeenCalled();
  });

  it('applies a user-saved moment on selection', () => {
    const userMoment = {
      id: 'user-moment-1',
      name: 'My Setup',
      isPredefined: false,
      format: '11v11',
      ownPositions: [
        { label: 'GK', nx: 0.5, ny: 0.1 },
        { label: 'CB1', nx: 0.3, ny: 0.2 },
        { label: 'CB2', nx: 0.7, ny: 0.2 },
        { label: 'LB', nx: 0.1, ny: 0.3 },
        { label: 'RB', nx: 0.9, ny: 0.3 },
        { label: 'CM1', nx: 0.35, ny: 0.4 },
        { label: 'CM2', nx: 0.65, ny: 0.4 },
        { label: 'LW', nx: 0.15, ny: 0.55 },
        { label: 'RW', nx: 0.85, ny: 0.55 },
        { label: 'ST1', nx: 0.4, ny: 0.65 },
        { label: 'ST2', nx: 0.6, ny: 0.65 },
      ],
      ballPosition: { nx: 0.3, ny: 0.7 },
      savedAt: '2024-01-01T00:00:00Z',
    };
    state = { ...state, savedMoments: [userMoment] };

    initMomentsSelectorFn(getState, setState);
    const select = document.getElementById('moments-select');

    select.value = 'user-moment-1';
    select.dispatchEvent(new Event('change'));

    expect(state.activeMomentKey).toBe('user-moment-1');
    expect(state.ball.nx).toBe(0.3);
    expect(state.ball.ny).toBe(0.7);
    expect(state.ownTokens[0].label).toBe('GK');
    expect(state.ownTokens[0].nx).toBe(0.5);
    expect(state.ownTokens[0].ny).toBe(0.1);
  });

  it('refreshMoments repopulates dropdown for a new format', () => {
    const { refreshMoments } = initMomentsSelectorFn(getState, setState);
    const select = document.getElementById('moments-select');

    // Count predefined moments for 11v11
    const predefinedGroup11 = select.querySelector('optgroup[label="Predefined"]');
    const count11 = predefinedGroup11 ? predefinedGroup11.querySelectorAll('option').length : 0;

    // Switch to 7v7
    state = { ...state, format: '7v7', activeMomentKey: null };
    refreshMoments('7v7');

    const predefinedGroup7 = select.querySelector('optgroup[label="Predefined"]');
    const count7 = predefinedGroup7 ? predefinedGroup7.querySelectorAll('option').length : 0;

    // Both should have predefined moments (9 per format: 5 original + 2 throw-ins + goal kick + penalty)
    expect(count11).toBe(9);
    expect(count7).toBe(9);
  });

  it('predefined moments have data-predefined="true" attribute', () => {
    initMomentsSelectorFn(getState, setState);
    const select = document.getElementById('moments-select');

    const predefinedGroup = select.querySelector('optgroup[label="Predefined"]');
    const options = predefinedGroup.querySelectorAll('option');
    options.forEach((opt) => {
      expect(opt.dataset.predefined).toBe('true');
    });
  });

  it('user-saved moments have data-predefined="false" attribute', () => {
    state = {
      ...state,
      savedMoments: [
        {
          id: 'user-moment-1',
          name: 'My Moment',
          isPredefined: false,
          format: '11v11',
          ownPositions: state.ownTokens.map((t) => ({ label: t.label, nx: t.nx, ny: t.ny })),
          ballPosition: { nx: 0.5, ny: 0.5 },
          savedAt: '2024-01-01T00:00:00Z',
        },
      ],
    };
    initMomentsSelectorFn(getState, setState);
    const select = document.getElementById('moments-select');

    const savedGroup = select.querySelector('optgroup[label="Saved"]');
    const options = savedGroup.querySelectorAll('option');
    options.forEach((opt) => {
      expect(opt.dataset.predefined).toBe('false');
    });
  });
});


// ─── Task 12.1: Description Panel Tests ─────────────────────────────────────

describe('initDescriptionPanel', () => {
  let state;
  let getState;
  let setState;
  let initDescriptionPanelFn;

  beforeEach(async () => {
    vi.clearAllMocks();

    const controllerModule = await import('../src/controller.js');
    initDescriptionPanelFn = controllerModule.initDescriptionPanel;

    const { createInitialState } = await import('../src/state.js');
    state = createInitialState('11v11');
    getState = () => state;
    setState = (newState) => { state = newState; };

    document.body.innerHTML = `
      <button id="toggle-info-btn" aria-label="Toggle position info panel" aria-pressed="false" style="opacity:0.5;">ℹ️ Info</button>
      <svg id="field-svg" viewBox="0 0 68 105" xmlns="http://www.w3.org/2000/svg">
        <g id="field-markings"></g>
        <g id="tokens-layer"></g>
        <g id="ball-layer"></g>
      </svg>
      <aside id="description-panel" aria-label="Position description" aria-hidden="true">
        <button id="dismiss-panel-btn" aria-label="Close position description panel">✕ Close</button>
        <div id="description-content"></div>
      </aside>
    `;

    // Render own tokens into the DOM
    const tokensLayer = document.querySelector('#tokens-layer');
    for (const token of state.ownTokens) {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.setAttribute('id', token.id);
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      g.appendChild(circle);
      tokensLayer.appendChild(g);
    }

    // Initialize and enable the panel (default is disabled)
    initDescriptionPanelFn(getState, setState);
    document.getElementById('toggle-info-btn').click();
  });

  it('shows the description panel when an own-team token is clicked', () => {
    const panel = document.getElementById('description-panel');
    const tokenG = document.getElementById('own-0');

    tokenG.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(panel.classList.contains('visible')).toBe(true);
    expect(panel.getAttribute('aria-hidden')).toBe('false');
  });

  it('sets selectedTokenId in state when a token is clicked', () => {
    const tokenG = document.getElementById('own-0');

    tokenG.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(state.selectedTokenId).toBe('own-0');
  });

  it('renders position description content for a token with a known formationKey', () => {
    const content = document.getElementById('description-content');

    // own-0 in 4-3-3 is GK
    const tokenG = document.getElementById('own-0');
    tokenG.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(content.querySelector('h2').textContent).toBe('Goalkeeper');
    expect(content.querySelector('.role-desc')).not.toBeNull();
    expect(content.querySelector('.attributes-list')).not.toBeNull();
    expect(content.querySelectorAll('.attributes-list li').length).toBeGreaterThanOrEqual(1);
    expect(content.querySelector('.responsibilities')).not.toBeNull();
  });

  it('renders "no description" message when formationKey has no description', () => {
    // Set a token with an unknown formationKey
    state.ownTokens[0] = { ...state.ownTokens[0], formationKey: 'UNKNOWN_KEY' };
    const content = document.getElementById('description-content');

    const tokenG = document.getElementById('own-0');
    tokenG.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(content.querySelector('.no-desc')).not.toBeNull();
    expect(content.querySelector('.no-desc').textContent).toBe(
      'No description is available for this position.'
    );
  });

  it('hides the panel and sets selectedTokenId to null on dismiss click', () => {
    const panel = document.getElementById('description-panel');
    const dismissBtn = document.getElementById('dismiss-panel-btn');

    // Open panel first
    const tokenG = document.getElementById('own-0');
    tokenG.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(panel.classList.contains('visible')).toBe(true);
    expect(state.selectedTokenId).toBe('own-0');

    // Dismiss
    dismissBtn.click();

    expect(panel.classList.contains('visible')).toBe(false);
    expect(panel.getAttribute('aria-hidden')).toBe('true');
    expect(state.selectedTokenId).toBeNull();
  });

  it('dismiss does NOT change token positions', () => {
    const dismissBtn = document.getElementById('dismiss-panel-btn');

    // Capture original positions
    const originalPositions = state.ownTokens.map((t) => ({ nx: t.nx, ny: t.ny }));

    // Open panel
    const tokenG = document.getElementById('own-0');
    tokenG.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    // Dismiss
    dismissBtn.click();

    // Verify positions unchanged
    state.ownTokens.forEach((token, i) => {
      expect(token.nx).toBe(originalPositions[i].nx);
      expect(token.ny).toBe(originalPositions[i].ny);
    });
  });

  it('handles click on a child element (circle) inside the token group', () => {
    const panel = document.getElementById('description-panel');
    const tokenG = document.getElementById('own-0');
    const circle = tokenG.querySelector('circle');

    // Click the circle (child of g)
    circle.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(panel.classList.contains('visible')).toBe(true);
    expect(state.selectedTokenId).toBe('own-0');
  });

  it('does not open the panel when clicking outside tokens', () => {
    const panel = document.getElementById('description-panel');
    const svgEl = document.getElementById('field-svg');

    // Click on the SVG background itself
    svgEl.dispatchEvent(new MouseEvent('click', { bubbles: false }));

    expect(panel.classList.contains('visible')).toBe(false);
    expect(state.selectedTokenId).toBeNull();
  });
});

// ─── Task 16.1: Reset Handler Tests ─────────────────────────────────────────

describe('initResetHandler', () => {
  let state;
  let getState;
  let setState;
  let initResetHandlerFn;

  beforeEach(async () => {
    vi.clearAllMocks();

    const controllerModule = await import('../src/controller.js');
    initResetHandlerFn = controllerModule.initResetHandler;

    const { createInitialState: createState, setOpponentOverlay, setOwnTokenPosition, setBallPosition, applyMoment } = await import('../src/state.js');

    state = createState('11v11');
    getState = () => state;
    setState = (newState) => {
      state = newState;
      const svgEl = document.getElementById('field-svg');
      if (svgEl) {
        renderTokens(svgEl, state.ownTokens, state.opponentTokens);
        renderBall(svgEl, state.ball);
      }
    };

    document.body.innerHTML = `
      <button id="reset-btn" aria-label="Reset field to formation defaults">Reset</button>
      <svg id="field-svg" viewBox="0 0 68 105">
        <g id="field-markings"></g>
        <g id="tokens-layer"></g>
        <g id="ball-layer"></g>
      </svg>
    `;
  });

  it('shows confirmation dialog on reset button click', async () => {
    const confirmFn = vi.fn().mockResolvedValue(false);
    initResetHandlerFn(getState, setState, confirmFn);

    document.getElementById('reset-btn').click();
    await new Promise((r) => setTimeout(r, 0));

    expect(confirmFn).toHaveBeenCalledWith('Reset all positions to formation defaults?');
  });

  it('does nothing when user cancels the confirmation', async () => {
    // Move a token first
    const { setOwnTokenPosition } = await import('../src/state.js');
    state = setOwnTokenPosition(state, 'own-0', 0.9, 0.9);
    const movedNx = state.ownTokens[0].nx;
    const movedNy = state.ownTokens[0].ny;

    const confirmFn = vi.fn().mockResolvedValue(false);
    initResetHandlerFn(getState, setState, confirmFn);

    document.getElementById('reset-btn').click();
    await new Promise((r) => setTimeout(r, 0));

    // Positions should be unchanged
    expect(state.ownTokens[0].nx).toBe(movedNx);
    expect(state.ownTokens[0].ny).toBe(movedNy);
  });

  it('resets own tokens to formation defaults on confirm', async () => {
    // Move tokens away from defaults
    const { setOwnTokenPosition } = await import('../src/state.js');
    state = setOwnTokenPosition(state, 'own-0', 0.9, 0.9);
    state = setOwnTokenPosition(state, 'own-1', 0.1, 0.1);

    const confirmFn = vi.fn().mockResolvedValue(true);
    initResetHandlerFn(getState, setState, confirmFn);

    document.getElementById('reset-btn').click();
    await new Promise((r) => setTimeout(r, 0));

    // Tokens should be back at formation defaults (4-3-3 for 11v11)
    const { getFormationById } = await import('../src/data.js');
    const formation = getFormationById('11v11-4-3-3');
    expect(state.ownTokens[0].nx).toBe(formation.positions[0].nx);
    expect(state.ownTokens[0].ny).toBe(formation.positions[0].ny);
    expect(state.ownTokens[1].nx).toBe(formation.positions[1].nx);
    expect(state.ownTokens[1].ny).toBe(formation.positions[1].ny);
  });

  it('resets ball to center on formation reset (no moment active)', async () => {
    // Move ball away from center
    const { setBallPosition } = await import('../src/state.js');
    state = setBallPosition(state, 0.2, 0.8);

    const confirmFn = vi.fn().mockResolvedValue(true);
    initResetHandlerFn(getState, setState, confirmFn);

    document.getElementById('reset-btn').click();
    await new Promise((r) => setTimeout(r, 0));

    expect(state.ball.nx).toBe(0.5);
    expect(state.ball.ny).toBe(0.5);
  });

  it('resets opponent tokens to their formation defaults when overlay is visible', async () => {
    // Enable opponent overlay
    const { setOpponentOverlay, setOpponentTokenPosition } = await import('../src/state.js');
    state = setOpponentOverlay(state, true);

    // Move an opponent token
    state = setOpponentTokenPosition(state, 'opp-0', 0.1, 0.1);

    const confirmFn = vi.fn().mockResolvedValue(true);
    initResetHandlerFn(getState, setState, confirmFn);

    document.getElementById('reset-btn').click();
    await new Promise((r) => setTimeout(r, 0));

    // Opponent token should be back at formation default (mirrored ny)
    const { getFormationById } = await import('../src/data.js');
    const oppFormation = getFormationById(state.opponentFormationKey);
    expect(state.opponentTokens[0].nx).toBe(oppFormation.positions[0].nx);
    expect(state.opponentTokens[0].ny).toBe(1 - oppFormation.positions[0].ny);
  });

  it('resets to moment snapshot when a moment is active', async () => {
    const { applyMoment } = await import('../src/state.js');
    const { getPredefinedMoments } = await import('../src/data.js');

    // Apply a moment
    const moments = getPredefinedMoments('11v11');
    const cornerAttacking = moments.find((m) => m.id === 'corner-attacking-11v11');
    state = applyMoment(state, cornerAttacking);

    // Move tokens away from moment positions
    const { setOwnTokenPosition, setBallPosition } = await import('../src/state.js');
    state = setOwnTokenPosition(state, 'own-0', 0.1, 0.1);
    state = setBallPosition(state, 0.3, 0.3);

    const confirmFn = vi.fn().mockResolvedValue(true);
    initResetHandlerFn(getState, setState, confirmFn);

    document.getElementById('reset-btn').click();
    await new Promise((r) => setTimeout(r, 0));

    // Should restore to moment's positions
    expect(state.ownTokens[0].nx).toBe(cornerAttacking.ownPositions[0].nx);
    expect(state.ownTokens[0].ny).toBe(cornerAttacking.ownPositions[0].ny);
    expect(state.ball.nx).toBe(cornerAttacking.ballPosition.nx);
    expect(state.ball.ny).toBe(cornerAttacking.ballPosition.ny);
  });

  it('re-renders tokens and ball after confirmed reset', async () => {
    const confirmFn = vi.fn().mockResolvedValue(true);
    initResetHandlerFn(getState, setState, confirmFn);

    document.getElementById('reset-btn').click();
    await new Promise((r) => setTimeout(r, 0));

    expect(renderTokens).toHaveBeenCalled();
    expect(renderBall).toHaveBeenCalled();
  });

  it('does not re-render when user cancels', async () => {
    const confirmFn = vi.fn().mockResolvedValue(false);
    initResetHandlerFn(getState, setState, confirmFn);

    document.getElementById('reset-btn').click();
    await new Promise((r) => setTimeout(r, 0));

    expect(renderTokens).not.toHaveBeenCalled();
    expect(renderBall).not.toHaveBeenCalled();
  });
});
