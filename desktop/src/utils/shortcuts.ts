export type Shortcut = {
  keys: string;
  label: string;
  description: string;
  group: 'Navigation' | 'Actions' | 'POS' | 'Modal' | 'General';
  scope?: 'global' | 'pos' | 'modal' | 'list';
};

export const SHORTCUTS: Shortcut[] = [
  // Global navigation
  { keys: 'g d', label: 'G then D', description: 'Go to Dashboard',       group: 'Navigation' },
  { keys: 'g p', label: 'G then P', description: 'Go to Point of Sale',   group: 'Navigation' },
  { keys: 'g s', label: 'G then S', description: 'Go to Sales',           group: 'Navigation' },
  { keys: 'g i', label: 'G then I', description: 'Go to Inventory',       group: 'Navigation' },
  { keys: 'g c', label: 'G then C', description: 'Go to Customers',       group: 'Navigation' },
  { keys: 'g t', label: 'G then T', description: 'Go to Patients',        group: 'Navigation' },
  { keys: 'g r', label: 'G then R', description: 'Go to Prescriptions',   group: 'Navigation' },
  { keys: 'g o', label: 'G then O', description: 'Go to Purchase Orders', group: 'Navigation' },
  { keys: 'g u', label: 'G then U', description: 'Go to Staff',           group: 'Navigation' },
  { keys: 'g f', label: 'G then F', description: 'Go to Suppliers',       group: 'Navigation' },
  { keys: 'g a', label: 'G then A', description: 'Go to AI',              group: 'Navigation' },
  { keys: 'g m', label: 'G then M', description: 'Go to Reports',         group: 'Navigation' },
  { keys: 'g b', label: 'G then B', description: 'Go to Billing',         group: 'Navigation' },
  { keys: 'g ,', label: 'G then ,', description: 'Go to Settings',        group: 'Navigation' },
  { keys: 'g n', label: 'G then N', description: 'Go to Notifications',   group: 'Navigation' },

  // Global actions
  { keys: 'ctrl+k',     label: 'Ctrl K',      description: 'Open command palette', group: 'Actions' },
  { keys: 'ctrl+enter', label: 'Ctrl Enter',  description: 'Submit current form',  group: 'Actions' },
  { keys: 'ctrl+s',     label: 'Ctrl S',      description: 'Save current form',    group: 'Actions' },
  { keys: 'ctrl+/',     label: 'Ctrl /',      description: 'Show keyboard shortcuts', group: 'Actions' },
  { keys: '?',          label: '?',           description: 'Show keyboard shortcuts', group: 'Actions' },

  // POS
  { keys: '/',          label: '/',           description: 'Focus drug search',      group: 'POS', scope: 'pos' },
  { keys: 'enter',      label: 'Enter',       description: 'Add top search match',   group: 'POS', scope: 'pos' },
  { keys: 'esc',        label: 'Esc',         description: 'Clear search / close',   group: 'POS', scope: 'pos' },
  { keys: 'f1',         label: 'F1',          description: 'Quantity of last line',  group: 'POS', scope: 'pos' },
  { keys: 'f2',         label: 'F2',          description: 'Price of last line',     group: 'POS', scope: 'pos' },
  { keys: 'f4',         label: 'F4',          description: 'Focus discount',         group: 'POS', scope: 'pos' },
  { keys: 'f5',         label: 'F5',          description: 'Remove last line',       group: 'POS', scope: 'pos' },
  { keys: 'f8',         label: 'F8',          description: 'Open payment',           group: 'POS', scope: 'pos' },
  { keys: 'f9',         label: 'F9',          description: 'Attach customer',        group: 'POS', scope: 'pos' },

  // List pages
  { keys: 'n',          label: 'N',           description: 'New item',               group: 'General', scope: 'list' },
  { keys: '/',          label: '/',           description: 'Focus search',           group: 'General', scope: 'list' },

  // Modal
  { keys: 'esc',        label: 'Esc',         description: 'Close dialog',           group: 'Modal', scope: 'modal' },
  { keys: 'ctrl+enter', label: 'Ctrl Enter',  description: 'Confirm / submit',       group: 'Modal', scope: 'modal' },
];

export const SHORTCUT_GROUPS: Shortcut['group'][] = [
  'Navigation',
  'Actions',
  'POS',
  'General',
  'Modal',
];

export function shortcutsByGroup(group: Shortcut['group']): Shortcut[] {
  return SHORTCUTS.filter((s) => s.group === group);
}

export function shortcutsForScope(scope: Shortcut['scope']): Shortcut[] {
  if (!scope) return SHORTCUTS;
  return SHORTCUTS.filter((s) => s.scope === scope || !s.scope);
}

export function formatKey(keys: string): string {
  const isMac =
    typeof navigator !== 'undefined' &&
    /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  return keys
    .split('+')
    .map((part) => {
      const k = part.trim().toLowerCase();
      if (k === 'ctrl' || k === 'cmd' || k === 'meta') {
        return isMac ? '⌘' : 'Ctrl';
      }
      if (k === 'shift') return isMac ? '⇧' : 'Shift';
      if (k === 'alt' || k === 'option') return isMac ? '⌥' : 'Alt';
      if (k === 'enter') return isMac ? '↩' : 'Enter';
      if (k === 'esc' || k === 'escape') return 'Esc';
      if (k === 'space') return 'Space';
      if (k === 'tab') return 'Tab';
      if (k === 'backspace') return '⌫';
      if (k === 'delete') return '⌦';
      if (/^f\d{1,2}$/.test(k)) return k.toUpperCase();
      return k.toUpperCase();
    })
    .join(isMac ? '' : ' + ');
}

export function matchesShortcut(
  e: KeyboardEvent,
  shortcut: string
): boolean {
  const parts = shortcut.toLowerCase().split('+').map((p) => p.trim());
  const key = parts[parts.length - 1];

  const needCtrl = parts.includes('ctrl') || parts.includes('cmd') || parts.includes('meta');
  const needShift = parts.includes('shift');
  const needAlt = parts.includes('alt') || parts.includes('option');

  const hasCtrl = e.ctrlKey || e.metaKey;
  const hasShift = e.shiftKey;
  const hasAlt = e.altKey;

  if (needCtrl !== hasCtrl) return false;
  if (needShift !== hasShift) return false;
  if (needAlt !== hasAlt) return false;

  const eventKey = e.key.toLowerCase();
  if (eventKey === key) return true;
  if (key === 'esc' && eventKey === 'escape') return true;
  if (key === 'enter' && eventKey === 'enter') return true;
  if (key === 'space' && eventKey === ' ') return true;

  return false;
}

export function isTypingTarget(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  if (target.isContentEditable) return true;
  return false;
}