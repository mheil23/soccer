/**
 * renderer.js — SVG field renderer (MVC: View)
 * Reads state and updates the SVG DOM.
 * Never mutates state directly.
 * Performs minimal DOM patching to keep the render path fast.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

// ─── Coordinate Conversion Utilities ────────────────────────────────────────

/**
 * Convert normalized [0,1] coordinates to pixel coordinates
 * relative to the given field rectangle.
 * @param {number} nx - Normalized x [0,1]
 * @param {number} ny - Normalized y [0,1]
 * @param {{ width: number, height: number }} fieldRect
 * @returns {{ x: number, y: number }}
 */
export function toPixel(nx, ny, fieldRect) {
  return {
    x: nx * fieldRect.width,
    y: ny * fieldRect.height,
  };
}

/**
 * Convert pixel coordinates to normalized [0,1] coordinates,
 * clamped to the valid range. This is the single choke-point
 * for out-of-bounds enforcement.
 * @param {number} px - Pixel x
 * @param {number} py - Pixel y
 * @param {{ width: number, height: number }} fieldRect
 * @returns {{ nx: number, ny: number }}
 */
export function toNormalized(px, py, fieldRect) {
  return {
    nx: Math.max(0, Math.min(1, px / fieldRect.width)),
    ny: Math.max(0, Math.min(1, py / fieldRect.height)),
  };
}

// ─── Field Rendering ────────────────────────────────────────────────────────

/**
 * Render static pitch markings into the SVG field.
 * Uses viewBox="0 0 68 105" coordinate space (portrait orientation, meters).
 * Opponent's goal at top (y=0), own goal at bottom (y=105).
 * Targets the #field-markings group inside the SVG element.
 * @param {SVGSVGElement} svgEl - The root SVG element
 * @param {string} [format] - Game format ('7v7', '9v9', '11v11') for format-specific markings
 */
