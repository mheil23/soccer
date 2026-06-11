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
    isAvailable: vi.fn(() => true),
    loadAll: vi.fn(() => ({ format: '11v11', customFormations: [], savedMoments: [], discardedCount: 0 })),
  },
  StorageQuotaExceededError: class StorageQuotaExceededError extends Error {
    constructor(msg) {
      super(msg);
      this.name = 'StorageQuotaExceededError';
    }
  },
}));

const { initMomentSaveDelete, showMomentConflictDialog } = await import('../src/controller.js');
const { createInitialState, addSavedMoment } = await import('../src/state.js');
const { storage } = await import('../src/storage.js');

function setupDOM() {
  document.body.innerHTML = `
    <select id="moments-select" aria-label="Select situational moment">
      <option value="">— Moments —</option>
    </select>
    <div id="moment-controls">
      <input id="save-moment-name" type="text" maxlength="50" placeholder="Moment name" aria-label="Moment name" />
      <button id="save-moment-btn" aria-label="Save as Moment">Save as Moment</button>
      <button id="delete-moment-btn" aria-label="Delete saved moment" style="display:none;">Delete Moment</button>
    </div>
    <dialog id="moment-conflict-dialog">
      <p id="moment-conflict-message"></p>
      <button id="moment-conflict-cancel-btn">Cancel</button>
      <button id="moment-conflict-rename-btn">Rename</button>
      <button id="moment-conflict-overwrite-btn">Overwrite</button>
    </dialog>
    <dialog id="confirm-dialog">
      <p id="dialog-message"></p>
      <button id="dialog-cancel-btn">Cancel</button>
      <button id="dialog-confirm-btn">Confirm</button>
    </dialog>
    <svg id="field-svg" viewBox="0 0 105 68">
      <g id="field-markings"></g>
      <g id="tokens-layer"></g>
      <g id="ball-layer"></g>
    </svg>
  `;
}

