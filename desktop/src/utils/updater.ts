/**
 * Updater bridge — renderer side.
 *
 * Talks to the main process via the `window.electronAPI` bridge exposed
 * in `electron/preload.cjs`. All calls are no-ops when running in a
 * plain browser (i.e. `window.electronAPI` is undefined), so the web
 * build of PharmaSys keeps working untouched.
 *
 * Contract with main process (see electron/main.js + electron/updater.js):
 *   - app:version                         -> string
 *   - update:check                        -> void
 *   - update:install                      -> void
 *   - onUpdateMessage(cb)                 -> event: 'update-message'   (string)
 *   - onDownloadProgress(cb)              -> event: 'download-progress' (number 0-100)
 *   - onUpdateError(cb)                   -> event: 'update-error'      (string)
 */

export type UpdateState =
  | { kind: 'idle' }
  | { kind: 'checking' }
  | { kind: 'available'; version: string }
  | { kind: 'downloading'; percent: number; version?: string }
  | { kind: 'downloaded'; version: string }
  | { kind: 'error'; message: string };

export type UpdateListener = (state: UpdateState) => void;

interface ElectronUpdaterAPI {
  isElectron: boolean;
  platform: string;
  version: string;
  getAppVersion: () => Promise<string>;
  openExternal: (url: string) => void;

  onUpdateMessage?: (cb: (msg: string) => void) => void;
  onDownloadProgress?: (cb: (percent: number) => void) => void;
  onUpdateError?: (cb: (msg: string) => void) => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronUpdaterAPI;
  }
}

/* ─────────── availability ─────────── */

export function isElectron(): boolean {
  return typeof window !== 'undefined' && !!window.electronAPI?.isElectron;
}

/* ─────────── app version ─────────── */

let cachedVersion: string | null = null;

/**
 * Read the app version. In Electron this asks the main process; in the
 * browser it falls back to a hardcoded value or null.
 */
export async function getAppVersion(): Promise<string | null> {
  if (cachedVersion) return cachedVersion;

  if (isElectron() && window.electronAPI?.getAppVersion) {
    try {
      const v = await window.electronAPI.getAppVersion();
      cachedVersion = v;
      return v;
    } catch {
      return null;
    }
  }

  return cachedVersion;
}

/* ─────────── state machine ─────────── */

let state: UpdateState = { kind: 'idle' };
const listeners = new Set<UpdateListener>();
let wired = false;

function setState(next: UpdateState) {
  state = next;
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch {
      /* listener errors must not kill the bridge */
    }
  });
}

export function getUpdateState(): UpdateState {
  return state;
}

/**
 * Subscribe to update state changes. Returns an unsubscribe function.
 * Immediately invokes the listener with the current state.
 */
export function subscribeToUpdates(listener: UpdateListener): () => void {
  listeners.add(listener);
  listener(state);
  wireBridge();
  return () => {
    listeners.delete(listener);
  };
}

/* ─────────── bridge wiring (idempotent) ─────────── */

function wireBridge() {
  if (wired) return;
  if (!isElectron()) return;
  const api = window.electronAPI;
  if (!api) return;

  api.onUpdateMessage?.((msg) => {
    setState(interpretMessage(msg));
  });

  api.onDownloadProgress?.((percent) => {
    const p = clampPercent(percent);
    const current = state;
    setState({
      kind: 'downloading',
      percent: p,
      version: current.kind === 'downloading' ? current.version : undefined,
    });
  });

  api.onUpdateError?.((msg) => {
    setState({ kind: 'error', message: msg || 'Update error' });
  });

  wired = true;
}

/* ─────────── message interpretation ─────────── */

/**
 * The main process sends free-form strings on 'update-message'. We map
 * the ones we care about into typed states. Anything unknown is
 * ignored — we never want to break the UI on a new string.
 *
 * Known messages from updater.js:
 *   "Checking for updates..."
 *   "Downloading FarmVexa v1.0.2"      -> "Downloading PharmaSys vX.Y.Z"
 *   "PharmaSys is up to date"
 *   "PharmaSys v1.0.2 downloaded. Restarting..."
 */
function interpretMessage(msg: string): UpdateState {
  const text = String(msg || '').trim();
  const lower = text.toLowerCase();

  if (lower.includes('checking')) {
    return { kind: 'checking' };
  }

  if (lower.includes('up to date')) {
    return { kind: 'idle' };
  }

  // "Downloading PharmaSys v1.0.2"
  const dl = text.match(/downloading .*? v([\w.\-]+)/i);
  if (dl) {
    const version = dl[1];
    const percent =
      state.kind === 'downloading' ? state.percent : 0;
    return { kind: 'downloading', percent, version };
  }

  // "PharmaSys v1.0.2 downloaded. Restarting..."
  const done = text.match(/ v([\w.\-]+) downloaded/i);
  if (done) {
    return { kind: 'downloaded', version: done[1] };
  }

  // Unknown but non-empty — keep current state
  return state;
}

function clampPercent(n: unknown): number {
  const v = Number(n);
  if (!Number.isFinite(v)) return 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

/* ─────────── commands ─────────── */

/**
 * Ask the main process to trigger an update check. No-op in the browser.
 * (updater.js already polls hourly; this is for a manual "Check now".)
 */
export function checkForUpdates(): void {
  if (!isElectron()) return;
  const api = window.electronAPI as any;
  api?.checkForUpdates?.();
}

/**
 * Ask the main process to quit and install the downloaded update.
 * Only meaningful after state.kind === 'downloaded'.
 */
export function installUpdate(): void {
  if (!isElectron()) return;
  const api = window.electronAPI as any;
  api?.installUpdate?.();
}