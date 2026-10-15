// Light, dark, or follow the operating system.
//
// The chosen theme is written to <html data-theme>, which tokens.css turns into
// a color-scheme; every colour resolves from that through light-dark(). The
// same attribute is set by an inline script in index.html before the first
// paint, so a saved theme never flashes the other one on load.

export const THEMES = ['auto', 'light', 'dark'];
export const STORAGE_KEY = 'gcwind:theme';

/** The browser chrome colour, which should track whatever is actually shown. */
const THEME_COLOR = { light: '#3fa34d', dark: '#16241b' };

export function readStoredTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(saved) ? saved : 'auto';
  } catch {
    // Private mode or blocked storage: fall back to following the system.
    return 'auto';
  }
}

/** What is actually on screen, resolving "auto" against the system. */
export function resolve(theme) {
  if (theme === 'light' || theme === 'dark') return theme;
  return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/**
 * Writes the choice to the document and to storage.
 *
 * Called straight from `set`, rather than by an effect watching the store from
 * another component. A module-level $state observed across module boundaries
 * does not survive hot reloading: the toggle ends up holding one instance of
 * this module and the effect another, so clicks update the buttons while the
 * page keeps its old colours. Applying it here keeps click and effect on the
 * same path.
 */
function apply(chosen) {
  document.documentElement.dataset.theme = chosen;

  try {
    localStorage.setItem(STORAGE_KEY, chosen);
  } catch {
    // Nothing useful to do if writing fails.
  }

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', THEME_COLOR[resolve(chosen)]);
}

class Theme {
  current = $state(readStoredTheme());

  get resolved() {
    return resolve(this.current);
  }

  set(next) {
    if (!THEMES.includes(next)) return;
    this.current = next;
    apply(next);
  }
}

export const theme = new Theme();

/** Syncs the document with the stored choice, and follows the system on auto. */
export function applyTheme() {
  apply(theme.current);

  // On auto the system can change under us, so keep the chrome colour current.
  $effect(() => {
    const query = matchMedia('(prefers-color-scheme: dark)');
    const update = () => apply(theme.current);

    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  });
}
