function renderExamenes(app) {
  let exams = [], loading = true, filter = '', sortBy = 'recent';

  async function load() {
    loading = true; render();
    try {
      exams = await apiGetExams();
    } catch { alert('Error al cargar los exámenes'); }
    finally { loading = false; render(); }
  }

  function getFiltered() {
    let list = [...exams];
    if (filter.trim()) {
      const q = filter.toLowerCase();
      list = list.filter(e =>
        (e.title || '').toLowerCase().includes(q) ||
        (e.code  || '').toLowerCase().includes(q)
      );
    }
    if (sortBy === 'recent')    list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    if (sortBy === 'alpha')     list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
    if (sortBy === 'questions') list.sort((a, b) => (b.questions?.length || 0) - (a.questions?.length || 0));
    if (sortBy === 'duration')  list.sort((a, b) => (b.durationMinutes || 0) - (a.durationMinutes || 0));
    return list;
  }

  function fmtDate(iso) {
    if (!iso) return '—';
    return new Date(iso).toLocaleString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }

  function render() {
    const filtered = getFiltered();

    app.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

        .ex-page { font-family: 'DM Sans', sans-serif; }

        /* ── Header ── */
        .ex-header {
          display: flex; flex-direction: column; gap: 1.5rem;
          padding: 2rem 0 1.5rem;
        }
        .ex-header-top {
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
        }
        .ex-title-block h1 {
          font-size: clamp(1.6rem, 3.5vw, 2.2rem);
          font-weight: 800; line-height: 1.1;
          color: #0f172a; letter-spacing: -.02em;
        }
        body.dark .ex-title-block h1 { color: #f1f5f9; }
        .ex-title-block p {
          font-size: .9rem; color: #64748b; margin-top: .3rem;
        }
        body.dark .ex-title-block p { color: #94a3b8; }
        .ex-title-accent {
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* ── Controls ── */
        .ex-controls {
          display: flex; gap: .75rem; flex-wrap: wrap; align-items: center;
        }
        .ex-search-wrap {
          position: relative; flex: 1; min-width: 200px;
        }
        .ex-search-wrap i {
          position: absolute; left: .9rem; top: 50%; transform: translateY(-50%);
          color: #94a3b8; font-size: .85rem; pointer-events: none;
        }
        .ex-search {
          width: 100%; padding: .6rem .9rem .6rem 2.4rem;
          border-radius: .75rem; border: 1.5px solid #e2e8f0;
          background: #fff; font-size: .9rem; color: #1e293b;
          font-family: 'DM Sans', sans-serif;
          transition: border .2s, box-shadow .2s;
        }
        .ex-search:focus {
          outline: none; border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,.12);
        }
        body.dark .ex-search {
          background: #1e293b; border-color: #334155; color: #e2e8f0;
        }
        body.dark .ex-search:focus { border-color: #60a5fa; }

        .ex-sort {
          padding: .6rem .9rem; border-radius: .75rem;
          border: 1.5px solid #e2e8f0; background: #fff;
          font-size: .85rem; color: #374151; cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: border .2s;
        }
        .ex-sort:focus { outline: none; border-color: #2563eb; }
        body.dark .ex-sort { background: #1e293b; border-color: #334155; color: #e2e8f0; }

        /* ── Stats strip ── */
        .ex-stats {
          display: flex; gap: 1rem; flex-wrap: wrap;
        }
        .ex-stat {
          display: flex; align-items: center; gap: .6rem;
          background: #fff; border: 1px solid #e2e8f0;
          border-radius: .85rem; padding: .65rem 1rem;
          font-size: .85rem;
        }
        body.dark .ex-stat { background: #1e293b; border-color: #334155; }
        .ex-stat-icon {
          width: 2rem; height: 2rem; border-radius: .5rem;
          display: flex; align-items: center; justify-content: center;
          font-size: .85rem;
        }
        .ex-stat-val { font-weight: 800; font-size: 1.1rem; color: #0f172a; }
        body.dark .ex-stat-val { color: #f1f5f9; }
        .ex-stat-lbl { font-size: .72rem; color: #64748b; }
        body.dark .ex-stat-lbl { color: #94a3b8; }

        /* ── Grid ── */
        .ex-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 1.1rem; margin-top: 1.5rem;
        }

        /* ── Card ── */
        .ex-card {
          background: #fff; border: 1.5px solid #e2e8f0;
          border-radius: 1.1rem; overflow: hidden;
          transition: transform .22s, box-shadow .22s, border-color .22s;
          cursor: pointer; position: relative;
        }
        body.dark .ex-card { background: #1e293b; border-color: #334155; }
        .ex-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(37,99,235,.13);
          border-color: #93c5fd;
        }
        body.dark .ex-card:hover {
          box-shadow: 0 16px 40px rgba(0,0,0,.35);
          border-color: #3b82f6;
        }
        .ex-card-stripe {
          height: 5px;
          background: linear-gradient(90deg, #2563eb, #7c3aed);
        }
        .ex-card-body { padding: 1.1rem 1.25rem; }

        .ex-card-code {
          display: inline-flex; align-items: center; gap: .4rem;
          background: #f0f4ff; color: #2563eb;
          border-radius: .5rem; padding: .2rem .65rem;
          font-family: 'DM Mono', monospace;
          font-size: .8rem; font-weight: 500;
          margin-bottom: .65rem; letter-spacing: .05em;
        }
        body.dark .ex-card-code { background: #1e3a5f; color: #93c5fd; }

        .ex-card-title {
          font-size: 1rem; font-weight: 700; color: #0f172a;
          line-height: 1.35; margin-bottom: .75rem;
          display: -webkit-box; -webkit-line-clamp: 2;
          -webkit-box-orient: vertical; overflow: hidden;
        }
        body.dark .ex-card-title { color: #f1f5f9; }

        .ex-card-meta {
          display: flex; gap: .5rem; flex-wrap: wrap; margin-bottom: .85rem;
        }
        .ex-meta-chip {
          display: flex; align-items: center; gap: .3rem;
          font-size: .75rem; color: #64748b;
          background: #f8fafc; border-radius: .5rem;
          padding: .2rem .6rem; border: 1px solid #f1f5f9;
        }
        body.dark .ex-meta-chip { background: #0f172a; border-color: #1e293b; color: #94a3b8; }
        .ex-meta-chip i { color: #94a3b8; font-size: .7rem; }

        .ex-card-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding-top: .75rem; border-top: 1px solid #f1f5f9;
          gap: .5rem;
        }
        body.dark .ex-card-footer { border-color: #334155; }

        .ex-card-date { font-size: .73rem; color: #94a3b8; }

        .ex-card-actions { display: flex; gap: .4rem; }
        .ex-icon-btn {
          width: 2rem; height: 2rem; border-radius: .55rem;
          border: 1.5px solid #e2e8f0; background: #fff;
          color: #374151; cursor: pointer; font-size: .8rem;
          display: flex; align-items: center; justify-content: center;
          transition: all .18s;
        }
        .ex-icon-btn:hover { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
        .ex-icon-btn.danger:hover { border-color: #dc2626; color: #dc2626; background: #fef2f2; }
        body.dark .ex-icon-btn { background: #0f172a; border-color: #334155; color: #cbd5e1; }
        body.dark .ex-icon-btn:hover { border-color: #3b82f6; color: #60a5fa; background: #1e3a5f; }
        body.dark .ex-icon-btn.danger:hover { border-color: #dc2626; color: #fca5a5; background: #450a0a; }

        .ex-badge-answers {
          font-size: .7rem; font-weight: 600; padding: .2rem .55rem;
          border-radius: .4rem;
        }
        .ex-badge-answers.show { background: #dcfce7; color: #15803d; }
        .ex-badge-answers.hide { background: #f1f5f9; color: #64748b; }
        body.dark .ex-badge-answers.show { background: #14532d; color: #86efac; }
        body.dark .ex-badge-answers.hide { background: #334155; color: #94a3b8; }

        /* ── Empty / Loading ── */
        .ex-empty {
          grid-column: 1/-1; text-align: center;
          padding: 5rem 2rem; color: #94a3b8;
        }
        .ex-empty-icon {
          font-size: 3.5rem; margin-bottom: 1rem;
          display: block; opacity: .3;
        }
        .ex-empty p { font-size: 1rem; font-weight: 600; color: #64748b; }
        .ex-empty span { font-size: .875rem; margin-top: .3rem; display: block; }
        body.dark .ex-empty p { color: #94a3b8; }

        /* ── Animation ── */
        .ex-card { opacity: 0; animation: exFadeUp .35s ease forwards; }
        @keyframes exFadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* ── Copy tooltip ── */
        .copied-tip {
          position: fixed; bottom: 1.5rem; left: 50%; transform: translateX(-50%);
          background: #1e293b; color: #fff; padding: .5rem 1.25rem;
          border-radius: 999px; font-size: .85rem; font-weight: 600;
          z-index: 9999; animation: tipIn .2s ease;
          pointer-events: none;
        }
        @keyframes tipIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
      </style>

      <div class="ex-page" style="max-width:100%;margin:0 auto">

        <div class="ex-header">
          <div class="ex-header-top">
            <div class="ex-title-block">
              <h1>Banco de <span class="ex-title-accent">Exámenes</span></h1>
              <p>${loading ? 'Cargando...' : `${exams.length} examen${exams.length !== 1 ? 'es' : ''} registrado${exams.length !== 1 ? 's' : ''}`}</p>
            </div>
            <div style="display:flex;gap:.5rem;flex-shrink:0">
              <button class="btn btn-outline" id="back-btn" style="font-family:'DM Sans',sans-serif">
                <i class="fa-solid fa-arrow-left" style="margin-right:.4rem"></i>Volver
              </button>
              <button class="btn btn-primary" id="create-btn" style="font-family:'DM Sans',sans-serif">
                <i class="fa-solid fa-plus" style="margin-right:.4rem"></i>Crear examen
              </button>
            </div>
          </div>

          ${!loading ? `
            <div class="ex-stats">
              <div class="ex-stat">
                <div class="ex-stat-icon" style="background:#dbeafe">
                  <i class="fa-solid fa-file-lines" style="color:#2563eb"></i>
                </div>
                <div>
                  <div class="ex-stat-val">${exams.length}</div>
                  <div class="ex-stat-lbl">Total exámenes</div>
                </div>
              </div>
              <div class="ex-stat">
                <div class="ex-stat-icon" style="background:#ede9fe">
                  <i class="fa-solid fa-circle-question" style="color:#7c3aed"></i>
                </div>
                <div>
                  <div class="ex-stat-val">${exams.reduce((a, e) => a + (e.questions?.length || 0), 0)}</div>
                  <div class="ex-stat-lbl">Total preguntas</div>
                </div>
              </div>
              <div class="ex-stat">
                <div class="ex-stat-icon" style="background:#dcfce7">
                  <i class="fa-solid fa-clock" style="color:#16a34a"></i>
                </div>
                <div>
                  <div class="ex-stat-val">${exams.length ? Math.round(exams.reduce((a, e) => a + (e.durationMinutes || 0), 0) / exams.length) : 0} min</div>
                  <div class="ex-stat-lbl">Duración promedio</div>
                </div>
              </div>
            </div>
          ` : ''}

          <div class="ex-controls">
            <div class="ex-search-wrap">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input class="ex-search" id="ex-filter" placeholder="Buscar por título o código..."
                value="${filter}"/>
            </div>
            <select class="ex-sort" id="ex-sort">
              <option value="recent"    ${sortBy==='recent'   ?'selected':''}>Más recientes</option>
              <option value="alpha"     ${sortBy==='alpha'    ?'selected':''}>Alfabético</option>
              <option value="questions" ${sortBy==='questions'?'selected':''}>Más preguntas</option>
              <option value="duration"  ${sortBy==='duration' ?'selected':''}>Mayor duración</option>
            </select>
          </div>
        </div>

        ${loading
          ? `<div class="text-center" style="padding:5rem">
              <div class="spinner"></div>
              <p class="text-gray mt-3">Cargando exámenes...</p>
             </div>`
          : `<div class="ex-grid">
              ${filtered.length === 0
                ? `<div class="ex-empty">
                    <i class="fa-solid fa-inbox ex-empty-icon"></i>
                    <p>${filter ? 'Sin resultados para esa búsqueda' : 'No hay exámenes registrados'}</p>
                    <span>${filter ? 'Prueba con otro término' : 'Crea el primero desde el panel docente'}</span>
                   </div>`
                : filtered.map((e, idx) => `
                    <div class="ex-card" data-id="${e.id}" style="animation-delay:${Math.min(idx * 0.04, 0.4)}s">
                      <div class="ex-card-stripe"></div>
                      <div class="ex-card-body">
                        <div class="ex-card-code">
                          <i class="fa-solid fa-key" style="font-size:.65rem"></i>${e.code}
                        </div>
                        <div class="ex-card-title">${e.title}</div>
                        <div class="ex-card-meta">
                          <span class="ex-meta-chip">
                            <i class="fa-solid fa-clock"></i>${e.durationMinutes} min
                          </span>
                          <span class="ex-meta-chip">
                            <i class="fa-solid fa-circle-question"></i>${e.questions?.length || 0} preguntas
                          </span>
                          <span class="ex-badge-answers ${e.showCorrectAnswers ? 'show' : 'hide'}">
                            ${e.showCorrectAnswers
                              ? '<i class="fa-solid fa-eye" style="margin-right:.3rem"></i>Muestra respuestas'
                              : '<i class="fa-solid fa-eye-slash" style="margin-right:.3rem"></i>Respuestas ocultas'}
                          </span>
                        </div>
                        <div class="ex-card-footer">
                          <span class="ex-card-date">
                            <i class="fa-solid fa-calendar-days" style="margin-right:.3rem;color:#cbd5e1"></i>
                            ${fmtDate(e.createdAt)}
                          </span>
                          <div class="ex-card-actions">
                            <button class="ex-icon-btn" data-copy="${e.code}" title="Copiar código">
                              <i class="fa-solid fa-copy"></i>
                            </button>
                            <button class="ex-icon-btn" data-edit="${e.id}" title="Editar examen">
                              <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="ex-icon-btn danger" data-del="${e.id}" title="Eliminar examen">
                              <i class="fa-solid fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  `).join('')}
             </div>`}
      </div>
    `;

    // Events
    document.getElementById('back-btn').onclick   = () => navigate('/docente');
    document.getElementById('create-btn').onclick = () => navigate('/docente');
    document.getElementById('ex-filter').oninput  = e => { filter = e.target.value; render(); };
    document.getElementById('ex-sort').onchange   = e => { sortBy = e.target.value; render(); };

    document.querySelectorAll('[data-copy]').forEach(btn => {
      btn.onclick = (ev) => {
        ev.stopPropagation();
        const code = btn.dataset.copy;
        navigator.clipboard.writeText(code).catch(() => {});
        showCopied(`Código ${code} copiado`);
      };
    });

    document.querySelectorAll('[data-edit]').forEach(btn => {
      btn.onclick = (ev) => {
        ev.stopPropagation();
        const exam = exams.find(e => e.id === btn.dataset.edit);
        if (exam) {
          sessionStorage.setItem('editExam', JSON.stringify(exam));
          navigate('/docente');
        }
      };
    });

    document.querySelectorAll('[data-del]').forEach(btn => {
      btn.onclick = async (ev) => {
        ev.stopPropagation();
        const exam = exams.find(e => e.id === btn.dataset.del);
        if (!exam) return;
        if (!confirm(`¿Eliminar "${exam.title}"?\nEsta acción no se puede deshacer.`)) return;
        try {
          await apiDeleteExam(exam.id);
          exams = exams.filter(e => e.id !== btn.dataset.del);
          render();
        } catch { alert('❌ Error al eliminar el examen'); }
      };
    });

    // Click on card = edit
    document.querySelectorAll('.ex-card').forEach(card => {
      card.onclick = () => {
        const exam = exams.find(e => e.id === card.dataset.id);
        if (exam) {
          sessionStorage.setItem('editExam', JSON.stringify(exam));
          navigate('/docente');
        }
      };
    });
  }

  function showCopied(msg) {
    document.querySelectorAll('.copied-tip').forEach(t => t.remove());
    const tip = document.createElement('div');
    tip.className = 'copied-tip';
    tip.innerHTML = `<i class="fa-solid fa-check" style="margin-right:.4rem;color:#86efac"></i>${msg}`;
    document.body.appendChild(tip);
    setTimeout(() => tip.remove(), 2000);
  }

  load();
}