export function renderField(svgEl, format) {
  const group = svgEl.querySelector('#field-markings');
  if (!group) return;

  // Clear any existing markings
  group.innerHTML = '';

  // Background (grass green base)
  const bg = createSvgElement('rect', {
    x: '0', y: '0', width: '68', height: '105',
    fill: '#4CAF50',
  });
  group.appendChild(bg);

  // Grass stripes (alternating light/dark bands, horizontal)
  const stripeCount = 10;
  const stripeHeight = 105 / stripeCount;
  for (let i = 0; i < stripeCount; i++) {
    if (i % 2 === 0) continue; // skip even stripes (they're the base color)
    const stripe = createSvgElement('rect', {
      x: '0',
      y: String(i * stripeHeight),
      width: '68',
      height: String(stripeHeight),
      fill: '#45a049',
      opacity: '0.3',
    });
    group.appendChild(stripe);
  }

  // Directional indicator — "ATTACK ▲" at top edge
  const attackLabel = createSvgElement('text', {
    x: '34',
    y: '2.5',
    'text-anchor': 'middle',
    'font-size': '2',
    'font-family': 'system-ui, sans-serif',
    fill: '#ffffff',
    opacity: '0.35',
    'pointer-events': 'none',
  });
  attackLabel.textContent = '▲ ATTACK';
  group.appendChild(attackLabel);

  // Outer pitch boundary
  const boundary = createSvgElement('rect', {
    x: '0', y: '0', width: '68', height: '105',
    fill: 'none', stroke: '#fff', 'stroke-width': '0.3',
  });
  group.appendChild(boundary);

  // Halfway line (horizontal, at y=52.5)
  const halfwayLine = createSvgElement('line', {
    x1: '0', y1: '52.5', x2: '68', y2: '52.5',
    stroke: '#fff', 'stroke-width': '0.3',
  });
  group.appendChild(halfwayLine);

  // Center circle (radius 9.15m)
  const centerCircle = createSvgElement('circle', {
    cx: '34', cy: '52.5', r: '9.15',
    fill: 'none', stroke: '#fff', 'stroke-width': '0.3',
  });
  group.appendChild(centerCircle);

  // Center spot
  const centerSpot = createSvgElement('circle', {
    cx: '34', cy: '52.5', r: '0.3',
    fill: '#fff',
  });
  group.appendChild(centerSpot);

  // Top penalty area (opponent's end, 16.5m deep, 40.32m wide centered)
  const topPenaltyArea = createSvgElement('rect', {
    x: '13.84', y: '0', width: '40.32', height: '16.5',
    fill: 'none', stroke: '#fff', 'stroke-width': '0.3',
  });
  group.appendChild(topPenaltyArea);

  // Bottom penalty area (own end)
  const bottomPenaltyArea = createSvgElement('rect', {
    x: '13.84', y: '88.5', width: '40.32', height: '16.5',
    fill: 'none', stroke: '#fff', 'stroke-width': '0.3',
  });
  group.appendChild(bottomPenaltyArea);

  // Top goal area (5.5m deep, 18.32m wide centered)
  const topGoalArea = createSvgElement('rect', {
    x: '24.84', y: '0', width: '18.32', height: '5.5',
    fill: 'none', stroke: '#fff', 'stroke-width': '0.3',
  });
  group.appendChild(topGoalArea);

  // Bottom goal area
  const bottomGoalArea = createSvgElement('rect', {
    x: '24.84', y: '99.5', width: '18.32', height: '5.5',
    fill: 'none', stroke: '#fff', 'stroke-width': '0.3',
  });
  group.appendChild(bottomGoalArea);

  // Top goal (opponent's — 7.32m wide centered, 2m deep behind end line)
  const topGoal = createSvgElement('rect', {
    x: '30.34', y: '-2', width: '7.32', height: '2',
    fill: 'none', stroke: '#fff', 'stroke-width': '0.3',
  });
  group.appendChild(topGoal);

  // Bottom goal (own)
  const bottomGoal = createSvgElement('rect', {
    x: '30.34', y: '105', width: '7.32', height: '2',
    fill: 'none', stroke: '#fff', 'stroke-width': '0.3',
  });
  group.appendChild(bottomGoal);

  // Penalty spots (11m from goal line = y=11 for top, y=94 for bottom)
  const topPenaltySpot = createSvgElement('circle', {
    cx: '34', cy: '11', r: '0.3',
    fill: '#fff',
  });
  group.appendChild(topPenaltySpot);

  const bottomPenaltySpot = createSvgElement('circle', {
    cx: '34', cy: '94', r: '0.3',
    fill: '#fff',
  });
  group.appendChild(bottomPenaltySpot);

  // Penalty arcs (the "D" — arc of radius 9.15m from penalty spot, outside the penalty area)
  // Top: arc centered at (34, 11), radius 9.15, only the portion below y=16.5
  const topArcPath = createSvgElement('path', {
    d: `M ${34 - 9.15 * Math.sin(Math.acos(5.5 / 9.15))},16.5 A 9.15,9.15 0 0,0 ${34 + 9.15 * Math.sin(Math.acos(5.5 / 9.15))},16.5`,
    fill: 'none', stroke: '#fff', 'stroke-width': '0.3',
  });
  group.appendChild(topArcPath);

  // Bottom: arc centered at (34, 94), radius 9.15, only the portion above y=88.5
  const bottomArcPath = createSvgElement('path', {
    d: `M ${34 - 9.15 * Math.sin(Math.acos(5.5 / 9.15))},88.5 A 9.15,9.15 0 0,1 ${34 + 9.15 * Math.sin(Math.acos(5.5 / 9.15))},88.5`,
    fill: 'none', stroke: '#fff', 'stroke-width': '0.3',
  });
  group.appendChild(bottomArcPath);

  // Corner arcs (quarter circles, radius 1.5m at each corner, curving inward)
  const cornerRadius = 1.5;
  // Top-left corner: arc from (cornerRadius, 0) to (0, cornerRadius) curving inward
  group.appendChild(createSvgElement('path', {
    d: `M ${cornerRadius},0 A ${cornerRadius},${cornerRadius} 0 0,1 0,${cornerRadius}`,
    fill: 'none', stroke: '#fff', 'stroke-width': '0.3',
  }));
  // Top-right corner: arc from (68-cornerRadius, 0) to (68, cornerRadius) curving inward
  group.appendChild(createSvgElement('path', {
    d: `M ${68 - cornerRadius},0 A ${cornerRadius},${cornerRadius} 0 0,0 68,${cornerRadius}`,
    fill: 'none', stroke: '#fff', 'stroke-width': '0.3',
  }));
  // Bottom-left corner: arc from (cornerRadius, 105) to (0, 105-cornerRadius) curving inward
  group.appendChild(createSvgElement('path', {
    d: `M ${cornerRadius},105 A ${cornerRadius},${cornerRadius} 0 0,0 0,${105 - cornerRadius}`,
    fill: 'none', stroke: '#fff', 'stroke-width': '0.3',
  }));
  // Bottom-right corner: arc from (68-cornerRadius, 105) to (68, 105-cornerRadius) curving inward
  group.appendChild(createSvgElement('path', {
    d: `M ${68 - cornerRadius},105 A ${cornerRadius},${cornerRadius} 0 0,1 68,${105 - cornerRadius}`,
    fill: 'none', stroke: '#fff', 'stroke-width': '0.3',
  }));

  // Build-out line for 7v7 (dashed line between penalty area and halfway line)
  // Positioned at y = (16.5 + 52.5) / 2 = 34.5 for top half, y = (88.5 + 52.5) / 2 = 70.5 for bottom half
  if (format === '7v7') {
    const topBuildOut = createSvgElement('line', {
      x1: '0', y1: '34.5', x2: '68', y2: '34.5',
      stroke: '#fff', 'stroke-width': '0.3',
      'stroke-dasharray': '2,1.5',
    });
    group.appendChild(topBuildOut);

    const bottomBuildOut = createSvgElement('line', {
      x1: '0', y1: '70.5', x2: '68', y2: '70.5',
      stroke: '#fff', 'stroke-width': '0.3',
      'stroke-dasharray': '2,1.5',
    });
    group.appendChild(bottomBuildOut);
  }
}

