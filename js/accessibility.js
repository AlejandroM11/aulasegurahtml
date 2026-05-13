// ===== ACCESIBILIDAD — AulaSegura =====
// Opciones WCAG 2.1 AA: contraste, tamaño de texto, lector de pantalla,
// reducción de movimiento, espaciado, cursor grande, resaltado de foco.

(function initAccessibility() {

  const STORAGE_KEY = 'as_a11y';
  const DEFAULTS = {
    fontSize:       0,      // -2 / -1 / 0 / +1 / +2 (rem offset × 0.125)
    highContrast:   false,
    reducedMotion:  false,
    bigCursor:      false,
    focusHighlight: false,
    textSpacing:    false,
    screenReader:   false,  // lector de texto al hover
    dyslexiaFont:   false,
  };

  let prefs = { ...DEFAULTS };

  // ── Persistencia ──────────────────────────────────────────
  function load() {
    try { prefs = { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') }; }
    catch (_) { prefs = { ...DEFAULTS }; }
  }
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }

  // ── Aplicar preferencias al DOM ───────────────────────────
  function apply() {
    const root = document.documentElement;

    // Tamaño de fuente base
    root.style.setProperty('--a11y-font-scale', `${1 + prefs.fontSize * 0.125}`);

    // Alto contraste
    document.body.classList.toggle('a11y-high-contrast', prefs.highContrast);

    // Reducir movimiento
    document.body.classList.toggle('a11y-reduced-motion', prefs.reducedMotion);

    // Cursor grande
    document.body.classList.toggle('a11y-big-cursor', prefs.bigCursor);

    // Resaltado de foco
    document.body.classList.toggle('a11y-focus-highlight', prefs.focusHighlight);

    // Espaciado de texto
    document.body.classList.toggle('a11y-text-spacing', prefs.textSpacing);

    // Fuente dislexia
    document.body.classList.toggle('a11y-dyslexia', prefs.dyslexiaFont);

    // Lector de texto (hover)
    if (prefs.screenReader) mountScreenReader();
    else unmountScreenReader();
  }

  // ── Lector de texto al hover ──────────────────────────────
  let srTooltip = null;
  let srTimer   = null;

  function mountScreenReader() {
    if (document.getElementById('a11y-sr-tooltip')) return;
    srTooltip = document.createElement('div');
    srTooltip.id = 'a11y-sr-tooltip';
    srTooltip.setAttribute('role', 'status');
    srTooltip.setAttribute('aria-live', 'polite');
    document.body.appendChild(srTooltip);
    document.addEventListener('mouseover', onSrHover);
  }

  function unmountScreenReader() {
    document.removeEventListener('mouseover', onSrHover);
    document.getElementById('a11y-sr-tooltip')?.remove();
    srTooltip = null;
    clearTimeout(srTimer);
    window.speechSynthesis?.cancel();
  }

  function onSrHover(e) {
    const el   = e.target;
    const text = getReadableText(el);
    if (!text) return;

    // Tooltip visual
    if (srTooltip) {
      srTooltip.textContent = text;
      srTooltip.style.left  = `${Math.min(e.clientX + 14, window.innerWidth - 260)}px`;
      srTooltip.style.top   = `${e.clientY + 20}px`;
      srTooltip.style.opacity = '1';
    }

    // TTS con Web Speech API
    clearTimeout(srTimer);
    srTimer = setTimeout(() => {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang  = 'es-ES';
      utt.rate  = 1.05;
      window.speechSynthesis.speak(utt);
    }, 400);
  }

  function getReadableText(el) {
    if (!el || el === document.body) return '';
    // Ignorar el propio panel de accesibilidad
    if (el.closest('#a11y-panel') || el.closest('#a11y-btn')) return '';
    const label = el.getAttribute('aria-label')
      || el.getAttribute('title')
      || el.getAttribute('alt')
      || el.getAttribute('placeholder');
    if (label) return label;
    const text = (el.innerText || el.textContent || '').trim().slice(0, 120);
    return text.length > 2 ? text : '';
  }

  // ── Inyectar estilos ──────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('a11y-styles')) return;
    const s = document.createElement('style');
    s.id = 'a11y-styles';
    s.textContent = `
      /* Escala de fuente */
      html { font-size: calc(15px * var(--a11y-font-scale, 1)) !important; }

      /* Alto contraste */
      body.a11y-high-contrast,
      body.a11y-high-contrast .card,
      body.a11y-high-contrast .auth-card,
      body.a11y-high-contrast .modal-box {
        background: #000 !important;
        color: #fff !important;
      }
      body.a11y-high-contrast a,
      body.a11y-high-contrast button:not(.btn-primary):not(.btn-danger) {
        color: #ffff00 !important;
      }
      body.a11y-high-contrast .btn-primary { background: #0ff !important; color: #000 !important; }
      body.a11y-high-contrast input,
      body.a11y-high-contrast textarea,
      body.a11y-high-contrast select {
        background: #000 !important; color: #fff !important;
        border: 2px solid #fff !important;
      }
      body.a11y-high-contrast img { filter: contrast(1.2) brightness(1.1); }

      /* Reducir movimiento */
      body.a11y-reduced-motion *,
      body.a11y-reduced-motion *::before,
      body.a11y-reduced-motion *::after {
        animation-duration: .01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: .01ms !important;
      }

      /* Cursor grande */
      body.a11y-big-cursor,
      body.a11y-big-cursor * {
        cursor: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32' viewBox='0 0 32 32'%3E%3Cpath d='M8 2 L8 26 L14 20 L18 30 L21 29 L17 19 L25 19 Z' fill='black' stroke='white' stroke-width='2'/%3E%3C/svg%3E") 0 0, auto !important;
      }

      /* Resaltado de foco mejorado */
      body.a11y-focus-highlight *:focus,
      body.a11y-focus-highlight *:focus-visible {
        outline: 4px solid #f59e0b !important;
        outline-offset: 4px !important;
        box-shadow: 0 0 0 8px rgba(245,158,11,.25) !important;
        border-radius: 4px !important;
      }

      /* Espaciado de texto */
      body.a11y-text-spacing * {
        line-height: 1.8 !important;
        letter-spacing: .06em !important;
        word-spacing: .16em !important;
      }

      /* Fuente dislexia (OpenDyslexic via Google Fonts fallback) */
      body.a11y-dyslexia,
      body.a11y-dyslexia * {
        font-family: 'Comic Sans MS', 'Chalkboard SE', cursive !important;
        letter-spacing: .04em !important;
        word-spacing: .12em !important;
      }

      /* Tooltip lector de pantalla */
      #a11y-sr-tooltip {
        position: fixed; z-index: 9999;
        background: rgba(0,0,0,.88); color: #fff;
        font-size: .8rem; line-height: 1.4;
        padding: .45rem .75rem; border-radius: .5rem;
        max-width: 240px; pointer-events: none;
        opacity: 0; transition: opacity .15s;
        box-shadow: 0 4px 16px rgba(0,0,0,.3);
      }

      /* Botón de accesibilidad — fixed, siempre visible */
      #a11y-btn {
        position: fixed;
        bottom: 5.5rem;   /* encima del botón de ARDI */
        right: 1.5rem;
        z-index: 501;
        display: flex; align-items: center; justify-content: center;
        width: 3.25rem; height: 3.25rem;
        border-radius: 50%;
        background: linear-gradient(135deg, #38bdf8, #0ea5e9);
        border: 3px solid rgba(255,255,255,.55);
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(14,165,233,.45);
        transition: transform .2s, box-shadow .2s;
        color: #fff;
        font-size: 1.25rem;
      }
      #a11y-btn:hover {
        transform: scale(1.12);
        box-shadow: 0 6px 24px rgba(14,165,233,.6);
      }
      #a11y-btn:focus-visible {
        outline: 3px solid #f59e0b;
        outline-offset: 3px;
      }

      /* Panel de accesibilidad */
      #a11y-panel {
        position: fixed;
        bottom: 9.5rem;   /* encima del botón */
        right: 1rem;
        z-index: 600;
        width: 300px;
        background: var(--surface, #fff);
        border: 1px solid var(--border, #e2e8f0);
        border-radius: 1.1rem;
        box-shadow: 0 16px 48px rgba(0,0,0,.15);
        overflow: hidden;
        animation: a11yPanelIn .2s cubic-bezier(.34,1.56,.64,1);
        display: none;
      }
      body.dark #a11y-panel {
        background: #161b22;
        border-color: #21262d;
      }
      @keyframes a11yPanelIn {
        from { opacity: 0; transform: translateY(-8px) scale(.96); }
        to   { opacity: 1; transform: translateY(0) scale(1); }
      }
      #a11y-panel.open { display: block; }

      .a11y-panel-header {
        background: linear-gradient(135deg, #0ea5e9, #0284c7);
        padding: .9rem 1.1rem;
        display: flex; align-items: center; justify-content: space-between;
      }
      .a11y-panel-title {
        font-size: .9rem; font-weight: 700; color: #fff;
        display: flex; align-items: center; gap: .5rem;
      }
      .a11y-close-btn {
        background: rgba(255,255,255,.2); border: none;
        color: #fff; border-radius: .4rem;
        width: 1.75rem; height: 1.75rem;
        cursor: pointer; font-size: .85rem;
        display: flex; align-items: center; justify-content: center;
        transition: background .15s;
      }
      .a11y-close-btn:hover { background: rgba(255,255,255,.35); }

      .a11y-panel-body { padding: .85rem 1rem; display: flex; flex-direction: column; gap: .5rem; }

      .a11y-row {
        display: flex; align-items: center; justify-content: space-between;
        padding: .6rem .75rem;
        border-radius: .65rem;
        background: var(--gray-50, #f8fafc);
        border: 1px solid var(--border, #e2e8f0);
        gap: .75rem;
        transition: background .15s;
      }
      body.dark .a11y-row { background: #0d1117; border-color: #21262d; }
      .a11y-row:hover { background: #eff6ff; border-color: #bfdbfe; }
      body.dark .a11y-row:hover { background: #1e3a5f; border-color: #1d4ed8; }

      .a11y-row-label {
        display: flex; align-items: center; gap: .5rem;
        font-size: .82rem; font-weight: 600;
        color: var(--text-primary, #0d1117);
        flex: 1;
      }
      body.dark .a11y-row-label { color: #e6edf3; }
      .a11y-row-label i { color: #0ea5e9; font-size: .85rem; width: 1rem; text-align: center; }

      /* Toggle switch */
      .a11y-toggle {
        position: relative; width: 2.4rem; height: 1.35rem;
        flex-shrink: 0;
      }
      .a11y-toggle input { opacity: 0; width: 0; height: 0; position: absolute; }
      .a11y-toggle-track {
        position: absolute; inset: 0;
        background: #cbd5e1; border-radius: 999px;
        transition: background .2s; cursor: pointer;
      }
      .a11y-toggle input:checked + .a11y-toggle-track { background: #0ea5e9; }
      .a11y-toggle-track::after {
        content: ''; position: absolute;
        width: 1rem; height: 1rem;
        background: #fff; border-radius: 50%;
        top: .175rem; left: .175rem;
        transition: transform .2s;
        box-shadow: 0 1px 3px rgba(0,0,0,.2);
      }
      .a11y-toggle input:checked + .a11y-toggle-track::after { transform: translateX(1.05rem); }

      /* Controles de tamaño */
      .a11y-size-ctrl {
        display: flex; align-items: center; gap: .4rem; flex-shrink: 0;
      }
      .a11y-size-btn {
        width: 1.75rem; height: 1.75rem;
        border-radius: .4rem;
        border: 1.5px solid #cbd5e1;
        background: #fff; color: #374151;
        font-size: .85rem; font-weight: 700;
        cursor: pointer; display: flex; align-items: center; justify-content: center;
        transition: all .15s;
      }
      .a11y-size-btn:hover { border-color: #0ea5e9; color: #0ea5e9; background: #eff6ff; }
      body.dark .a11y-size-btn { background: #0d1117; border-color: #30363d; color: #e6edf3; }
      .a11y-size-val {
        font-size: .78rem; font-weight: 700; color: #0ea5e9;
        min-width: 1.5rem; text-align: center;
      }

      .a11y-reset-btn {
        width: 100%; padding: .55rem;
        background: transparent; border: 1.5px solid #cbd5e1;
        border-radius: .65rem; font-size: .8rem; font-weight: 600;
        color: #64748b; cursor: pointer; transition: all .15s;
        margin-top: .25rem;
      }
      .a11y-reset-btn:hover { border-color: #dc2626; color: #dc2626; background: #fef2f2; }
    `;
    document.head.appendChild(s);
  }

  // ── Construir el panel ────────────────────────────────────
  function buildPanel() {
    if (document.getElementById('a11y-panel')) return;

    const panel = document.createElement('div');
    panel.id = 'a11y-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Opciones de accesibilidad');
    panel.innerHTML = `
      <div class="a11y-panel-header">
        <span class="a11y-panel-title">
          <i class="fa-solid fa-universal-access"></i>
          Accesibilidad
        </span>
        <button class="a11y-close-btn" id="a11y-close" aria-label="Cerrar panel de accesibilidad">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
      <div class="a11y-panel-body">

        <!-- Tamaño de texto -->
        <div class="a11y-row">
          <span class="a11y-row-label">
            <i class="fa-solid fa-text-height"></i>Tamaño de texto
          </span>
          <div class="a11y-size-ctrl">
            <button class="a11y-size-btn" id="a11y-font-dec" aria-label="Reducir texto">A−</button>
            <span class="a11y-size-val" id="a11y-font-val">${prefs.fontSize > 0 ? '+' : ''}${prefs.fontSize}</span>
            <button class="a11y-size-btn" id="a11y-font-inc" aria-label="Aumentar texto">A+</button>
          </div>
        </div>

        <!-- Alto contraste -->
        <div class="a11y-row">
          <label class="a11y-row-label" for="a11y-contrast">
            <i class="fa-solid fa-circle-half-stroke"></i>Alto contraste
          </label>
          <label class="a11y-toggle">
            <input type="checkbox" id="a11y-contrast" ${prefs.highContrast ? 'checked' : ''}/>
            <span class="a11y-toggle-track"></span>
          </label>
        </div>

        <!-- Reducir movimiento -->
        <div class="a11y-row">
          <label class="a11y-row-label" for="a11y-motion">
            <i class="fa-solid fa-wind"></i>Reducir movimiento
          </label>
          <label class="a11y-toggle">
            <input type="checkbox" id="a11y-motion" ${prefs.reducedMotion ? 'checked' : ''}/>
            <span class="a11y-toggle-track"></span>
          </label>
        </div>

        <!-- Cursor grande -->
        <div class="a11y-row">
          <label class="a11y-row-label" for="a11y-cursor">
            <i class="fa-solid fa-arrow-pointer"></i>Cursor grande
          </label>
          <label class="a11y-toggle">
            <input type="checkbox" id="a11y-cursor" ${prefs.bigCursor ? 'checked' : ''}/>
            <span class="a11y-toggle-track"></span>
          </label>
        </div>

        <!-- Resaltado de foco -->
        <div class="a11y-row">
          <label class="a11y-row-label" for="a11y-focus">
            <i class="fa-solid fa-crosshairs"></i>Resaltar foco
          </label>
          <label class="a11y-toggle">
            <input type="checkbox" id="a11y-focus" ${prefs.focusHighlight ? 'checked' : ''}/>
            <span class="a11y-toggle-track"></span>
          </label>
        </div>

        <!-- Espaciado de texto -->
        <div class="a11y-row">
          <label class="a11y-row-label" for="a11y-spacing">
            <i class="fa-solid fa-align-left"></i>Mayor espaciado
          </label>
          <label class="a11y-toggle">
            <input type="checkbox" id="a11y-spacing" ${prefs.textSpacing ? 'checked' : ''}/>
            <span class="a11y-toggle-track"></span>
          </label>
        </div>

        <!-- Fuente dislexia -->
        <div class="a11y-row">
          <label class="a11y-row-label" for="a11y-dyslexia">
            <i class="fa-solid fa-font"></i>Fuente dislexia
          </label>
          <label class="a11y-toggle">
            <input type="checkbox" id="a11y-dyslexia" ${prefs.dyslexiaFont ? 'checked' : ''}/>
            <span class="a11y-toggle-track"></span>
          </label>
        </div>

        <!-- Lector de texto -->
        <div class="a11y-row">
          <label class="a11y-row-label" for="a11y-reader">
            <i class="fa-solid fa-volume-high"></i>Lector al pasar mouse
          </label>
          <label class="a11y-toggle">
            <input type="checkbox" id="a11y-reader" ${prefs.screenReader ? 'checked' : ''}/>
            <span class="a11y-toggle-track"></span>
          </label>
        </div>

        <button class="a11y-reset-btn" id="a11y-reset">
          <i class="fa-solid fa-rotate-left" style="margin-right:.4rem"></i>Restablecer todo
        </button>
      </div>
    `;
    document.body.appendChild(panel);
    bindPanelEvents();
  }

  function bindPanelEvents() {
    document.getElementById('a11y-close').onclick  = togglePanel;
    document.getElementById('a11y-reset').onclick  = resetAll;

    document.getElementById('a11y-font-inc').onclick = () => { if (prefs.fontSize < 4) { prefs.fontSize++; updateFontVal(); save(); apply(); } };
    document.getElementById('a11y-font-dec').onclick = () => { if (prefs.fontSize > -2) { prefs.fontSize--; updateFontVal(); save(); apply(); } };

    const toggleMap = {
      'a11y-contrast':  'highContrast',
      'a11y-motion':    'reducedMotion',
      'a11y-cursor':    'bigCursor',
      'a11y-focus':     'focusHighlight',
      'a11y-spacing':   'textSpacing',
      'a11y-dyslexia':  'dyslexiaFont',
      'a11y-reader':    'screenReader',
    };
    Object.entries(toggleMap).forEach(([id, key]) => {
      document.getElementById(id)?.addEventListener('change', e => {
        prefs[key] = e.target.checked;
        save(); apply();
      });
    });

    // Cerrar al hacer clic fuera
    document.addEventListener('click', outsideClick);
  }

  function outsideClick(e) {
    const panel = document.getElementById('a11y-panel');
    const btn   = document.getElementById('a11y-btn');
    if (panel && !panel.contains(e.target) && !btn?.contains(e.target)) {
      panel.classList.remove('open');
    }
  }

  function updateFontVal() {
    const el = document.getElementById('a11y-font-val');
    if (el) el.textContent = `${prefs.fontSize > 0 ? '+' : ''}${prefs.fontSize}`;
  }

  function resetAll() {
    prefs = { ...DEFAULTS };
    save(); apply();
    // Re-render panel con valores reseteados
    document.getElementById('a11y-panel')?.remove();
    document.removeEventListener('click', outsideClick);
    buildPanel();
    document.getElementById('a11y-panel').classList.add('open');
  }

  function togglePanel() {
    const panel = document.getElementById('a11y-panel');
    if (!panel) { buildPanel(); document.getElementById('a11y-panel').classList.add('open'); return; }
    panel.classList.toggle('open');
  }

  // ── Botón en el navbar ────────────────────────────────────
  function mountButton() {
    // El botón vive fuera del navbar como elemento fixed independiente
    // así nunca lo borra updateNavbar()
    if (document.getElementById('a11y-btn')) return;
    const btn = document.createElement('button');
    btn.id = 'a11y-btn';
    btn.setAttribute('aria-label', 'Opciones de accesibilidad');
    btn.setAttribute('title', 'Accesibilidad');
    btn.innerHTML = '<i class="fa-solid fa-universal-access"></i>';
    btn.onclick = (e) => { e.stopPropagation(); togglePanel(); };
    document.body.appendChild(btn);
  }

  // ── Init ──────────────────────────────────────────────────
  function init() {
    load();
    injectStyles();
    apply();

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', mountButton);
    } else {
      mountButton();
    }
  }

  init();

  // Exponer para uso externo si se necesita
  window.a11y = { toggle: togglePanel, reset: resetAll };

})();
