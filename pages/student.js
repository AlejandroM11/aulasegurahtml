// ============================================================
//  student.js  —  AulaSegura
//  CON SOPORTE COMPLETO DE ECUACIONES (MathQuill)
//  - Muestra ecuaciones del profesor (referenceLatex)
//  - Permite al estudiante responder con teclado matemático
//  - Retroalimentación muestra respuestas tipo eq correctamente
// ============================================================

function renderStudent(app) {

  // ===== ESTADO GLOBAL =====
  let exam = null, answers = {}, timer = 0;
  let submitting = false, finished = false, submitted = false;
  let violations = [];
  let submissionData = null;

  // Mapa de campos MathQuill activos: { [questionId]: MathField }
  let mqStudentFields = {};

  let blockState = {
    isBlocked: false,
    reason: '',
    local: false,
    remote: false,
    unlocking: false,
  };

  let fraudGuard = {
    active: false,
    paused: false,
    listeners: null,
  };

  let timerInterval  = null;
  let statusInterval = null;
  let unsubBlock     = null;
  let unsubMessages  = null; // listener de respuestas del profesor
  let listenerReady  = false;
  let enteringFullscreen = false;

  const user      = getUser() || {};
  const studentId = user.uid || user.email;
  const guestCode = user.isGuest ? user.examCode : '';

  // ─────────────────────────────────────────────
  // ESTILOS GLOBALES DE LA PÁGINA ESTUDIANTE
  // ─────────────────────────────────────────────
  const STUDENT_STYLES = `
    /* Fuente unificada con el resto del sistema */
    .st-page { font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; }

    /* ── JOIN SCREEN ── */
    .join-wrap {
      min-height: 85vh;
      display: flex; align-items: center; justify-content: center;
      padding: 2rem 1rem;
      position: relative;
      overflow: hidden;
    }
    .join-bg-blob {
      position: fixed; pointer-events: none; z-index: 0;
      border-radius: 50%; filter: blur(80px); opacity: .12;
    }
    .join-card {
      background: #fff;
      border: 1px solid #e8e4df;
      border-radius: 2rem;
      padding: 2.5rem 2.25rem;
      width: 100%; max-width: 480px;
      position: relative; z-index: 1;
      box-shadow: 0 24px 64px rgba(0,0,0,.08), 0 4px 16px rgba(0,0,0,.04);
    }
    body.dark .join-card {
      background: #1a1a2e;
      border-color: #2a2a4a;
    }
    .join-logo-ring {
      width: 72px; height: 72px; border-radius: 50%;
      background: linear-gradient(135deg, #1e3a5f, #2563eb);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.5rem;
      font-size: 2rem;
      box-shadow: 0 8px 24px rgba(37,99,235,.3);
    }
    .join-title {
      font-family: 'Inter', system-ui, sans-serif; letter-spacing: -.02em;
      font-size: 2rem; font-weight: 600;
      text-align: center; line-height: 1.2;
      margin-bottom: .35rem;
      color: #0f172a;
    }
    body.dark .join-title { color: #f1f5f9; }
    .join-subtitle {
      text-align: center; color: #64748b; font-size: .9rem;
      margin-bottom: 2rem; font-weight: 300;
    }
    body.dark .join-subtitle { color: #94a3b8; }

    .st-label {
      display: block; font-size: .72rem; font-weight: 600;
      text-transform: uppercase; letter-spacing: .09em;
      color: #94a3b8; margin-bottom: .45rem;
    }
    .st-input {
      width: 100%; padding: .8rem 1rem;
      border: 1.5px solid #e2e8f0; border-radius: 1rem;
      font-size: .95rem; background: #fafaf9;
      color: #1e293b; font-family: 'Inter', system-ui, sans-serif;
      transition: all .2s;
    }
    .st-input:focus {
      outline: none; border-color: #2563eb;
      box-shadow: 0 0 0 4px rgba(37,99,235,.1);
      background: #fff;
    }
    body.dark .st-input {
      background: #0f172a; border-color: #334155; color: #e2e8f0;
    }
    .st-code-input {
      text-align: center; font-size: 1.6rem; font-weight: 700;
      letter-spacing: .2em; text-transform: uppercase;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
    }
    .st-btn-main {
      width: 100%; padding: .9rem;
      background: linear-gradient(135deg, #1e3a5f, #2563eb);
      color: #fff; border: none; border-radius: 1rem;
      font-size: 1rem; font-weight: 600;
      cursor: pointer; transition: all .22s;
      font-family: 'Inter', system-ui, sans-serif;
      letter-spacing: .01em;
    }
    .st-btn-main:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(37,99,235,.35);
    }
    .st-btn-main:disabled { opacity: .5; cursor: not-allowed; }

    .join-warnings {
      margin-top: 1.5rem; border-radius: 1rem;
      background: #fef9ee; border: 1px solid #fde68a;
      padding: 1rem 1.1rem;
    }
    body.dark .join-warnings { background: #1c1500; border-color: #92400e; }
    .join-warnings p.warn-title {
      font-size: .8rem; font-weight: 600;
      color: #92400e; margin-bottom: .5rem;
      text-transform: uppercase; letter-spacing: .07em;
    }
    body.dark .join-warnings p.warn-title { color: #fde68a; }
    .join-warnings li {
      font-size: .82rem; color: #78350f; line-height: 1.8;
    }
    body.dark .join-warnings li { color: #fde68a; opacity: .85; }

    /* ── EXAM HEADER ── */
    .st-exam-header {
      background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%);
      border-radius: 1.25rem;
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.5rem;
      position: sticky; top: 56px; z-index: 10;
      box-shadow: 0 6px 24px rgba(37,99,235,.3);
    }
    .st-exam-title {
      font-family: 'Inter', system-ui, sans-serif; letter-spacing: -.02em;
      font-size: 1.3rem; font-weight: 600;
      color: #fff; line-height: 1.2;
    }
    .st-exam-code {
      font-size: .78rem; color: rgba(255,255,255,.7);
      margin-top: .2rem;
    }
    .st-timer {
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      font-size: 2.2rem; font-weight: 700;
      color: #fff; letter-spacing: .04em;
    }
    .st-progress-bar {
      background: rgba(255,255,255,.2);
      border-radius: 999px; height: 6px; margin-top: .75rem;
    }
    .st-progress-fill {
      background: #fff;
      height: 100%; border-radius: 999px;
      transition: width .4s;
    }
    .st-progress-text {
      font-size: .72rem; color: rgba(255,255,255,.75);
      text-align: center; margin-top: .3rem;
    }

    /* ── QUESTION CARDS ── */
    .st-question-card {
      background: #fff;
      border: 1px solid #e8e4df;
      border-radius: 1.25rem;
      padding: 1.5rem;
      margin-bottom: 1rem;
      box-shadow: 0 2px 8px rgba(0,0,0,.04);
      animation: stFadeUp .35s ease both;
    }
    body.dark .st-question-card {
      background: #1e293b; border-color: #334155;
    }
    @keyframes stFadeUp {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    .st-q-number {
      display: inline-flex; align-items: center; justify-content: center;
      width: 1.9rem; height: 1.9rem; border-radius: .55rem;
      background: linear-gradient(135deg, #1e3a5f, #2563eb);
      color: #fff; font-size: .78rem; font-weight: 700;
      margin-right: .65rem; flex-shrink: 0;
    }
    .st-q-text {
      font-family: 'Inter', system-ui, sans-serif; letter-spacing: -.02em;
      font-size: 1.05rem; font-weight: 300;
      color: #1e293b; line-height: 1.5;
    }
    body.dark .st-q-text { color: #e2e8f0; }

    .st-option {
      display: flex; align-items: center; gap: .75rem;
      padding: .85rem 1rem; border-radius: .85rem;
      border: 1.5px solid #e8e4df;
      cursor: pointer; transition: all .18s;
      margin-top: .5rem;
      background: #fafaf9;
    }
    body.dark .st-option { background: #0f172a; border-color: #334155; }
    .st-option:hover { border-color: #93c5fd; background: #f0f7ff; }
    body.dark .st-option:hover { border-color: #3b82f6; background: #1e3a5f; }
    .st-option.selected {
      border-color: #2563eb;
      background: linear-gradient(135deg, #eff6ff, #f5f3ff);
      box-shadow: 0 0 0 1px #2563eb;
    }
    body.dark .st-option.selected {
      border-color: #3b82f6; background: #1e3a5f;
    }
    .st-option-letter {
      width: 1.75rem; height: 1.75rem; border-radius: .45rem;
      border: 1.5px solid #d1d5db; display: flex;
      align-items: center; justify-content: center;
      font-size: .78rem; font-weight: 700; color: #64748b;
      flex-shrink: 0; transition: all .18s;
    }
    .st-option.selected .st-option-letter {
      background: #2563eb; border-color: #2563eb; color: #fff;
    }
    .st-option-text { font-size: .9rem; color: #374151; flex: 1; }
    body.dark .st-option-text { color: #cbd5e1; }

    /* ── ECUACIONES ── */
    .eq-ref-box {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: .85rem;
      padding: .85rem 1.1rem;
      margin-bottom: 1rem;
    }
    body.dark .eq-ref-box {
      background: #1e3a5f;
      border-color: #3b82f6;
    }
    .eq-ref-label {
      font-size: .7rem; font-weight: 700; color: #1d4ed8;
      text-transform: uppercase; letter-spacing: .08em;
      margin-bottom: .45rem;
    }
    body.dark .eq-ref-label { color: #93c5fd; }
    .eq-ref-display {
      font-size: 1.15rem; color: #1e293b;
      min-height: 32px;
    }
    body.dark .eq-ref-display { color: #e2e8f0; }

    .eq-answer-label {
      font-size: .7rem; font-weight: 700; color: #64748b;
      text-transform: uppercase; letter-spacing: .08em;
      margin-bottom: .45rem;
    }
    .eq-answer-field {
      border: 1.5px solid #cbd5e1;
      border-radius: .75rem;
      padding: .65rem 1rem;
      background: #fff;
      min-height: 48px;
      font-size: 1.1rem;
      cursor: text;
      transition: border-color .2s;
    }
    .eq-answer-field:focus-within {
      border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37,99,235,.1);
    }
    body.dark .eq-answer-field {
      background: #0f172a;
      border-color: #334155;
    }
    /* MathQuill overrides */
    .eq-answer-field .mq-editable-field {
      border: none !important;
      box-shadow: none !important;
      min-width: 100%;
      font-size: 1.1rem;
    }

    .eq-keyboard {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: .85rem;
      padding: .6rem .65rem;
      display: flex;
      flex-wrap: wrap;
      gap: .3rem;
      margin-top: .6rem;
    }
    body.dark .eq-keyboard {
      background: #1e293b;
      border-color: #334155;
    }
    .eq-key {
      padding: .32rem .6rem;
      border: 1px solid #cbd5e1;
      border-radius: .4rem;
      background: #fff;
      font-size: .8rem;
      cursor: pointer;
      font-family: 'JetBrains Mono', 'Courier New', monospace;
      color: #1e293b;
      transition: all .15s;
      white-space: nowrap;
    }
    .eq-key:hover {
      background: #eff6ff;
      border-color: #3b82f6;
      color: #1d4ed8;
    }
    body.dark .eq-key {
      background: #0f172a;
      border-color: #334155;
      color: #e2e8f0;
    }
    body.dark .eq-key:hover {
      background: #1e3a5f;
      border-color: #3b82f6;
    }
    .eq-key-del {
      border-color: #fca5a5;
      color: #dc2626;
      font-weight: 700;
    }
    .eq-key-del:hover {
      background: #fef2f2 !important;
      border-color: #dc2626 !important;
      color: #dc2626 !important;
    }
    .eq-key-group-label {
      width: 100%;
      font-size: .65rem;
      font-weight: 700;
      color: #94a3b8;
      text-transform: uppercase;
      letter-spacing: .08em;
      padding: .25rem .2rem .1rem;
    }

    /* ── STICKY BAR ── */
    .st-sticky {
      position: sticky; bottom: 0;
      background: rgba(241,245,249,.95);
      backdrop-filter: blur(8px);
      padding: .9rem 1rem;
      border-radius: 1rem 1rem 0 0;
      display: flex; gap: .75rem;
      box-shadow: 0 -4px 20px rgba(0,0,0,.08);
      margin-top: 1.5rem;
    }
    body.dark .st-sticky {
      background: rgba(15,23,42,.95);
    }
    .st-btn-sec {
      flex: 1; padding: .8rem;
      background: transparent;
      border: 1.5px solid #d1d5db;
      border-radius: .85rem;
      font-size: .9rem; font-weight: 600;
      cursor: pointer; color: #374151;
      transition: all .2s; font-family: 'Inter', system-ui, sans-serif;
    }
    .st-btn-sec:hover { background: #f1f5f9; border-color: #2563eb; color: #2563eb; }
    body.dark .st-btn-sec { color: #e2e8f0; border-color: #334155; }
    body.dark .st-btn-sec:hover { background: #1e3a5f; border-color: #3b82f6; }
    .st-btn-prim {
      flex: 1; padding: .8rem;
      background: linear-gradient(135deg, #1e3a5f, #2563eb);
      border: none; border-radius: .85rem;
      font-size: .9rem; font-weight: 600;
      cursor: pointer; color: #fff;
      transition: all .2s; font-family: 'Inter', system-ui, sans-serif;
    }
    .st-btn-prim:hover:not(:disabled) {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(37,99,235,.35);
    }
    .st-btn-prim:disabled { opacity: .5; cursor: not-allowed; }

    /* ── SUCCESS SCREEN ── */
    .st-success-wrap {
      min-height: 85vh;
      display: flex; align-items: center; justify-content: center;
      padding: 2rem 1rem;
    }
    .st-success-card {
      width: 100%; max-width: 520px;
      text-align: center;
    }
    .st-success-icon-ring {
      width: 100px; height: 100px; border-radius: 50%;
      background: linear-gradient(135deg, #16a34a, #15803d);
      display: flex; align-items: center; justify-content: center;
      margin: 0 auto 1.5rem;
      font-size: 2.8rem;
      box-shadow: 0 12px 32px rgba(22,163,74,.35);
      animation: successPop .5s cubic-bezier(.34,1.56,.64,1);
    }
    @keyframes successPop {
      from { transform: scale(0); opacity: 0; }
      to   { transform: scale(1); opacity: 1; }
    }
    .st-success-title {
      font-family: 'Inter', system-ui, sans-serif; letter-spacing: -.02em;
      font-size: 2.2rem; font-weight: 600;
      color: #0f172a; margin-bottom: .5rem;
    }
    body.dark .st-success-title { color: #f1f5f9; }
    .st-success-sub {
      color: #64748b; font-size: .95rem; margin-bottom: 2rem;
    }
    body.dark .st-success-sub { color: #94a3b8; }

    .st-success-stats {
      display: grid; grid-template-columns: repeat(3,1fr); gap: .75rem;
      margin-bottom: 2rem;
    }
    .st-success-stat {
      background: #fff; border: 1px solid #e8e4df;
      border-radius: 1rem; padding: 1rem;
    }
    body.dark .st-success-stat { background: #1e293b; border-color: #334155; }
    .st-success-stat-val {
      font-family: 'Inter', system-ui, sans-serif; letter-spacing: -.02em;
      font-size: 1.8rem; font-weight: 600;
      color: #1e293b; display: block;
    }
    body.dark .st-success-stat-val { color: #f1f5f9; }
    .st-success-stat-lbl {
      font-size: .72rem; color: #94a3b8;
      text-transform: uppercase; letter-spacing: .07em;
    }

    .st-success-actions {
      display: flex; flex-direction: column; gap: .75rem;
    }
    .st-btn-retro {
      width: 100%; padding: .9rem;
      background: linear-gradient(135deg, #1e3a5f, #2563eb);
      color: #fff; border: none; border-radius: 1rem;
      font-size: .95rem; font-weight: 600;
      cursor: pointer; font-family: 'Inter', system-ui, sans-serif;
      transition: all .2s;
    }
    .st-btn-retro:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(37,99,235,.35);
    }
    .st-btn-home {
      width: 100%; padding: .85rem;
      background: transparent; border: 1.5px solid #d1d5db;
      border-radius: 1rem;
      font-size: .95rem; font-weight: 600;
      cursor: pointer; color: #374151;
      font-family: 'Inter', system-ui, sans-serif; transition: all .2s;
    }
    .st-btn-home:hover { background: #f1f5f9; border-color: #2563eb; color: #2563eb; }
    body.dark .st-btn-home { color: #e2e8f0; border-color: #334155; }
    body.dark .st-btn-home:hover { background: #1e3a5f; border-color: #3b82f6; }

    /* ── RETRO SCREEN ── */
    .st-retro-header {
      background: linear-gradient(135deg, #1e3a5f, #2563eb);
      border-radius: 1.25rem; padding: 1.5rem;
      margin-bottom: 1.5rem; text-align: center;
    }
    .st-retro-title {
      font-family: 'Inter', system-ui, sans-serif; letter-spacing: -.02em;
      font-size: 1.5rem; font-weight: 600; color: #fff;
    }
    .st-retro-score {
      font-family: 'Inter', system-ui, sans-serif; letter-spacing: -.02em;
      font-size: 3.5rem; font-weight: 700; color: #fff;
      line-height: 1; margin: .5rem 0;
    }
    .st-retro-sub { color: rgba(255,255,255,.75); font-size: .85rem; }

    .st-retro-card {
      background: #fff; border: 1px solid #e8e4df;
      border-radius: 1.25rem; padding: 1.1rem 1.25rem;
      margin-bottom: .75rem;
    }
    body.dark .st-retro-card { background: #1e293b; border-color: #334155; }
    .st-retro-card.correct { border-color: #86efac; background: #f0fdf4; }
    .st-retro-card.wrong   { border-color: #fca5a5; background: #fef2f2; }
    .st-retro-card.unanswered { border-color: #fed7aa; background: #fff7ed; }
    body.dark .st-retro-card.correct { border-color: #166534; background: #052e16; }
    body.dark .st-retro-card.wrong   { border-color: #991b1b; background: #450a0a; }
    body.dark .st-retro-card.unanswered { border-color: #92400e; background: #1c0a00; }

    .st-retro-icon {
      width: 1.75rem; height: 1.75rem; border-radius: .45rem;
      display: flex; align-items: center; justify-content: center;
      font-size: .85rem; flex-shrink: 0;
    }
    .st-retro-q-text {
      font-family: 'Inter', system-ui, sans-serif; letter-spacing: -.02em;
      font-size: .95rem; font-weight: 300;
      color: #1e293b; line-height: 1.4;
    }
    body.dark .st-retro-q-text { color: #e2e8f0; }
    .st-retro-answer-line {
      font-size: .82rem; margin-top: .4rem; color: #64748b;
    }
    body.dark .st-retro-answer-line { color: #94a3b8; }

    /* MathQuill estático en retroalimentación */
    .retro-eq-display {
      display: inline-block;
      font-size: .95rem;
      color: #1e293b;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: .5rem;
      padding: .25rem .6rem;
      margin-top: .25rem;
    }
    body.dark .retro-eq-display {
      background: #0f172a;
      border-color: #334155;
      color: #e2e8f0;
    }
  `;

  function injectStyles() {
    if (!document.getElementById('student-styles')) {
      const el = document.createElement('style');
      el.id = 'student-styles';
      el.textContent = STUDENT_STYLES;
      document.head.appendChild(el);
    }
  }

  // ─────────────────────────────────────────────
  // HELPERS MATHQUILL
  // ─────────────────────────────────────────────

  function getMQ() {
    if (window.MathQuill) return window.MathQuill.getInterface(2);
    return null;
  }

  /**
   * Renderiza un LaTeX como matemática estática (solo lectura) en un elemento.
   * Si MathQuill no está disponible, muestra el LaTeX en texto plano.
   */
  function renderStaticMath(el, latex) {
    if (!el) return;
    const MQ = getMQ();
    if (MQ) {
      try {
        el.innerHTML = '';
        MQ.StaticMath(el).latex(latex);
        return;
      } catch(e) { /* fallback */ }
    }
    // Fallback: mostrar LaTeX como código
    el.innerHTML = `<code style="font-family:monospace;font-size:.95rem;color:#1d4ed8">${safeText(latex)}</code>`;
  }

  /**
   * Crea un campo MathQuill editable y lo asocia a una pregunta.
   * Guarda la respuesta en answers[qId] como string LaTeX cada vez que cambia.
   */
  function createMathField(el, qId, initialLatex) {
    if (!el) return null;
    const MQ = getMQ();
    if (!MQ) {
      // Fallback: input de texto plano
      el.innerHTML = `<input type="text" style="width:100%;border:none;outline:none;font-size:1rem;background:transparent"
        placeholder="Escribe en LaTeX (ej: \\frac{x}{2})"
        value="${safeText(initialLatex || '')}"
        id="mq-fallback-${qId}"/>`;
      const inp = el.querySelector('input');
      if (inp) {
        inp.oninput = () => {
          answers[qId] = inp.value;
          updateTimerDisplay();
        };
      }
      return null;
    }
    try {
      el.innerHTML = '';
      const mqField = MQ.MathField(el, {
        spaceBehavesLikeTab: true,
        supSubsRequireOperand: false,
        handlers: {
          edit: () => {
            answers[qId] = mqField.latex();
            updateTimerDisplay();
          }
        }
      });
      if (initialLatex) mqField.latex(initialLatex);
      mqStudentFields[qId] = mqField;
      return mqField;
    } catch(e) {
      console.warn('MathField error:', e);
      return null;
    }
  }

  // ─────────────────────────────────────────────
  // TECLADO MATEMÁTICO ON-SCREEN — grupos de símbolos
  // ─────────────────────────────────────────────
  const EQ_KEYS = [
    {
      label: 'Básico',
      keys: [
        { show: 'x',   latex: 'x' },
        { show: 'y',   latex: 'y' },
        { show: 'z',   latex: 'z' },
        { show: 'n',   latex: 'n' },
        { show: '(',   latex: '(' },
        { show: ')',   latex: ')' },
        { show: '=',   latex: '=' },
        { show: '+',   latex: '+' },
        { show: '−',   latex: '-' },
        { show: '·',   latex: '\\cdot' },
        { show: '÷',   latex: '\\div' },
        { show: '±',   latex: '\\pm' },
      ]
    },
    {
      label: 'Fracciones y potencias',
      keys: [
        { show: 'a/b',   latex: '\\frac{□}{□}' },
        { show: 'x²',    latex: '^{2}' },
        { show: 'xⁿ',    latex: '^{□}' },
        { show: 'x₀',    latex: '_{□}' },
        { show: '√x',    latex: '\\sqrt{□}' },
        { show: '∛x',    latex: '\\sqrt[3]{□}' },
        { show: 'ⁿ√x',   latex: '\\sqrt[□]{□}' },
        { show: 'eˣ',    latex: 'e^{□}' },
      ]
    },
    {
      label: 'Trigonometría',
      keys: [
        { show: 'sin',   latex: '\\sin(□)' },
        { show: 'cos',   latex: '\\cos(□)' },
        { show: 'tan',   latex: '\\tan(□)' },
        { show: 'csc',   latex: '\\csc(□)' },
        { show: 'sec',   latex: '\\sec(□)' },
        { show: 'cot',   latex: '\\cot(□)' },
        { show: 'arcsin',latex: '\\arcsin(□)' },
        { show: 'arccos',latex: '\\arccos(□)' },
        { show: 'arctan',latex: '\\arctan(□)' },
      ]
    },
    {
      label: 'Cálculo',
      keys: [
        { show: '∫',     latex: '\\int_{□}^{□}' },
        { show: '∮',     latex: '\\oint' },
        { show: 'd/dx',  latex: '\\frac{d}{dx}' },
        { show: '∂/∂x',  latex: '\\frac{\\partial}{\\partial x}' },
        { show: 'lim',   latex: '\\lim_{x \\to □}' },
        { show: 'Σ',     latex: '\\sum_{□}^{□}' },
        { show: 'Π',     latex: '\\prod_{□}^{□}' },
        { show: "f'",    latex: "f'(□)" },
      ]
    },
    {
      label: 'Símbolos',
      keys: [
        { show: 'π',     latex: '\\pi' },
        { show: 'e',     latex: 'e' },
        { show: '∞',     latex: '\\infty' },
        { show: '≤',     latex: '\\leq' },
        { show: '≥',     latex: '\\geq' },
        { show: '≠',     latex: '\\neq' },
        { show: '≈',     latex: '\\approx' },
        { show: '|x|',   latex: '\\left|□\\right|' },
        { show: 'α',     latex: '\\alpha' },
        { show: 'β',     latex: '\\beta' },
        { show: 'γ',     latex: '\\gamma' },
        { show: 'θ',     latex: '\\theta' },
        { show: 'λ',     latex: '\\lambda' },
        { show: 'μ',     latex: '\\mu' },
        { show: 'σ',     latex: '\\sigma' },
        { show: 'Δ',     latex: '\\Delta' },
        { show: 'ω',     latex: '\\omega' },
      ]
    },
    {
      label: 'Logaritmos',
      keys: [
        { show: 'log',   latex: '\\log(□)' },
        { show: 'ln',    latex: '\\ln(□)' },
        { show: 'log₂',  latex: '\\log_{2}(□)' },
        { show: 'logₙ',  latex: '\\log_{□}(□)' },
      ]
    },
  ];

  function renderEqKeyboard(qId) {
    const groups = EQ_KEYS.map(group => `
      <span class="eq-key-group-label">${group.label}</span>
      ${group.keys.map(k => `
        <button type="button" class="eq-key"
          data-qid="${qId}"
          data-latex="${k.latex.replace(/"/g,'&quot;')}"
          title="${k.latex}"
        >${k.show}</button>
      `).join('')}
    `).join('');

    return `
      <div class="eq-keyboard" data-keyboard="${qId}">
        ${groups}
        <button type="button" class="eq-key eq-key-del"
          data-qid="${qId}" data-action="backspace">⌫ Borrar</button>
        <button type="button" class="eq-key"
          style="border-color:#86efac;color:#16a34a"
          data-qid="${qId}" data-action="clear">✕ Limpiar</button>
      </div>
    `;
  }

  function bindKeyboardEvents(container) {
    container.querySelectorAll('.eq-key').forEach(btn => {
      btn.addEventListener('mousedown', e => {
        e.preventDefault(); // evitar que el campo de MQ pierda foco
        const qId   = btn.dataset.qid;
        const latex = btn.dataset.latex;
        const action = btn.dataset.action;
        const mq = mqStudentFields[qId];

        if (action === 'backspace') {
          if (mq) { mq.keystroke('Backspace'); mq.focus(); }
          else {
            const inp = document.getElementById(`mq-fallback-${qId}`);
            if (inp) { inp.focus(); }
          }
          return;
        }
        if (action === 'clear') {
          if (mq) { mq.latex(''); mq.focus(); answers[qId] = ''; }
          else {
            const inp = document.getElementById(`mq-fallback-${qId}`);
            if (inp) { inp.value = ''; answers[qId] = ''; }
          }
          updateTimerDisplay();
          return;
        }
        if (latex && mq) {
          mq.write(latex);
          mq.focus();
        }
      });
    });
  }

  // ─────────────────────────────────────────────
  // RENDER DE CADA PREGUNTA
  // ─────────────────────────────────────────────
  function renderQuestion(q, idx) {
    const answer = answers[q.id];

    // ── OPCIÓN MÚLTIPLE ──
    if (q.type === 'mc') {
      return `
        <div class="st-question-card" style="animation-delay:${idx * 0.05}s">
          <div style="display:flex;align-items:flex-start;gap:.65rem;margin-bottom:1rem">
            <span class="st-q-number">${idx + 1}</span>
            <p class="st-q-text">${safeText(q.text)}</p>
          </div>
          <div>
            ${(q.options || []).map((opt, i) => `
              <label id="lbl-${q.id}-${i}" class="st-option${answer === i ? ' selected' : ''}" style="cursor:pointer">
                <input type="radio" id="opt-${q.id}-${i}" name="q-${q.id}" value="${i}"
                  ${answer === i ? 'checked' : ''} style="display:none"/>
                <span class="st-option-letter">${String.fromCharCode(65 + i)}</span>
                <span class="st-option-text">${safeText(opt)}</span>
              </label>
            `).join('')}
          </div>
        </div>
      `;
    }

    // ── ECUACIÓN ──
    if (q.type === 'eq') {
      const hasRef = q.referenceLatex && q.referenceLatex.trim();
      return `
        <div class="st-question-card" style="animation-delay:${idx * 0.05}s">
          <div style="display:flex;align-items:flex-start;gap:.65rem;margin-bottom:1rem">
            <span class="st-q-number">${idx + 1}</span>
            <p class="st-q-text">${safeText(q.text)}</p>
          </div>

          ${hasRef ? `
            <div class="eq-ref-box">
              <p class="eq-ref-label">📐 Referencia del profesor</p>
              <div class="eq-ref-display" id="eq-ref-${q.id}"></div>
            </div>
          ` : ''}

          <p class="eq-answer-label">✏️ Tu respuesta</p>
          <div class="eq-answer-field" id="eq-field-${q.id}"></div>

          ${renderEqKeyboard(q.id)}
        </div>
      `;
    }

    // ── ABIERTA (texto libre) ──
    return `
      <div class="st-question-card" style="animation-delay:${idx * 0.05}s">
        <div style="display:flex;align-items:flex-start;gap:.65rem;margin-bottom:1rem">
          <span class="st-q-number">${idx + 1}</span>
          <p class="st-q-text">${safeText(q.text)}</p>
        </div>
        <textarea class="st-input" id="open-${q.id}" rows="3"
          placeholder="Escribe tu respuesta aquí..."
          style="resize:vertical;min-height:80px"
        >${safeText(answer || '')}</textarea>
      </div>
    `;
  }

  // ─────────────────────────────────────────────
  // INICIALIZAR MATHQUILL EN EL DOM (después de render)
  // ─────────────────────────────────────────────
  function initMathFields(questions) {
    mqStudentFields = {};
    questions.forEach(q => {
      if (q.type !== 'eq') return;

      // Referencia del profesor (solo lectura)
      if (q.referenceLatex && q.referenceLatex.trim()) {
        const refEl = document.getElementById(`eq-ref-${q.id}`);
        renderStaticMath(refEl, q.referenceLatex);
      }

      // Campo editable del estudiante
      const fieldEl = document.getElementById(`eq-field-${q.id}`);
      createMathField(fieldEl, q.id, answers[q.id] || '');
    });

    // Eventos de teclado para todos los teclados del DOM
    document.querySelectorAll('.eq-keyboard').forEach(kb => bindKeyboardEvents(kb));
  }

  // ─────────────────────────────────────────────
  // PANTALLA: UNIRSE
  // ─────────────────────────────────────────────
  function showJoin() {
    injectStyles();
    app.innerHTML = `
      <div class="st-page join-wrap">
        <div class="join-bg-blob" style="width:500px;height:500px;background:#2563eb;top:-100px;right:-150px"></div>
        <div class="join-bg-blob" style="width:400px;height:400px;background:#7c3aed;bottom:-80px;left:-120px"></div>

        <div class="join-card">
          <div class="join-logo-ring">📋</div>
          <h1 class="join-title">Aula Segura</h1>
          <p class="join-subtitle">Ingresa el código de tu examen para comenzar</p>

          <div style="margin-bottom:1.25rem">
            <label class="st-label">Tu nombre completo</label>
            <input class="st-input" type="text" id="join-name" placeholder="Ej: Camila Torres"
              value="${user.name || ''}" maxlength="60" autocomplete="off"/>
          </div>

          <div style="margin-bottom:1.5rem">
            <label class="st-label">Código del examen</label>
            <input class="st-input st-code-input" type="text" id="exam-code"
              placeholder="XXXXX" value="${guestCode}" maxlength="10" autocomplete="off"/>
          </div>

          <button class="st-btn-main" id="join-btn">
            Iniciar examen →
          </button>

          <div class="join-warnings">
            <p class="warn-title">⚠ Antes de comenzar</p>
            <ul style="list-style:none;padding:0;margin:0">
              <li>• Serás monitoreado en tiempo real</li>
              <li>• No salgas de la ventana del examen</li>
              <li>• No presiones Escape ni salgas de pantalla completa</li>
              <li>• Solo el docente puede desbloquearte si eres bloqueado</li>
            </ul>
          </div>

          ${user.role === 'estudiante' ? '' : `
            <p style="text-align:center;margin-top:1.25rem;font-size:.82rem;color:#94a3b8">
              ¿Tienes cuenta? <a href="#/login" style="color:#2563eb;font-weight:600;text-decoration:none">Iniciar sesión</a>
            </p>
          `}
        </div>
      </div>
    `;

    const codeInput = document.getElementById('exam-code');
    codeInput.oninput = () => { codeInput.value = codeInput.value.toUpperCase(); };
    codeInput.addEventListener('keydown', e => { if (e.key === 'Enter') joinExam(); });
    document.getElementById('join-btn').onclick = joinExam;
    if (guestCode) joinExam();
  }

  async function joinExam() {
    const name = document.getElementById('join-name')?.value.trim();
    const code = document.getElementById('exam-code')?.value?.trim().toUpperCase();

    if (!code) { alert('Por favor ingresa un código'); return; }
    if (name && name.length >= 2) {
      const storedUser = getUser();
      if (storedUser && !storedUser.name) setUser({ ...storedUser, name });
      else if (!storedUser) setUser({ uid: guestUid?.() || `g_${Date.now()}`, name, email: `inv_${Date.now()}@tmp.local`, role: 'estudiante', isGuest: true });
    }

    const btn = document.getElementById('join-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Buscando examen...'; }
    try {
      const res = await apiGetExamByCode(code);
      if (res?.ok && res.exam) {
        exam = res.exam;
        answers = {}; violations = [];
        blockState = { isBlocked: false, reason: '', local: false, remote: false, unlocking: false };
        fraudGuard = { active: false, paused: false, listeners: null };
        submitted = false; finished = false; submitting = false;
        submissionData = null;
        listenerReady = false;
        startExam();
      } else {
        alert('❌ Código inválido');
        if (btn) { btn.disabled = false; btn.textContent = 'Iniciar examen →'; }
      }
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || err.message));
      if (btn) { btn.disabled = false; btn.textContent = 'Iniciar examen →'; }
    }
  }

  // ─────────────────────────────────────────────
  // INICIO DEL EXAMEN
  // ─────────────────────────────────────────────
  function startExam() {
    timer = (exam.durationMinutes || 0) * 60;

    registerActiveStudent(exam.code, {
      uid: studentId, email: user.email, name: user.name, timeLeft: timer
    }).catch(() => {});

    unsubBlock = listenToBlockStatus(exam.code, studentId, onRemoteBlockChange);
    statusInterval = setInterval(syncStatus, 5000);

    requestFullscreen();
    startTimer();
    mountFraudGuard();
    showExam();
  }

  function requestFullscreen() {
    enteringFullscreen = true;
    const el = document.documentElement;
    const promise = el.requestFullscreen?.() || el.webkitRequestFullscreen?.() || el.mozRequestFullScreen?.();
    // Limpiar el flag una vez que la transición termina (o tras timeout de seguridad)
    const clearFlag = () => { enteringFullscreen = false; };
    if (promise && typeof promise.then === 'function') {
      promise.then(clearFlag).catch(clearFlag);
    } else {
      setTimeout(clearFlag, 800);
    }
  }

  function exitFullscreen() {
    if (document.exitFullscreen)            document.exitFullscreen().catch(() => {});
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
    else if (document.mozCancelFullScreen)  document.mozCancelFullScreen();
  }

  // ─────────────────────────────────────────────
  // CAMBIO REMOTO DE BLOQUEO
  // ─────────────────────────────────────────────
  function onRemoteBlockChange(isBlocked, reason) {
    if (!listenerReady) { listenerReady = true; return; }
    if (isBlocked && !blockState.remote) {
      blockState.remote = true; blockState.isBlocked = true;
      blockState.reason = safeText(reason || 'Bloqueado por el profesor');
      pauseFraudGuard(); stopTimer(); showBlocked();
    } else if (!isBlocked && blockState.remote) {
      handleUnlock();
    }
  }

  function handleUnlock() {
    blockState.unlocking = true;
    blockState.remote = false; blockState.local = false;
    blockState.isBlocked = false; blockState.reason = '';
    blockState.unlocking = false;
    // Detener listener de mensajes al salir de la pantalla de bloqueo
    if (unsubMessages) { try { unsubMessages(); } catch (_) {} unsubMessages = null; }
    if (submitted || finished) return;
    showReturnToFullscreenScreen();
  }

  function showReturnToFullscreenScreen() {
    app.innerHTML = `
      <div style="
        position:fixed;inset:0;z-index:9999;
        background:linear-gradient(135deg,#1e3a5f,#2563eb);
        display:flex;align-items:center;justify-content:center;
        padding:1rem;
      ">
        <div style="
          background:#fff;border-radius:1.5rem;
          padding:2.5rem 2.5rem;max-width:560px;width:100%;
          text-align:center;
          box-shadow:0 24px 64px rgba(0,0,0,.25);
        ">
          <div style="
            width:72px;height:72px;border-radius:50%;
            background:linear-gradient(135deg,#16a34a,#15803d);
            display:flex;align-items:center;justify-content:center;
            margin:0 auto 1.25rem;font-size:2rem;
            box-shadow:0 8px 24px rgba(22,163,74,.35);
          ">✅</div>

          <h2 style="
            font-family:'Inter',system-ui,sans-serif;letter-spacing:-.02em;
            font-size:1.5rem;font-weight:600;
            color:#0f172a;margin-bottom:.5rem;
          ">Has sido desbloqueado</h2>

          <p style="color:#64748b;font-size:.9rem;margin-bottom:2rem;line-height:1.6">
            El docente te ha desbloqueado.<br/>
            Para continuar el examen debes volver a pantalla completa.
          </p>

          <button id="reenter-fs-btn" style="
            width:100%;padding:.95rem;
            background:linear-gradient(135deg,#1e3a5f,#2563eb);
            color:#fff;border:none;border-radius:1rem;
            font-size:1rem;font-weight:600;cursor:pointer;
            font-family:'Inter',system-ui,sans-serif;
            transition:all .2s;
          ">
            Volver a pantalla completa →
          </button>

          <p style="margin-top:1rem;font-size:.78rem;color:#94a3b8">
            Debes hacer clic para activar el modo examen seguro
          </p>
        </div>
      </div>
    `;

    document.getElementById('reenter-fs-btn').onclick = reEnterFullscreen;
  }

  function reEnterFullscreen() {
    requestFullscreen();
    resumeFraudGuard();
    if (!timerInterval && timer > 0) startTimer();
    showExam();
  }

  // ─────────────────────────────────────────────
  // ANTIFRAUDE
  // ─────────────────────────────────────────────
  function mountFraudGuard() {
    if (fraudGuard.listeners) removeFraudListeners();

    const BLOCKED_KEYS = {
      'Escape': 'Presionaste Escape',
      'F11': 'Intentaste cambiar pantalla completa (F11)',
      'F12': 'Intentaste abrir DevTools (F12)',
      'PrintScreen': 'Intentaste tomar captura de pantalla',
    };

    const onKey = (e) => {
      if (!fraudGuard.active || fraudGuard.paused) return;
      if (BLOCKED_KEYS[e.key]) { e.preventDefault(); e.stopPropagation(); triggerFraudBlock(BLOCKED_KEYS[e.key]); return; }
      if (e.key === 'Meta' || e.metaKey) { e.preventDefault(); triggerFraudBlock('Presionaste la tecla Windows/Meta'); }
      else if (e.altKey && e.key === 'Tab') { e.preventDefault(); triggerFraudBlock('Intentaste cambiar de ventana (Alt+Tab)'); }
      else if (e.ctrlKey && e.shiftKey && (e.key === 'Escape' || e.key === 'I' || e.key === 'J')) { e.preventDefault(); triggerFraudBlock('Intentaste abrir herramientas del navegador'); }
      else if (e.ctrlKey && e.key === 'p') { e.preventDefault(); triggerFraudBlock('Intentaste imprimir (Ctrl+P)'); }
      else if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) { e.preventDefault(); triggerFraudBlock('Intentaste copiar contenido'); }
      else if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) { e.preventDefault(); triggerFraudBlock('Intentaste ver el código fuente'); }
    };
    const onBlur = () => {
      if (!fraudGuard.active || fraudGuard.paused || enteringFullscreen) return;
      triggerFraudBlock('Saliste de la ventana del examen');
    };
    const onVisibility = () => {
      if (!fraudGuard.active || fraudGuard.paused || enteringFullscreen) return;
      if (document.hidden) triggerFraudBlock('Cambiaste de pestaña o minimizaste el navegador');
    };
    const onFullscreen = () => {
      if (!fraudGuard.active || fraudGuard.paused || enteringFullscreen) return;
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        triggerFraudBlock('Saliste del modo pantalla completa');
      }
    };
    const onContext = (e) => {
      // Permitir clic derecho dentro de campos MathQuill para no bloquear al escribir
      const isMathField = e.target.closest('.mq-editable-field');
      if (!isMathField) e.preventDefault();
      if (!fraudGuard.active || fraudGuard.paused || isMathField) return;
      addViolation('Intentaste abrir el menú contextual (clic derecho)');
    };
    const onCopy = (e) => { e.preventDefault(); if (!fraudGuard.active || fraudGuard.paused) return; triggerFraudBlock('Intentaste copiar contenido del examen'); };
    const onCut = (e) => { e.preventDefault(); if (!fraudGuard.active || fraudGuard.paused) return; addViolation('Intentaste cortar contenido'); };
    const onSelectAll = (e) => {
      if (!fraudGuard.active || fraudGuard.paused) return;
      if (e.ctrlKey && (e.key === 'a' || e.key === 'A')) {
        const tag = document.activeElement?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') { e.preventDefault(); addViolation('Intentaste seleccionar todo el contenido'); }
      }
    };

    document.addEventListener('keydown', onKey, { capture: true });
    document.addEventListener('keydown', onSelectAll, { capture: true });
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreen);
    document.addEventListener('webkitfullscreenchange', onFullscreen);
    document.addEventListener('contextmenu', onContext, { capture: true });
    document.addEventListener('copy', onCopy, { capture: true });
    document.addEventListener('cut', onCut, { capture: true });

    fraudGuard.listeners = () => {
      document.removeEventListener('keydown', onKey, { capture: true });
      document.removeEventListener('keydown', onSelectAll, { capture: true });
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('webkitfullscreenchange', onFullscreen);
      document.removeEventListener('contextmenu', onContext, { capture: true });
      document.removeEventListener('copy', onCopy, { capture: true });
      document.removeEventListener('cut', onCut, { capture: true });
    };

    fraudGuard.active = true; fraudGuard.paused = false;
    window.onbeforeunload = () => { if (exam && !finished) removeActiveStudent(exam.code, studentId).catch(() => {}); };
  }

  function removeFraudListeners() {
    if (fraudGuard.listeners) { fraudGuard.listeners(); fraudGuard.listeners = null; }
    fraudGuard.active = false;
  }
  function pauseFraudGuard() { fraudGuard.paused = true; }
  function resumeFraudGuard() { fraudGuard.paused = false; fraudGuard.active = true; }

  async function triggerFraudBlock(reason) {
    if (blockState.isBlocked || blockState.unlocking || submitted || finished) return;
    blockState.isBlocked = true; blockState.local = true; blockState.reason = safeText(reason);
    pauseFraudGuard(); stopTimer(); addViolation(reason);
    try { await blockStudent(exam.code, studentId, reason); } catch (_) {}
    showBlocked();
  }

  async function addViolation(reason) {
    violations.push({ reason, timestamp: new Date().toISOString() });
    try { await updateStudentStatus(exam.code, studentId, { violations: violations.length, lastViolation: reason }); } catch (_) {}
  }

  // ─────────────────────────────────────────────
  // TIMER
  // ─────────────────────────────────────────────
  function startTimer() {
    stopTimer();
    timerInterval = setInterval(() => {
      timer--;
      updateTimerDisplay();
      if (timer <= 0) { stopTimer(); if (!submitted) finishExam(true); }
    }, 1000);
  }

  function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  function updateTimerDisplay() {
    const timerEl = document.getElementById('exam-timer');
    const fillEl  = document.getElementById('st-progress-fill');
    const textEl  = document.getElementById('st-progress-text');
    const answered = countAnswered();
    const total    = exam?.questions?.length || 0;
    if (timerEl) {
      timerEl.textContent = fmt(timer);
      timerEl.style.color = timer < 120 ? '#fca5a5' : '#fff';
    }
    if (fillEl)  fillEl.style.width = `${total ? (answered / total) * 100 : 0}%`;
    if (textEl)  textEl.textContent = `${answered} de ${total} respondidas`;
  }

  function countAnswered() {
    return Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== '').length;
  }

  function syncStatus() {
    if (!exam) return;
    updateStudentStatus(exam.code, studentId, {
      timeLeft: timer, answeredCount: countAnswered(),
      violations: violations.length, lastActivity: Date.now()
    }).catch(() => {});
  }

  // ─────────────────────────────────────────────
  // ENVÍO DEL EXAMEN
  // ─────────────────────────────────────────────
  async function finishExam(forced) {
    if (!exam || submitted || submitting) return;
    submitted = true; submitting = true;

    stopTimer();
    if (statusInterval) { clearInterval(statusInterval); statusInterval = null; }
    removeFraudListeners();
    if (unsubBlock) { try { unsubBlock(); } catch (_) {} unsubBlock = null; }
    try { await removeActiveStudent(exam.code, studentId); } catch (_) {}

    const submission = {
      examId: exam.id, code: exam.code, title: exam.title,
      studentEmail: user.email || 'anónimo', studentName: user.name || 'Estudiante',
      submittedAt: new Date().toISOString(),
      answers: Object.fromEntries(Object.entries(answers).filter(([, v]) => v !== undefined && v !== '')),
      violations, wasBlocked: blockState.isBlocked,
      blockReason: blockState.reason || null, forced
    };

    try {
      await apiCreateSubmission(submission);
      finished = true;
      exitFullscreen();
      submissionData = submission;
      showSuccess(forced);
    } catch {
      submitted = false; submitting = false;
      alert('❌ Error al enviar el examen. Intenta de nuevo.');
    }
  }

  function resetExam() {
    if (exam) removeActiveStudent(exam.code, studentId).catch(() => {});
    exam = null; answers = {}; timer = 0;
    finished = false; submitted = false; submitting = false;
    violations = []; submissionData = null;
    mqStudentFields = {};
    blockState = { isBlocked: false, reason: '', local: false, remote: false, unlocking: false };
    stopTimer();
    if (statusInterval)  { clearInterval(statusInterval); statusInterval = null; }
    if (unsubBlock)      { try { unsubBlock(); }      catch (_) {} unsubBlock = null; }
    if (unsubMessages)   { try { unsubMessages(); }   catch (_) {} unsubMessages = null; }
    removeFraudListeners();
    window.onbeforeunload = null;
    listenerReady = false;
    enteringFullscreen = false;
    showJoin();
  }

  // ─────────────────────────────────────────────
  // PANTALLA BLOQUEADO
  // ─────────────────────────────────────────────
  function showBlocked() {
    injectStyles();
    app.innerHTML = `
      <div class="blocked-screen" style="align-items:flex-start;overflow-y:auto;padding:2rem 1rem">
        <div style="max-width:560px;width:100%;margin:auto">

          <!-- Cabecera -->
          <div style="text-align:center;margin-bottom:1.5rem">
            <div style="
              width:80px;height:80px;border-radius:50%;
              background:rgba(255,255,255,.15);
              border:3px solid rgba(255,255,255,.4);
              display:flex;align-items:center;justify-content:center;
              margin:0 auto 1rem;font-size:2.5rem;
            ">🚫</div>
            <h1 style="
              font-family:'Inter',system-ui,sans-serif;letter-spacing:-.02em;
              font-size:clamp(1.75rem,5vw,2.5rem);
              font-weight:600;margin:0 0 .5rem;
            ">Examen bloqueado</h1>
            <p style="opacity:.8;font-size:.9rem">
              El docente ha sido notificado. Solo él puede desbloquearte.
            </p>
          </div>

          <!-- Razón -->
          <div style="
            background:rgba(255,255,255,.15);
            border:1px solid rgba(255,255,255,.3);
            border-radius:1rem;padding:1rem 1.25rem;margin-bottom:1rem;
          ">
            <p style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.09em;opacity:.7;margin-bottom:.35rem">
              Razón del bloqueo
            </p>
            <p style="font-size:.95rem">${safeText(blockState.reason)}</p>
          </div>

          <!-- Historial de infracciones -->
          ${violations.length > 0 ? `
            <div style="
              background:rgba(255,255,255,.1);border-radius:1rem;
              padding:1rem;margin-bottom:1rem;
              max-height:160px;overflow-y:auto;text-align:left;
            ">
              <p style="font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.09em;opacity:.7;margin-bottom:.5rem">
                Infracciones (${violations.length})
              </p>
              ${violations.map((v, i) => `
                <div style="
                  font-size:.82rem;background:rgba(255,255,255,.1);
                  padding:.45rem .75rem;border-radius:.5rem;margin-bottom:.35rem;
                "><b>${i + 1}.</b> ${safeText(v.reason)}</div>
              `).join('')}
            </div>
          ` : ''}

          <!-- Conversación con el docente -->
          <div style="
            background:rgba(255,255,255,.12);
            border:1px solid rgba(255,255,255,.25);
            border-radius:1rem;padding:1.25rem;margin-bottom:1rem;
          ">
            <p style="font-size:.8rem;font-weight:700;text-transform:uppercase;letter-spacing:.09em;opacity:.8;margin-bottom:.75rem">
              <i class="fa-solid fa-comments" style="margin-right:.4rem"></i>
              Mensajes con el docente
            </p>

            <!-- Hilo de mensajes (se actualiza en tiempo real) -->
            <div id="msg-thread" style="
              max-height:220px;overflow-y:auto;
              display:flex;flex-direction:column;gap:.5rem;
              margin-bottom:.75rem;
            "></div>

            <!-- Input para enviar -->
            <textarea
              id="msg-text"
              rows="2"
              placeholder="Explica tu situación al docente..."
              style="
                width:100%;padding:.75rem 1rem;
                border-radius:.75rem;border:1.5px solid rgba(255,255,255,.3);
                background:rgba(255,255,255,.15);
                color:#fff;font-size:.9rem;resize:none;
                font-family:'Inter',system-ui,sans-serif;
                box-sizing:border-box;
              "
            ></textarea>
            <p id="msg-feedback" style="font-size:.8rem;margin-top:.4rem;min-height:1.2em;opacity:.85"></p>
            <button id="msg-send" style="
              width:100%;margin-top:.5rem;padding:.8rem;
              background:#fff;color:#dc2626;
              border:none;border-radius:.85rem;
              font-size:.9rem;font-weight:700;cursor:pointer;
              font-family:'Inter',system-ui,sans-serif;
              transition:opacity .2s;
            ">
              <i class="fa-solid fa-paper-plane" style="margin-right:.4rem"></i>
              Enviar mensaje
            </button>
          </div>

          <!-- Info -->
          <div style="
            background:rgba(255,255,255,.08);
            border-radius:.85rem;padding:.85rem 1rem;
            font-size:.8rem;line-height:1.9;opacity:.85;
          ">
            <p>• Tu progreso está guardado</p>
            <p>• Solo el docente puede desbloquearte</p>
            <p>• Las respuestas del docente aparecen arriba en tiempo real</p>
          </div>

        </div>
      </div>
    `;

    bindBlockScreenEvents();
    startMessageListener();
  }

  /** Renderiza el hilo de mensajes en la pantalla de bloqueo */
  function renderMessageThread(msgs) {
    const thread = document.getElementById('msg-thread');
    if (!thread) return;

    // Filtrar solo los mensajes de este estudiante
    const mine = msgs.filter(m => m.studentUid === studentId);

    if (mine.length === 0) {
      thread.innerHTML = `
        <p style="font-size:.78rem;opacity:.6;text-align:center;padding:.5rem 0">
          Aún no has enviado mensajes. Escribe abajo para contactar al docente.
        </p>`;
      return;
    }

    thread.innerHTML = mine.map(m => `
      <!-- Mensaje del estudiante -->
      <div style="display:flex;justify-content:flex-end">
        <div style="
          background:rgba(255,255,255,.2);
          border-radius:.85rem .85rem 0 .85rem;
          padding:.55rem .85rem;max-width:85%;
          font-size:.85rem;color:#fff;
        ">
          <p>${safeText(m.message)}</p>
          <p style="font-size:.68rem;opacity:.6;margin-top:.2rem;text-align:right">
            ${fmtTs(m.timestamp)}
          </p>
        </div>
      </div>
      <!-- Respuesta del docente (si existe) -->
      ${m.response ? `
        <div style="display:flex;justify-content:flex-start">
          <div style="
            background:#fff;
            border-radius:.85rem .85rem .85rem 0;
            padding:.55rem .85rem;max-width:85%;
            font-size:.85rem;color:#1e293b;
            box-shadow:0 2px 8px rgba(0,0,0,.15);
          ">
            <p style="font-size:.68rem;font-weight:700;color:#2563eb;margin-bottom:.2rem">
              <i class="fa-solid fa-chalkboard-user" style="margin-right:.3rem"></i>Docente
            </p>
            <p>${safeText(m.response)}</p>
            <p style="font-size:.68rem;opacity:.5;margin-top:.2rem">
              ${fmtTs(m.respondedAt)}
            </p>
          </div>
        </div>
      ` : ''}
    `).join('');

    // Scroll al final para ver el mensaje más reciente
    thread.scrollTop = thread.scrollHeight;
  }

  /** Inicia el listener de mensajes para mostrar respuestas del docente */
  function startMessageListener() {
    if (unsubMessages) { try { unsubMessages(); } catch (_) {} }
    if (!exam?.code) return;
    unsubMessages = listenToMessages(exam.code, (msgs) => {
      renderMessageThread(msgs);
    });
  }

  function bindBlockScreenEvents() {
    const sendBtn  = document.getElementById('msg-send');
    const textarea = document.getElementById('msg-text');
    const feedback = document.getElementById('msg-feedback');

    sendBtn.onclick = async () => {
      const msg = textarea.value.trim();
      if (!msg) {
        feedback.style.color = '#fca5a5';
        feedback.textContent = 'Escribe un mensaje antes de enviar.';
        return;
      }
      sendBtn.disabled = true;
      sendBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:.4rem"></i>Enviando...';
      feedback.textContent = '';
      try {
        await sendMessageToTeacher(
          exam.code, studentId, msg,
          user.name || 'Estudiante',
          user.email || ''
        );
        textarea.value = '';
        feedback.style.color = '#86efac';
        feedback.textContent = '✔ Mensaje enviado. El docente lo recibirá en tiempo real.';
        sendBtn.innerHTML = '<i class="fa-solid fa-check" style="margin-right:.4rem"></i>Enviado';
        setTimeout(() => {
          sendBtn.disabled = false;
          sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane" style="margin-right:.4rem"></i>Enviar otro mensaje';
          feedback.textContent = '';
        }, 3000);
      } catch (err) {
        feedback.style.color = '#fca5a5';
        feedback.textContent = '❌ Error al enviar: ' + (err?.message || 'intenta de nuevo');
        sendBtn.disabled = false;
        sendBtn.innerHTML = '<i class="fa-solid fa-paper-plane" style="margin-right:.4rem"></i>Enviar mensaje';
      }
    };
  }

  // ─────────────────────────────────────────────
  // PANTALLA ÉXITO
  // ─────────────────────────────────────────────
  function showSuccess(forced) {
    injectStyles();
    const questions = Array.isArray(exam?.questions) ? exam.questions : [];
    const mc = questions.filter(q => q.type === 'mc');
    const correct = mc.filter(q => answers[q.id] !== undefined && Number(answers[q.id]) === q.correctIndex).length;
    const pct = mc.length ? Math.round((correct / mc.length) * 100) : null;
    const answered = countAnswered();

    app.innerHTML = `
      <div class="st-page st-success-wrap">
        <div class="st-success-card">
          <div class="st-success-icon-ring">✅</div>

          <h1 class="st-success-title">¡Examen enviado!</h1>
          <p class="st-success-sub">
            ${forced ? 'El tiempo se agotó y tu examen fue enviado automáticamente.' : 'Tus respuestas han sido guardadas correctamente.'}
          </p>

          <div class="st-success-stats">
            <div class="st-success-stat">
              <span class="st-success-stat-val">${answered}</span>
              <span class="st-success-stat-lbl">Respondidas</span>
            </div>
            <div class="st-success-stat">
              <span class="st-success-stat-val">${violations.length}</span>
              <span class="st-success-stat-lbl">Infracciones</span>
            </div>
            <div class="st-success-stat">
              <span class="st-success-stat-val">${pct !== null ? pct + '%' : '—'}</span>
              <span class="st-success-stat-lbl">Resultado MC</span>
            </div>
          </div>

          <div class="st-success-actions">
            ${exam?.showCorrectAnswers && mc.length > 0 ? `
              <button class="st-btn-retro" id="ver-retro-btn">
                📊 Ver retroalimentación del examen
              </button>
            ` : `
              <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:1rem;padding:1rem;font-size:.85rem;color:#92400e;text-align:center">
                🔒 El docente no habilitó la retroalimentación para este examen
              </div>
            `}
            <button class="st-btn-home" id="volver-inicio-btn">
              ← Volver a la página principal
            </button>
          </div>
        </div>
      </div>
    `;

    const retroBtn = document.getElementById('ver-retro-btn');
    if (retroBtn) retroBtn.onclick = () => showRetroalimentacion();

    document.getElementById('volver-inicio-btn').onclick = () => {
      const u = getUser();
      if (u?.isGuest) { logout?.(); navigate('/'); }
      else { resetExam(); }
    };
  }

  // ─────────────────────────────────────────────
  // PANTALLA RETROALIMENTACIÓN
  // ─────────────────────────────────────────────
  function showRetroalimentacion() {
    injectStyles();
    const questions = Array.isArray(exam?.questions) ? exam.questions : [];
    const mc = questions.filter(q => q.type === 'mc');
    const correct = mc.filter(q => answers[q.id] !== undefined && Number(answers[q.id]) === q.correctIndex).length;
    const pct = mc.length ? Math.round((correct / mc.length) * 100) : null;
    const total = questions.length;
    const answeredCount = countAnswered();

    app.innerHTML = `
      <div class="st-page" style="max-width:760px;margin:0 auto;padding-bottom:3rem">

        <div class="st-retro-header">
          <p class="st-retro-sub">Retroalimentación</p>
          <h2 class="st-retro-title">${safeText(exam.title)}</h2>
          ${pct !== null ? `<div class="st-retro-score">${pct}%</div><p class="st-retro-sub">${correct} de ${mc.length} preguntas de opción múltiple correctas</p>` : ''}
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem;margin-bottom:1.5rem">
          <div style="background:#fff;border:1px solid #e8e4df;border-radius:1rem;padding:1rem;text-align:center">
            <div style="font-family:'Inter',system-ui,sans-serif;letter-spacing:-.02em;font-size:1.6rem;font-weight:600;color:#16a34a">${correct}</div>
            <div style="font-size:.72rem;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em">Correctas MC</div>
          </div>
          <div style="background:#fff;border:1px solid #e8e4df;border-radius:1rem;padding:1rem;text-align:center">
            <div style="font-family:'Inter',system-ui,sans-serif;letter-spacing:-.02em;font-size:1.6rem;font-weight:600;color:#dc2626">${mc.length - correct}</div>
            <div style="font-size:.72rem;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em">Incorrectas MC</div>
          </div>
          <div style="background:#fff;border:1px solid #e8e4df;border-radius:1rem;padding:1rem;text-align:center">
            <div style="font-family:'Inter',system-ui,sans-serif;letter-spacing:-.02em;font-size:1.6rem;font-weight:600;color:#d97706">${total - answeredCount}</div>
            <div style="font-size:.72rem;color:#94a3b8;text-transform:uppercase;letter-spacing:.07em">Sin responder</div>
          </div>
        </div>

        <div id="retro-questions-list">
          ${questions.map((q, idx) => {
            const given    = answers[q.id];
            const answered = given !== undefined && given !== '';
            let cardClass  = 'st-retro-card';
            let iconHtml   = '';
            let statusHtml = '';
            let extraHtml  = '';

            if (q.type === 'mc') {
              const isCorrect = answered && Number(given) === q.correctIndex;
              if (!answered) {
                cardClass += ' unanswered';
                iconHtml   = `<span style="color:#d97706;font-size:1rem">—</span>`;
                statusHtml = `<span style="color:#d97706;font-size:.82rem">Sin responder</span>`;
              } else if (isCorrect) {
                cardClass += ' correct';
                iconHtml   = `<span style="color:#16a34a;font-size:1rem">✓</span>`;
                statusHtml = `<span style="color:#16a34a;font-size:.82rem">Correcto · ${safeText(q.options?.[given])}</span>`;
              } else {
                cardClass += ' wrong';
                iconHtml   = `<span style="color:#dc2626;font-size:1rem">✗</span>`;
                statusHtml = `<span style="color:#dc2626;font-size:.82rem">Incorrecto · Respondiste: ${safeText(q.options?.[given])}</span>`;
                extraHtml  = `<p style="font-size:.8rem;color:#16a34a;margin-top:.35rem;font-weight:600">✓ Correcta: ${safeText(q.options?.[q.correctIndex])}</p>`;
              }

            } else if (q.type === 'eq') {
              // Preguntas de ecuación
              cardClass += answered ? '' : ' unanswered';
              iconHtml = answered
                ? `<span style="color:#2563eb;font-size:1rem">∫</span>`
                : `<span style="color:#d97706;font-size:1rem">—</span>`;
              statusHtml = answered
                ? `<span style="font-size:.75rem;color:#475569;font-style:italic">Respuesta enviada (revisión manual por el docente)</span>`
                : `<span style="color:#d97706;font-size:.82rem">Sin responder</span>`;

              if (answered) {
                extraHtml += `
                  <div style="margin-top:.5rem">
                    <p style="font-size:.7rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:.07em;margin-bottom:.3rem">Tu respuesta:</p>
                    <div class="retro-eq-display" id="retro-student-eq-${q.id}"></div>
                  </div>
                `;
              }
              if (q.referenceLatex) {
                extraHtml += `
                  <div style="margin-top:.4rem">
                    <p style="font-size:.7rem;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:.07em;margin-bottom:.3rem">📐 Referencia del profesor:</p>
                    <div class="retro-eq-display" id="retro-ref-eq-${q.id}"></div>
                  </div>
                `;
              }

            } else {
              // Pregunta abierta
              cardClass += answered ? '' : ' unanswered';
              iconHtml = answered
                ? `<span style="color:#2563eb;font-size:1rem">✎</span>`
                : `<span style="color:#d97706;font-size:1rem">—</span>`;
              statusHtml = answered
                ? `<span style="font-size:.82rem;color:#475569">${safeText(given)}</span>`
                : `<span style="color:#d97706;font-size:.82rem">Sin responder</span>`;
            }

            return `
              <div class="${cardClass}" style="animation:stFadeUp .3s ease ${Math.min(idx * 0.04, 0.5)}s both;opacity:0">
                <div style="display:flex;gap:.75rem;align-items:flex-start">
                  <div style="display:flex;align-items:center;justify-content:center;width:2rem;height:2rem;border-radius:.5rem;background:rgba(0,0,0,.06);flex-shrink:0;margin-top:.1rem">
                    ${iconHtml}
                  </div>
                  <div style="flex:1;min-width:0">
                    <p class="st-retro-q-text">${idx + 1}. ${safeText(q.text)}</p>
                    <div class="st-retro-answer-line">${statusHtml}</div>
                    ${extraHtml}
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="display:flex;gap:.75rem;margin-top:2rem">
          <button class="st-btn-sec" id="back-success-btn" style="flex:1;padding:.85rem;border-radius:1rem;font-size:.9rem">
            ← Volver al resumen
          </button>
          <button class="st-btn-main" id="volver-inicio-retro-btn" style="flex:1;padding:.85rem">
            Ir al inicio
          </button>
        </div>
      </div>
    `;

    // Renderizar ecuaciones en retroalimentación (después de que el DOM esté listo)
    setTimeout(() => {
      questions.forEach(q => {
        if (q.type !== 'eq') return;
        const given = answers[q.id];
        if (given) {
          const studentEl = document.getElementById(`retro-student-eq-${q.id}`);
          renderStaticMath(studentEl, given);
        }
        if (q.referenceLatex) {
          const refEl = document.getElementById(`retro-ref-eq-${q.id}`);
          renderStaticMath(refEl, q.referenceLatex);
        }
      });
    }, 80);

    document.getElementById('back-success-btn').onclick = () => showSuccess(submissionData?.forced || false);
    document.getElementById('volver-inicio-retro-btn').onclick = () => {
      const u = getUser();
      if (u?.isGuest) { logout?.(); navigate('/'); }
      else { resetExam(); }
    };
  }

  // ─────────────────────────────────────────────
  // REVISIÓN
  // ─────────────────────────────────────────────
  function showReview() {
    pauseFraudGuard();
    stopTimer();
    injectStyles();
    const questions = Array.isArray(exam.questions) ? exam.questions : [];

    app.innerHTML = `
      <div class="st-page" style="max-width:760px;margin:0 auto">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem;padding:.75rem 0">
          <h2 style="font-family:'Inter',system-ui,sans-serif;letter-spacing:-.02em;font-size:1.3rem;font-weight:600;color:#1e293b">Revisar respuestas</h2>
          <button id="back-btn" style="background:none;border:1.5px solid #e2e8f0;border-radius:.75rem;padding:.45rem .9rem;font-size:.85rem;cursor:pointer;color:#374151;font-family:'DM Sans',sans-serif">← Volver</button>
        </div>
        <div>
          ${questions.map((q, idx) => {
            const answer   = answers[q.id];
            const answered = answer !== undefined && answer !== '';
            let answerHtml = '';
            if (q.type === 'mc') {
              answerHtml = `<p style="font-size:.82rem;color:${answered ? '#15803d' : '#dc2626'};font-weight:600">${answered ? '✅ ' + safeText(q.options?.[answer]) : '❌ Sin responder'}</p>`;
            } else if (q.type === 'eq') {
              answerHtml = answered
                ? `<p style="font-size:.82rem;color:#15803d;font-weight:600">✅ Ecuación ingresada</p><div id="review-eq-${q.id}" style="font-size:.9rem;margin-top:.3rem"></div>`
                : `<p style="font-size:.82rem;color:#dc2626;font-weight:600">❌ Sin responder</p>`;
            } else {
              answerHtml = `<p style="font-size:.82rem;color:${answered ? '#15803d' : '#dc2626'};font-weight:600">${answered ? safeText(answer) : '❌ Sin responder'}</p>`;
            }
            return `
              <div style="background:${answered ? '#f0fdf4' : '#fef2f2'};border:1.5px solid ${answered ? '#86efac' : '#fca5a5'};border-radius:1rem;padding:1rem;margin-bottom:.6rem">
                <p style="font-family:'Inter',system-ui,sans-serif;letter-spacing:-.02em;font-size:.95rem;font-weight:300;color:#1e293b;margin-bottom:.4rem">${idx + 1}. ${safeText(q.text)}</p>
                ${answerHtml}
              </div>
            `;
          }).join('')}
        </div>
        <div style="display:flex;gap:.75rem;margin-top:1.5rem;position:sticky;bottom:0;background:#f1f5f9;padding:.75rem;border-radius:1rem">
          <button class="st-btn-sec" style="flex:1;padding:.8rem;border-radius:.85rem" id="back-btn2">Seguir respondiendo</button>
          <button class="st-btn-main" style="flex:1;padding:.8rem;border-radius:.85rem" id="submit-btn" ${submitting ? 'disabled' : ''}>
            ${submitting ? 'Enviando...' : '✅ Enviar examen'}
          </button>
        </div>
      </div>
    `;

    // Renderizar ecuaciones respondidas en pantalla de revisión
    setTimeout(() => {
      questions.forEach(q => {
        if (q.type !== 'eq') return;
        const answer = answers[q.id];
        if (answer) {
          const el = document.getElementById(`review-eq-${q.id}`);
          renderStaticMath(el, answer);
        }
      });
    }, 80);

    const goBack = () => {
      resumeFraudGuard();
      requestFullscreen(); // requestFullscreen ya setea enteringFullscreen=true
      setTimeout(() => { startTimer(); showExam(); }, 400);
    };

    document.getElementById('back-btn').onclick  = goBack;
    document.getElementById('back-btn2').onclick = goBack;
    document.getElementById('submit-btn').onclick = () => finishExam(false);
  }

  // ─────────────────────────────────────────────
  // EXAMEN PRINCIPAL
  // ─────────────────────────────────────────────
  function showExam() {
    injectStyles();
    const questions = Array.isArray(exam.questions) ? exam.questions : [];
    const answered  = countAnswered();
    const total     = questions.length;

    app.innerHTML = `
      <div class="st-page" style="max-width:760px;margin:0 auto">

        <div class="st-exam-header">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem">
            <div style="flex:1;min-width:0">
              <h1 class="st-exam-title">${safeText(exam.title)}</h1>
              <p class="st-exam-code">Código: ${safeText(exam.code)} · ${total} preguntas</p>
            </div>
            <div style="text-align:right;flex-shrink:0">
              <div class="st-timer" id="exam-timer">${fmt(timer)}</div>
              <p style="font-size:.7rem;color:rgba(255,255,255,.65);margin-top:.1rem">Tiempo restante</p>
            </div>
          </div>
          <div class="st-progress-bar">
            <div class="st-progress-fill" id="st-progress-fill" style="width:${total ? (answered / total) * 100 : 0}%"></div>
          </div>
          <p class="st-progress-text" id="st-progress-text">${answered} de ${total} respondidas</p>
        </div>

        <div id="questions-container">
          ${questions.map((q, idx) => renderQuestion(q, idx)).join('')}
        </div>

        <div class="st-sticky">
          <button class="st-btn-sec" id="review-btn">📝 Revisar respuestas</button>
          <button class="st-btn-prim" id="submit-btn" ${submitting ? 'disabled' : ''}>
            ${submitting ? 'Enviando...' : '✅ Enviar examen'}
          </button>
        </div>
      </div>
    `;

    document.getElementById('review-btn').onclick = showReview;
    document.getElementById('submit-btn').onclick = () => finishExam(false);

    // Listeners de opción múltiple
    questions.forEach(q => {
      if (q.type === 'mc' && q.options) {
        q.options.forEach((_, i) => {
          const radio = document.getElementById(`opt-${q.id}-${i}`);
          if (!radio) return;
          radio.onchange = () => {
            answers[q.id] = i;
            q.options.forEach((__, j) => {
              const lbl = document.getElementById(`lbl-${q.id}-${j}`);
              if (lbl) lbl.classList.toggle('selected', j === i);
            });
            updateTimerDisplay();
          };
        });
      }

      // Listener de preguntas abiertas
      if (q.type === 'open' || (!q.type && q.type !== 'mc' && q.type !== 'eq')) {
        const ta = document.getElementById(`open-${q.id}`);
        if (ta) {
          ta.oninput = () => {
            answers[q.id] = ta.value;
            updateTimerDisplay();
          };
        }
      }
    });

    // Inicializar campos MathQuill para preguntas tipo eq
    // Usamos setTimeout para asegurar que el DOM esté listo
    setTimeout(() => initMathFields(questions), 50);
  }

  // ─────────────────────────────────────────────
  // INICIO
  // ─────────────────────────────────────────────
  showJoin();
}