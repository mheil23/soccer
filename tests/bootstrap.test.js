/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock renderer before importing controller
vi.mock('../src/renderer.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    renderField: vi.fn(),
    renderTokens: vi.fn(),
    renderBall: vi.fn(),
  };
});

// Mock storage with configurable behavior
const mockStorage = {
  isAvailable: vi.fn(() => true),
  loadAll: vi.fn(() => ({
    format: null,
    customFormations: [],
    savedMoments: [],
    opponentState: null,
    discardedCount: 0,
  })),
  read: vi.fn(() => null),
  write: vi.fn(),
};

vi.mock('../src/storage.js', () => ({
  storage: mockStorage,
  StorageQuotaExceededError: class StorageQuotaExceededError extends Error {
    constructor(msg = 'quota exceeded') {
      super(msg);
      this.name = 'StorageQuotaExceededError';
    }
  },
}));

const { bootstrap, showNotification, safeStorageWrite } = await import('../src/controller.js');
const { renderField, renderTokens, renderBall } = await import('../src/renderer.js');
const { StorageQuotaExceededError } = await import('../src/storage.js');

function setupFullDOM() {
  document.body.innerHTML = `
    <div id="notification-banner" role="status" aria-live="polite" aria-atomic="false"></div>
    <header id="toolbar">
      <h1>Soccer Formations</h1>
      <div role="group" aria-label="Game format">
        <button class="format-btn" id="btn-7v7" aria-pressed="false" data-format="7v7">7v7</button>
        <button class="format-btn" id="btn-9v9" aria-pressed="false" data-format="9v9">9v9</button>
        <button class="format-btn" id="btn-11v11" aria-pressed="true" data-format="11v11">11v11</button>
      </div>
      <span id="active-format-label" aria-live="polite">Format: 11v11</span>
      <select id="formation-select" aria-label="Select formation"></select>
      <span id="active-formation-label" aria-live="polite">No formation selected</span>
      <label id="opponent-toggle-label">
        <input type="checkbox" id="opponent-toggle" aria-label="Toggle opponent overlay" />
        Opponent
      </label>
      <select id="opponent-formation-select" aria-label="Opponent formation" disabled></select>
      <button id="reset-btn" aria-label="Reset field to formation defaults">Reset</button>
      <div id="custom-formation-controls" style="display:none;">
        <input id="save-formation-name" type="text" maxlength="50" />
        <button id="save-formation-btn">Save Formation</button>
      </div>
    </header>
    <main id="main">
      <div id="field-container">
        <input id="token-label-input" type="text" maxlength="20" style="display:none;" />
        <svg id="field-svg" viewBox="0 0 105 68" xmlns="http://www.w3.org/2000/svg">
          <g id="field-markings"></g>
          <g id="tokens-layer"></g>
          <g id="ball-layer"></g>
        </svg>
      </div>
      <aside id="description-panel" aria-label="Position description" aria-hidden="true">
        <button id="dismiss-panel-btn">Close</button>
        <div id="description-content"></div>
      </aside>
    </main>
    <dialog id="confirm-dialog">
      <h3 id="dialog-title">Confirm</h3>
      <p id="dialog-message">Are you sure?</p>
      <div class="dialog-actions">
        <button class="btn-cancel" id="dialog-cancel-btn">Cancel</button>
        <button class="btn-confirm" id="dialog-confirm-btn">Confirm</button>
      </div>
    </dialog>
    <dialog id="name-conflict-dialog">
      <h3 id="conflict-dialog-title">Name Conflict</h3>
      <p id="conflict-message"></p>
      <div class="dialog-actions">
        <button id="conflict-cancel-btn">Cancel</button>
        <button id="conflict-rename-btn">Rename</button>
        <button id="conflict-overwrite-btn">Overwrite</button>
      </div>
    </dialog>
  `;
}

