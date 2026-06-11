import { describe, it, expect, beforeEach } from 'vitest';
import { toPixel, toNormalized, renderField, renderTokens, renderBall } from '../src/renderer.js';

// ─── Task 6.2: Coordinate Conversion Utilities ─────────────────────────────

describe('toPixel', () => {
  it('converts (0, 0) to origin', () => {
    const result = toPixel(0, 0, { width: 800, height: 600 });
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it('converts (1, 1) to full dimensions', () => {
    const result = toPixel(1, 1, { width: 800, height: 600 });
    expect(result).toEqual({ x: 800, y: 600 });
  });

  it('converts (0.5, 0.5) to center', () => {
    const result = toPixel(0.5, 0.5, { width: 1000, height: 500 });
    expect(result).toEqual({ x: 500, y: 250 });
  });

  it('handles non-standard field dimensions', () => {
    const result = toPixel(0.25, 0.75, { width: 400, height: 200 });
    expect(result).toEqual({ x: 100, y: 150 });
  });
});

describe('toNormalized', () => {
  it('converts pixel center to (0.5, 0.5)', () => {
    const result = toNormalized(400, 300, { width: 800, height: 600 });
    expect(result).toEqual({ nx: 0.5, ny: 0.5 });
  });

  it('converts origin to (0, 0)', () => {
    const result = toNormalized(0, 0, { width: 800, height: 600 });
    expect(result).toEqual({ nx: 0, ny: 0 });
  });

  it('converts full dimensions to (1, 1)', () => {
    const result = toNormalized(800, 600, { width: 800, height: 600 });
    expect(result).toEqual({ nx: 1, ny: 1 });
  });

  it('clamps negative x to 0', () => {
    const result = toNormalized(-50, 300, { width: 800, height: 600 });
    expect(result.nx).toBe(0);
    expect(result.ny).toBe(0.5);
  });

  it('clamps negative y to 0', () => {
    const result = toNormalized(400, -100, { width: 800, height: 600 });
    expect(result.nx).toBe(0.5);
    expect(result.ny).toBe(0);
  });

  it('clamps x beyond width to 1', () => {
    const result = toNormalized(1200, 300, { width: 800, height: 600 });
    expect(result.nx).toBe(1);
    expect(result.ny).toBe(0.5);
  });

  it('clamps y beyond height to 1', () => {
    const result = toNormalized(400, 900, { width: 800, height: 600 });
    expect(result.nx).toBe(0.5);
    expect(result.ny).toBe(1);
  });

  it('clamps both axes when both are out of bounds', () => {
    const result = toNormalized(-10, 1000, { width: 800, height: 600 });
    expect(result).toEqual({ nx: 0, ny: 1 });
  });
});

// ─── Task 6.1: renderField — Static Pitch Markings ─────────────────────────

describe('renderField', () => {
  let svgEl;

  beforeEach(() => {
    // Create a minimal DOM structure mimicking index.html
    document.body.innerHTML = `
      <svg id="field-svg" viewBox="0 0 68 105" xmlns="http://www.w3.org/2000/svg">
        <g id="field-markings"></g>
      </svg>
    `;
    svgEl = document.querySelector('#field-svg');
  });

  it('renders markings into #field-markings group', () => {
    renderField(svgEl);
    const group = svgEl.querySelector('#field-markings');
    expect(group.children.length).toBeGreaterThan(0);
  });

  it('renders a green background rect', () => {
    renderField(svgEl);
    const group = svgEl.querySelector('#field-markings');
    const bg = group.querySelector('rect[fill="#4CAF50"]');
    expect(bg).not.toBeNull();
    expect(bg.getAttribute('width')).toBe('68');
    expect(bg.getAttribute('height')).toBe('105');
  });

  it('renders outer pitch boundary', () => {
    renderField(svgEl);
    const group = svgEl.querySelector('#field-markings');
    // Boundary is a rect with no fill and white stroke
    const rects = group.querySelectorAll('rect[fill="none"][stroke="#fff"]');
    // Should have multiple (boundary, penalty areas, goal areas, goals)
    expect(rects.length).toBeGreaterThanOrEqual(1);
    // First no-fill rect should be the boundary (105x68)
    const boundary = Array.from(rects).find(
      r => r.getAttribute('width') === '68' && r.getAttribute('height') === '105'
    );
    expect(boundary).not.toBeNull();
  });

  it('renders halfway line at y=52.5', () => {
    renderField(svgEl);
    const group = svgEl.querySelector('#field-markings');
    const line = group.querySelector('line');
    expect(line).not.toBeNull();
    expect(line.getAttribute('x1')).toBe('0');
    expect(line.getAttribute('x2')).toBe('68');
    expect(line.getAttribute('y1')).toBe('52.5');
    expect(line.getAttribute('y2')).toBe('52.5');
  });

  it('renders center circle at (34, 52.5) with r=9.15', () => {
    renderField(svgEl);
    const group = svgEl.querySelector('#field-markings');
    const circles = group.querySelectorAll('circle');
    const centerCircle = Array.from(circles).find(
      c => c.getAttribute('r') === '9.15'
    );
    expect(centerCircle).not.toBeNull();
    expect(centerCircle.getAttribute('cx')).toBe('34');
    expect(centerCircle.getAttribute('cy')).toBe('52.5');
  });

  it('renders center spot at (34, 52.5) with r=0.3', () => {
    renderField(svgEl);
    const group = svgEl.querySelector('#field-markings');
    const circles = group.querySelectorAll('circle');
    const spot = Array.from(circles).find(
      c => c.getAttribute('r') === '0.3' && c.getAttribute('fill') === '#fff'
    );
    expect(spot).not.toBeNull();
    expect(spot.getAttribute('cx')).toBe('34');
    expect(spot.getAttribute('cy')).toBe('52.5');
  });

  it('renders left penalty area (16.5m deep, 40.32m wide)', () => {
    renderField(svgEl);
    const group = svgEl.querySelector('#field-markings');
    const rects = group.querySelectorAll('rect[fill="none"]');
    const leftPenalty = Array.from(rects).find(
      r => r.getAttribute('x') === '0' &&
           r.getAttribute('y') === '13.84' &&
           r.getAttribute('width') === '16.5' &&
           r.getAttribute('height') === '40.32'
    );
    expect(leftPenalty).not.toBeNull();
  });

  it('renders right penalty area', () => {
    renderField(svgEl);
    const group = svgEl.querySelector('#field-markings');
    const rects = group.querySelectorAll('rect[fill="none"]');
    const rightPenalty = Array.from(rects).find(
      r => r.getAttribute('x') === '88.5' &&
           r.getAttribute('width') === '16.5' &&
           r.getAttribute('height') === '40.32'
    );
    expect(rightPenalty).not.toBeNull();
  });

  it('renders left goal area (5.5m deep, 18.32m wide)', () => {
    renderField(svgEl);
    const group = svgEl.querySelector('#field-markings');
    const rects = group.querySelectorAll('rect[fill="none"]');
    const leftGoalArea = Array.from(rects).find(
      r => r.getAttribute('x') === '0' &&
           r.getAttribute('y') === '24.84' &&
           r.getAttribute('width') === '5.5' &&
           r.getAttribute('height') === '18.32'
    );
    expect(leftGoalArea).not.toBeNull();
  });

  it('renders right goal area', () => {
    renderField(svgEl);
    const group = svgEl.querySelector('#field-markings');
    const rects = group.querySelectorAll('rect[fill="none"]');
    const rightGoalArea = Array.from(rects).find(
      r => r.getAttribute('x') === '99.5' &&
           r.getAttribute('width') === '5.5' &&
           r.getAttribute('height') === '18.32'
    );
    expect(rightGoalArea).not.toBeNull();
  });

  it('renders left goal behind end line', () => {
    renderField(svgEl);
    const group = svgEl.querySelector('#field-markings');
    const rects = group.querySelectorAll('rect[fill="none"]');
    const leftGoal = Array.from(rects).find(
      r => r.getAttribute('x') === '-2' &&
           r.getAttribute('y') === '30.34' &&
           r.getAttribute('width') === '2' &&
           r.getAttribute('height') === '7.32'
    );
    expect(leftGoal).not.toBeNull();
  });

  it('renders right goal', () => {
    renderField(svgEl);
    const group = svgEl.querySelector('#field-markings');
    const rects = group.querySelectorAll('rect[fill="none"]');
    const rightGoal = Array.from(rects).find(
      r => r.getAttribute('y') === '105' &&
           r.getAttribute('width') === '2' &&
           r.getAttribute('height') === '7.32'
    );
    expect(rightGoal).not.toBeNull();
  });

  it('does nothing if #field-markings group is not found', () => {
    document.body.innerHTML = `<svg id="field-svg" viewBox="0 0 68 105"></svg>`;
    const emptySvg = document.querySelector('#field-svg');
    expect(() => renderField(emptySvg)).not.toThrow();
  });

  it('clears existing markings on re-render', () => {
    renderField(svgEl);
    const group = svgEl.querySelector('#field-markings');
    const firstCount = group.children.length;
    renderField(svgEl);
    expect(group.children.length).toBe(firstCount);
  });
});


// ─── Task 7.1: renderTokens ─────────────────────────────────────────────────

describe('renderTokens', () => {
  let svgEl;

  beforeEach(() => {
    document.body.innerHTML = `
      <svg id="field-svg" viewBox="0 0 68 105" xmlns="http://www.w3.org/2000/svg">
        <g id="field-markings"></g>
        <g id="tokens-layer"></g>
        <g id="ball-layer"></g>
      </svg>
    `;
    svgEl = document.querySelector('#field-svg');
  });

  it('renders own tokens as blue circles in #tokens-layer', () => {
    const ownTokens = [
      { id: 'own-0', label: 'GK', nx: 0.05, ny: 0.5 },
    ];
    renderTokens(svgEl, ownTokens, []);

    const layer = svgEl.querySelector('#tokens-layer');
    const g = layer.querySelector('#own-0');
    expect(g).not.toBeNull();
    const circle = g.querySelector('circle');
    expect(circle.getAttribute('fill')).toBe('#1E6FE8');
  });

  it('renders opponent tokens as red circles', () => {
    const oppTokens = [
      { id: 'opp-0', label: 'ST', nx: 0.9, ny: 0.5 },
    ];
    renderTokens(svgEl, [], oppTokens);

    const layer = svgEl.querySelector('#tokens-layer');
    const g = layer.querySelector('#opp-0');
    expect(g).not.toBeNull();
    const circle = g.querySelector('circle');
    expect(circle.getAttribute('fill')).toBe('#E81E1E');
  });

  it('positions token using transform="translate(px, py)"', () => {
    const ownTokens = [
      { id: 'own-0', label: 'GK', nx: 0.5, ny: 0.5 },
    ];
    renderTokens(svgEl, ownTokens, []);

    const g = svgEl.querySelector('#own-0');
    // nx*68 = 34, ny*105 = 52.5
    expect(g.getAttribute('transform')).toBe('translate(34, 52.5)');
  });

  it('renders text label inside the token group', () => {
    const ownTokens = [
      { id: 'own-0', label: 'CB', nx: 0.2, ny: 0.4 },
    ];
    renderTokens(svgEl, ownTokens, []);

    const g = svgEl.querySelector('#own-0');
    const text = g.querySelector('text');
    expect(text).not.toBeNull();
    expect(text.textContent).toBe('CB');
    expect(text.getAttribute('text-anchor')).toBe('middle');
    expect(text.getAttribute('dominant-baseline')).toBe('central');
  });

  it('updates existing token position and label on re-render', () => {
    renderTokens(svgEl, [{ id: 'own-0', label: 'GK', nx: 0.1, ny: 0.5 }], []);
    renderTokens(svgEl, [{ id: 'own-0', label: 'SW', nx: 0.3, ny: 0.6 }], []);

    const layer = svgEl.querySelector('#tokens-layer');
    // Should still be only 1 token group
    expect(layer.children.length).toBe(1);
    const g = layer.querySelector('#own-0');
    expect(g.getAttribute('transform')).toBe('translate(20.4, 63)');
    expect(g.querySelector('text').textContent).toBe('SW');
  });

  it('removes stale tokens that are no longer in the list', () => {
    renderTokens(svgEl, [
      { id: 'own-0', label: 'GK', nx: 0.1, ny: 0.5 },
      { id: 'own-1', label: 'CB', nx: 0.2, ny: 0.5 },
    ], []);

    // Second render without own-1
    renderTokens(svgEl, [{ id: 'own-0', label: 'GK', nx: 0.1, ny: 0.5 }], []);

    const layer = svgEl.querySelector('#tokens-layer');
    expect(layer.children.length).toBe(1);
    expect(layer.querySelector('#own-1')).toBeNull();
  });

  it('renders both own and opponent tokens together', () => {
    const ownTokens = [{ id: 'own-0', label: 'GK', nx: 0.05, ny: 0.5 }];
    const oppTokens = [{ id: 'opp-0', label: 'ST', nx: 0.95, ny: 0.5 }];
    renderTokens(svgEl, ownTokens, oppTokens);

    const layer = svgEl.querySelector('#tokens-layer');
    expect(layer.children.length).toBe(2);
    expect(layer.querySelector('#own-0')).not.toBeNull();
    expect(layer.querySelector('#opp-0')).not.toBeNull();
  });

  it('does nothing if #tokens-layer is not found', () => {
    document.body.innerHTML = `<svg id="field-svg" viewBox="0 0 68 105"></svg>`;
    const emptySvg = document.querySelector('#field-svg');
    expect(() => renderTokens(emptySvg, [{ id: 'own-0', label: 'GK', nx: 0.5, ny: 0.5 }], [])).not.toThrow();
  });
});

// ─── Task 7.3: renderBall ───────────────────────────────────────────────────

describe('renderBall', () => {
  let svgEl;

  beforeEach(() => {
    document.body.innerHTML = `
      <svg id="field-svg" viewBox="0 0 68 105" xmlns="http://www.w3.org/2000/svg">
        <g id="field-markings"></g>
        <g id="tokens-layer"></g>
        <g id="ball-layer"></g>
      </svg>
    `;
    svgEl = document.querySelector('#field-svg');
  });

  it('renders the ball as a <g> group with emoji text', () => {
    renderBall(svgEl, { nx: 0.5, ny: 0.5 });

    const layer = svgEl.querySelector('#ball-layer');
    const ball = layer.querySelector('#ball');
    expect(ball).not.toBeNull();
    expect(ball.tagName.toLowerCase()).toBe('g');
    const text = ball.querySelector('text');
    expect(text).not.toBeNull();
    expect(text.textContent).toBe('\u26BD');
  });

  it('ball group has id="ball"', () => {
    renderBall(svgEl, { nx: 0.5, ny: 0.5 });

    const layer = svgEl.querySelector('#ball-layer');
    const ball = layer.querySelector('#ball');
    expect(ball).not.toBeNull();
  });

  it('ball is visually distinct from position tokens (uses emoji, not circle)', () => {
    renderBall(svgEl, { nx: 0.5, ny: 0.5 });

    const ball = svgEl.querySelector('#ball');
    // No direct circle child used as fill (emoji text is the visual)
    const text = ball.querySelector('text');
    expect(text.textContent).toBe('\u26BD');
  });

  it('updates ball position on re-render without creating a new element', () => {
    renderBall(svgEl, { nx: 0.5, ny: 0.5 });
    const firstTransform = svgEl.querySelector('#ball').getAttribute('transform');

    renderBall(svgEl, { nx: 0.7, ny: 0.3 });
    const layer = svgEl.querySelector('#ball-layer');
    expect(layer.children.length).toBe(1);
    const secondTransform = svgEl.querySelector('#ball').getAttribute('transform');
    expect(secondTransform).not.toBe(firstTransform);
  });

  it('ball is positioned at (nx*68, ny*105) via transform', () => {
    renderBall(svgEl, { nx: 0.5, ny: 0.5 });

    const ball = svgEl.querySelector('#ball');
    const transform = ball.getAttribute('transform');
    expect(transform).toBe('translate(34, 52.5)');
  });

  it('does nothing if #ball-layer is not found', () => {
    document.body.innerHTML = `<svg id="field-svg" viewBox="0 0 68 105"></svg>`;
    const emptySvg = document.querySelector('#field-svg');
    expect(() => renderBall(emptySvg, { nx: 0.5, ny: 0.5 })).not.toThrow();
  });
});