describe('initMomentSaveDelete — Save as Moment', () => {
  let state;
  let getState;
  let setState;
  let momentsApi;

  beforeEach(() => {
    setupDOM();
    vi.clearAllMocks();
    state = createInitialState('11v11');
    getState = () => state;
    setState = (newState) => { state = newState; };
    momentsApi = { refreshMoments: vi.fn() };
  });

  it('saves a moment with a valid name (1–50 chars)', async () => {
    const conflictFn = vi.fn();
    const confirmFn = vi.fn();
    initMomentSaveDelete(getState, setState, momentsApi, conflictFn, confirmFn);

    const nameInput = document.getElementById('save-moment-name');
    const saveBtn = document.getElementById('save-moment-btn');

    nameInput.value = 'Corner kick setup';
    saveBtn.click();
    await new Promise((r) => setTimeout(r, 0));

    expect(state.savedMoments).toHaveLength(1);
    expect(state.savedMoments[0].name).toBe('Corner kick setup');
    expect(state.savedMoments[0].isPredefined).toBe(false);
    expect(state.savedMoments[0].format).toBe('11v11');
    expect(state.savedMoments[0].savedAt).not.toBeNull();
  });

  it('persists via storage.write after save', async () => {
    const conflictFn = vi.fn();
    const confirmFn = vi.fn();
    initMomentSaveDelete(getState, setState, momentsApi, conflictFn, confirmFn);

    const nameInput = document.getElementById('save-moment-name');
    const saveBtn = document.getElementById('save-moment-btn');

    nameInput.value = 'My moment';
    saveBtn.click();
    await new Promise((r) => setTimeout(r, 0));

    expect(storage.write).toHaveBeenCalledWith('savedMoments', expect.any(String));
    const saved = JSON.parse(storage.write.mock.calls[0][1]);
    expect(saved).toHaveLength(1);
    expect(saved[0].name).toBe('My moment');
  });

  it('refreshes the moments selector after save', async () => {
    const conflictFn = vi.fn();
    const confirmFn = vi.fn();
    initMomentSaveDelete(getState, setState, momentsApi, conflictFn, confirmFn);

    const nameInput = document.getElementById('save-moment-name');
    const saveBtn = document.getElementById('save-moment-btn');

    nameInput.value = 'Test moment';
    saveBtn.click();
    await new Promise((r) => setTimeout(r, 0));

    expect(momentsApi.refreshMoments).toHaveBeenCalled();
  });

  it('rejects an empty name', async () => {
    const conflictFn = vi.fn();
    const confirmFn = vi.fn();
    initMomentSaveDelete(getState, setState, momentsApi, conflictFn, confirmFn);

    const nameInput = document.getElementById('save-moment-name');
    const saveBtn = document.getElementById('save-moment-btn');

    nameInput.value = '';
    saveBtn.click();
    await new Promise((r) => setTimeout(r, 0));

    expect(state.savedMoments).toHaveLength(0);
    expect(storage.write).not.toHaveBeenCalled();
  });

  it('rejects a name exceeding 50 characters', async () => {
    const conflictFn = vi.fn();
    const confirmFn = vi.fn();
    initMomentSaveDelete(getState, setState, momentsApi, conflictFn, confirmFn);

    const nameInput = document.getElementById('save-moment-name');
    const saveBtn = document.getElementById('save-moment-btn');

    nameInput.value = 'A'.repeat(51);
    saveBtn.click();
    await new Promise((r) => setTimeout(r, 0));

    expect(state.savedMoments).toHaveLength(0);
    expect(storage.write).not.toHaveBeenCalled();
  });

  it('trims whitespace from name before saving', async () => {
    const conflictFn = vi.fn();
    const confirmFn = vi.fn();
    initMomentSaveDelete(getState, setState, momentsApi, conflictFn, confirmFn);

    const nameInput = document.getElementById('save-moment-name');
    const saveBtn = document.getElementById('save-moment-btn');

    nameInput.value = '  My moment  ';
    saveBtn.click();
    await new Promise((r) => setTimeout(r, 0));

    expect(state.savedMoments[0].name).toBe('My moment');
  });

  it('captures own token positions and ball position in saved moment', async () => {
    const conflictFn = vi.fn();
    const confirmFn = vi.fn();
    initMomentSaveDelete(getState, setState, momentsApi, conflictFn, confirmFn);

    const nameInput = document.getElementById('save-moment-name');
    const saveBtn = document.getElementById('save-moment-btn');

    nameInput.value = 'Positions check';
    saveBtn.click();
    await new Promise((r) => setTimeout(r, 0));

    const saved = state.savedMoments[0];
    expect(saved.ownPositions).toHaveLength(state.ownTokens.length);
    expect(saved.ballPosition).toEqual({ nx: 0.5, ny: 0.5 });
    expect(saved.ownPositions[0]).toHaveProperty('label');
    expect(saved.ownPositions[0]).toHaveProperty('nx');
    expect(saved.ownPositions[0]).toHaveProperty('ny');
  });

  it('clears the name input after successful save', async () => {
    const conflictFn = vi.fn();
    const confirmFn = vi.fn();
    initMomentSaveDelete(getState, setState, momentsApi, conflictFn, confirmFn);

    const nameInput = document.getElementById('save-moment-name');
    const saveBtn = document.getElementById('save-moment-btn');

    nameInput.value = 'Clear me';
    saveBtn.click();
    await new Promise((r) => setTimeout(r, 0));

    expect(nameInput.value).toBe('');
  });

  it('shows conflict dialog when name already exists for same format', async () => {
    // Add an existing moment
    state = addSavedMoment(state, {
      id: 'existing-1',
      name: 'My setup',
      isPredefined: false,
      format: '11v11',
      ownPositions: [{ label: 'GK', nx: 0.5, ny: 0.06 }],
      ballPosition: { nx: 0.5, ny: 0.5 },
      savedAt: '2024-01-01T00:00:00.000Z',
    });

    const conflictFn = vi.fn().mockResolvedValue('overwrite');
    const confirmFn = vi.fn();
    initMomentSaveDelete(getState, setState, momentsApi, conflictFn, confirmFn);

    const nameInput = document.getElementById('save-moment-name');
    const saveBtn = document.getElementById('save-moment-btn');

    nameInput.value = 'My setup';
    saveBtn.click();
    await new Promise((r) => setTimeout(r, 0));

    expect(conflictFn).toHaveBeenCalledWith('My setup');
  });

  it('overwrites existing moment when user chooses overwrite', async () => {
    state = addSavedMoment(state, {
      id: 'existing-1',
      name: 'My setup',
      isPredefined: false,
      format: '11v11',
      ownPositions: [{ label: 'GK', nx: 0.5, ny: 0.06 }],
      ballPosition: { nx: 0.5, ny: 0.5 },
      savedAt: '2024-01-01T00:00:00.000Z',
    });

    const conflictFn = vi.fn().mockResolvedValue('overwrite');
    const confirmFn = vi.fn();
    initMomentSaveDelete(getState, setState, momentsApi, conflictFn, confirmFn);

    const nameInput = document.getElementById('save-moment-name');
    const saveBtn = document.getElementById('save-moment-btn');

    nameInput.value = 'My setup';
    saveBtn.click();
    await new Promise((r) => setTimeout(r, 0));

    // Should still have exactly 1 moment with the same name but new data
    const moments = state.savedMoments.filter((m) => m.name === 'My setup');
    expect(moments).toHaveLength(1);
    expect(moments[0].id).not.toBe('existing-1'); // New id
    expect(moments[0].ownPositions).toHaveLength(11); // From current state (11v11 has 11 tokens)
  });

  it('refocuses input when user chooses rename on conflict', async () => {
    state = addSavedMoment(state, {
      id: 'existing-1',
      name: 'My setup',
      isPredefined: false,
      format: '11v11',
      ownPositions: [{ label: 'GK', nx: 0.5, ny: 0.06 }],
      ballPosition: { nx: 0.5, ny: 0.5 },
      savedAt: '2024-01-01T00:00:00.000Z',
    });

    const conflictFn = vi.fn().mockResolvedValue('rename');
    const confirmFn = vi.fn();
    initMomentSaveDelete(getState, setState, momentsApi, conflictFn, confirmFn);

    const nameInput = document.getElementById('save-moment-name');
    const saveBtn = document.getElementById('save-moment-btn');

    nameInput.value = 'My setup';
    saveBtn.click();
    await new Promise((r) => setTimeout(r, 0));

    // Original moment should still be there, unmodified
    expect(state.savedMoments).toHaveLength(1);
    expect(state.savedMoments[0].id).toBe('existing-1');
    // Input should be cleared for rename
    expect(nameInput.value).toBe('');
  });

  it('does nothing when user cancels conflict dialog', async () => {
    state = addSavedMoment(state, {
      id: 'existing-1',
      name: 'My setup',
      isPredefined: false,
      format: '11v11',
      ownPositions: [{ label: 'GK', nx: 0.5, ny: 0.06 }],
      ballPosition: { nx: 0.5, ny: 0.5 },
      savedAt: '2024-01-01T00:00:00.000Z',
    });

    const conflictFn = vi.fn().mockResolvedValue(null);
    const confirmFn = vi.fn();
    initMomentSaveDelete(getState, setState, momentsApi, conflictFn, confirmFn);

    const nameInput = document.getElementById('save-moment-name');
    const saveBtn = document.getElementById('save-moment-btn');

    nameInput.value = 'My setup';
    saveBtn.click();
    await new Promise((r) => setTimeout(r, 0));

    // Original moment unchanged, no new moment added
    expect(state.savedMoments).toHaveLength(1);
    expect(state.savedMoments[0].id).toBe('existing-1');
  });

  it('does not conflict with moments in a different format', async () => {
    state = addSavedMoment(state, {
      id: 'existing-7v7',
      name: 'My setup',
      isPredefined: false,
      format: '7v7', // different format
      ownPositions: [{ label: 'GK', nx: 0.5, ny: 0.06 }],
      ballPosition: { nx: 0.5, ny: 0.5 },
      savedAt: '2024-01-01T00:00:00.000Z',
    });

    const conflictFn = vi.fn();
    const confirmFn = vi.fn();
    initMomentSaveDelete(getState, setState, momentsApi, conflictFn, confirmFn);

    const nameInput = document.getElementById('save-moment-name');
    const saveBtn = document.getElementById('save-moment-btn');

    nameInput.value = 'My setup';
    saveBtn.click();
    await new Promise((r) => setTimeout(r, 0));

    // No conflict dialog shown — different format
    expect(conflictFn).not.toHaveBeenCalled();
    // Should have 2 moments now
    expect(state.savedMoments).toHaveLength(2);
  });
});

