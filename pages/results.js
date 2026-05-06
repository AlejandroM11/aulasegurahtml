function renderResults(app) {
  let submissions = [], loading = true, filter = '', selectedSub = null;

  // ── Lógica sin cambios ──────────────────────────────────────────────────

  function score(sub) {
    if (!sub.answers || !sub.examQuestions) return null;
    const mc = sub.examQuestions.filter(q => q.type === 'mc');
    if (!mc.length) return null;
    const correct = mc.filter(q =>
      sub.answers[q.id] !== undefined && Number(sub.answers[q.id]) === q.correctIndex
    ).length;
    return { correct, total: mc.length, pct: Math.round((correct / mc.length) * 100) };
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  async function load() {
    loading = true; render();
    try {
      const user = getUser();
      const [subs, allExams] = await Promise.all([apiGetSubmissions(), apiGetExams()]);
      let myExams = allExams.filter(e =>
        (user?.uid   && e.teacherId === user.uid) ||
        (user?.email && e.teacherId === user.email)
      );
      const isFallback = myExams.length === 0 && allExams.length > 0;
      if (isFallback) myExams = allExams;
      const examMap = {};
      myExams.forEach(e => {
        if (e.id)   examMap[e.id]                        = e;
        if (e.code) examMap[e.code.trim().toUpperCase()] = e;
      });
      const myIds   = new Set(myExams.map(e => e.id));
      const myCodes = new Set(myExams.map(e => e.code?.trim().toUpperCase()));
      submissions = subs
        .filter(s => {
          if (isFallback) return true;
          const byId      = s.examId    && myIds.has(s.examId);
          const byCode    = s.code      && myCodes.has(s.code?.trim().toUpperCase());
          const byTeacher = s.teacherId && (s.teacherId === user?.uid || s.teacherId === user?.email);
          return byId || byCode || byTeacher;
        })
        .map(s => {
          const exam = examMap[s.examId] || examMap[s.code?.trim().toUpperCase()];
          return { ...s, examQuestions: exam?.questions || [], showCorrectAnswers: exam?.showCorrectAnswers || false };
        });
    } catch (err) {
      console.error('Error en load():', err);
      alert('Error al cargar resultados');
    } finally {
      loading = false; render();
    }
  }

  function renderStaticMath(el, latex) {
    if (!el || !latex) return;
    if (window.MathQuill) {
      try { el.innerHTML = ''; window.MathQuill.getInterface(2).StaticMath(el).latex(latex); return; }
      catch (_) {}
    }
    el.innerHTML = `<code style="font-family:monospace;font-size:.9rem;color:#1d4ed8;background:#eff6ff;padding:.15rem .4rem;border-radius:.35rem">${latex}</code>`;
  }

  function renderMathInResults(questions, answers) {
    questions.forEach(q => {
      if (q.type !== 'eq') return;
      const given = answers?.[q.id];
      if (given)            renderStaticMath(document.getElementById(`res-eq-student-${q.id}`), given);
      if (q.referenceLatex) renderStaticMath(document.getElementById(`res-eq-ref-${q.id}`), q.referenceLatex);
    });
  }

  // ── Vista lista ─────────────────────────────────────────────────────────

  function render() {
    if (loading) {
      app.innerHTML = `
        <div class="text-center" style="padding:5rem">
          <div class="spinner"></div>
          <p class="text-gray mt-3">Cargando resultados...</p>
        </div>`;
      return;
    }
    if (selectedSub) { renderDetail(); return; }

    const filtered = submissions.filter(s =>
      `${s.studentName || ''}${s.studentEmail || ''}${s.title || ''}${s.code || ''}`
        .toLowerCase().includes(filter.toLowerCase())
    );
    const totalSubs = submissions.length;
    const blocked   = submissions.filter(s => s.wasBlocked).length;
    const avgPct    = (() => {
      const scored = submissions.map(s => score(s)).filter(Boolean);
      if (!scored.length) return null;
      return Math.round(scored.reduce((a, b) => a + b.pct, 0) / scored.length);
    })();

    app.innerHTML = `
      <style>
        /* ── Stats ── */
        .rs-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.75rem}
        .rs-stat{background:#fff;border:1px solid #e8e4df;border-radius:1.1rem;padding:1.25rem 1.4rem;
          display:flex;align-items:center;gap:1rem;
          box-shadow:0 2px 8px rgba(0,0,0,.05);transition:box-shadow .2s}
        .rs-stat:hover{box-shadow:0 4px 16px rgba(0,0,0,.09)}
        body.dark .rs-stat{background:#1e293b;border-color:#334155}
        .rs-stat-icon{width:2.75rem;height:2.75rem;border-radius:.85rem;
          display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0}
        .rs-stat-val{font-size:1.8rem;font-weight:800;line-height:1;color:#1e293b}
        body.dark .rs-stat-val{color:#f1f5f9}
        .rs-stat-lbl{font-size:.72rem;color:#94a3b8;margin-top:.2rem;text-transform:uppercase;letter-spacing:.06em}
        /* ── Table ── */
        .rs-table-wrap{background:#fff;border:1px solid #e8e4df;border-radius:1.1rem;
          overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.05)}
        body.dark .rs-table-wrap{background:#1e293b;border-color:#334155}
        .rs-search-bar{padding:1rem 1.25rem;border-bottom:1px solid #e8e4df;
          display:flex;align-items:center;gap:.75rem;background:#fafaf9}
        body.dark .rs-search-bar{background:#0f172a;border-color:#334155}
        .rs-table{width:100%;border-collapse:collapse;font-size:.875rem}
        .rs-table thead tr{background:linear-gradient(90deg,#1e3a5f,#2563eb)}
        .rs-table th{padding:.75rem 1rem;text-align:left;color:#fff;font-weight:600;
          font-size:.78rem;text-transform:uppercase;letter-spacing:.06em}
        .rs-table th:first-child{border-radius:0}
        .rs-table td{padding:.85rem 1rem;border-bottom:1px solid #f1f5f9;vertical-align:middle;color:#1e293b}
        body.dark .rs-table td{border-color:#334155;color:#e2e8f0}
        .rs-table tbody tr{transition:background .15s}
        .rs-table tbody tr:hover td{background:#f8fafc}
        body.dark .rs-table tbody tr:hover td{background:#1e293b}
        .rs-table tbody tr:last-child td{border-bottom:none}
        /* ── Student cell ── */
        .rs-student-name{font-weight:600;font-size:.9rem;color:#1e293b}
        body.dark .rs-student-name{color:#f1f5f9}
        .rs-student-email{font-size:.75rem;color:#94a3b8;margin-top:.1rem}
        /* ── Score pill ── */
        .rs-score-pass{display:inline-block;padding:.25rem .7rem;border-radius:999px;
          font-size:.8rem;font-weight:700;background:#dcfce7;color:#15803d}
        .rs-score-fail{display:inline-block;padding:.25rem .7rem;border-radius:999px;
          font-size:.8rem;font-weight:700;background:#fee2e2;color:#991b1b}
        body.dark .rs-score-pass{background:#14532d;color:#86efac}
        body.dark .rs-score-fail{background:#7f1d1d;color:#fca5a5}
        /* ── Empty state ── */
        .rs-empty{padding:4rem 2rem;text-align:center;color:#94a3b8}
        @media(max-width:640px){.rs-grid{grid-template-columns:1fr}}
      </style>

      <div style="max-width:980px;margin:0 auto">

        <!-- Header -->
        <div class="flex-between mb-4">
          <div>
            <h1 style="font-size:1.6rem;font-weight:800;color:#1e293b;display:flex;align-items:center;gap:.6rem">
              <span style="width:2.2rem;height:2.2rem;background:linear-gradient(135deg,#1e3a5f,#2563eb);
                border-radius:.65rem;display:inline-flex;align-items:center;justify-content:center">
                <i class="fa-solid fa-chart-bar" style="color:#fff;font-size:.9rem"></i>
              </span>
              Resultados
            </h1>
            <p style="color:#94a3b8;font-size:.85rem;margin-top:.3rem">
              ${totalSubs} entrega${totalSubs !== 1 ? 's' : ''} registrada${totalSubs !== 1 ? 's' : ''}
            </p>
          </div>
          <button class="btn btn-outline" id="back-btn">
            <i class="fa-solid fa-arrow-left" style="margin-right:.4rem"></i>Volver
          </button>
        </div>

        <!-- Stats -->
        <div class="rs-grid">
          <div class="rs-stat">
            <div class="rs-stat-icon" style="background:#dbeafe">
              <i class="fa-solid fa-users" style="color:#2563eb"></i>
            </div>
            <div>
              <div class="rs-stat-val" style="color:#2563eb">${totalSubs}</div>
              <div class="rs-stat-lbl">Entregas</div>
            </div>
          </div>
          <div class="rs-stat">
            <div class="rs-stat-icon" style="background:${avgPct == null ? '#f1f5f9' : avgPct >= 60 ? '#dcfce7' : '#fee2e2'}">
              <i class="fa-solid fa-percent" style="color:${avgPct == null ? '#94a3b8' : avgPct >= 60 ? '#16a34a' : '#dc2626'}"></i>
            </div>
            <div>
              <div class="rs-stat-val" style="color:${avgPct == null ? '#94a3b8' : avgPct >= 60 ? '#16a34a' : '#dc2626'}">
                ${avgPct != null ? avgPct + '%' : '—'}
              </div>
              <div class="rs-stat-lbl">Promedio MC</div>
            </div>
          </div>
          <div class="rs-stat">
            <div class="rs-stat-icon" style="background:${blocked > 0 ? '#fee2e2' : '#f1f5f9'}">
              <i class="fa-solid fa-lock" style="color:${blocked > 0 ? '#dc2626' : '#94a3b8'}"></i>
            </div>
            <div>
              <div class="rs-stat-val" style="color:${blocked > 0 ? '#dc2626' : '#94a3b8'}">${blocked}</div>
              <div class="rs-stat-lbl">Bloqueados</div>
            </div>
          </div>
        </div>

        <!-- Table -->
        <div class="rs-table-wrap">
          <div class="rs-search-bar">
            <div style="position:relative;flex:1;max-width:340px">
              <i class="fa-solid fa-magnifying-glass" style="position:absolute;left:.85rem;top:50%;
                transform:translateY(-50%);color:#94a3b8;font-size:.8rem;pointer-events:none"></i>
              <input class="input" id="f-filter"
                placeholder="Buscar por nombre, correo o código..."
                value="${filter}"
                style="padding-left:2.4rem;border-radius:.75rem;font-size:.875rem"/>
            </div>
            ${filter ? `
              <button class="btn btn-outline text-xs" id="clear-filter" style="border-radius:.75rem">
                <i class="fa-solid fa-xmark" style="margin-right:.3rem"></i>Limpiar
              </button>` : ''}
          </div>

          ${filtered.length === 0 ? `
            <div class="rs-empty">
              <i class="fa-solid fa-inbox" style="font-size:2.5rem;color:#e2e8f0;display:block;margin-bottom:.75rem"></i>
              <p style="font-weight:600;color:#64748b">${filter ? 'Sin resultados para esa búsqueda' : 'No hay entregas aún'}</p>
              ${!filter ? '<p style="font-size:.82rem;margin-top:.35rem">Los resultados aparecerán cuando los estudiantes completen un examen</p>' : ''}
            </div>
          ` : `
            <div style="overflow-x:auto">
              <table class="rs-table">
                <thead>
                  <tr>
                    <th>Estudiante</th>
                    <th>Examen</th>
                    <th>Nota</th>
                    <th>Infracciones</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th style="width:52px"></th>
                  </tr>
                </thead>
                <tbody>
                  ${filtered.map(s => {
                    const sc         = score(s);
                    const violations = s.violations?.length || 0;
                    return `
                      <tr>
                        <td>
                          <p class="rs-student-name">${s.studentName || 'Anónimo'}</p>
                          <p class="rs-student-email">${s.studentEmail || ''}</p>
                        </td>
                        <td>
                          <p style="font-weight:600;font-size:.875rem;color:#1e293b">${s.title || s.code || '—'}</p>
                          <p style="font-size:.72rem;font-family:monospace;color:#2563eb;margin-top:.1rem">${s.code || ''}</p>
                        </td>
                        <td>
                          ${sc
                            ? `<span class="${sc.pct >= 60 ? 'rs-score-pass' : 'rs-score-fail'}">${sc.pct}%</span>
                               <p style="font-size:.72rem;color:#94a3b8;margin-top:.25rem">${sc.correct}/${sc.total} correctas</p>`
                            : `<span style="font-size:.78rem;color:#94a3b8;font-style:italic">Solo abiertas</span>`}
                        </td>
                        <td>
                          ${violations > 0
                            ? `<span style="display:inline-flex;align-items:center;gap:.3rem;
                                color:#dc2626;font-weight:700;font-size:.875rem">
                                <i class="fa-solid fa-triangle-exclamation"></i>${violations}
                               </span>`
                            : `<span style="color:#94a3b8;font-size:.875rem">0</span>`}
                        </td>
                        <td>
                          ${s.wasBlocked
                            ? `<span class="badge badge-red" style="font-size:.75rem">
                                <i class="fa-solid fa-lock" style="margin-right:.3rem"></i>Bloqueado</span>`
                            : s.forced
                              ? `<span class="badge badge-gray" style="font-size:.75rem">
                                  <i class="fa-solid fa-clock" style="margin-right:.3rem"></i>Tiempo</span>`
                              : `<span class="badge badge-green" style="font-size:.75rem">
                                  <i class="fa-solid fa-circle-check" style="margin-right:.3rem"></i>Completado</span>`}
                        </td>
                        <td style="font-size:.78rem;color:#94a3b8;white-space:nowrap">${fmtDate(s.submittedAt)}</td>
                        <td>
                          <button class="btn btn-outline text-xs" data-view="${s.id || s.submittedAt}"
                            style="border-radius:.65rem;padding:.4rem .65rem">
                            <i class="fa-solid fa-eye"></i>
                          </button>
                        </td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>`;

    document.getElementById('back-btn').onclick = () => navigate('/docente');
    document.getElementById('f-filter').oninput = e => { filter = e.target.value; render(); };
    const clearBtn = document.getElementById('clear-filter');
    if (clearBtn) clearBtn.onclick = () => { filter = ''; render(); };
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.onclick = () => {
        selectedSub = filtered.find(s => (s.id || s.submittedAt) == btn.dataset.view);
        render();
      };
    });
  }

  // ── Vista detalle ────────────────────────────────────────────────────────

  function renderDetail() {
    const s          = selectedSub;
    const sc         = score(s);
    const questions  = s.examQuestions || [];
    const violations = s.violations    || [];
    const answers    = s.answers       || {};

    app.innerHTML = `
      <style>
        /* ── Detail stats ── */
        .rd-stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem}
        .rd-stat{background:#fff;border:1px solid #e8e4df;border-radius:1.1rem;
          padding:1.25rem;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.05)}
        body.dark .rd-stat{background:#1e293b;border-color:#334155}
        .rd-stat-val{font-size:2rem;font-weight:800;line-height:1;margin-bottom:.3rem;color:#1e293b}
        body.dark .rd-stat-val{color:#f1f5f9}
        .rd-stat-lbl{font-size:.72rem;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em}
        /* ── Question cards ── */
        .rd-q-card{background:#fff;border:1px solid #e8e4df;border-radius:1.1rem;
          padding:1.25rem 1.4rem;margin-bottom:.85rem;
          box-shadow:0 2px 6px rgba(0,0,0,.04);transition:box-shadow .2s}
        .rd-q-card:hover{box-shadow:0 4px 14px rgba(0,0,0,.08)}
        body.dark .rd-q-card{background:#1e293b;border-color:#334155}
        /* ── Question header ── */
        .rd-q-header{display:flex;align-items:center;gap:.65rem;margin-bottom:.85rem}
        .rd-q-num{width:1.9rem;height:1.9rem;border-radius:.55rem;flex-shrink:0;
          background:linear-gradient(135deg,#1e3a5f,#2563eb);
          display:flex;align-items:center;justify-content:center;
          color:#fff;font-size:.75rem;font-weight:700}
        .rd-q-type-badge{font-size:.68rem;font-weight:700;text-transform:uppercase;
          letter-spacing:.07em;padding:.2rem .55rem;border-radius:999px}
        .rd-q-type-mc{background:#dbeafe;color:#1d4ed8}
        .rd-q-type-open{background:#dcfce7;color:#15803d}
        .rd-q-type-eq{background:#f3e8ff;color:#7c3aed}
        .rd-q-text{font-size:.95rem;font-weight:600;color:#1e293b;line-height:1.5;flex:1}
        body.dark .rd-q-text{color:#f1f5f9}
        /* ── Answer boxes ── */
        .rd-answer-box{border-radius:.75rem;padding:.75rem 1rem;margin-top:.5rem;font-size:.875rem}
        .rd-answer-correct{background:#f0fdf4;border:1.5px solid #86efac;color:#166534}
        .rd-answer-wrong{background:#fef2f2;border:1.5px solid #fca5a5;color:#991b1b}
        .rd-answer-open{background:#f8fafc;border:1.5px solid #e2e8f0;color:#1e293b}
        .rd-answer-empty{background:#fafaf9;border:1.5px dashed #d1d5db;color:#94a3b8}
        body.dark .rd-answer-correct{background:#052e16;border-color:#166534;color:#86efac}
        body.dark .rd-answer-wrong{background:#450a0a;border-color:#991b1b;color:#fca5a5}
        body.dark .rd-answer-open{background:#0f172a;border-color:#334155;color:#e2e8f0}
        body.dark .rd-answer-empty{background:#1e293b;border-color:#334155;color:#64748b}
        /* ── Correct answer hint ── */
        .rd-correct-hint{margin-top:.5rem;padding:.55rem .85rem;border-radius:.65rem;
          background:#f0fdf4;border:1px solid #bbf7d0;
          font-size:.8rem;color:#166534;display:flex;align-items:center;gap:.4rem}
        body.dark .rd-correct-hint{background:#052e16;border-color:#166534;color:#86efac}
        /* ── Math boxes ── */
        .rd-math-ref{background:#eff6ff;border:1px solid #bfdbfe;border-radius:.65rem;
          padding:.5rem .85rem;margin-bottom:.5rem;font-size:1rem}
        body.dark .rd-math-ref{background:#1e3a5f;border-color:#3b82f6}
        .rd-math-student{background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:.65rem;
          padding:.5rem .85rem;font-size:1rem}
        body.dark .rd-math-student{background:#0f172a;border-color:#334155}
        /* ── Violations ── */
        .rd-violation{background:#fef2f2;border-radius:.6rem;padding:.5rem .85rem;
          font-size:.83rem;color:#991b1b;margin-bottom:.4rem;
          display:flex;align-items:flex-start;gap:.5rem}
        body.dark .rd-violation{background:#450a0a;color:#fca5a5}
        @media(max-width:640px){.rd-stat-grid{grid-template-columns:1fr 1fr}}
      </style>

      <div style="max-width:840px;margin:0 auto">

        <!-- Header -->
        <div class="flex-between mb-4">
          <div>
            <h1 style="font-size:1.45rem;font-weight:800;color:#1e293b;display:flex;align-items:center;gap:.6rem">
              <span style="width:2.1rem;height:2.1rem;background:linear-gradient(135deg,#1e3a5f,#2563eb);
                border-radius:.6rem;display:inline-flex;align-items:center;justify-content:center">
                <i class="fa-solid fa-clipboard-list" style="color:#fff;font-size:.85rem"></i>
              </span>
              Detalle de entrega
            </h1>
            <p style="color:#94a3b8;font-size:.83rem;margin-top:.3rem">
              <i class="fa-solid fa-user" style="margin-right:.35rem"></i>${s.studentName || 'Anónimo'}
              &nbsp;·&nbsp;
              <i class="fa-solid fa-calendar" style="margin-right:.35rem"></i>${fmtDate(s.submittedAt)}
            </p>
          </div>
          <button class="btn btn-outline" id="back-detail">
            <i class="fa-solid fa-arrow-left" style="margin-right:.4rem"></i>Volver
          </button>
        </div>

        <!-- Stats -->
        <div class="rd-stat-grid">
          <div class="rd-stat">
            <div class="rd-stat-val" style="color:${sc ? (sc.pct >= 60 ? '#16a34a' : '#dc2626') : '#94a3b8'}">
              ${sc ? sc.pct + '%' : '—'}
            </div>
            <div class="rd-stat-lbl"><i class="fa-solid fa-percent" style="margin-right:.3rem"></i>Nota MC</div>
          </div>
          <div class="rd-stat">
            <div class="rd-stat-val" style="color:${violations.length > 0 ? '#dc2626' : '#16a34a'}">
              ${violations.length}
            </div>
            <div class="rd-stat-lbl"><i class="fa-solid fa-triangle-exclamation" style="margin-right:.3rem"></i>Infracciones</div>
          </div>
          <div class="rd-stat">
            <div class="rd-stat-val" style="font-size:1.6rem">
              ${s.wasBlocked
                ? `<i class="fa-solid fa-lock" style="color:#dc2626"></i>`
                : s.forced
                  ? `<i class="fa-solid fa-clock" style="color:#d97706"></i>`
                  : `<i class="fa-solid fa-circle-check" style="color:#16a34a"></i>`}
            </div>
            <div class="rd-stat-lbl">${s.wasBlocked ? 'Bloqueado' : s.forced ? 'Tiempo agotado' : 'Completado'}</div>
          </div>
        </div>

        <!-- Violations -->
        ${violations.length > 0 ? `
          <div style="background:#fff;border:1px solid #fecaca;border-left:4px solid #dc2626;
            border-radius:1.1rem;padding:1.1rem 1.25rem;margin-bottom:1.25rem;
            box-shadow:0 2px 6px rgba(0,0,0,.04)">
            <p style="font-size:.8rem;font-weight:700;color:#dc2626;text-transform:uppercase;
              letter-spacing:.07em;margin-bottom:.75rem">
              <i class="fa-solid fa-triangle-exclamation" style="margin-right:.4rem"></i>
              Infracciones (${violations.length})
            </p>
            ${violations.map((v, i) => `
              <div class="rd-violation">
                <span style="font-weight:700;flex-shrink:0">${i + 1}.</span>
                <span>${v.reason || v}${v.timestamp
                  ? `<span style="margin-left:.5rem;font-size:.72rem;opacity:.7">${fmtDate(v.timestamp)}</span>`
                  : ''}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Questions -->
        <div style="background:#fff;border:1px solid #e8e4df;border-radius:1.1rem;
          padding:1.25rem 1.4rem;box-shadow:0 2px 8px rgba(0,0,0,.05)">
          <p style="font-size:.8rem;font-weight:700;color:#64748b;text-transform:uppercase;
            letter-spacing:.07em;margin-bottom:1.1rem">
            <i class="fa-solid fa-list-check" style="color:#2563eb;margin-right:.4rem"></i>
            Respuestas — ${questions.length} pregunta${questions.length !== 1 ? 's' : ''}
          </p>

          ${questions.length === 0 ? `
            <div style="text-align:center;padding:2.5rem;color:#94a3b8">
              <i class="fa-solid fa-inbox" style="font-size:2rem;display:block;margin-bottom:.6rem;color:#e2e8f0"></i>
              <p style="font-weight:600">Examen eliminado</p>
              <p style="font-size:.8rem;margin-top:.25rem">Las respuestas siguen guardadas en el sistema</p>
            </div>
          ` : questions.map((q, idx) => {
              const given    = answers[q.id];
              const answered = given !== undefined && given !== '';
              let isCorrect  = null;
              if (q.type === 'mc' && answered) isCorrect = Number(given) === q.correctIndex;

              const typeLabel = q.type === 'mc' ? 'Múltiple opción'
                              : q.type === 'eq' ? 'Ecuación'
                              : 'Abierta';
              const typeClass = q.type === 'mc' ? 'rd-q-type-mc'
                              : q.type === 'eq' ? 'rd-q-type-eq'
                              : 'rd-q-type-open';
              const typeIcon  = q.type === 'mc' ? 'fa-circle-question'
                              : q.type === 'eq' ? 'fa-square-root-variable'
                              : 'fa-pen-to-square';

              return `
                <div class="rd-q-card">
                  <!-- Question header -->
                  <div class="rd-q-header">
                    <div class="rd-q-num">${idx + 1}</div>
                    <span class="rd-q-type-badge ${typeClass}">
                      <i class="fa-solid ${typeIcon}" style="margin-right:.3rem"></i>${typeLabel}
                    </span>
                    <p class="rd-q-text">${q.text}</p>
                  </div>

                  <!-- Answer -->
                  ${q.type === 'mc' ? `
                    <div class="rd-answer-box ${answered
                      ? (isCorrect ? 'rd-answer-correct' : 'rd-answer-wrong')
                      : 'rd-answer-empty'}">
                      ${answered
                        ? `<i class="fa-solid ${isCorrect ? 'fa-check' : 'fa-xmark'}"
                             style="margin-right:.5rem"></i>
                           <strong>Respondió:</strong> ${q.options?.[given] || given}`
                        : `<i class="fa-solid fa-minus" style="margin-right:.5rem"></i>Sin responder`}
                    </div>
                    ${!isCorrect && s.showCorrectAnswers && q.options ? `
                      <div class="rd-correct-hint">
                        <i class="fa-solid fa-check"></i>
                        <span><strong>Correcta:</strong> ${q.options[q.correctIndex]}</span>
                      </div>
                    ` : ''}

                  ` : q.type === 'eq' ? `
                    ${q.referenceLatex ? `
                      <p style="font-size:.72rem;font-weight:700;color:#1d4ed8;
                        text-transform:uppercase;letter-spacing:.06em;margin-bottom:.35rem">
                        <i class="fa-solid fa-square-root-variable" style="margin-right:.3rem"></i>Referencia del docente
                      </p>
                      <div class="rd-math-ref" id="res-eq-ref-${q.id}"></div>
                    ` : ''}
                    <p style="font-size:.72rem;font-weight:700;color:#64748b;
                      text-transform:uppercase;letter-spacing:.06em;margin-bottom:.35rem">
                      <i class="fa-solid fa-pen-to-square" style="margin-right:.3rem"></i>Respuesta del estudiante
                    </p>
                    ${answered
                      ? `<div class="rd-math-student" id="res-eq-student-${q.id}"></div>`
                      : `<div class="rd-answer-box rd-answer-empty">
                          <i class="fa-solid fa-minus" style="margin-right:.5rem"></i>Sin responder
                         </div>`}

                  ` : `
                    <div class="rd-answer-box ${answered ? 'rd-answer-open' : 'rd-answer-empty'}">
                      ${answered
                        ? `<i class="fa-solid fa-pen-to-square" style="margin-right:.5rem;color:#2563eb"></i>
                           <span style="white-space:pre-wrap">${given}</span>`
                        : `<i class="fa-solid fa-minus" style="margin-right:.5rem"></i>Sin responder`}
                    </div>
                  `}
                </div>
              `;
            }).join('')}
        </div>
      </div>`;

    document.getElementById('back-detail').onclick = () => { selectedSub = null; render(); };
    setTimeout(() => renderMathInResults(questions, answers), 60);
  }

  load();
}
