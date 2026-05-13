function renderMonitor(app) {
  let exams = [], selectedExam = null, allStudents = [], messages = [];
  let loading = true, unblocking = false, selectedMsg = null, responseText = '';
  let unsubStudents = null, unsubMessages = null, cleanupInterval = null;

  function fmt(s) {
    if (!s || s < 0) return '0:00';
    return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  }

  function fmtTs(ts) {
    if (!ts) return '';
    const diff = Date.now() - ts;
    if (diff < 60000) return 'Ahora';
    if (diff < 3600000) return `Hace ${Math.floor(diff/60000)} min`;
    return new Date(ts).toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' });
  }

  async function loadExams() {
    try {
      const user = getUser();
      const all  = await apiGetExams();
      let fbUid  = '';
      try { fbUid = fbAuth?.currentUser?.uid || ''; } catch (_) {}
      const myUids = new Set([user?.uid, user?.email, fbUid].filter(Boolean));
      exams = all.filter(e => e.teacherId && myUids.has(e.teacherId));
      if (!exams.length) exams = all;
    } catch { console.error('Error al cargar exámenes'); }
    finally { loading = false; render(); }
  }

  /**
   * Elimina de Firebase los nodos de estudiantes que llevan más de
   * STALE_MS sin actividad — son fantasmas de sesiones anteriores.
   * Se llama al seleccionar un examen y cada vez que llega un snapshot.
   */
  const STALE_MS = 5 * 60 * 1000; // 5 minutos sin actividad = fantasma

  async function purgeGhosts(examCode, students) {
    const now    = Date.now();
    const ghosts = students.filter(s => {
      const last = s.lastActivity || s.joinedAt || 0;
      return (now - last) > STALE_MS;
    });
    if (!ghosts.length) return;
    await Promise.allSettled(
      ghosts.map(s => removeActiveStudent(examCode, s.id))
    );
  }

  function selectExam(exam) {
    selectedExam = exam;

    async function fetchNow() {
      try {
        const snap = await fbDB.ref(`active_exams/${exam.code}/students`).get();
        const all = [];
        const raw = snap.val();
        if (raw) Object.entries(raw).forEach(([key, val]) => all.push({ id: key, ...val }));
        // Limpiar fantasmas antes de mostrar
        await purgeGhosts(exam.code, all);
        // Re-leer después de purgar para tener la lista limpia
        const snap2 = await fbDB.ref(`active_exams/${exam.code}/students`).get();
        const clean = [];
        const raw2  = snap2.val();
        if (raw2) Object.entries(raw2).forEach(([key, val]) => clean.push({ id: key, ...val }));
        allStudents = clean;
        render();
      } catch(e) { console.error('[MONITOR] Error fetch:', e); }
    }

    unsubStudents = listenToActiveStudents(exam.code, async (students) => {
      // Purgar fantasmas en cada update del listener
      await purgeGhosts(exam.code, students);
      allStudents = students.filter(s => {
        const last = s.lastActivity || s.joinedAt || 0;
        return (Date.now() - last) <= STALE_MS;
      });
      render();
    });

    unsubMessages = listenToMessages(exam.code, (msgs) => {
      messages = msgs.sort((a,b) => b.timestamp - a.timestamp);
      render();
    });

    cleanupInterval = setInterval(fetchNow, 15000);
    fetchNow();
    render();
  }

  function deselectExam() {
    if (unsubStudents)   { unsubStudents();   unsubStudents   = null; }
    if (unsubMessages)   { unsubMessages();   unsubMessages   = null; }
    if (cleanupInterval) { clearInterval(cleanupInterval); cleanupInterval = null; }
    selectedExam = null; allStudents = []; messages = [];
    render();
  }

  async function handleUnblock(student) {
    if (!confirm(`¿Desbloquear a ${student.name}?\n\nEl estudiante podrá continuar su examen.`)) return;
    unblocking = true; render();
    try {
      await unblockStudent(selectedExam.code, student.id);
    } catch { alert('❌ Error al desbloquear al estudiante.'); }
    finally { unblocking = false; render(); }
  }

  async function handleRespond(msgId) {
    if (!responseText.trim()) { alert('Escribe una respuesta'); return; }
    try {
      await respondToStudent(selectedExam.code, msgId, responseText);
      responseText = ''; selectedMsg = null; render();
    } catch { alert('❌ Error al enviar la respuesta'); }
  }

  async function handleDeleteMessage(msgId) {
    if (!confirm('¿Eliminar este mensaje?')) return;
    try { await deleteMessage(selectedExam.code, msgId); }
    catch { alert('❌ Error al eliminar el mensaje'); }
  }

  // ── Student row ──
  function renderStudentRow(s) {
    const vCount = s.violations || 0;
    const vColor = vCount > 2 ? '#dc2626' : vCount > 0 ? '#d97706' : '#64748b';
    return `
      <tr style="${s.isBlocked ? 'background:rgba(254,242,242,.5)' : ''}">
        <td>
          <div style="display:flex;align-items:center;gap:.65rem">
            <div style="
              width:2rem;height:2rem;border-radius:50%;flex-shrink:0;
              background:linear-gradient(135deg,${s.isBlocked?'#dc2626,#991b1b':'#2563eb,#1d4ed8'});
              display:flex;align-items:center;justify-content:center;
              font-size:.7rem;font-weight:800;color:#fff;
            ">${(s.name||'?')[0].toUpperCase()}</div>
            <div>
              <p style="font-weight:600;font-size:.875rem;color:var(--text-primary)">${s.name || 'Sin nombre'}</p>
              <p style="font-size:.72rem;color:var(--text-muted)">${s.email || ''}</p>
            </div>
          </div>
        </td>
        <td>
          ${s.isBlocked
            ? `<span class="badge badge-red"><i class="fa-solid fa-lock" style="margin-right:.3rem"></i>Bloqueado</span>`
            : `<span class="badge badge-green"><i class="fa-solid fa-circle" style="font-size:.45rem;margin-right:.35rem"></i>Activo</span>`}
        </td>
        <td>
          <span style="font-family:'JetBrains Mono',monospace;font-size:.875rem;font-weight:600;
            color:${s.timeLeft < 120 ? '#dc2626' : 'var(--text-primary)'}">
            ${fmt(s.timeLeft)}
          </span>
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:.5rem">
            <div style="flex:1;height:5px;background:var(--gray-200);border-radius:999px;min-width:48px">
              <div style="height:100%;border-radius:999px;background:#2563eb;
                width:${selectedExam.questions?.length ? Math.round(((s.answeredCount||0)/selectedExam.questions.length)*100) : 0}%"></div>
            </div>
            <span style="font-size:.78rem;color:var(--text-muted);white-space:nowrap">
              ${s.answeredCount||0}/${selectedExam.questions?.length||0}
            </span>
          </div>
        </td>
        <td>
          <span style="color:${vColor};font-weight:${vCount>0?'700':'400'};font-size:.875rem;display:flex;align-items:center;gap:.3rem">
            ${vCount > 0 ? `<i class="fa-solid fa-triangle-exclamation" style="font-size:.75rem"></i>` : ''}
            ${vCount}
          </span>
        </td>
        <td style="font-size:.78rem;color:var(--text-muted)">${fmtTs(s.lastActivity || s.joinedAt)}</td>
        <td>
          ${s.isBlocked
            ? `<button class="btn btn-primary btn-sm" data-unblock="${s.id}" ${unblocking?'disabled':''}>
                ${unblocking
                  ? '<i class="fa-solid fa-spinner fa-spin"></i>'
                  : '<i class="fa-solid fa-lock-open" style="margin-right:.3rem"></i>Desbloquear'}
              </button>`
            : `<button class="btn btn-danger btn-sm" data-block="${s.id}">
                <i class="fa-solid fa-lock" style="margin-right:.3rem"></i>Bloquear
              </button>`}
        </td>
      </tr>
    `;
  }

  // ── Message card ──
  function renderMessageCard(m) {
    const isUnread = !m.read;
    const replyForm = selectedMsg === m.id
      ? `<div style="display:flex;gap:.4rem;margin-top:.5rem">
          <input class="input" id="resp-input"
            placeholder="Escribe tu respuesta..."
            value="${responseText}"
            style="flex:1;font-size:.85rem;border-radius:.65rem"/>
          <button class="btn btn-primary btn-sm" data-send="${m.id}">
            <i class="fa-solid fa-paper-plane"></i>
          </button>
          <button class="btn btn-outline btn-sm" id="cancel-resp">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>`
      : `<button class="btn btn-outline btn-sm" data-reply="${m.id}" style="margin-top:.5rem">
          <i class="fa-solid fa-reply" style="margin-right:.3rem"></i>Responder
        </button>`;

    return `
      <div style="
        background:${isUnread ? 'rgba(239,246,255,.8)' : 'var(--surface-raised)'};
        border:1.5px solid ${isUnread ? '#93c5fd' : 'var(--border)'};
        border-left:4px solid ${isUnread ? '#2563eb' : 'var(--border-strong)'};
        border-radius:var(--radius-lg);padding:1rem 1.1rem;
        transition:border-color .2s;
      ">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;margin-bottom:.5rem">
          <div style="display:flex;align-items:center;gap:.6rem">
            <div style="
              width:2rem;height:2rem;border-radius:50%;
              background:${isUnread?'#dbeafe':'var(--gray-200)'};
              display:flex;align-items:center;justify-content:center;flex-shrink:0;
            ">
              <i class="fa-solid fa-user" style="font-size:.7rem;color:${isUnread?'#2563eb':'#64748b'}"></i>
            </div>
            <div>
              <p style="font-weight:700;font-size:.875rem;color:var(--text-primary)">${m.studentName || 'Estudiante'}</p>
              ${m.studentEmail ? `<p style="font-size:.7rem;color:var(--text-muted)">${m.studentEmail}</p>` : ''}
            </div>
            ${isUnread ? `<span style="width:.45rem;height:.45rem;border-radius:50%;background:#2563eb;flex-shrink:0"></span>` : ''}
          </div>
          <div style="display:flex;align-items:center;gap:.4rem;flex-shrink:0">
            <span style="font-size:.72rem;color:var(--text-muted)">${fmtTs(m.timestamp)}</span>
            <button class="btn btn-danger btn-sm" data-delete="${m.id}" style="padding:.25rem .45rem">
              <i class="fa-solid fa-trash" style="font-size:.7rem"></i>
            </button>
          </div>
        </div>

        <p style="font-size:.875rem;color:var(--text-secondary);line-height:1.55;padding-left:2.6rem">${m.message}</p>

        ${m.response
          ? `<div style="
              background:var(--green-50);border:1px solid #bbf7d0;
              border-radius:var(--radius-md);padding:.6rem .85rem;
              margin-top:.5rem;margin-left:2.6rem;
            ">
              <p style="font-size:.7rem;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:.06em;margin-bottom:.2rem">
                <i class="fa-solid fa-reply" style="margin-right:.3rem"></i>Tu respuesta
              </p>
              <p style="font-size:.82rem;color:#166534">${m.response}</p>
            </div>`
          : `<div style="padding-left:2.6rem">${replyForm}</div>`
        }
      </div>
    `;
  }

  // ── Render ──
  function render() {
    if (loading) {
      app.innerHTML = `
        <div class="text-center" style="padding:5rem">
          <div class="spinner"></div>
          <p class="text-gray mt-3">Cargando exámenes...</p>
        </div>`;
      return;
    }

    // ── Pantalla de selección de examen ──
    if (!selectedExam) {
      app.innerHTML = `
        <style>
          .mon-exam-card {
            background:var(--surface);border:1.5px solid var(--border);
            border-radius:var(--radius-xl);padding:1.25rem 1.5rem;
            cursor:pointer;transition:all .2s;
            display:flex;align-items:center;justify-content:space-between;gap:1rem;
          }
          .mon-exam-card:hover {
            border-color:var(--blue-500);
            box-shadow:0 4px 20px rgba(37,99,235,.12);
            transform:translateY(-2px);
          }
          body.dark .mon-exam-card { background:var(--surface-raised);border-color:var(--border-strong); }
          body.dark .mon-exam-card:hover { border-color:var(--blue-500); }
        </style>

        <div style="max-width:760px;margin:0 auto">
          <div class="flex-between mb-6">
            <div>
              <h1 style="font-size:1.75rem;font-weight:800;letter-spacing:-.025em;color:var(--text-primary);display:flex;align-items:center;gap:.6rem">
                <span style="width:2.4rem;height:2.4rem;background:linear-gradient(135deg,#1e3a5f,#2563eb);border-radius:.7rem;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">
                  <i class="fa-solid fa-tower-broadcast" style="color:#fff;font-size:.95rem"></i>
                </span>
                Monitoreo
              </h1>
              <p style="color:var(--text-muted);font-size:.875rem;margin-top:.3rem">
                Selecciona un examen para supervisar en tiempo real
              </p>
            </div>
            <button class="btn btn-outline" id="back-btn">
              <i class="fa-solid fa-arrow-left" style="margin-right:.4rem"></i>Volver
            </button>
          </div>

          <div class="card">
            <p style="font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:1rem">
              <i class="fa-solid fa-file-lines" style="margin-right:.4rem;color:#2563eb"></i>
              ${exams.length} examen${exams.length !== 1 ? 'es' : ''} disponible${exams.length !== 1 ? 's' : ''}
            </p>

            ${exams.length === 0
              ? `<div class="text-center" style="padding:3rem;color:var(--text-muted)">
                  <i class="fa-solid fa-inbox" style="font-size:2.5rem;color:var(--gray-300);display:block;margin-bottom:.75rem"></i>
                  <p style="font-weight:600">No hay exámenes disponibles</p>
                  <button class="btn btn-primary mt-3" id="create-btn">
                    <i class="fa-solid fa-plus" style="margin-right:.4rem"></i>Crear examen
                  </button>
                </div>`
              : `<div style="display:flex;flex-direction:column;gap:.6rem">
                  ${exams.map(e => `
                    <div class="mon-exam-card" data-exam="${e.id}">
                      <div style="display:flex;align-items:center;gap:1rem">
                        <div style="width:2.75rem;height:2.75rem;border-radius:.75rem;background:linear-gradient(135deg,#1e3a5f,#2563eb);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                          <i class="fa-solid fa-file-pen" style="color:#fff;font-size:.9rem"></i>
                        </div>
                        <div>
                          <p style="font-weight:700;font-size:.95rem;color:var(--text-primary)">${e.title}</p>
                          <p style="font-size:.78rem;color:var(--text-muted);margin-top:.15rem">
                            <span style="font-family:'JetBrains Mono',monospace;font-weight:600;color:#2563eb">${e.code}</span>
                            &nbsp;·&nbsp;${e.durationMinutes} min
                            &nbsp;·&nbsp;${e.questions?.length || 0} preguntas
                          </p>
                        </div>
                      </div>
                      <i class="fa-solid fa-chevron-right" style="color:var(--text-muted);font-size:.8rem"></i>
                    </div>
                  `).join('')}
                </div>`
            }
          </div>
        </div>`;

      document.getElementById('back-btn').onclick = () => navigate('/docente');
      document.getElementById('create-btn')?.addEventListener('click', () => navigate('/docente'));
      document.querySelectorAll('[data-exam]').forEach(el => {
        el.onclick = () => { const e = exams.find(x => x.id === el.dataset.exam); if (e) selectExam(e); };
      });
      return;
    }

    // ── Dashboard de monitoreo ──
    const blocked = allStudents.filter(s => s.isBlocked);
    const unread  = messages.filter(m => !m.read);

    app.innerHTML = `
      <style>
        .mon-stat {
          background:var(--surface);border:1px solid var(--border);
          border-radius:var(--radius-xl);padding:1.25rem 1.5rem;
          display:flex;align-items:center;gap:1rem;
          box-shadow:0 1px 3px rgba(0,0,0,.04),0 4px 12px rgba(0,0,0,.04);
          transition:var(--transition-slow);
        }
        .mon-stat:hover { transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,.08); }
        body.dark .mon-stat { background:var(--surface-raised);border-color:var(--border-strong); }
        .mon-stat-icon {
          width:2.75rem;height:2.75rem;border-radius:.75rem;
          display:flex;align-items:center;justify-content:center;font-size:1.1rem;flex-shrink:0;
        }
        .mon-stat-val { font-size:1.9rem;font-weight:800;letter-spacing:-.03em;line-height:1; }
        .mon-stat-lbl { font-size:.72rem;color:var(--text-muted);margin-top:.15rem;text-transform:uppercase;letter-spacing:.06em; }
        .mon-section-title {
          font-size:.78rem;font-weight:700;text-transform:uppercase;
          letter-spacing:.07em;color:var(--text-muted);margin-bottom:1rem;
          display:flex;align-items:center;gap:.5rem;
        }
        .mon-section-title i { color:#2563eb; }
      </style>

      <div style="max-width:100%;margin:0 auto">

        <!-- Header -->
        <div class="flex-between mb-5">
          <div>
            <h1 style="font-size:1.5rem;font-weight:800;letter-spacing:-.025em;color:var(--text-primary);display:flex;align-items:center;gap:.6rem">
              <span style="width:2.2rem;height:2.2rem;background:linear-gradient(135deg,#1e3a5f,#2563eb);border-radius:.6rem;display:inline-flex;align-items:center;justify-content:center;flex-shrink:0">
                <i class="fa-solid fa-tower-broadcast" style="color:#fff;font-size:.85rem"></i>
              </span>
              ${selectedExam.title}
            </h1>
            <p style="color:var(--text-muted);font-size:.82rem;margin-top:.3rem">
              <span style="font-family:'JetBrains Mono',monospace;font-weight:700;color:#2563eb">${selectedExam.code}</span>
              &nbsp;·&nbsp;${selectedExam.durationMinutes} min
              &nbsp;·&nbsp;${selectedExam.questions?.length || 0} preguntas
            </p>
          </div>
          <div style="display:flex;gap:.5rem">
            <button class="btn btn-outline btn-sm" id="refresh-btn">
              <i class="fa-solid fa-rotate" style="margin-right:.35rem"></i>Actualizar
            </button>
            <button class="btn btn-outline btn-sm" id="purge-btn" title="Eliminar estudiantes inactivos">
              <i class="fa-solid fa-broom" style="margin-right:.35rem"></i>Limpiar
            </button>
            <button class="btn btn-outline btn-sm" id="deselect-btn">
              <i class="fa-solid fa-arrow-left" style="margin-right:.35rem"></i>Cambiar
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem">
          <div class="mon-stat">
            <div class="mon-stat-icon" style="background:#dbeafe">
              <i class="fa-solid fa-users" style="color:#2563eb"></i>
            </div>
            <div>
              <div class="mon-stat-val" style="color:#2563eb">${allStudents.length}</div>
              <div class="mon-stat-lbl">Activos</div>
            </div>
          </div>
          <div class="mon-stat">
            <div class="mon-stat-icon" style="background:${blocked.length>0?'#fee2e2':'var(--gray-100)'}">
              <i class="fa-solid fa-lock" style="color:${blocked.length>0?'#dc2626':'#94a3b8'}"></i>
            </div>
            <div>
              <div class="mon-stat-val" style="color:${blocked.length>0?'#dc2626':'var(--text-muted)'}">${blocked.length}</div>
              <div class="mon-stat-lbl">Bloqueados</div>
            </div>
          </div>
          <div class="mon-stat">
            <div class="mon-stat-icon" style="background:${unread.length>0?'#fef3c7':'var(--gray-100)'}">
              <i class="fa-solid fa-envelope" style="color:${unread.length>0?'#d97706':'#94a3b8'}"></i>
            </div>
            <div>
              <div class="mon-stat-val" style="color:${unread.length>0?'#d97706':'var(--text-muted)'}">${unread.length}</div>
              <div class="mon-stat-lbl">Sin leer</div>
            </div>
          </div>
        </div>

        <!-- Students table -->
        <div class="card mb-4" style="padding:0;overflow:hidden">
          <div style="padding:1.25rem 1.5rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
            <p class="mon-section-title" style="margin:0">
              <i class="fa-solid fa-users"></i>
              Estudiantes en examen
              <span style="background:#dbeafe;color:#1d4ed8;border-radius:999px;padding:.1rem .55rem;font-size:.72rem;font-weight:700">${allStudents.length}</span>
            </p>
          </div>
          ${allStudents.length === 0
            ? `<div class="text-center" style="padding:3rem;color:var(--text-muted)">
                <i class="fa-solid fa-hourglass-half" style="font-size:2rem;color:var(--gray-300);display:block;margin-bottom:.6rem"></i>
                <p style="font-weight:600">Esperando estudiantes...</p>
                <p style="font-size:.8rem;margin-top:.25rem">Presiona "Actualizar" si hay estudiantes activos</p>
              </div>`
            : `<div class="overflow-x">
                <table>
                  <thead><tr>
                    <th>Estudiante</th><th>Estado</th><th>Tiempo</th>
                    <th>Progreso</th><th>Infracciones</th><th>Actividad</th><th>Acción</th>
                  </tr></thead>
                  <tbody>${allStudents.map(s => renderStudentRow(s)).join('')}</tbody>
                </table>
              </div>`
          }
        </div>

        <!-- Messages -->
        <div class="card" style="padding:0;overflow:hidden">
          <div style="padding:1.25rem 1.5rem;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between">
            <p class="mon-section-title" style="margin:0">
              <i class="fa-solid fa-inbox"></i>
              Mensajes
              ${messages.length > 0 ? `<span style="background:var(--gray-200);color:var(--gray-600);border-radius:999px;padding:.1rem .55rem;font-size:.72rem;font-weight:700">${messages.length}</span>` : ''}
              ${unread.length > 0 ? `<span class="badge badge-red">${unread.length} sin leer</span>` : ''}
            </p>
            ${messages.length > 0 ? `
              <button class="btn btn-outline btn-sm" id="clear-read-btn">
                <i class="fa-solid fa-check-double" style="margin-right:.3rem"></i>Limpiar leídos
              </button>` : ''}
          </div>
          <div style="padding:1.25rem 1.5rem">
            ${messages.length === 0
              ? `<div class="text-center" style="padding:2.5rem;color:var(--text-muted)">
                  <i class="fa-solid fa-inbox" style="font-size:2rem;color:var(--gray-300);display:block;margin-bottom:.5rem"></i>
                  <p style="font-size:.875rem">No hay mensajes</p>
                </div>`
              : `<div style="display:flex;flex-direction:column;gap:.6rem;max-height:520px;overflow-y:auto;padding-right:.25rem">
                  ${messages.map(m => renderMessageCard(m)).join('')}
                </div>`
            }
          </div>
        </div>

      </div>`;

    // Events
    document.getElementById('deselect-btn').onclick = deselectExam;

    document.getElementById('refresh-btn').onclick = async () => {
      const btn = document.getElementById('refresh-btn');
      if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; }
      try {
        const snap = await fbDB.ref(`active_exams/${selectedExam.code}/students`).get();
        const all = [];
        const raw = snap.val();
        if (raw) Object.entries(raw).forEach(([key, val]) => all.push({ id: key, ...val }));
        await purgeGhosts(selectedExam.code, all);
        const snap2 = await fbDB.ref(`active_exams/${selectedExam.code}/students`).get();
        const clean = [];
        const raw2  = snap2.val();
        if (raw2) Object.entries(raw2).forEach(([key, val]) => clean.push({ id: key, ...val }));
        allStudents = clean;
        render();
      } catch(e) { console.error('Error al actualizar:', e); }
    };

    document.getElementById('purge-btn')?.addEventListener('click', async () => {
      const btn = document.getElementById('purge-btn');
      if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>'; }
      try {
        await purgeGhosts(selectedExam.code, allStudents);
        allStudents = allStudents.filter(s => {
          const last = s.lastActivity || s.joinedAt || 0;
          return (Date.now() - last) <= STALE_MS;
        });
        render();
      } catch(e) { console.error('Error al limpiar:', e); }
    });

    document.querySelectorAll('[data-unblock]').forEach(btn => {
      btn.onclick = () => { const s = allStudents.find(x => x.id === btn.dataset.unblock); if (s) handleUnblock(s); };
    });

    document.querySelectorAll('[data-block]').forEach(btn => {
      btn.onclick = () => {
        const s = allStudents.find(x => x.id === btn.dataset.block);
        if (s && confirm(`¿Bloquear a ${s.name}?`)) {
          blockStudent(selectedExam.code, s.id, 'Bloqueado por el docente').catch(() => alert('❌ Error al bloquear'));
        }
      };
    });

    document.querySelectorAll('[data-reply]').forEach(btn => {
      btn.onclick = () => { selectedMsg = btn.dataset.reply; responseText = ''; render(); };
    });

    document.getElementById('cancel-resp')?.addEventListener('click', () => { selectedMsg = null; responseText = ''; render(); });

    const respInput = document.getElementById('resp-input');
    if (respInput) {
      respInput.oninput = e => { responseText = e.target.value; };
      respInput.value = responseText;
      respInput.focus();
      respInput.setSelectionRange(respInput.value.length, respInput.value.length);
    }

    document.querySelectorAll('[data-send]').forEach(btn => {
      btn.onclick = () => handleRespond(btn.dataset.send);
    });

    document.querySelectorAll('[data-delete]').forEach(btn => {
      btn.onclick = () => handleDeleteMessage(btn.dataset.delete);
    });

    document.getElementById('clear-read-btn')?.addEventListener('click', async () => {
      const readMsgs = messages.filter(m => m.read);
      if (!readMsgs.length) return;
      if (!confirm(`¿Eliminar ${readMsgs.length} mensaje${readMsgs.length !== 1 ? 's' : ''} ya respondido${readMsgs.length !== 1 ? 's' : ''}?`)) return;
      try { await Promise.all(readMsgs.map(m => deleteMessage(selectedExam.code, m.id))); }
      catch { alert('❌ Error al limpiar mensajes'); }
    });
  }

  loadExams();
}