describe('bootstrap', () => {
  beforeEach(() => {
    setupFullDOM();
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockStorage.isAvailable.mockReturnValue(true);
    mockStorage.loadAll.mockReturnValue({
      format: null,
      customFormations: [],
      savedMoments: [],
      opponentState: null,
      discardedCount: 0,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls storage.loadAll() on init', () => {
    bootstrap();
    expect(mockStorage.loadAll).toHaveBeenCalledOnce();
  });

  it('defaults to 11v11 format when no saved format exists', () => {
    const { getState } = bootstrap();
    expect(getState().format).toBe('11v11');
    expect(getState().ownTokens).toHaveLength(11);
  });

  it('restores saved format from storage', () => {
    mockStorage.loadAll.mockReturnValue({
      format: '7v7',
      customFormations: [],
      savedMoments: [],
      opponentState: null,
      discardedCount: 0,
    });

    const { getState } = bootstrap();
    expect(getState().format).toBe('7v7');
    expect(getState().ownTokens).toHaveLength(7);
  });

  it('restores custom formations from storage', () => {
    const customFormation = {
      id: 'test-1',
      name: 'My Formation',
      format: '11v11',
      positions: [{ label: 'GK', nx: 0.5, ny: 0.95 }],
      savedAt: '2024-01-01T00:00:00Z',
    };
    mockStorage.loadAll.mockReturnValue({
      format: '11v11',
      customFormations: [customFormation],
      savedMoments: [],
      opponentState: null,
      discardedCount: 0,
    });

    const { getState } = bootstrap();
    expect(getState().customFormations).toHaveLength(1);
    expect(getState().customFormations[0].name).toBe('My Formation');
  });

  it('restores saved moments from storage', () => {
    const savedMoment = {
      id: 'moment-1',
      name: 'Test Moment',
      isPredefined: false,
      format: '11v11',
      ownPositions: [{ label: 'GK', nx: 0.5, ny: 0.95 }],
      ballPosition: { nx: 0.5, ny: 0.5 },
      savedAt: '2024-01-01T00:00:00Z',
    };
    mockStorage.loadAll.mockReturnValue({
      format: '11v11',
      customFormations: [],
      savedMoments: [savedMoment],
      opponentState: null,
      discardedCount: 0,
    });

    const { getState } = bootstrap();
    expect(getState().savedMoments).toHaveLength(1);
    expect(getState().savedMoments[0].name).toBe('Test Moment');
  });

  it('renders field, tokens, and ball on bootstrap', () => {
    bootstrap();
    expect(renderField).toHaveBeenCalledOnce();
    expect(renderTokens).toHaveBeenCalled();
    expect(renderBall).toHaveBeenCalled();
  });

  it('updates format button aria-pressed states on bootstrap', () => {
    mockStorage.loadAll.mockReturnValue({
      format: '9v9',
      customFormations: [],
      savedMoments: [],
      opponentState: null,
      discardedCount: 0,
    });

    bootstrap();

    expect(document.getElementById('btn-9v9').getAttribute('aria-pressed')).toBe('true');
    expect(document.getElementById('btn-7v7').getAttribute('aria-pressed')).toBe('false');
    expect(document.getElementById('btn-11v11').getAttribute('aria-pressed')).toBe('false');
  });

  it('updates format label on bootstrap', () => {
    mockStorage.loadAll.mockReturnValue({
      format: '9v9',
      customFormations: [],
      savedMoments: [],
      opponentState: null,
      discardedCount: 0,
    });

    bootstrap();
    const label = document.getElementById('active-format-label');
    expect(label.textContent).toBe('Format: 9v9');
  });

  it('shows notification when storage is unavailable', () => {
    mockStorage.isAvailable.mockReturnValue(false);
    bootstrap();

    const banner = document.getElementById('notification-banner');
    const notifications = banner.querySelectorAll('.notification');
    expect(notifications).toHaveLength(1);
    expect(notifications[0].textContent).toBe(
      'Storage is unavailable in this browser. Your work will not be saved.'
    );
    expect(notifications[0].classList.contains('warn')).toBe(true);
  });

  it('shows notification when corrupt entries are discarded', () => {
    mockStorage.loadAll.mockReturnValue({
      format: '11v11',
      customFormations: [],
      savedMoments: [],
      opponentState: null,
      discardedCount: 3,
    });

    bootstrap();

    const banner = document.getElementById('notification-banner');
    const notifications = banner.querySelectorAll('.notification');
    expect(notifications).toHaveLength(1);
    expect(notifications[0].textContent).toBe(
      'Some saved data could not be loaded and was discarded.'
    );
  });

  it('shows both notifications when storage is unavailable AND entries are corrupt', () => {
    mockStorage.isAvailable.mockReturnValue(false);
    mockStorage.loadAll.mockReturnValue({
      format: null,
      customFormations: [],
      savedMoments: [],
      opponentState: null,
      discardedCount: 2,
    });

    bootstrap();

    const banner = document.getElementById('notification-banner');
    const notifications = banner.querySelectorAll('.notification');
    expect(notifications).toHaveLength(2);
  });
});

describe('showNotification', () => {
  beforeEach(() => {
    setupFullDOM();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('appends a notification element to #notification-banner', () => {
    showNotification('Test message', 'error');

    const banner = document.getElementById('notification-banner');
    const notifications = banner.querySelectorAll('.notification');
    expect(notifications).toHaveLength(1);
    expect(notifications[0].textContent).toBe('Test message');
  });

  it('applies the correct type class', () => {
    showNotification('Info message', 'info');
    showNotification('Warning message', 'warn');
    showNotification('Error message', 'error');

    const banner = document.getElementById('notification-banner');
    const notifications = banner.querySelectorAll('.notification');
    expect(notifications[0].classList.contains('info')).toBe(true);
    expect(notifications[1].classList.contains('warn')).toBe(true);
    expect(notifications[2].classList.contains('error')).toBe(true);
  });

  it('queues multiple notifications rather than overwriting', () => {
    showNotification('First', 'error');
    showNotification('Second', 'warn');
    showNotification('Third', 'info');

    const banner = document.getElementById('notification-banner');
    const notifications = banner.querySelectorAll('.notification');
    expect(notifications).toHaveLength(3);
    expect(notifications[0].textContent).toBe('First');
    expect(notifications[1].textContent).toBe('Second');
    expect(notifications[2].textContent).toBe('Third');
  });

  it('auto-dismisses notification after 5 seconds', () => {
    showNotification('Temporary message', 'error');

    const banner = document.getElementById('notification-banner');
    expect(banner.querySelectorAll('.notification')).toHaveLength(1);

    vi.advanceTimersByTime(5000);

    expect(banner.querySelectorAll('.notification')).toHaveLength(0);
  });

  it('dismisses notifications independently based on their own timers', () => {
    showNotification('First', 'error');
    vi.advanceTimersByTime(2000);
    showNotification('Second', 'warn');

    const banner = document.getElementById('notification-banner');
    expect(banner.querySelectorAll('.notification')).toHaveLength(2);

    // After 3 more seconds (5s total for first), first should be gone
    vi.advanceTimersByTime(3000);
    const remaining = banner.querySelectorAll('.notification');
    expect(remaining).toHaveLength(1);
    expect(remaining[0].textContent).toBe('Second');

    // After 2 more seconds (5s total for second), second should be gone
    vi.advanceTimersByTime(2000);
    expect(banner.querySelectorAll('.notification')).toHaveLength(0);
  });

  it('defaults type to error when not specified', () => {
    showNotification('Default type');

    const banner = document.getElementById('notification-banner');
    const notification = banner.querySelector('.notification');
    expect(notification.classList.contains('error')).toBe(true);
  });
});

describe('safeStorageWrite', () => {
  beforeEach(() => {
    setupFullDOM();
    vi.clearAllMocks();
    vi.useFakeTimers();
    mockStorage.write.mockImplementation(() => {});
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('calls storage.write with key and value', () => {
    safeStorageWrite('format', '7v7');
    expect(mockStorage.write).toHaveBeenCalledWith('format', '7v7');
  });

  it('shows quota exceeded notification when StorageQuotaExceededError is thrown', () => {
    mockStorage.write.mockImplementation(() => {
      throw new StorageQuotaExceededError();
    });

    safeStorageWrite('format', '7v7');

    const banner = document.getElementById('notification-banner');
    const notifications = banner.querySelectorAll('.notification');
    expect(notifications).toHaveLength(1);
    expect(notifications[0].textContent).toBe(
      'Save failed: storage quota exceeded. Your existing saved data has not been affected.'
    );
    expect(notifications[0].classList.contains('error')).toBe(true);
  });

  it('does not show notification when write succeeds', () => {
    safeStorageWrite('format', '7v7');

    const banner = document.getElementById('notification-banner');
    expect(banner.querySelectorAll('.notification')).toHaveLength(0);
  });
});
