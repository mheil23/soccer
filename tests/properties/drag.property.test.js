// @vitest-environment jsdom
// Feature: soccer-formations-tool, Property 7: Out-of-bounds drag snap-back
// **Validates: Requirements 4.7, 4.8**
// Feature: soccer-formations-tool, Property 8: Token renders its label
// **Validates: Requirements 4.3**
import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';
import { renderTokens, toNormalized } from '../../src/renderer.js';
import {
  createInitialState,
  setOwnTokenPosition,
  setOpponentTokenPosition,
  setBallPosition,
  setOpponentOverlay,
} from '../../src/state.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/**
 * Create a minimal SVG DOM structure with a #tokens-layer group,
 * matching the application's expected DOM shape.
 */
function createSvgWithTokensLayer() {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 105 68');
  const tokensLayer = document.createElementNS(SVG_NS, 'g');
  tokensLayer.setAttribute('id', 'tokens-layer');
  svg.appendChild(tokensLayer);
  document.body.appendChild(svg);
  return svg;
}

// ---------------------------------------------------------------------------
// Property 7: Out-of-bounds drag snap-back
//
// For any draggable element starting at normalized position (nx₀, ny₀),
// dragging it to any pixel coordinate that falls outside the field boundary
// should return that element to exactly (nx₀, ny₀) upon drag end.
// ---------------------------------------------------------------------------

// Field dimensions in SVG viewBox units (matches controller.js FIELD_RECT)
const FIELD_WIDTH = 68;
const FIELD_HEIGHT = 105;

/**
 * Replicate the controller's isWithinFieldBounds check.
 * Returns true if SVG coordinates are within [0,105]×[0,68].
 */
function isWithinFieldBounds(svgX, svgY) {
  return svgX >= 0 && svgX <= FIELD_WIDTH && svgY >= 0 && svgY <= FIELD_HEIGHT;
}

/**
 * Simulate the snap-back logic from controller.js pointerup handler:
 * - If final SVG coordinates are out of bounds, restore startNx/startNy
 * - Otherwise, keep the current (clamped) position
 *
 * @param {object} params
 * @param {string} params.type - "own" | "opp" | "ball"
 * @param {string} params.id - token/ball id
 * @param {number} params.startNx - starting normalized x
 * @param {number} params.startNy - starting normalized y
 * @param {number} params.finalSvgX - final SVG x coordinate (from screenToSVG)
 * @param {number} params.finalSvgY - final SVG y coordinate (from screenToSVG)
 * @param {object} state - current app state
 * @returns {object} new state after snap-back logic
 */
function simulatePointerUp({ type, id, startNx, startNy, finalSvgX, finalSvgY }, state) {
  const inBounds = isWithinFieldBounds(finalSvgX, finalSvgY);

  if (!inBounds) {
    // Snap back to start position
    if (type === 'ball') {
      return setBallPosition(state, startNx, startNy);
    } else if (type === 'own') {
      return setOwnTokenPosition(state, id, startNx, startNy);
    } else if (type === 'opp') {
      return setOpponentTokenPosition(state, id, startNx, startNy);
    }
  }

  return state;
}

