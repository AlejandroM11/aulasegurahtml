function renderResults(app) {
  let submissions = [], loading = true, filter = '', selectedSub = null;

  // ── Calcula nota de opción múltiple ──
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
      // apiGetSubmissions ya filtra por teacherId y exámenes existentes del profesor
      const [subs, exams] = await Promise.all([apiGetSubmissions(), apiGetExams()]);

      // Construir mapa solo con exámenes que existen actualmente
      const examMap = {};
      exams.forEach(e => { examMap[e.id] = e; examMap[e.code] = e; });

      // Filtrar submissions: solo las que corresponden a un examen existente
      submissions = subs
        .filter(s => examMap[s.examId] || examMap[s.code])
        .map(s => {
          const exam = examMap[s.examId] || examMap[s.code];
          return {
            ...s,
            examQuestions:      exam?.questions          || [],
            showCorrectAnswers: exam?.showCorrectAnswers || false
          };
        });
    } catch {
      alert('Error al cargar resultados');
    } finally {
      loading = false; render();
    }
  }

  // ── Render principal ──
  function render() {
    if (loading) {
      app.innerHTML = `
        <div class="text-center" style="padding:4rem">
          <div class="spinner"></div>
          <p class="text-gray mt-3">Cargando resultados...</p>
        </div>`;
      return;
    }

    if (selectedSub) { renderDetail(); return; }

    const filtered = submissions.filter(s =>
      `${s.studentName}${s.studentEmail}${s.title}${s.code}`
        .toLowerCase().includes(filter.toLowerCase())
    );

    // Métricas de resumen
    const totalSubs    = submissions.length;
    const blocked      = submissions.filter(s => s.wasBlocked).length;
    const avgPct       = (() => {
      const scored = submissions.map(s => score(s)).filter(Boolean);
      if (!scored.length) return null;
      return Math.round(scored.reduce((a, b) => a + b.pct, 0) / scored.length);
    })();

    app.innerHTML = `
      <style>
        .results-stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem}
        .results-stat{background:#fff;border:1px solid #e2e8f0;border-radius:1rem;padding:1.25rem 1.5rem;display:flex;align-items:center;gap:1rem}
        body.dark .results-stat{background:#1e293b;border-color:#334155}
        .results-stat-icon{width:2.75rem;height:2.75rem;border-radius:.75rem;display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0}
        .results-stat-val{font-size:1.75rem;font-weight:800;line-height:1}
        .results-stat-lbl{font-size:.75rem;color:#64748b;margin-top:.2rem}
        body.dark .results-stat-lbl{color:#94a3b8}
        .score-pill{display:inline-block;padding:.2rem .65rem;border-radius:999px;font-size:.8rem;font-weight:700}
        .score-pass{background:#dcfce7;color:#15803d}
        .score-fail{background:#fee2e2;color:#b91c1c}
        body.dark .score-pass{background:#14532d;color:#86efac}
        body.dark .score-fail{background:#7f1d1d;color:#fca5a5}
        .results-table td{vertical-align:middle}
        .student-cell p:first-child{font-weight:600;font-size:.9rem;color:#1e293b}
        body.dark .student-cell p:first-child{color:#e2e8f0}
        .student-cell p:last-child{font-size:.75rem;color:#64748b;margin-top:.1rem}
        @media(max-width:640px){.results-stat-grid{grid-template-columns:1fr}}
      </style>

      <div style="max-width:960px;margin:0 auto">

        <!-- Header -->
        <div class="flex-between mb-4">
          <div>
            <h1 class="font-bold" style="font-size:1.6rem">
              <i class="fa-solid fa-chart-bar" style="color:#2563eb;margin-right:.5rem"></i>Resultados
            </h1>
            <p class="text-gray text-sm mt-1">${totalSubs} entrega${totalSubs !== 1 ? 's' : ''} registrada${totalSubs !== 1 ? 's' : ''}</p>
          </div>
          <button class="btn btn-outline" id="back-btn">
            <i class="fa-solid fa-arrow-left" style="margin-right:.4rem"></i>Volver
          </button>
        </div>

        <!-- Stats -->
        <div class="results-stat-grid">
          <div class="results-stat">
            <div class="results-stat-icon" style="background:#dbeafe">
              <i class="fa-solid fa-users" style="color:#2563eb"></i>
            </div>
            <div>
              <div class="results-stat-val text-blue">${totalSubs}</div>
              <div class="results-stat-lbl">Entregas totales</div>
            </div>
          </div>
          <div class="results-stat">
            <div class="results-stat-icon" style="background:#dcfce7">
              <i class="fa-solid fa-percent" style="color:#16a34a"></i>
            </div>
            <div>
              <div class="results-stat-val" style="color:${avgPct == null ? '#94a3b8' : avgPct >= 60 ? '#16a34a' : '#dc2626'}">
                ${avgPct != null ? avgPct + '%' : '—'}
              </div>
              <div class="results-stat-lbl">Promedio general</div>
            </div>
          </div>
          <div class="results-stat">
            <div class="results-stat-icon" style="background:#fee2e2">
              <i class="fa-solid fa-lock" style="color:#dc2626"></i>
            </div>
            <div>
              <div class="results-stat-val" style="color:#dc2626">${blocked}</div>
              <div class="results-stat-lbl">Bloqueados</div>
            </div>
          </div>
        </div>

        <!-- Tabla -->
        <div class="card" style="padding:0;overflow:hidden">
          <div style="padding:1.25rem 1.5rem;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:.75rem">
            <div style="position:relative;flex:1;max-width:320px">
              <i class="fa-solid fa-magnifying-glass" style="position:absolute;left:.75rem;top:50%;transform:translateY(-50%);color:#94a3b8;font-size:.85rem"></i>
              <input class="input" id="f-filter" placeholder="Buscar por nombre, correo o código..."
                value="${filter}" style="padding-left:2.25rem"/>
            </div>
            ${filter ? `<button class="btn btn-outline text-xs" id="clear-filter">
              <i class="fa-solid fa-xmark" style="margin-right:.3rem"></i>Limpiar
            </button>` : ''}
          </div>

          ${filtered.length === 0 ? `
            <div class="text-center text-gray" style="padding:4rem 2rem">
              <i class="fa-solid fa-inbox" style="font-size:2.5rem;color:#cbd5e1"></i>
              <p class="mt-3 font-bold">${filter ? 'Sin resultados para esa búsqueda' : 'No hay entregas aún'}</p>
              ${filter ? '' : '<p class="text-sm mt-1">Los resultados aparecerán cuando los estudiantes completen un examen</p>'}
            </div>
          ` : `
            <div class="overflow-x">
              <table class="results-table">
                <thead><tr>
                  <th>Estudiante</th>
                  <th>Examen</th>
                  <th>Nota</th>
                  <th>Infracciones</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th style="width:60px"></th>
                </tr></thead>
                <tbody>
                  ${filtered.map(s => {
                    const sc = score(s);
                    const violations = s.violations?.length || 0;
                    return `
                      <tr>
                        <td class="student-cell">
                          <p>${s.studentName || 'Anónimo'}</p>
                          <p>${s.studentEmail || ''}</p>
                        </td>
                        <td>
                          <p class="text-sm font-bold">${s.title || s.code || '—'}</p>
                          <p class="text-xs font-mono text-blue">${s.code || ''}</p>
                        </td>
                        <td>
                          ${sc
                            ? `<span class="score-pill ${sc.pct >= 60 ? 'score-pass' : 'score-fail'}">${sc.pct}%</span>
                               <p class="text-xs text-gray mt-1">${sc.correct}/${sc.total} correctas</p>`
                            : `<span class="text-xs text-gray">Abierta</span>`}
                        </td>
                        <td>
                          ${violations > 0
                            ? `<span style="color:#dc2626;font-weight:700">
                                <i class="fa-solid fa-triangle-exclamation" style="margin-right:.3rem"></i>${violations}
                               </span>`
                            : `<span class="text-gray text-sm">0</span>`}
                        </td>
                        <td>
                          ${s.wasBlocked
                            ? `<span class="badge badge-red"><i class="fa-solid fa-lock" style="margin-right:.3rem"></i>Bloqueado</span>`
                            : s.forced
                              ? `<span class="badge badge-gray"><i class="fa-solid fa-clock" style="margin-right:.3rem"></i>Tiempo</span>`
                              : `<span class="badge badge-green"><i class="fa-solid fa-circle-check" style="margin-right:.3rem"></i>Completado</span>`}
                        </td>
                        <td class="text-xs text-gray">${fmtDate(s.submittedAt)}</td>
                        <td>
                          <button class="btn btn-outline text-xs" data-view="${s.id || s.submittedAt}">
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

  // ── Vista de detalle ──
  function renderDetail() {
    const s         = selectedSub;
    const sc        = score(s);
    const questions = s.examQuestions || [];
    const violations = s.violations || [];

    app.innerHTML = `
      <style>
        .detail-stat-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem}
        .detail-stat{background:#fff;border:1px solid #e2e8f0;border-radius:1rem;padding:1.25rem;text-align:center}
        body.dark .detail-stat{background:#1e293b;border-color:#334155}
        .detail-stat-val{font-size:2rem;font-weight:800;line-height:1;margin-bottom:.35rem}
        .detail-stat-lbl{font-size:.75rem;color:#64748b}
        body.dark .detail-stat-lbl{color:#94a3b8}
        .answer-row{padding:.85rem 1rem;border-radius:.75rem;border:1px solid;margin-bottom:.5rem}
        .answer-correct{background:#f0fdf4;border-color:#bbf7d0}
        .answer-wrong{background:#fef2f2;border-color:#fecaca}
        .answer-neutral{background:#f8fafc;border-color:#e2e8f0}
        body.dark .answer-correct{background:#052e16;border-color:#166534}
        body.dark .answer-wrong{background:#450a0a;border-color:#991b1b}
        body.dark .answer-neutral{background:#1e293b;border-color:#334155}
        .violation-item{background:#fef2f2;border-radius:.5rem;padding:.5rem .85rem;font-size:.85rem;margin-bottom:.4rem}
        body.dark .violation-item{background:#450a0a}
        @media(max-width:640px){.detail-stat-grid{grid-template-columns:1fr 1fr}}
      </style>

      <div style="max-width:820px;margin:0 auto">

        <!-- Header -->
        <div class="flex-between mb-4">
          <div>
            <h1 class="font-bold" style="font-size:1.5rem">
              <i class="fa-solid fa-clipboard-list" style="color:#2563eb;margin-right:.5rem"></i>Detalle de entrega
            </h1>
            <p class="text-gray text-sm mt-1">
              <i class="fa-solid fa-user" style="margin-right:.3rem"></i>${s.studentName || 'Anónimo'}
              &nbsp;·&nbsp;
              <i class="fa-solid fa-calendar" style="margin-right:.3rem"></i>${fmtDate(s.submittedAt)}
            </p>
          </div>
          <button class="btn btn-outline" id="back-detail">
            <i class="fa-solid fa-arrow-left" style="margin-right:.4rem"></i>Volver
          </button>
        </div>

        <!-- Stats -->
        <div class="detail-stat-grid">
          <div class="detail-stat">
            <div class="detail-stat-val" style="color:${sc ? (sc.pct >= 60 ? '#16a34a' : '#dc2626') : '#94a3b8'}">
              ${sc ? sc.pct + '%' : '—'}
            </div>
            <div class="detail-stat-lbl">
              <i class="fa-solid fa-percent" style="margin-right:.3rem"></i>Nota
            </div>
          </div>
          <div class="detail-stat">
            <div class="detail-stat-val" style="color:${violations.length > 0 ? '#dc2626' : '#16a34a'}">
              ${violations.length}
            </div>
            <div class="detail-stat-lbl">
              <i class="fa-solid fa-triangle-exclamation" style="margin-right:.3rem"></i>Infracciones
            </div>
          </div>
          <div class="detail-stat">
            <div class="detail-stat-val" style="font-size:1.5rem">
              ${s.wasBlocked
                ? `<i class="fa-solid fa-lock" style="color:#dc2626"></i>`
                : s.forced
                  ? `<i class="fa-solid fa-clock" style="color:#d97706"></i>`
                  : `<i class="fa-solid fa-circle-check" style="color:#16a34a"></i>`}
            </div>
            <div class="detail-stat-lbl">
              ${s.wasBlocked ? 'Bloqueado' : s.forced ? 'Tiempo agotado' : 'Completado'}
            </div>
          </div>
        </div>

        <!-- Infracciones -->
        ${violations.length > 0 ? `
          <div class="card mb-4" style="border-left:3px solid #dc2626">
            <h3 class="font-bold mb-3" style="font-size:.95rem">
              <i class="fa-solid fa-triangle-exclamation" style="color:#dc2626;margin-right:.4rem"></i>
              Infracciones (${violations.length})
            </h3>
            ${violations.map((v, i) => `
              <div class="violation-item">
                <span style="font-weight:700;margin-right:.5rem">${i + 1}.</span>
                ${v.reason || v}
                ${v.timestamp
                  ? `<span class="text-gray" style="margin-left:.5rem;font-size:.75rem">${fmtDate(v.timestamp)}</span>`
                  : ''}
              </div>
            `).join('')}
          </div>
        ` : ''}

        <!-- Respuestas -->
        <div class="card">
          <h3 class="font-bold mb-3" style="font-size:.95rem">
            <i class="fa-solid fa-list-check" style="color:#2563eb;margin-right:.4rem"></i>
            Respuestas (${questions.length} preguntas)
          </h3>

          ${questions.length === 0
            ? `<p class="text-center text-gray" style="padding:2rem">
                <i class="fa-solid fa-inbox" style="font-size:1.5rem;display:block;margin-bottom:.5rem"></i>
                No hay preguntas registradas para este examen
               </p>`
            : questions.map((q, idx) => {
                const given    = s.answers?.[q.id];
                const answered = given !== undefined && given !== '';
                let isCorrect  = null;
                if (q.type === 'mc' && answered) isCorrect = Number(given) === q.correctIndex;

                const rowClass = isCorrect === true
                  ? 'answer-correct'
                  : isCorrect === false
                    ? 'answer-wrong'
                    : 'answer-neutral';

                return `
                  <div class="answer-row ${rowClass}">
                    <div style="display:flex;align-items:flex-start;gap:.75rem">
                      <span style="font-size:.8rem;font-weight:700;color:#94a3b8;flex-shrink:0;margin-top:.1rem">${idx + 1}</span>
                      <div style="flex:1">
                        <p class="font-bold text-sm mb-1">${q.text}</p>
                        ${q.type === 'mc' ? `
                          <p class="text-sm">
                            ${answered
                              ? `<i class="fa-solid ${isCorrect ? 'fa-check' : 'fa-xmark'}"
                                   style="color:${isCorrect ? '#16a34a' : '#dc2626'};margin-right:.4rem"></i>
                                 <b>Respondió:</b> ${q.options?.[given] || given}`
                              : `<span class="text-gray"><i class="fa-solid fa-minus" style="margin-right:.3rem"></i>Sin responder</span>`}
                          </p>
                          ${!isCorrect && s.showCorrectAnswers && q.options ? `
                            <p class="text-xs mt-1" style="color:#16a34a">
                              <i class="fa-solid fa-check" style="margin-right:.3rem"></i>
                              Correcta: ${q.options[q.correctIndex]}
                            </p>
                          ` : ''}
                        ` : `
                          <p class="text-sm">
                            ${answered
                              ? given
                              : `<span class="text-gray"><i class="fa-solid fa-minus" style="margin-right:.3rem"></i>Sin responder</span>`}
                          </p>
                        `}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')
          }
        </div>
      </div>`;

    document.getElementById('back-detail').onclick = () => { selectedSub = null; render(); };
  }

  load();
}