// ─── SVG Helpers ────────────────────────────────────────────────────────────

/**
 * Create an SVG element with the given tag and attributes.
 * @param {string} tag
 * @param {Record<string, string>} attrs
 * @returns {SVGElement}
 */
function createSvgElement(tag, attrs = {}) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, value);
  }
  return el;
}

// ─── Token Rendering ────────────────────────────────────────────────────────

// ViewBox dimensions (meters) — portrait orientation
const FIELD_WIDTH = 68;
const FIELD_HEIGHT = 105;
const TOKEN_RADIUS = 3;

const OWN_FILL = '#1E6FE8';
const OPP_FILL = '#E81E1E';

/**
 * Get the size scale factor for the given format.
 * 11v11 = 1.0 (base), 9v9 = 1.1, 7v7 = 1.2
 * @param {string} [format]
 * @returns {number}
 */
function getSizeScale(format) {
  if (format === '7v7') return 1.2;
  if (format === '9v9') return 1.1;
  return 1.0;
}

/**
 * Render position tokens into the SVG field using minimal DOM patching.
 * Creates/updates/removes <g> elements each containing a <circle> and <text>.
 * @param {SVGSVGElement} svgEl - The root SVG element
 * @param {Array<{id: string, label: string, nx: number, ny: number}>} ownTokens
 * @param {Array<{id: string, label: string, nx: number, ny: number}>} opponentTokens
 */
export function renderTokens(svgEl, ownTokens = [], opponentTokens = [], format) {
  const layer = svgEl.querySelector('#tokens-layer');
  if (!layer) return;

  const scale = getSizeScale(format);
  const radius = TOKEN_RADIUS * scale;
  const fontSize = 2.2 * scale;

  // Build a map of desired tokens with their fill color
  const desired = new Map();
  for (const token of ownTokens) {
    desired.set(token.id, { ...token, fill: OWN_FILL });
  }
  for (const token of opponentTokens) {
    desired.set(token.id, { ...token, fill: OPP_FILL });
  }

  // Track existing token group elements by id
  const existing = new Map();
  for (const child of Array.from(layer.children)) {
    const id = child.getAttribute('id');
    if (id) {
      existing.set(id, child);
    }
  }

  // Remove stale tokens (present in DOM but not in desired)
  for (const [id, el] of existing) {
    if (!desired.has(id)) {
      layer.removeChild(el);
    }
  }

  // Create or update tokens
  for (const [id, token] of desired) {
    const px = token.nx * FIELD_WIDTH;
    const py = token.ny * FIELD_HEIGHT;
    const transformValue = `translate(${px}, ${py})`;

    if (existing.has(id)) {
      // Update existing node
      const g = existing.get(id);
      g.setAttribute('transform', transformValue);

      // Update circle fill and radius
      const circle = g.querySelector('circle');
      if (circle) {
        circle.setAttribute('fill', token.fill);
        circle.setAttribute('r', String(radius));
      }

      // Update text content and size
      const text = g.querySelector('text');
      if (text) {
        text.textContent = token.label;
        text.setAttribute('font-size', String(fontSize));
      }
    } else {
      // Create new token group
      const g = createSvgElement('g', {
        id: id,
        transform: transformValue,
      });

      const circle = createSvgElement('circle', {
        r: String(radius),
        fill: token.fill,
        stroke: '#fff',
        'stroke-width': '0.3',
      });

      const text = createSvgElement('text', {
        'text-anchor': 'middle',
        'dominant-baseline': 'central',
        fill: '#fff',
        'font-size': String(fontSize),
        'font-family': 'system-ui, sans-serif',
        'pointer-events': 'none',
      });
      text.textContent = token.label;

      g.appendChild(circle);
      g.appendChild(text);
      layer.appendChild(g);
    }
  }
}

// ─── Ball Rendering ─────────────────────────────────────────────────────────

const BALL_RADIUS = 1.8;

/**
 * Render the ball as the ⚽ emoji in SVG, matching the header icon.
 * Uses a <text> element with the emoji character, sized to match BALL_RADIUS.
 * The group uses a `transform` to position, making updates a single attribute write.
 * @param {SVGSVGElement} svgEl - The root SVG element
 * @param {{ nx: number, ny: number }} ball - Ball normalized position
 */