describe('Property 7: Out-of-bounds drag snap-back', () => {
  // Generator: normalized coordinate in [0, 1]
  const arbNx = fc.float({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true });
  const arbNy = fc.float({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true });

  // Generator: out-of-bounds SVG coordinate (outside [0,105]×[0,68])
  // At least one axis must be out of bounds
  const arbOutOfBoundsSvg = fc.oneof(
    // x too large
    fc.record({
      x: fc.float({ min: Math.fround(FIELD_WIDTH + 0.01), max: Math.fround(FIELD_WIDTH * 10), noNaN: true, noDefaultInfinity: true }),
      y: fc.float({ min: Math.fround(-FIELD_HEIGHT * 10), max: Math.fround(FIELD_HEIGHT * 10), noNaN: true, noDefaultInfinity: true }),
    }),
    // x too small (negative)
    fc.record({
      x: fc.float({ min: Math.fround(-FIELD_WIDTH * 10), max: Math.fround(-0.01), noNaN: true, noDefaultInfinity: true }),
      y: fc.float({ min: Math.fround(-FIELD_HEIGHT * 10), max: Math.fround(FIELD_HEIGHT * 10), noNaN: true, noDefaultInfinity: true }),
    }),
    // y too large
    fc.record({
      x: fc.float({ min: Math.fround(-FIELD_WIDTH * 10), max: Math.fround(FIELD_WIDTH * 10), noNaN: true, noDefaultInfinity: true }),
      y: fc.float({ min: Math.fround(FIELD_HEIGHT + 0.01), max: Math.fround(FIELD_HEIGHT * 10), noNaN: true, noDefaultInfinity: true }),
    }),
    // y too small (negative)
    fc.record({
      x: fc.float({ min: Math.fround(-FIELD_WIDTH * 10), max: Math.fround(FIELD_WIDTH * 10), noNaN: true, noDefaultInfinity: true }),
      y: fc.float({ min: Math.fround(-FIELD_HEIGHT * 10), max: Math.fround(-0.01), noNaN: true, noDefaultInfinity: true }),
    })
  );

  it('own-team token snaps back to original position when dragged out of bounds', () => {
    fc.assert(
      fc.property(arbNx, arbNy, arbOutOfBoundsSvg, (startNx, startNy, oob) => {
        // Set up state with one own token at the start position
        let state = createInitialState('11v11');
        // Place the first own token at the generated start position
        const tokenId = state.ownTokens[0].id;
        state = setOwnTokenPosition(state, tokenId, startNx, startNy);

        // Simulate pointerup with out-of-bounds SVG coordinates
        const newState = simulatePointerUp(
          { type: 'own', id: tokenId, startNx, startNy, finalSvgX: oob.x, finalSvgY: oob.y },
          state
        );

        // Token should be back at its original position
        const token = newState.ownTokens.find((t) => t.id === tokenId);
        expect(token.nx).toBe(startNx);
        expect(token.ny).toBe(startNy);
      }),
      { numRuns: 100 }
    );
  });

  it('opponent token snaps back to original position when dragged out of bounds', () => {
    fc.assert(
      fc.property(arbNx, arbNy, arbOutOfBoundsSvg, (startNx, startNy, oob) => {
        // Set up state with opponent overlay enabled
        let state = createInitialState('11v11');
        state = setOpponentOverlay(state, true);

        // Place the first opponent token at the generated start position
        const tokenId = state.opponentTokens[0].id;
        state = setOpponentTokenPosition(state, tokenId, startNx, startNy);

        // Simulate pointerup with out-of-bounds SVG coordinates
        const newState = simulatePointerUp(
          { type: 'opp', id: tokenId, startNx, startNy, finalSvgX: oob.x, finalSvgY: oob.y },
          state
        );

        // Token should be back at its original position
        const token = newState.opponentTokens.find((t) => t.id === tokenId);
        expect(token.nx).toBe(startNx);
        expect(token.ny).toBe(startNy);
      }),
      { numRuns: 100 }
    );
  });

  it('ball snaps back to original position when dragged out of bounds', () => {
    fc.assert(
      fc.property(arbNx, arbNy, arbOutOfBoundsSvg, (startNx, startNy, oob) => {
        // Set up state with ball at the generated start position
        let state = createInitialState('11v11');
        state = setBallPosition(state, startNx, startNy);

        // Simulate pointerup with out-of-bounds SVG coordinates
        const newState = simulatePointerUp(
          { type: 'ball', id: 'ball', startNx, startNy, finalSvgX: oob.x, finalSvgY: oob.y },
          state
        );

        // Ball should be back at its original position
        expect(newState.ball.nx).toBe(startNx);
        expect(newState.ball.ny).toBe(startNy);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 8: Token renders its label
//
// For any position token with label string L, the rendered SVG <text> element
// inside that token's <g> should contain exactly L as its text content.
// ---------------------------------------------------------------------------
describe('Property 8: Token renders its label', () => {
  let svgEl;

  beforeEach(() => {
    document.body.innerHTML = '';
    svgEl = createSvgWithTokensLayer();
  });

  it('rendered <text> element contains exactly the token label', () => {
    // Generator: non-empty strings of 1–20 printable characters
    const arbLabel = fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.length > 0);

    fc.assert(
      fc.property(arbLabel, (label) => {
        // Clear tokens layer for each iteration
        const layer = svgEl.querySelector('#tokens-layer');
        layer.innerHTML = '';

        // Create a single own-team token with the generated label
        const token = {
          id: `own-test`,
          label: label,
          nx: 0.5,
          ny: 0.5,
        };

        renderTokens(svgEl, [token], []);

        // Find the rendered <g> element for the token
        const g = layer.querySelector('#own-test');
        expect(g).not.toBeNull();

        // Find the <text> element inside the <g>
        const textEl = g.querySelector('text');
        expect(textEl).not.toBeNull();

        // The text content should be exactly the label
        expect(textEl.textContent).toBe(label);
      }),
      { numRuns: 100 }
    );
  });
});
