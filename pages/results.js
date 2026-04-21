function renderResults(app) {
  let submissions = [], loading = true, filter = '', selectedSub = null;

  function score(sub) {
    if (!sub.answers || !sub.examQuestions) return null;
    const mc = sub.examQuestions.filter(q => q.type === 'mc');
    if (!mc.length) return null;
    const correct = mc.filter(q => sub.answers[q.id] !== undefined && Number(sub.answers[q.id]) === q.correctIndex).length;
    return { correct, total: mc.length, pct: Math.round((correct / mc.length) * 100) };
  }

  function fmtDate(iso) {
    if (!iso) return '';
    return new Date(iso).toLocaleString('es-ES', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' });
  }

  async function load() {
    loading = true; render();
    try {
      const [subs, exams] = await Promise.all([apiGetSubmissions(), apiGetExams()]);
      const examMap = {};
      exams.forEach(e => { examMap[e.id] = e; examMap[e.code] = e; });
      submissions = subs.map(s => ({
        ...s,
        examQuestions: (examMap[s.examId] || examMap[s.code])?.questions || [],
        showCorrectAnswers: (examMap[s.examId] || examMap[s.code])?.showCorrectAnswers || false
      }));
    } catch { alert('❌ Error al cargar resultados'); }
    finally { loading = false; render(); }
  }

  function render() {
    if (loading) {
      app.innerHTML = `<div class="text-center" style="padding:4rem"><div class="spinner"></div><p class="text-gray mt-3">Cargando resultados...</p></div>`;
      return;
    }

    if (selectedSub) {
      renderDetail();
      return;
    }

    const filtered = submissions.filter(s =>
      (s.studentName + s.studentEmail + s.title + s.code).toLowerCase().includes(filter.toLowerCase())
    );

    app.innerHTML = `
      <div style="max-width:900px;margin:0 auto">
        <div class="flex-between mb-4">
          <div>
            <h1 class="font-bold" style="font-size:1.75rem">📊 Resultados</h1>
            <p class="text-gray text-sm mt-1">${submissions.length} entregas registradas</p>
          </div>
          <button class="btn btn-outline" id="back-btn">← Volver</button>
        </div>

        <div class="card">
          <input class="input mb-3" id="f-filter" placeholder="Buscar por nombre, correo o código..." value="${filter}"/>
          ${filtered.length === 0
            ? `<div class="text-center text-gray" style="padding:3rem">
                <p style="font-size:2.5rem">📭</p>
                <p class="mt-2">${filter ? 'Sin resultados para esa búsqueda' : 'No hay entregas aún'}</p>
              </div>`
            : `<div class="overflow-x">
                <table>
                  <thead><tr>
                    <th>Estudiante</th><th>Examen</th><th>Nota</th><th>Infracciones</th><th>Estado</th><th>Fecha</th><th></th>
                  </tr></thead>
                  <tbody>
                    ${filtered.map(s => {
                      const sc = score(s);
                      return `
                        <tr>
                          <td>
                            <p class="font-bold text-sm">${s.studentName || 'Anónimo'}</p>
                            <p class="text-xs text-gray">${s.studentEmail || ''}</p>
                          </td>
                          <td>
                            <p class="text-sm">${s.title || s.code}</p>
                            <p class="text-xs font-mono text-blue">${s.code || ''}</p>
                          </td>
                          <td>
                            ${sc
                              ? `<span class="font-bold" style="color:${sc.pct >= 60 ? '#16a34a' : '#dc2626'}">${sc.pct}%</span>
                                 <p class="text-xs text-gray">${sc.correct}/${sc.total}</p>`
                              : `<span class="text-xs text-gray">Abierta</span>`}
                          </td>
                          <td>
                            <span style="color:${(s.violations?.length||0) > 0 ? '#dc2626' : '#374151'};font-weight:${(s.violations?.length||0) > 0 ? '700' : '400'}">
                              ${s.violations?.length || 0}
                            </span>
                          </td>
                          <td>
                            ${s.wasBlocked
                              ? `<span class="badge badge-red">🔒 Bloqueado</span>`
                              : s.forced
                                ? `<span class="badge badge-gray">⏱️ Tiempo</span>`
                                : `<span class="badge badge-green">✅ Completado</span>`}
                          </td>
                          <td class="text-xs text-gray">${fmtDate(s.submittedAt)}</td>
                          <td>
                            <button class="btn btn-outline text-xs" data-view="${s.id || s.submittedAt}">Ver</button>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </div>`
          }
        </div>
      </div>`;

    document.getElementById('back-btn').onclick = () => navigate('/docente');
    document.getElementById('f-filter').oninput = e => { filter = e.target.value; render(); };
    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.onclick = () => {
        selectedSub = filtered.find(s => (s.id || s.submittedAt) == btn.dataset.view);
        render();
      };
    });
  }

  function renderDetail() {
    const s = selectedSub;
    const sc = score(s);
    const questions = s.examQuestions || [];

    app.innerHTML = `
      <div style="max-width:800px;margin:0 auto">
        <div class="flex-between mb-4">
          <div>
            <h1 class="font-bold" style="font-size:1.5rem">📋 Detalle de entrega</h1>
            <p class="text-gray text-sm mt-1">${s.studentName} · ${fmtDate(s.submittedAt)}</p>
          </div>
          <button class="btn btn-outline" id="back-detail">← Volver</button>
        </div>

        <!-- Summary -->
        <div class="card mb-4" style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;text-align:center">
          <div>
            <p style="font-size:1.75rem;font-weight:700;color:${sc ? (sc.pct >= 60 ? '#16a34a' : '#dc2626') : '#374151'}">
              ${sc ? sc.pct + '%' : '—'}
            </p>
            <p class="text-xs text-gray">Nota</p>
          </div>
          <div>
            <p style="font-size:1.75rem;font-weight:700;color:${(s.violations?.length||0) > 0 ? '#dc2626' : '#374151'}">
              ${s.violations?.length || 0}
            </p>
            <p class="text-xs text-gray">Infracciones</p>
          </div>
          <div>
            <p style="font-size:1.75rem;font-weight:700">
              ${s.wasBlocked ? '🔒' : s.forced ? '⏱️' : '✅'}
            </p>
            <p class="text-xs text-gray">${s.wasBlocked ? 'Bloqueado' : s.forced ? 'Tiempo agotado' : 'Completado'}</p>
          </div>
        </div>

        <!-- Violations -->
        ${s.violations?.length > 0 ? `
          <div class="card mb-4" style="border-left:3px solid #dc2626">
            <h3 class="font-bold mb-2 text-sm">⚠️ Infracciones (${s.violations.length})</h3>
            <div class="space-y">
              ${s.violations.map((v, i) => `
                <div style="background:#fef2f2;padding:.5rem .75rem;border-radius:.4rem;font-size:.85rem">
                  <b>${i+1}.</b> ${v.reason || v}
                  ${v.timestamp ? `<span class="text-gray" style="margin-left:.5rem;font-size:.75rem">${fmtDate(v.timestamp)}</span>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Answers -->
        ${questions.length > 0 ? `
          <div class="card">
            <h3 class="font-bold mb-3 text-sm">📝 Respuestas</h3>
            <div class="space-y">
              ${questions.map((q, idx) => {
                const given = s.answers?.[q.id];
                const answered = given !== undefined && given !== '';
                let isCorrect = null;
                if (q.type === 'mc' && answered) isCorrect = Number(given) === q.correctIndex;
                return `
                  <div style="padding:.75rem;border-radius:.5rem;background:${
                    isCorrect === true ? '#f0fdf4' : isCorrect === false ? '#fef2f2' : '#f8fafc'
                  };border:1px solid ${isCorrect === true ? '#bbf7d0' : isCorrect === false ? '#fecaca' : '#e2e8f0'}">
                    <p class="font-bold text-sm mb-1">${idx+1}. ${q.text}</p>
                    ${q.type === 'mc' ? `
                      <p class="text-sm">
                        ${answered
                          ? `${isCorrect ? '✅' : '❌'} <b>Respondió:</b> ${q.options?.[given] || given}`
                          : `<span class="text-gray">Sin responder</span>`}
                      </p>
                      ${!isCorrect && s.showCorrectAnswers && q.options
                        ? `<p class="text-xs" style="color:#16a34a;margin-top:.25rem">✅ Correcta: ${q.options[q.correctIndex]}</p>`
                        : ''}
                    ` : `
                      <p class="text-sm">${answered ? given : '<span class="text-gray">Sin responder</span>'}</p>
                    `}
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : `<div class="card text-center text-gray" style="padding:2rem">No hay preguntas registradas para este examen</div>`}
      </div>`;

    document.getElementById('back-detail').onclick = () => { selectedSub = null; render(); };
  }

  load();
}
