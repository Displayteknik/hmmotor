/* ═══════════════════════════════════════════════════════
   HM MOTOR — CMS Edit Mode
   Injected into the site iframe by admin/index.html.
   Makes elements with [data-cms] clickable & editable.
   Communicates with parent via postMessage.
   ═══════════════════════════════════════════════════════ */
(function() {
  if (window.self === window.top) return; // Only run in iframe

  // ── Styles ──
  const style = document.createElement('style');
  style.textContent = `
    [data-cms] { cursor: pointer !important; position: relative; transition: outline .12s, background .12s; }
    [data-cms]:hover { outline: 2px solid #2563eb; outline-offset: 2px; background: rgba(37,99,235,.04); border-radius: 3px; }
    [data-cms].cms-active { outline: 2px solid #2563eb; outline-offset: 2px; background: rgba(37,99,235,.06); }
    [data-cms]:hover::before {
      content: attr(data-cms-label);
      position: absolute; top: -22px; left: 0; z-index: 99999;
      background: #2563eb; color: #fff; font: 600 10px/1 Inter, sans-serif;
      padding: 3px 8px; border-radius: 3px; white-space: nowrap;
      pointer-events: none;
    }
    [data-cms-section]:hover { outline: 2px dashed #94a3b8; outline-offset: 4px; }
    .cms-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 99998; pointer-events: none; }
  `;
  document.head.appendChild(style);

  // ── Click handler ──
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-cms]');
    if (!el) return;
    e.preventDefault();
    e.stopPropagation();

    // Remove previous active
    document.querySelectorAll('.cms-active').forEach(x => x.classList.remove('cms-active'));
    el.classList.add('cms-active');

    // Send to parent
    const file = el.getAttribute('data-cms');
    const field = el.getAttribute('data-cms-field');
    const type = el.getAttribute('data-cms-type') || 'text';
    const label = el.getAttribute('data-cms-label') || field;
    const listIdx = el.getAttribute('data-cms-idx');
    const listKey = el.getAttribute('data-cms-key');

    window.parent.postMessage({
      type: 'cms-select',
      file, field, label, inputType: type,
      listIdx: listIdx !== null ? parseInt(listIdx) : null,
      listKey,
      value: type === 'img' ? el.src : el.textContent.trim(),
      rect: el.getBoundingClientRect()
    }, '*');
  }, true);

  // ── Receive updates from parent ──
  window.addEventListener('message', (e) => {
    if (!e.data || e.data.type !== 'cms-update') return;
    const { file, field, listIdx, listKey, value, inputType } = e.data;

    let selector = `[data-cms="${file}"][data-cms-field="${field}"]`;
    if (listIdx !== null && listIdx !== undefined) {
      selector += `[data-cms-idx="${listIdx}"]`;
      if (listKey) selector += `[data-cms-key="${listKey}"]`;
    }

    const el = document.querySelector(selector);
    if (!el) return;

    if (inputType === 'img') {
      el.src = value;
    } else {
      el.textContent = value;
    }
  });

  // ── Tell parent we're ready ──
  window.parent.postMessage({ type: 'cms-ready' }, '*');
})();
