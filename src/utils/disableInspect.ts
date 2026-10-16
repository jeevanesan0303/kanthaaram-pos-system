/**
 * Production-only protection against browser DevTools / Inspect.
 *
 * 1. Blocks right-click, F12, Ctrl+Shift+I/J/C/K, Ctrl+U, Ctrl+S
 * 2. Detects DevTools opened from the browser menu and replaces the page
 *    with a blocked screen until DevTools is closed.
 *
 * Printing (Ctrl+P, receipt Print/Enter) is NOT affected.
 * Disabled automatically in `npm run dev`.
 *
 * Note: no front-end code can make this 100% unbypassable. Keep real secrets
 * (API keys, admin logic) on the server / Supabase RLS, never in the browser.
 */

const BLOCK_ID = 'devtools-block-screen';

function showBlock(): void {
  if (document.getElementById(BLOCK_ID)) return;
  const el = document.createElement('div');
  el.id = BLOCK_ID;
  el.style.cssText =
    'position:fixed;inset:0;z-index:2147483647;background:#0b0b0b;color:#fff;' +
    'display:flex;align-items:center;justify-content:center;text-align:center;' +
    'font-family:system-ui,sans-serif;padding:24px;font-size:18px;';
  el.textContent = 'Developer tools are not allowed. Please close them to continue.';
  document.body.appendChild(el);
}

function hideBlock(): void {
  document.getElementById(BLOCK_ID)?.remove();
}

export function disableInspect(): void {
  if (import.meta.env.DEV) return;

  // --- 1. Block shortcuts and context menu --------------------------------
  document.addEventListener('contextmenu', (e) => e.preventDefault());

  document.addEventListener(
    'keydown',
    (e) => {
      const key = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      const blocked =
        e.key === 'F12' ||
        (ctrl && e.shiftKey && ['i', 'j', 'c', 'k'].includes(key)) ||
        (e.metaKey && e.altKey && ['i', 'j', 'c', 'u'].includes(key)) || // macOS
        (ctrl && key === 'u') ||
        (ctrl && key === 's');
      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );

  // --- 2. Detect DevTools opened any other way ----------------------------
  // A `debugger` statement only pauses when DevTools is open, so a long delay
  // means it is open. Built via Function() so the minifier cannot strip it.
  const trap = new Function('debugger');

  const check = () => {
    const start = performance.now();
    trap();
    const paused = performance.now() - start > 100;
    if (paused) showBlock();
    else hideBlock();
  };

  window.setInterval(check, 1000);
}