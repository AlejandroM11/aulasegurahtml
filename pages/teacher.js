// ============================================================
//  teacher.js  —  AulaSegura
//  CORRECCIÓN: tablero de símbolos matemáticos completamente
//  funcional usando MathQuill + teclado on-screen
// ============================================================
//
//  DEPENDENCIAS que deben estar en el <head> de index.html
//  (agregar si no están):
//
//  <!-- MathJax para renderizar LaTeX guardado -->
//  <script>
//    window.MathJax = { tex: { inlineMath: [['\\(','\\)']] }, startup: { typeset: false } };
//  </script>
//  <script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js" defer></script>
//
//  <!-- MathQuill (editor interactivo) -->
//  <link  rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/mathquill/0.10.1/mathquill.min.css"/>
//  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
//  <script src="https://cdnjs.cloudflare.com/ajax/libs/mathquill/0.10.1/mathquill.min.js"></script>
//
// ============================================================

function renderTeacher(app) {
  let exams = [], loading = true, saving = false;
  let activeTab = 'crear', filter = '', showRegistry = true;
  let selectedExam = null;
  let title = '', code = '', dur = 30, showCorrectAnswers = false;
  let questions = [], qtext = '', qtype = 'mc';
  let options = ['', ''], correctIndex = 0, correctIndexes = [];
  let mathEditorInstance = null;   // MathQuill instance para el campo de ecuación inline
  let mathModalInstance = null;    // MathQuill instance del modal de inserción
  const user = getUser();

  // ─── carga inicial ────────────────────────────────────────
  async function loadExams() {
    initChat();
    loading = true;
    try {
      exams = await apiGetExams();
      exams.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    } catch { alert('Error al cargar los exámenes'); }
    finally { loading = false; render(); }
  }

  function generateCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 5; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    return exams.some(e => e.code === result) ? generateCode() : result;
  }

  function resetForm() {
    title = ''; code = generateCode(); dur = 30; questions = [];
    qtext = ''; options = ['', '']; correctIndex = 0; correctIndexes = [];
    showCorrectAnswers = false; selectedExam = null; qtype = 'mc';
    mathEditorInstance = null; mathModalInstance = null;
  }

  function openExam(exam) {
    selectedExam = exam;
    title = exam.title; code = exam.code; dur = exam.durationMinutes;
    questions = exam.questions ? JSON.parse(JSON.stringify(exam.questions)) : [];
    showCorrectAnswers = exam.showCorrectAnswers || false;
    activeTab = 'crear'; render();
  }

  function checkPendingEdit() {
    try {
      const pending = sessionStorage.getItem('editExam');
      if (pending) { sessionStorage.removeItem('editExam'); openExam(JSON.parse(pending)); }
    } catch (_) {}
  }

  // ─── guardar examen ───────────────────────────────────────
  async function saveExam() {
    if (!title.trim() || !code.trim() || questions.length === 0)
      return alert('Completa todos los campos y agrega al menos una pregunta');
    const isDuplicate = !selectedExam &&
      exams.find(e => e.code.toUpperCase() === code.trim().toUpperCase());
    if (isDuplicate) return alert('❌ Ya existe un examen con ese código');
    saving = true; render();
    try {
      let teacherId = user?.uid || user?.email || 'unknown';
      try { const fbUser = fbAuth.currentUser; if (fbUser?.uid) teacherId = fbUser.uid; } catch (_) {}
      const examData = {
        title: title.trim(), code: code.trim().toUpperCase(),
        durationMinutes: Number(dur), questions, showCorrectAnswers, teacherId
      };
      if (selectedExam) {
        await apiUpdateExam(selectedExam.id, examData);
        alert('✅ Examen actualizado exitosamente');
      } else {
        await apiCreateExam(examData);
        alert('✅ Examen creado exitosamente');
      }
      resetForm(); activeTab = 'lista';
      await loadExams();
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || err.message || 'Error al guardar'));
    } finally { saving = false; render(); }
  }

  async function deleteExam(exam) {
    if (!confirm(`¿Eliminar "${exam.title}"?\nEsta acción no se puede deshacer.`)) return;
    try {
      await apiDeleteExam(exam.id);
      if (selectedExam?.id === exam.id) resetForm();
      exams = exams.filter(e => e.id !== exam.id); render();
    } catch { alert('❌ Error al eliminar el examen'); }
  }

  // ─── agregar / quitar pregunta ────────────────────────────
  function addQuestion() {
    if (!qtext.trim()) return alert('Escribe el texto de la pregunta');
    const q = { id: crypto.randomUUID(), text: qtext.trim(), type: qtype };

    if (qtype === 'mc') {
      const opts = options.map(o => o.trim()).filter(Boolean);
      if (opts.length < 2) return alert('Agrega al menos 2 opciones');
      if (!opts[correctIndex]?.trim()) return alert('Selecciona una opción correcta válida');
      q.options = opts; q.correctIndex = Number(correctIndex);
    }

    if (qtype === 'multi') {
      const opts = options.map(o => o.trim()).filter(Boolean);
      if (opts.length < 2) return alert('Agrega al menos 2 opciones');
      if (correctIndexes.length === 0) return alert('Marca al menos una respuesta correcta');
      q.options = opts;
      q.correctIndexes = [...correctIndexes];
    }

    if (qtype === 'eq') {
      if (mathEditorInstance) {
        const refLatex = mathEditorInstance.latex();
        if (refLatex) q.referenceLatex = refLatex;
      }
    }

    questions.push(q);
    qtext = ''; options = ['', '']; correctIndex = 0; correctIndexes = [];
    mathEditorInstance = null;
    render();
  }

  function removeQuestion(id) { questions = questions.filter(q => q.id !== id); render(); }
  function addOption()        { if (options.length < 6) { options.push(''); render(); } }
  function removeOption(i) {
    if (options.length <= 2) return;
    options.splice(i, 1);
    if (correctIndex >= options.length) correctIndex = 0;
    render();
  }

  // ─── RENDER principal ─────────────────────────────────────
  function render() {
    app.innerHTML = `
      <div style="max-width:100%;margin:0 auto">
        <div style="display:flex;gap:.5rem;margin-bottom:1.5rem;background:#fff;padding:.4rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,.07);border:1px solid #e2e8f0">
          <button class="tab-pill${activeTab==='crear'?' active':''}" id="tab-crear" style="flex:1">
            ${selectedExam
              ? '<i class="fa-solid fa-pen" style="margin-right:.4rem"></i>Editando'
              : '<i class="fa-solid fa-plus" style="margin-right:.4rem"></i>Crear examen'}
          </button>
          <button class="tab-pill${activeTab==='lista'?' active':''}" id="tab-lista" style="flex:1">
            <i class="fa-solid fa-list" style="margin-right:.4rem"></i>Mis exámenes
            <span style="background:#e2e8f0;border-radius:999px;padding:.1rem .5rem;font-size:.75rem;margin-left:.25rem">${exams.length}</span>
          </button>
          <button class="tab-pill" id="tab-examenes" style="flex:1">
            <i class="fa-solid fa-table-list" style="margin-right:.4rem"></i>Ver todos
          </button>
          <button class="tab-pill" id="tab-resultados" style="flex:1">
            <i class="fa-solid fa-chart-bar" style="margin-right:.4rem"></i>Resultados
          </button>
          <button class="tab-pill" id="tab-monitor" style="flex:1">
            <i class="fa-solid fa-tower-broadcast" style="margin-right:.4rem"></i>Monitoreo
          </button>
        </div>
        ${activeTab === 'crear' ? renderTabCrear() : ''}
        ${activeTab === 'lista' ? renderTabLista() : ''}
      </div>

      <!-- ══════════ MODAL ECUACIÓN ══════════ -->
      <div id="math-modal-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9000;align-items:center;justify-content:center">
        <div style="background:#fff;border-radius:1.25rem;padding:1.75rem 2rem;width:min(98vw,780px);box-shadow:0 20px 60px rgba(0,0,0,.25);max-height:92vh;overflow-y:auto">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem">
            <h3 style="font-size:1.05rem;font-weight:700;color:#1e293b">
              <span style="color:#7c3aed;margin-right:.4rem">∑</span> Editor de ecuación
            </h3>
            <button id="math-modal-close" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#94a3b8;line-height:1">×</button>
          </div>

          <!-- campo MathQuill del modal -->
          <div style="border:2px solid #7c3aed;border-radius:.75rem;padding:.75rem 1rem;min-height:3rem;font-size:1.3rem;background:#fdf4ff;margin-bottom:1rem" id="math-modal-field"></div>

          <!-- teclado de símbolos -->
          <div style="margin-bottom:1rem">
            ${renderKeyboardHTML()}
          </div>

          <!-- previsualización -->
          <div style="background:#f8fafc;border-radius:.75rem;padding:.75rem 1rem;min-height:2.5rem;border:1px solid #e2e8f0;margin-bottom:1rem;font-size:.85rem;color:#64748b">
            LaTeX: <span id="math-modal-latex-preview" style="color:#1e293b;font-family:monospace"></span>
          </div>

          <div style="display:flex;gap:.75rem">
            <button id="math-modal-cancel" class="btn btn-outline" style="flex:1">Cancelar</button>
            <button id="math-modal-insert" class="btn btn-primary" style="flex:1;background:linear-gradient(135deg,#7c3aed,#2563eb)">
              <i class="fa-solid fa-check" style="margin-right:.4rem"></i>Insertar ecuación
            </button>
          </div>
        </div>
      </div>

      <style>
        .tab-pill{background:transparent;border:none;padding:.55rem 1rem;border-radius:.75rem;font-weight:600;font-size:.875rem;cursor:pointer;color:#64748b;transition:all .2s}
        .tab-pill.active{background:#2563eb;color:#fff;box-shadow:0 2px 8px rgba(37,99,235,.3)}
        .tab-pill:hover:not(.active){background:#f1f5f9;color:#1e293b}
        .opt-row{display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem}
        .correct-radio{width:1.1rem;height:1.1rem;accent-color:#2563eb;cursor:pointer;flex-shrink:0}
        .q-chip{background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:.75rem;padding:.85rem 1rem;display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem;transition:border-color .2s}
        .q-chip:hover{border-color:#2563eb}
        .section-label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:.5rem}
        /* teclado matemático */
        .math-kb-section{margin-bottom:.75rem}
        .math-kb-title{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;margin-bottom:.4rem}
        .math-kb-row{display:flex;flex-wrap:wrap;gap:.35rem}
        .math-kb-btn{background:#f1f5f9;border:1.5px solid #e2e8f0;border-radius:.5rem;padding:.35rem .6rem;font-size:.9rem;cursor:pointer;color:#1e293b;font-family:'Times New Roman',serif;transition:all .15s;min-width:2.2rem;text-align:center;line-height:1.2}
        .math-kb-btn:hover{background:#ede9fe;border-color:#7c3aed;color:#7c3aed}
        .math-kb-btn:active{transform:scale(.93)}
        /* MathQuill overrides */
        .mq-editable-field{outline:none!important;font-size:1.2rem}
        .mq-cursor{border-left:2px solid #7c3aed!important}
      </style>
    `;

    bindTabEvents();
    if (activeTab === 'crear') {
      bindCrearEvents();
      initEqEditorInCard();   // ← inicializa MathQuill en el card cuando qtype='eq'
    }
    if (activeTab === 'lista') bindListaEvents();

    // Re-renderizar MathJax en las chips de preguntas
    requestAnimationFrame(() => {
      if (window.MathJax?.typesetPromise) {
        MathJax.typesetPromise([app]).catch(() => {});
      }
    });
  }

  // ──────────────────────────────────────────────────────────
  //  HTML del teclado de símbolos (compartido por modal y card)
  // ──────────────────────────────────────────────────────────
  function renderKeyboardHTML() {
    const sections = [
      {
        title: 'Números y operadores básicos',
        keys: [
          { label: '÷', cmd: '\\div' },
          { label: '×', cmd: '\\times' },
          { label: '±', cmd: '\\pm' },
          { label: '≠', cmd: '\\neq' },
          { label: '≤', cmd: '\\leq' },
          { label: '≥', cmd: '\\geq' },
          { label: '≈', cmd: '\\approx' },
          { label: '∞', cmd: '\\infty' },
          { label: '%', cmd: '\\%' },
        ]
      },
      {
        title: 'Fracciones y potencias',
        keys: [
          { label: 'a/b',    cmd: '\\frac{}{}',  write: true },
          { label: 'xⁿ',    cmd: '^{}',          write: true },
          { label: 'x₀',    cmd: '_{}',          write: true },
          { label: 'x²',    cmd: '^{2}',         write: true },
          { label: 'x³',    cmd: '^{3}',         write: true },
          { label: '√',     cmd: '\\sqrt{}',     write: true },
          { label: '∛',     cmd: '\\sqrt[3]{}',  write: true },
          { label: '∜',     cmd: '\\sqrt[4]{}',  write: true },
        ]
      },
      {
        title: 'Letras griegas',
        keys: [
          { label: 'α', cmd: '\\alpha' },
          { label: 'β', cmd: '\\beta' },
          { label: 'γ', cmd: '\\gamma' },
          { label: 'δ', cmd: '\\delta' },
          { label: 'ε', cmd: '\\epsilon' },
          { label: 'θ', cmd: '\\theta' },
          { label: 'λ', cmd: '\\lambda' },
          { label: 'μ', cmd: '\\mu' },
          { label: 'π', cmd: '\\pi' },
          { label: 'σ', cmd: '\\sigma' },
          { label: 'φ', cmd: '\\phi' },
          { label: 'ω', cmd: '\\omega' },
          { label: 'Δ', cmd: '\\Delta' },
          { label: 'Σ', cmd: '\\Sigma' },
          { label: 'Ω', cmd: '\\Omega' },
          { label: 'Π', cmd: '\\Pi' },
        ]
      },
      {
        title: 'Cálculo y análisis',
        keys: [
          { label: '∑',   cmd: '\\sum_{i=0}^{n}', write: true },
          { label: '∏',   cmd: '\\prod',            write: true },
          { label: '∫',   cmd: '\\int_{}^{}',       write: true },
          { label: '∮',   cmd: '\\oint',            write: true },
          { label: 'lim', cmd: '\\lim_{x\\to}',     write: true },
          { label: 'd/dx',cmd: '\\frac{d}{dx}',     write: true },
          { label: '∂',   cmd: '\\partial' },
          { label: '∇',   cmd: '\\nabla' },
          { label: "f'",  cmd: "f'",                write: true },
        ]
      },
      {
        title: 'Funciones y paréntesis',
        keys: [
          { label: 'sin',  cmd: '\\sin(' },
          { label: 'cos',  cmd: '\\cos(' },
          { label: 'tan',  cmd: '\\tan(' },
          { label: 'log',  cmd: '\\log(' },
          { label: 'ln',   cmd: '\\ln(' },
          { label: 'eˣ',   cmd: 'e^{}', write: true },
          { label: '|x|',  cmd: '\\left|\\right|', write: true },
          { label: '( )',  cmd: '\\left(\\right)', write: true },
          { label: '[ ]',  cmd: '\\left[\\right]', write: true },
          { label: '{ }',  cmd: '\\left\\{\\right\\}', write: true },
        ]
      },
      {
        title: 'Matrices y vectores',
        keys: [
          { label: 'vec',  cmd: '\\vec{}',          write: true },
          { label: '‖v‖',  cmd: '\\|\\|',            write: true },
          { label: 'mat',  cmd: '\\begin{pmatrix}a & b \\\\ c & d\\end{pmatrix}', write: true },
          { label: '→',    cmd: '\\rightarrow' },
          { label: '⟹',    cmd: '\\Rightarrow' },
          { label: '↔',    cmd: '\\leftrightarrow' },
          { label: '∈',    cmd: '\\in' },
          { label: '∉',    cmd: '\\notin' },
          { label: '⊂',    cmd: '\\subset' },
        ]
      }
    ];

    return sections.map(sec => `
      <div class="math-kb-section">
        <p class="math-kb-title">${sec.title}</p>
        <div class="math-kb-row">
          ${sec.keys.map(k => `
            <button class="math-kb-btn" data-cmd="${encodeURIComponent(k.cmd)}" data-write="${k.write ? '1' : '0'}" title="${k.cmd}">
              ${k.label}
            </button>
          `).join('')}
        </div>
      </div>
    `).join('');
  }

  // ──────────────────────────────────────────────────────────
  //  Inicializar MathQuill en el card de tipo 'eq'
  // ──────────────────────────────────────────────────────────
  function initEqEditorInCard() {
    if (qtype !== 'eq') return;
    const wrap = document.getElementById('eq-answer-editor-wrap');
    if (!wrap) return;
    if (typeof MathQuill === 'undefined') {
      wrap.innerHTML = '<p style="color:#ef4444;font-size:.82rem">⚠ MathQuill no cargado. Revisa las dependencias en &lt;head&gt;.</p>';
      return;
    }
    const MQ = MathQuill.getInterface(2);
    const fieldEl = document.createElement('div');
    fieldEl.style.cssText = 'border:2px solid #7c3aed;border-radius:.75rem;padding:.65rem 1rem;min-height:2.8rem;font-size:1.2rem;background:#fdf4ff;cursor:text;margin-bottom:.5rem';
    wrap.innerHTML = '';
    wrap.appendChild(fieldEl);
    mathEditorInstance = MQ.MathField(fieldEl, {
      spaceBehavesLikeTab: true,
      handlers: { edit: () => {} }
    });

    // Teclado de símbolos para el card
    const kbDiv = document.createElement('div');
    kbDiv.innerHTML = renderKeyboardHTML();
    kbDiv.style.cssText = 'margin-top:.5rem';
    wrap.appendChild(kbDiv);

    // Bind botones del teclado del card
    bindKeyboardButtons(kbDiv, mathEditorInstance);

    // Botón limpiar
    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn btn-outline text-xs';
    clearBtn.style.cssText = 'margin-top:.5rem;width:100%';
    clearBtn.innerHTML = '<i class="fa-solid fa-eraser" style="margin-right:.4rem"></i>Limpiar campo';
    clearBtn.onclick = () => { mathEditorInstance.latex(''); mathEditorInstance.focus(); };
    wrap.appendChild(clearBtn);
  }

  // ──────────────────────────────────────────────────────────
  //  Abrir MODAL de ecuación (botón ∑ del textarea)
  // ──────────────────────────────────────────────────────────
  function openMathModal(onInsert) {
    const overlay = document.getElementById('math-modal-overlay');
    overlay.style.display = 'flex';

    if (typeof MathQuill === 'undefined') {
      document.getElementById('math-modal-field').innerHTML =
        '<p style="color:#ef4444">⚠ MathQuill no cargado. Agrega las dependencias en &lt;head&gt;.</p>';
      return;
    }

    const MQ = MathQuill.getInterface(2);
    const fieldEl = document.getElementById('math-modal-field');
    fieldEl.innerHTML = '';

    mathModalInstance = MQ.MathField(fieldEl, {
      spaceBehavesLikeTab: true,
      handlers: {
        edit: () => {
          const latex = mathModalInstance.latex();
          document.getElementById('math-modal-latex-preview').textContent = latex;
        }
      }
    });
    mathModalInstance.focus();

    // Botones del teclado del modal
    const kbContainer = overlay.querySelector('.math-kb-section')?.parentElement;
    if (kbContainer) bindKeyboardButtons(kbContainer, mathModalInstance);

    // También bind por delegación (por si el contenedor ya existe)
    overlay.querySelectorAll('.math-kb-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const cmd   = decodeURIComponent(btn.dataset.cmd);
        const write = btn.dataset.write === '1';
        if (write) mathModalInstance.write(cmd);
        else       mathModalInstance.cmd(cmd);
        mathModalInstance.focus();
        document.getElementById('math-modal-latex-preview').textContent = mathModalInstance.latex();
      };
    });

    // Botones del modal
    document.getElementById('math-modal-close').onclick  = closeMathModal;
    document.getElementById('math-modal-cancel').onclick = closeMathModal;
    document.getElementById('math-modal-insert').onclick = () => {
      const latex = mathModalInstance.latex().trim();
      if (!latex) return alert('Escribe una ecuación primero');
      onInsert(latex);
      closeMathModal();
    };

    // Cerrar al hacer click fuera
    overlay.onclick = (e) => { if (e.target === overlay) closeMathModal(); };
  }

  function closeMathModal() {
    const overlay = document.getElementById('math-modal-overlay');
    if (overlay) overlay.style.display = 'none';
    mathModalInstance = null;
  }

  // ──────────────────────────────────────────────────────────
  //  Bind genérico de botones del teclado matemático
  // ──────────────────────────────────────────────────────────
  function bindKeyboardButtons(container, mqInstance) {
    container.querySelectorAll('.math-kb-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.preventDefault();
        const cmd   = decodeURIComponent(btn.dataset.cmd);
        const write = btn.dataset.write === '1';
        if (write) mqInstance.write(cmd);
        else       mqInstance.cmd(cmd);
        mqInstance.focus();
      };
    });
  }

  // ──────────────────────────────────────────────────────────
  //  renderTabCrear
  // ──────────────────────────────────────────────────────────
  function renderTabCrear() {
    return `
      <div style="max-width:100%;margin:0 auto">

        <!-- Layout dashboard: izquierda formularios | derecha panel preguntas -->
        <div style="
          display:grid;
          grid-template-columns:1fr 360px;
          gap:1.5rem;
          align-items:start;
        " class="crear-layout">

          <!-- ── Columna izquierda: formularios apilados ── -->
          <div style="display:flex;flex-direction:column;gap:1.25rem;min-width:0">

            <!-- Info del examen -->
            <div class="card">
              <div class="flex-between mb-4">
                <h2 class="font-bold" style="font-size:1.15rem">
                  ${selectedExam
                    ? `<i class="fa-solid fa-pen" style="margin-right:.4rem;color:#2563eb"></i><span class="text-blue">${selectedExam.title}</span>`
                    : '<i class="fa-solid fa-file-lines" style="margin-right:.4rem;color:#2563eb"></i>Información del examen'}
                </h2>
                ${selectedExam ? `<button class="btn btn-outline text-xs" id="cancel-edit"><i class="fa-solid fa-xmark" style="margin-right:.3rem"></i>Cancelar</button>` : ''}
              </div>
              <div style="display:grid;grid-template-columns:2fr 1fr 1fr;gap:1rem;align-items:end">
                <div class="form-group">
                  <label class="label">Título del examen</label>
                  <input class="input" id="f-title" placeholder="Ej: Parcial de Matemáticas" value="${title}"/>
                </div>
                <div class="form-group">
                  <label class="label">Código</label>
                  <div style="display:flex;gap:.5rem">
                    <input class="input font-mono" id="f-code" value="${code}"
                      ${selectedExam ? 'disabled' : 'readonly'}
                      style="text-transform:uppercase;letter-spacing:.1em;background:${selectedExam ? '' : '#f8fafc'}"/>
                    ${!selectedExam ? `
                      <button class="btn btn-outline" id="regen-code-btn" style="flex-shrink:0;padding:.5rem .75rem" title="Generar nuevo código">
                        <i class="fa-solid fa-rotate"></i>
                      </button>
                    ` : ''}
                  </div>
                </div>
                <div class="form-group">
                  <label class="label">Duración (min)</label>
                  <input class="input" id="f-dur" type="number" min="1" value="${dur}"/>
                </div>
              </div>
              <label style="display:flex;align-items:center;gap:.75rem;cursor:pointer;padding:.85rem 1rem;background:#f8fafc;border-radius:.75rem;border:1.5px solid #e2e8f0;margin-top:1rem">
                <input type="checkbox" id="f-show-answers" ${showCorrectAnswers ? 'checked' : ''} style="width:1.1rem;height:1.1rem;accent-color:#2563eb;flex-shrink:0"/>
                <div>
                  <p class="font-bold text-sm">Mostrar respuestas al finalizar</p>
                  <p class="text-xs text-gray">El estudiante verá las correctas al terminar</p>
                </div>
              </label>
            </div>

            <!-- Nueva pregunta -->
            <div class="card">
              <h3 class="font-bold mb-4" style="font-size:1.05rem">
                <i class="fa-solid fa-circle-plus" style="margin-right:.4rem;color:#2563eb"></i>Nueva pregunta
              </h3>

              <div style="display:grid;grid-template-columns:1fr auto;gap:1rem;align-items:start;margin-bottom:1rem">
                <div class="form-group">
                  <label class="label">Texto de la pregunta</label>
                  <div style="position:relative">
                    <textarea class="input" id="f-qtext" rows="4"
                      placeholder="Escribe aquí la pregunta..."
                      style="resize:none;padding-right:2.8rem">${escapeHtmlForAttr(qtext)}</textarea>
                    <button type="button" id="open-math-inline"
                      title="Insertar ecuación en el texto"
                      style="position:absolute;right:.5rem;top:.5rem;background:linear-gradient(135deg,#7c3aed,#2563eb);border:none;border-radius:.5rem;color:#fff;width:2rem;height:2rem;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;">∑</button>
                  </div>
                  <p class="text-xs text-gray mt-1">
                    <i class="fa-solid fa-circle-info" style="margin-right:.3rem"></i>
                    Presiona <strong>∑</strong> para insertar una ecuación en el texto.
                  </p>
                </div>
                <div class="form-group" style="min-width:190px">
                  <label class="label">Tipo</label>
                  <div style="display:flex;flex-direction:column;gap:.4rem">
                    <label style="display:flex;align-items:center;gap:.5rem;padding:.55rem .85rem;border-radius:.6rem;border:2px solid ${qtype==='mc'?'#2563eb':'#e2e8f0'};cursor:pointer;background:${qtype==='mc'?'#eff6ff':'#fff'}">
                      <input type="radio" name="qtype" value="mc" ${qtype==='mc'?'checked':''} style="accent-color:#2563eb"/>
                      <i class="fa-solid fa-list-check" style="color:#2563eb;margin-right:.3rem"></i>
                      <span class="text-sm font-bold">Una correcta</span>
                    </label>
                    <label style="display:flex;align-items:center;gap:.5rem;padding:.55rem .85rem;border-radius:.6rem;border:2px solid ${qtype==='multi'?'#0891b2':'#e2e8f0'};cursor:pointer;background:${qtype==='multi'?'#ecfeff':'#fff'}">
                      <input type="radio" name="qtype" value="multi" ${qtype==='multi'?'checked':''} style="accent-color:#0891b2"/>
                      <i class="fa-solid fa-square-check" style="color:#0891b2;margin-right:.3rem"></i>
                      <span class="text-sm font-bold">Varias correctas</span>
                    </label>
                    <label style="display:flex;align-items:center;gap:.5rem;padding:.55rem .85rem;border-radius:.6rem;border:2px solid ${qtype==='open'?'#2563eb':'#e2e8f0'};cursor:pointer;background:${qtype==='open'?'#eff6ff':'#fff'}">
                      <input type="radio" name="qtype" value="open" ${qtype==='open'?'checked':''} style="accent-color:#2563eb"/>
                      <i class="fa-solid fa-pen-to-square" style="color:#2563eb;margin-right:.3rem"></i>
                      <span class="text-sm font-bold">Pregunta abierta</span>
                    </label>
                    <label style="display:flex;align-items:center;gap:.5rem;padding:.55rem .85rem;border-radius:.6rem;border:2px solid ${qtype==='eq'?'#7c3aed':'#e2e8f0'};cursor:pointer;background:${qtype==='eq'?'#fdf4ff':'#fff'}">
                      <input type="radio" name="qtype" value="eq" ${qtype==='eq'?'checked':''} style="accent-color:#7c3aed"/>
                      <span style="color:#7c3aed;margin-right:.3rem;font-size:1rem">∑</span>
                      <span class="text-sm font-bold">Ecuación</span>
                    </label>
                  </div>
                </div>
              </div>

              ${qtype === 'mc'    ? renderMcOptions()    : ''}
              ${qtype === 'multi' ? renderMultiOptions() : ''}
              ${qtype === 'eq'    ? renderEqSection()    : ''}
              ${qtype === 'open'  ? `
                <div class="info-box info-box-blue mb-3">
                  <p class="text-xs">
                    <i class="fa-solid fa-lightbulb" style="margin-right:.4rem"></i>
                    Las preguntas abiertas serán respondidas con texto libre.
                  </p>
                </div>
              ` : ''}

              <div style="display:flex;gap:.75rem;margin-top:.5rem">
                <button class="btn btn-full" id="rag-btn"
                  style="background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff">
                  <i class="fa-solid fa-wand-magic-sparkles" style="margin-right:.4rem"></i>Generar con IA
                </button>
                <button class="btn btn-primary btn-full" id="add-q-btn">
                  <i class="fa-solid fa-plus" style="margin-right:.4rem"></i>Agregar pregunta
                </button>
              </div>
            </div>

          </div><!-- /columna izquierda -->

          <!-- ── Columna derecha: panel de preguntas sticky ── -->
          <div style="
            position:sticky;
            top:calc(var(--nav-height, 64px) + 1rem);
            display:flex;
            flex-direction:column;
            gap:1rem;
            max-height:calc(100vh - var(--nav-height, 64px) - 2rem);
          ">

            <!-- Panel preguntas -->
            <div class="card" style="
              display:flex;
              flex-direction:column;
              flex:1;
              overflow:hidden;
              padding:0;
              min-height:0;
            ">
              <!-- Header del panel -->
              <div style="
                padding:1.1rem 1.4rem;
                border-bottom:1px solid var(--border, #e2e8f0);
                display:flex;
                align-items:center;
                justify-content:space-between;
                flex-shrink:0;
              ">
                <h3 class="font-bold" style="font-size:.95rem">
                  <i class="fa-solid fa-clipboard-list" style="margin-right:.4rem;color:#2563eb"></i>Preguntas
                </h3>
                <span style="background:#dbeafe;color:#1d4ed8;border-radius:999px;padding:.15rem .65rem;font-size:.78rem;font-weight:700">
                  ${questions.length}
                </span>
              </div>

              <!-- Lista con scroll independiente -->
              <div style="
                flex:1;
                overflow-y:auto;
                padding:1rem 1.1rem;
                display:flex;
                flex-direction:column;
                gap:.65rem;
                max-height:calc(100vh - var(--nav-height, 64px) - 14rem);
              ">
                ${questions.length === 0 ? `
                  <div class="text-center text-gray" style="padding:3rem 1rem;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center">
                    <i class="fa-solid fa-inbox" style="font-size:2.25rem;color:#cbd5e1;margin-bottom:.75rem"></i>
                    <p class="text-sm font-bold" style="color:#94a3b8">Sin preguntas aún</p>
                    <p class="text-xs" style="color:#cbd5e1;margin-top:.3rem">Agrégalas desde el panel izquierdo</p>
                  </div>
                ` : questions.map((q, idx) => renderQuestionChip(q, idx)).join('')}
              </div>
            </div>

            <!-- Botón guardar -->
            <button class="btn btn-primary btn-full" id="save-btn"
              style="padding:.85rem;font-size:.95rem;flex-shrink:0"
              ${saving || questions.length === 0 || !title.trim() || !code.trim() ? 'disabled' : ''}>
              ${saving
                ? '<i class="fa-solid fa-spinner fa-spin" style="margin-right:.4rem"></i>Guardando...'
                : selectedExam
                  ? '<i class="fa-solid fa-floppy-disk" style="margin-right:.4rem"></i>Guardar cambios'
                  : '<i class="fa-solid fa-circle-check" style="margin-right:.4rem"></i>Crear examen'}
            </button>
            ${questions.length === 0 ? `<p class="text-center text-xs text-gray" style="margin-top:-.25rem">Agrega al menos una pregunta</p>` : ''}

          </div><!-- /columna derecha -->

        </div><!-- /crear-layout -->
      </div>
    `;
  }

  function renderMcOptions() {
    return `
      <div style="background:#f8fafc;border-radius:.75rem;padding:.85rem;border:1.5px solid #e2e8f0;margin-bottom:.75rem">
        <p class="section-label">Opciones de respuesta</p>
        <p class="text-xs text-gray mb-2">Marca el círculo de la respuesta correcta</p>
        ${options.map((opt, i) => `
          <div class="opt-row">
            <input type="radio" class="correct-radio" name="correct-opt" value="${i}"
              ${correctIndex==i?'checked':''} id="correct-${i}"/>
            <input class="input text-sm" id="opt-${i}" value="${opt}"
              placeholder="Opción ${String.fromCharCode(65+i)}" style="flex:1"/>
            ${options.length > 2
              ? `<button class="btn btn-danger" style="padding:.3rem .55rem;font-size:.8rem" data-remove-opt="${i}">
                   <i class="fa-solid fa-xmark"></i>
                 </button>`
              : ''}
          </div>
        `).join('')}
        ${options.length < 6
          ? `<button class="btn btn-outline text-xs mt-2" id="add-opt-btn" style="width:100%">
               <i class="fa-solid fa-plus" style="margin-right:.3rem"></i>Agregar opción
             </button>`
          : ''}
      </div>
    `;
  }

  /** Opciones para preguntas con varias respuestas correctas (checkboxes) */
  function renderMultiOptions() {
    return `
      <div style="background:#ecfeff;border-radius:.75rem;padding:.85rem;border:1.5px solid #a5f3fc;margin-bottom:.75rem">
        <p class="section-label" style="color:#0891b2">Opciones — marca TODAS las correctas</p>
        <p class="text-xs mb-2" style="color:#0e7490">
          <i class="fa-solid fa-circle-info" style="margin-right:.3rem"></i>
          El estudiante debe seleccionar exactamente las mismas opciones marcadas aquí.
        </p>
        ${options.map((opt, i) => `
          <div class="opt-row">
            <input type="checkbox" class="correct-multi-cb" value="${i}"
              ${correctIndexes.includes(i)?'checked':''}
              id="multi-correct-${i}"
              style="width:1.1rem;height:1.1rem;accent-color:#0891b2;flex-shrink:0;cursor:pointer"/>
            <input class="input text-sm" id="opt-${i}" value="${opt}"
              placeholder="Opción ${String.fromCharCode(65+i)}" style="flex:1"/>
            ${options.length > 2
              ? `<button class="btn btn-danger" style="padding:.3rem .55rem;font-size:.8rem" data-remove-opt="${i}">
                   <i class="fa-solid fa-xmark"></i>
                 </button>`
              : ''}
          </div>
        `).join('')}
        ${options.length < 6
          ? `<button class="btn btn-outline text-xs mt-2" id="add-opt-btn" style="width:100%">
               <i class="fa-solid fa-plus" style="margin-right:.3rem"></i>Agregar opción
             </button>`
          : ''}
        ${correctIndexes.length > 0
          ? `<p class="text-xs mt-2" id="multi-hint" style="color:#0891b2;font-weight:600">
               <i class="fa-solid fa-check" style="margin-right:.3rem"></i>
               ${correctIndexes.length} respuesta${correctIndexes.length !== 1 ? 's' : ''} correcta${correctIndexes.length !== 1 ? 's' : ''} marcada${correctIndexes.length !== 1 ? 's' : ''}
             </p>`
          : `<p class="text-xs mt-2" id="multi-hint" style="color:#dc2626;font-weight:600">
               <i class="fa-solid fa-triangle-exclamation" style="margin-right:.3rem"></i>
               Marca al menos una respuesta correcta
             </p>`}
      </div>
    `;
  }

  function renderEqSection() {
    return `
      <div style="background:#fdf4ff;border-radius:.75rem;padding:.85rem;border:1.5px solid #e9d5ff;margin-bottom:.75rem">
        <p class="section-label" style="color:#7c3aed">✦ Pregunta de ecuación — editor matemático</p>
        <p class="text-xs" style="color:#7c3aed;margin-bottom:.75rem">
          Escribe la ecuación de referencia / respuesta esperada usando el teclado de abajo.
          El estudiante también tendrá este mismo teclado para responder.
        </p>
        <!-- MathQuill se monta aquí con initEqEditorInCard() -->
        <div id="eq-answer-editor-wrap"></div>
      </div>
    `;
  }

  function renderQuestionChip(q, idx) {
    const typeBadge = {
      mc:    { bg:'#dbeafe', color:'#1d4ed8', icon:'fa-list-check',    label:'MÚLTIPLE' },
      multi: { bg:'#cffafe', color:'#0e7490', icon:'fa-square-check',  label:'VARIAS CORRECTAS' },
      open:  { bg:'#dcfce7', color:'#15803d', icon:'fa-pen-to-square', label:'ABIERTA' },
      eq:    { bg:'#ede9fe', color:'#6d28d9', icon:'fa-square-root-variable', label:'ECUACIÓN' },
    }[q.type] || { bg:'#f1f5f9', color:'#475569', icon:'fa-question', label:'?' };

    const displayText = q.type === 'eq'
      ? `\\(${q.text}\\)`
      : q.isMath && q.latex
        ? `${q.text} &nbsp;<span style="font-size:.8rem;color:#7c3aed">\\(${q.latex}\\)</span>`
        : q.text;

    return `
      <div class="q-chip">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.35rem">
            <span style="background:${typeBadge.bg};color:${typeBadge.color};font-size:.7rem;font-weight:700;padding:.15rem .5rem;border-radius:999px">
              <i class="fa-solid ${typeBadge.icon}" style="margin-right:.3rem"></i>${typeBadge.label}
            </span>
            <span class="text-xs text-gray">#${idx+1}</span>
          </div>
          <p class="text-sm font-bold">${displayText}</p>
          ${q.type === 'mc' ? `
            <div style="margin-top:.4rem;display:flex;flex-wrap:wrap;gap:.3rem">
              ${q.options.map((o,i) => `
                <span style="font-size:.72rem;padding:.15rem .5rem;border-radius:999px;
                  background:${i===q.correctIndex?'#dcfce7':'#f1f5f9'};
                  color:${i===q.correctIndex?'#15803d':'#475569'};
                  font-weight:${i===q.correctIndex?'700':'400'}">
                  ${i===q.correctIndex?'<i class="fa-solid fa-check" style="margin-right:.2rem"></i>':''}${o}
                </span>
              `).join('')}
            </div>
          ` : q.type === 'multi' ? `
            <div style="margin-top:.4rem;display:flex;flex-wrap:wrap;gap:.3rem">
              ${(q.options||[]).map((o,i) => {
                const isCorrect = (q.correctIndexes||[]).includes(i);
                return `<span style="font-size:.72rem;padding:.15rem .5rem;border-radius:999px;
                  background:${isCorrect?'#cffafe':'#f1f5f9'};
                  color:${isCorrect?'#0e7490':'#475569'};
                  font-weight:${isCorrect?'700':'400'}">
                  ${isCorrect?'<i class="fa-solid fa-check" style="margin-right:.2rem"></i>':''}${o}
                </span>`;
              }).join('')}
            </div>
          ` : q.type === 'eq' && q.referenceLatex ? `
            <p class="text-xs" style="color:#7c3aed;margin-top:.3rem">
              <i class="fa-solid fa-superscript" style="margin-right:.3rem"></i>
              Ref: \\(${q.referenceLatex}\\)
            </p>
          ` : q.type === 'open' ? `
            <p class="text-xs text-gray mt-1">
              <i class="fa-solid fa-pen-to-square" style="margin-right:.3rem"></i>Respuesta abierta
            </p>
          ` : ''}
        </div>
        <button class="btn btn-danger" style="padding:.3rem .55rem;font-size:.8rem;flex-shrink:0"
          data-del="${q.id}"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
  }

    // Mostrar LaTeX como fórmula renderizada
    const displayText = q.type === 'eq'
      ? `\\(${q.text}\\)`
      : q.isMath && q.latex
        ? `${q.text} &nbsp;<span style="font-size:.8rem;color:#7c3aed">\\(${q.latex}\\)</span>`
        : q.text;

    return `
      <div class="q-chip">
        <div style="flex:1">
          <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.35rem">
            <span style="background:${typeBadge.bg};color:${typeBadge.color};font-size:.7rem;font-weight:700;padding:.15rem .5rem;border-radius:999px">
              <i class="fa-solid ${typeBadge.icon}" style="margin-right:.3rem"></i>${typeBadge.label}
            </span>
            <span class="text-xs text-gray">#${idx+1}</span>
          </div>
          <p class="text-sm font-bold">${displayText}</p>
          ${q.type === 'mc' ? `
            <div style="margin-top:.4rem;display:flex;flex-wrap:wrap;gap:.3rem">
              ${q.options.map((o,i) => `
                <span style="font-size:.72rem;padding:.15rem .5rem;border-radius:999px;
                  background:${i===q.correctIndex?'#dcfce7':'#f1f5f9'};
                  color:${i===q.correctIndex?'#15803d':'#475569'};
                  font-weight:${i===q.correctIndex?'700':'400'}">
                  ${i===q.correctIndex?'<i class="fa-solid fa-check" style="margin-right:.2rem"></i>':''}${o}
                </span>
              `).join('')}
            </div>
          ` : q.type === 'eq' && q.referenceLatex ? `
            <p class="text-xs" style="color:#7c3aed;margin-top:.3rem">
              <i class="fa-solid fa-superscript" style="margin-right:.3rem"></i>
              Ref: \\(${q.referenceLatex}\\)
            </p>
          ` : q.type === 'open' ? `
            <p class="text-xs text-gray mt-1">
              <i class="fa-solid fa-pen-to-square" style="margin-right:.3rem"></i>Respuesta abierta
            </p>
          ` : ''}
        </div>
        <button class="btn btn-danger" style="padding:.3rem .55rem;font-size:.8rem;flex-shrink:0"
          data-del="${q.id}"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
  }

  // ──────────────────────────────────────────────────────────
  //  renderTabLista
  // ──────────────────────────────────────────────────────────
  function renderTabLista() {
    const filtered = exams.filter(e =>
      (e.code + e.title).toLowerCase().includes(filter.toLowerCase()));
    return `
      <div class="card">
        <div class="flex-between mb-3">
          <h2 class="font-bold" style="font-size:1.2rem">
            <i class="fa-solid fa-list" style="margin-right:.4rem;color:#2563eb"></i>Todos los exámenes
            <span style="background:#dbeafe;color:#1d4ed8;border-radius:999px;padding:.1rem .55rem;font-size:.75rem;font-weight:700;margin-left:.5rem">${exams.length}</span>
          </h2>
          <div class="flex-row">
            <input class="input" id="f-filter" placeholder="Buscar..." value="${filter}" style="width:160px"/>
            <button class="btn btn-outline text-sm" id="toggle-reg">
              <i class="fa-solid ${showRegistry ? 'fa-eye-slash' : 'fa-eye'}" style="margin-right:.3rem"></i>${showRegistry ? 'Ocultar' : 'Mostrar'}
            </button>
            <button class="btn btn-outline text-sm" id="goto-examenes-btn">
              <i class="fa-solid fa-arrow-up-right-from-square" style="margin-right:.3rem"></i>Vista completa
            </button>
          </div>
        </div>
        ${loading
          ? `<div class="text-center" style="padding:2.5rem"><div class="spinner"></div><p class="text-gray mt-3">Cargando...</p></div>`
          : showRegistry
            ? renderExamsTable(filtered)
            : '<p class="text-center text-gray" style="padding:1rem">Lista oculta</p>'}
      </div>
    `;
  }

  function renderExamsTable(filtered) {
    if (filtered.length === 0)
      return `<p class="text-center text-gray" style="padding:2rem">${filter ? 'No se encontraron exámenes' : 'No hay exámenes registrados aún'}</p>`;
    return `
      <div class="overflow-x">
        <table>
          <thead>
            <tr><th>Código</th><th>Título</th><th>Duración</th><th>Preguntas</th><th>Config</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            ${filtered.map(e => `
              <tr>
                <td class="font-mono font-bold text-blue">${e.code}</td>
                <td>${e.title}</td>
                <td><i class="fa-solid fa-clock" style="margin-right:.3rem;color:#64748b"></i>${e.durationMinutes} min</td>
                <td><i class="fa-solid fa-circle-question" style="margin-right:.3rem;color:#64748b"></i>${e.questions?.length || 0}</td>
                <td>${e.showCorrectAnswers
                  ? `<span class="badge badge-green"><i class="fa-solid fa-eye" style="margin-right:.3rem"></i>Muestra respuestas</span>`
                  : `<span class="badge badge-gray"><i class="fa-solid fa-eye-slash" style="margin-right:.3rem"></i>Oculta respuestas</span>`}</td>
                <td>
                  <div class="flex-row">
                    <button class="btn btn-outline text-xs" data-edit="${e.id}"><i class="fa-solid fa-pen" style="margin-right:.3rem"></i>Editar</button>
                    <button class="btn btn-danger text-xs" data-del-exam="${e.id}"><i class="fa-solid fa-trash"></i></button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ──────────────────────────────────────────────────────────
  //  bindTabEvents
  // ──────────────────────────────────────────────────────────
  function bindTabEvents() {
    document.getElementById('tab-crear').onclick      = () => { activeTab = 'crear'; if (!selectedExam) resetForm(); render(); };
    document.getElementById('tab-lista').onclick      = () => { activeTab = 'lista'; render(); };
    document.getElementById('tab-examenes').onclick   = () => navigate('/examenes');
    document.getElementById('tab-resultados').onclick = () => navigate('/resultados');
    document.getElementById('tab-monitor').onclick    = () => navigate('/monitor');
  }

  // ──────────────────────────────────────────────────────────
  //  bindCrearEvents  ← AQUÍ ESTABA EL BUG PRINCIPAL
  // ──────────────────────────────────────────────────────────
  function bindCrearEvents() {
    document.getElementById('f-title').oninput         = e => { title = e.target.value; };
    const regenBtn = document.getElementById('regen-code-btn');
    if (regenBtn) regenBtn.onclick = () => {
      code = generateCode();
      document.getElementById('f-code').value = code;
    };
    document.getElementById('f-dur').oninput           = e => { dur = e.target.value; };
    document.getElementById('f-show-answers').onchange = e => { showCorrectAnswers = e.target.checked; };
    document.getElementById('f-qtext').oninput         = e => { qtext = e.target.value; };

    // ─── BOTÓN ∑: abrir modal de ecuación e insertar en textarea ───
    const mathInlineBtn = document.getElementById('open-math-inline');
    if (mathInlineBtn) {
      mathInlineBtn.onclick = () => {
        openMathModal((latex) => {
          // Inserta la ecuación como marcador {{latex}} en el texto
          const ta = document.getElementById('f-qtext');
          const marker = `{{${latex}}}`;
          const pos = ta.selectionStart;
          qtext = qtext.slice(0, pos) + marker + qtext.slice(pos);
          ta.value = qtext;
          // Mover cursor al final del marcador insertado
          ta.selectionStart = ta.selectionEnd = pos + marker.length;
          ta.focus();
        });
      };
    }

    // ─── Radio de tipo de pregunta ───
    document.querySelectorAll('input[name="qtype"]').forEach(r => {
      r.onchange = e => { qtype = e.target.value; render(); };
    });

    // ─── Opciones múltiple choice ───
    if (qtype === 'mc') {
      options.forEach((_, i) => {
        const inp   = document.getElementById(`opt-${i}`);
        const radio = document.getElementById(`correct-${i}`);
        if (inp)   inp.oninput    = e => { options[i] = e.target.value; };
        if (radio) radio.onchange = () => { correctIndex = i; };
      });
      const addOptBtn = document.getElementById('add-opt-btn');
      if (addOptBtn) addOptBtn.onclick = addOption;
      document.querySelectorAll('[data-remove-opt]').forEach(btn => {
        btn.onclick = () => removeOption(Number(btn.dataset.removeOpt));
      });
    }

    // ─── Opciones varias correctas ───
    if (qtype === 'multi') {
      options.forEach((_, i) => {
        const inp = document.getElementById(`opt-${i}`);
        const cb  = document.getElementById(`multi-correct-${i}`);
        if (inp) inp.oninput = e => { options[i] = e.target.value; };
        if (cb)  cb.onchange = () => {
          const idx = Number(cb.value);
          if (cb.checked) {
            if (!correctIndexes.includes(idx)) correctIndexes.push(idx);
          } else {
            correctIndexes = correctIndexes.filter(x => x !== idx);
          }
          // Actualizar solo el feedback visual sin re-render completo
          const hint = document.getElementById('multi-hint');
          if (hint) {
            hint.style.color = correctIndexes.length > 0 ? '#0891b2' : '#dc2626';
            hint.innerHTML = correctIndexes.length > 0
              ? `<i class="fa-solid fa-check" style="margin-right:.3rem"></i>${correctIndexes.length} respuesta${correctIndexes.length !== 1 ? 's' : ''} correcta${correctIndexes.length !== 1 ? 's' : ''} marcada${correctIndexes.length !== 1 ? 's' : ''}`
              : `<i class="fa-solid fa-triangle-exclamation" style="margin-right:.3rem"></i>Marca al menos una respuesta correcta`;
          }
        };
      });
      const addOptBtn = document.getElementById('add-opt-btn');
      if (addOptBtn) addOptBtn.onclick = addOption;
      document.querySelectorAll('[data-remove-opt]').forEach(btn => {
        btn.onclick = () => removeOption(Number(btn.dataset.removeOpt));
      });
    }

    document.getElementById('add-q-btn').onclick = addQuestion;
    document.getElementById('save-btn').onclick   = saveExam;
    if (selectedExam) {
      document.getElementById('cancel-edit').onclick = () => { resetForm(); render(); };
    }
    document.querySelectorAll('[data-del]').forEach(btn => {
      btn.onclick = () => removeQuestion(btn.dataset.del);
    });

    // ─── Botón IA ───
    const ragBtn = document.getElementById('rag-btn');
    if (ragBtn) ragBtn.onclick = () => {
      openRAGModal((newQ) => { questions.push(...newQ); render(); });
    };
  }

  function bindListaEvents() {
    document.getElementById('f-filter').oninput   = e => { filter = e.target.value; render(); };
    document.getElementById('toggle-reg').onclick = () => { showRegistry = !showRegistry; render(); };
    const gotoBtn = document.getElementById('goto-examenes-btn');
    if (gotoBtn) gotoBtn.onclick = () => navigate('/examenes');
    document.querySelectorAll('[data-edit]').forEach(btn => {
      btn.onclick = () => { const e = exams.find(x => x.id === btn.dataset.edit); if (e) openExam(e); };
    });
    document.querySelectorAll('[data-del-exam]').forEach(btn => {
      btn.onclick = () => { const e = exams.find(x => x.id === btn.dataset.delExam); if (e) deleteExam(e); };
    });
  }

  // ─── helper para HTML seguro en atributos ─────────────────
  function escapeHtmlForAttr(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  loadExams().then(() => checkPendingEdit());
}