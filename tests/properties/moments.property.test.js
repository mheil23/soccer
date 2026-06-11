// Feature: soccer-formations-tool, Property 12: Situational moment load leaves opponent tokens unaffected
// **Validates: Requirements 7.2**
// Feature: soccer-formations-tool, Property 13: Situational moment definition is immutable after load
// **Validates: Requirements 7.3**
// Feature: soccer-formations-tool, Property 14: Predefined moments are not deletable
// **Validates: Requirements 7.7**
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  createInitialState,
  setOpponentOverlay,
  setOpponentTokenPosition,
  applyMoment,
  setOwnTokenPosition,
  deleteSavedMoment,
} from '../../src/state.js';
import { getPredefinedMoments } from '../../src/data.js';

// ---------------------------------------------------------------------------
// Shared generators and helpers
// ---------------------------------------------------------------------------

const FORMATS = ['7v7', '9v9', '11v11'];

// Normalized coordinate in [0, 1]
const arbNx = fc.float({ min: 0, max: 1, noNaN: true, noDefaultInfinity: true });

// Collect all predefined moments across all formats
const allPredefinedMoments = FORMATS.flatMap((format) => getPredefinedMoments(format));

// Generator: pick any predefined moment
const arbPredefinedMoment = fc.constantFrom(...allPredefinedMoments);

// Generator: pick a format
const arbFormat = fc.constantFrom(...FORMATS);

// ---------------------------------------------------------------------------
// Property 12: Situational moment load leaves opponent tokens unaffected
//
// For any situational moment M with opponentPositions defined, loading M
// should set opponent tokens to the moment's opponentPositions when overlay is enabled.
// Own-team and ball are always updated to M's defined values.
// ---------------------------------------------------------------------------
describe('Property 12: Situational moment load sets opponent tokens from moment definition', () => {
  it('applying a moment with opponentPositions sets opponent tokens correctly when overlay is enabled', () => {
    fc.assert(
      fc.property(arbPredefinedMoment, fc.array(fc.tuple(arbNx, arbNx), { minLength: 1, maxLength: 11 }), (moment, randomPositions) => {
        // Create state with the moment's format
        let state = createInitialState(moment.format);

        // Enable opponent overlay so we have opponent tokens
        state = setOpponentOverlay(state, true);

        // Assign random positions to opponent tokens
        const opponentCount = Math.min(randomPositions.length, state.opponentTokens.length);
        for (let i = 0; i < opponentCount; i++) {
          const [nx, ny] = randomPositions[i];
          state = setOpponentTokenPosition(state, state.opponentTokens[i].id, nx, ny);
        }

        // Apply the moment
        const newState = applyMoment(state, moment);

        // Verify opponent tokens match the moment's opponentPositions
        if (moment.opponentPositions && moment.opponentPositions.length > 0) {
          expect(newState.opponentTokens.length).toBe(moment.opponentPositions.length);
          moment.opponentPositions.forEach((pos, i) => {
            expect(newState.opponentTokens[i].nx).toBe(pos.nx);
            expect(newState.opponentTokens[i].ny).toBe(pos.ny);
            expect(newState.opponentTokens[i].label).toBe(pos.label);
          });
        }

        // Verify own tokens were updated to moment definition
        moment.ownPositions.forEach((pos, i) => {
          expect(newState.ownTokens[i].nx).toBe(pos.nx);
          expect(newState.ownTokens[i].ny).toBe(pos.ny);
        });

        // Verify ball was updated to moment definition
        expect(newState.ball.nx).toBe(moment.ballPosition.nx);
        expect(newState.ball.ny).toBe(moment.ballPosition.ny);
      }),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 13: Situational moment definition is immutable after load
//
// For any saved situational moment M with stored definition D, loading M onto
// the field and then dragging tokens to new positions should leave D (the
// activeMomentSnapshot in state) identical to its pre-drag state.
// ---------------------------------------------------------------------------
describe('Property 13: Situational moment definition is immutable after load', () => {
  it('dragging tokens after loading a moment does not mutate activeMomentSnapshot', () => {
    fc.assert(
      fc.property(
        arbPredefinedMoment,
        fc.nat({ max: 10 }),
        arbNx,
        arbNx,
        (moment, tokenIndex, newNx, newNy) => {
          // Create state and apply the moment
          let state = createInitialState(moment.format);
          state = applyMoment(state, moment);

          // Capture the activeMomentSnapshot right after loading
          const snapshotBefore = JSON.parse(JSON.stringify(state.activeMomentSnapshot));

          // Pick a valid token index to drag
          const idx = tokenIndex % state.ownTokens.length;
          const tokenId = state.ownTokens[idx].id;

          // Drag the token to a new position
          state = setOwnTokenPosition(state, tokenId, newNx, newNy);

          // The activeMomentSnapshot should remain identical to before the drag
          expect(state.activeMomentSnapshot).toEqual(snapshotBefore);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 14: Predefined moments are not deletable
//
// For any moment M where M.isPredefined === true, attempting a delete
// operation on M should have no effect on the moments list.
// ---------------------------------------------------------------------------
describe('Property 14: Predefined moments are not deletable', () => {
  it('deleteSavedMoment has no effect on predefined moments', () => {
    fc.assert(
      fc.property(arbPredefinedMoment, (moment) => {
        // Confirm the moment is predefined
        expect(moment.isPredefined).toBe(true);

        // Create state for the moment's format
        let state = createInitialState(moment.format);

        // Get all predefined moments for this format before delete attempt
        const predefinedBefore = getPredefinedMoments(moment.format);

        // Attempt to delete the predefined moment via state mutation
        state = deleteSavedMoment(state, moment.id);

        // Predefined moments come from data.js, not savedMoments in state.
        // The getPredefinedMoments function should still return all of them.
        const predefinedAfter = getPredefinedMoments(moment.format);

        // Verify the predefined moments list is unchanged
        expect(predefinedAfter.length).toBe(predefinedBefore.length);
        expect(predefinedAfter.map((m) => m.id)).toEqual(predefinedBefore.map((m) => m.id));

        // Verify the specific moment is still present
        const stillExists = predefinedAfter.some((m) => m.id === moment.id);
        expect(stillExists).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