export function renderBall(svgEl, ball, format) {
  const layer = svgEl.querySelector('#ball-layer');
  if (!layer) return;

  const scale = getSizeScale(format);
  const ballSize = BALL_RADIUS * scale;

  const cx = ball.nx * FIELD_WIDTH;
  const cy = ball.ny * FIELD_HEIGHT;

  let ballGroup = layer.querySelector('#ball');
  if (ballGroup) {
    // Update position and size
    ballGroup.setAttribute('transform', `translate(${cx}, ${cy})`);
    const emojiEl = ballGroup.querySelector('text');
    if (emojiEl) emojiEl.setAttribute('font-size', String(ballSize * 2.4));
  } else {
    // Create soccer ball group using emoji
    ballGroup = createSvgElement('g', {
      id: 'ball',
      transform: `translate(${cx}, ${cy})`,
    });

    const emojiText = createSvgElement('text', {
      x: '0',
      y: '0',
      'text-anchor': 'middle',
      'dominant-baseline': 'central',
      'font-size': String(ballSize * 2.4),
      'pointer-events': 'auto',
      style: 'user-select: none;',
    });
    emojiText.textContent = '\u26BD';

    ballGroup.appendChild(emojiText);
    layer.appendChild(ballGroup);
  }
}

// ─── Arrow Rendering ────────────────────────────────────────────────────────

/**
 * Render movement arrows into the SVG field.
 * Each arrow is a quadratic bezier curve with a slight arc and an arrowhead marker.
 * Renders into the #arrows-layer group.
 *
 * @param {SVGSVGElement} svgEl - The root SVG element
 * @param {Array<{id: string, startNx: number, startNy: number, endNx: number, endNy: number}>} arrows
 */
export function renderArrows(svgEl, arrows = []) {
  const layer = svgEl.querySelector('#arrows-layer');
  if (!layer) return;

  // Ensure the arrowhead marker definition exists
  ensureArrowDefs(svgEl);

  // Clear and rebuild (arrows are infrequent, full rebuild is acceptable)
  layer.innerHTML = '';

  for (const arrow of arrows) {
    const startX = arrow.startNx * FIELD_WIDTH;
    const startY = arrow.startNy * FIELD_HEIGHT;
    const endX = arrow.endNx * FIELD_WIDTH;
    const endY = arrow.endNy * FIELD_HEIGHT;

    // Compute control point for quadratic bezier (perpendicular offset from midpoint)
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const dx = endX - startX;
    const dy = endY - startY;
    const len = Math.sqrt(dx * dx + dy * dy);
    const offset = len * 0.05; // 5% of arrow length for subtle curvature

    // Perpendicular direction (rotate 90 degrees)
    const perpX = -dy / (len || 1);
    const perpY = dx / (len || 1);
    const ctrlX = midX + perpX * offset;
    const ctrlY = midY + perpY * offset;

    const pathData = `M ${startX},${startY} Q ${ctrlX},${ctrlY} ${endX},${endY}`;

    // Group for the arrow (id for selection)
    const g = createSvgElement('g', {
      id: `arrow-${arrow.id}`,
      'data-arrow-id': arrow.id,
      style: 'cursor: pointer;',
    });

    // Invisible wider hit area for easier clicking/tapping
    const hitArea = createSvgElement('path', {
      d: pathData,
      fill: 'none',
      stroke: 'transparent',
      'stroke-width': '5',
      'pointer-events': 'stroke',
    });

    // Visible arrow path
    const path = createSvgElement('path', {
      d: pathData,
      fill: 'none',
      stroke: '#f0c040',
      'stroke-width': '0.8',
      opacity: '0.85',
      'stroke-linecap': 'round',
      'marker-end': 'url(#arrowhead)',
      'pointer-events': 'none',
    });

    g.appendChild(hitArea);
    g.appendChild(path);
    layer.appendChild(g);
  }
}

/**
 * Ensure the SVG <defs> contains the arrowhead marker definition.
 * @param {SVGSVGElement} svgEl
 */
function ensureArrowDefs(svgEl) {
  // Check if marker already exists
  if (svgEl.querySelector('#arrowhead')) return;

  let defs = svgEl.querySelector('defs');
  if (!defs) {
    defs = createSvgElement('defs', {});
    svgEl.insertBefore(defs, svgEl.firstChild);
  }

  const marker = createSvgElement('marker', {
    id: 'arrowhead',
    markerWidth: '4',
    markerHeight: '4',
    refX: '3',
    refY: '2',
    orient: 'auto',
    markerUnits: 'strokeWidth',
  });

  const polygon = createSvgElement('polygon', {
    points: '0,0 4,2 0,4',
    fill: '#f0c040',
    opacity: '0.85',
  });

  marker.appendChild(polygon);
  defs.appendChild(marker);
}