describe('initMomentSaveDelete — Delete Moment', () => {
  let state;
  let getState;
  let setState;
  let momentsApi;

  beforeEach(() => {
    setupDOM();
    vi.clearAllMocks();
    state = createInitialState('11v11');
    getState = () => state;
    setState = (newState) => { state = newState; };
    momentsApi = { refreshMoments: vi.fn() };
  });

  it('shows delete button only for user-saved moments', async () => {
    state = addSavedMoment(state, {
      id: 'user-moment-1',
      name: 'User moment',
      isPredefined: false,
      format: '11v11',
      ownPositions: [{ label: 'GK', nx: 0.5, ny: 0.06 }],
      ballPosition: { nx: 0.5, ny: 0.5 },
      savedAt: '2024-01-01T00:00:00.000Z',
    });

    const conflictFn = vi.fn();
    const confirmFn = vi.fn();
    initMomentSaveDelete(getState, setState, momentsApi, conflictFn, confirmFn);

    const momentsSelect = document.getElementById('moments-select');
    const deleteBtn = document.getElementById('delete-moment-btn');

    // Select a user moment
    const option = document.createElement('option');
    option.value = 'user-moment-1';
    momentsSelect.appendChild(option);
    momentsSelect.value = 'user-moment-1';
    momentsSelect.dispatchEvent(new Event('change'));

    expect(deleteBtn.style.display).toBe('inline-block');
  });

  it('hides delete button for predefined moments', () => {
    const conflictFn = vi.fn();
    const confirmFn = vi.fn();
    initMomentSaveDelete(getState, setState, momentsApi, conflictFn, confirmFn);

    const momentsSelect = document.getElementById('moments-select');
    const deleteBtn = document.getElementById('delete-moment-btn');

    // Select a predefined moment (from data.js)
    const option = document.createElement('option');
    option.value = 'corner-kick-attacking-11v11';
    momentsSelect.appendChild(option);
    momentsSelect.value = 'corner-kick-attacking-11v11';
    momentsSelect.dispatchEvent(new Event('change'));

    expect(deleteBtn.style.display).toBe('none');
  });

  it('hides delete button when no moment is selected', () => {
    const conflictFn = vi.fn();
    const confirmFn = vi.fn();
    initMomentSaveDelete(getState, setState, momentsApi, conflictFn, confirmFn);

    const momentsSelect = document.getElementById('moments-select');
    const deleteBtn = document.getElementById('delete-moment-btn');

    momentsSelect.value = '';
    momentsSelect.dispatchEvent(new Event('change'));

    expect(deleteBtn.style.display).toBe('none');
  });

  it('shows confirmation dialog before deleting', async () => {
    state = addSavedMoment(state, {
      id: 'user-moment-1',
      name: 'User moment',
      isPredefined: false,
      format: '11v11',
      ownPositions: [{ label: 'GK', nx: 0.5, ny: 0.06 }],
      ballPosition: { nx: 0.5, ny: 0.5 },
      savedAt: '2024-01-01T00:00:00.000Z',
    });

    const conflictFn = vi.fn();
    const confirmFn = vi.fn().mockResolvedValue(true);
    initMomentSaveDelete(getState, setState, momentsApi, conflictFn, confirmFn);

    const momentsSelect = document.getElementById('moments-select');
    const deleteBtn = document.getElementById('delete-moment-btn');

    // Select the user moment
    const option = document.createElement('option');
    option.value = 'user-moment-1';
    momentsSelect.appendChild(option);
    momentsSelect.value = 'user-moment-1';
    momentsSelect.dispatchEvent(new Event('change'));

    deleteBtn.click();
    await new Promise((r) => setTimeout(r, 0));

    expect(confirmFn).toHaveBeenCalledWith(
      'Delete moment "User moment"? This cannot be undone.'
    );
  });

  it('removes moment from state and storage on confirm', async () => {
    state = addSavedMoment(state, {
      id: 'user-moment-1',
      name: 'User moment',
      isPredefined: false,
      format: '11v11',
      ownPositions: [{ label: 'GK', nx: 0.5, ny: 0.06 }],
      ballPosition: { nx: 0.5, ny: 0.5 },
      savedAt: '2024-01-01T00:00:00.000Z',
    });

    const conflictFn = vi.fn();
    const confirmFn = vi.fn().mockResolvedValue(true);
    initMomentSaveDelete(getState, setState, momentsApi, conflictFn, confirmFn);

    const momentsSelect = document.getElementById('moments-select');
    const deleteBtn = document.getElementById('delete-moment-btn');

    const option = document.createElement('option');
    option.value = 'user-moment-1';
    momentsSelect.appendChild(option);
    momentsSelect.value = 'user-moment-1';
    momentsSelect.dispatchEvent(new Event('change'));

    deleteBtn.click();
    await new Promise((r) => setTimeout(r, 0));

    expect(state.savedMoments).toHaveLength(0);
    expect(storage.write).toHaveBeenCalledWith('savedMoments', '[]');
    expect(momentsApi.refreshMoments).toHaveBeenCalled();
  });

  it('does not remove moment when user cancels confirmation', async () => {
    state = addSavedMoment(state, {
      id: 'user-moment-1',
      name: 'User moment',
      isPredefined: false,
      format: '11v11',
      ownPositions: [{ label: 'GK', nx: 0.5, ny: 0.06 }],
      ballPosition: { nx: 0.5, ny: 0.5 },
      savedAt: '2024-01-01T00:00:00.000Z',
    });

    const conflictFn = vi.fn();
    const confirmFn = vi.fn().mockResolvedValue(false);
    initMomentSaveDelete(getState, setState, momentsApi, conflictFn, confirmFn);

    const momentsSelect = document.getElementById('moments-select');
    const deleteBtn = document.getElementById('delete-moment-btn');

    const option = document.createElement('option');
    option.value = 'user-moment-1';
    momentsSelect.appendChild(option);
    momentsSelect.value = 'user-moment-1';
    momentsSelect.dispatchEvent(new Event('change'));

    deleteBtn.click();
    await new Promise((r) => setTimeout(r, 0));

    expect(state.savedMoments).toHaveLength(1);
    expect(storage.write).not.toHaveBeenCalled();
  });

  it('does not allow deletion of predefined moments even if delete is clicked', async () => {
    // This tests the guard in the delete click handler
    const conflictFn = vi.fn();
    const confirmFn = vi.fn().mockResolvedValue(true);
    initMomentSaveDelete(getState, setState, momentsApi, conflictFn, confirmFn);

    const momentsSelect = document.getElementById('moments-select');
    const deleteBtn = document.getElementById('delete-moment-btn');

    // Force a predefined moment id into the select
    const option = document.createElement('option');
    option.value = 'corner-kick-attacking-11v11';
    momentsSelect.appendChild(option);
    momentsSelect.value = 'corner-kick-attacking-11v11';

    // Manually show delete button (bypassing the display logic)
    deleteBtn.style.display = 'inline-block';
    deleteBtn.click();
    await new Promise((r) => setTimeout(r, 0));

    // Confirm should never be called for predefined moments
    expect(confirmFn).not.toHaveBeenCalled();
  });

  it('clears activeMomentKey when deleting the active moment', async () => {
    state = addSavedMoment(state, {
      id: 'user-moment-1',
      name: 'User moment',
      isPredefined: false,
      format: '11v11',
      ownPositions: [{ label: 'GK', nx: 0.5, ny: 0.06 }],
      ballPosition: { nx: 0.5, ny: 0.5 },
      savedAt: '2024-01-01T00:00:00.000Z',
    });
    state = { ...state, activeMomentKey: 'user-moment-1' };

    const conflictFn = vi.fn();
    const confirmFn = vi.fn().mockResolvedValue(true);
    initMomentSaveDelete(getState, setState, momentsApi, conflictFn, confirmFn);

    const momentsSelect = document.getElementById('moments-select');
    const deleteBtn = document.getElementById('delete-moment-btn');

    const option = document.createElement('option');
    option.value = 'user-moment-1';
    momentsSelect.appendChild(option);
    momentsSelect.value = 'user-moment-1';
    momentsSelect.dispatchEvent(new Event('change'));

    deleteBtn.click();
    await new Promise((r) => setTimeout(r, 0));

    expect(state.activeMomentKey).toBeNull();
  });
});
