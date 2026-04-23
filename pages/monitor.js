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
    if (diff < 60000) return 'Hace un momento';
    if (diff < 3600000) return `Hace ${Math.floor(diff/60000)} min`;
    return new Date(ts).toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' });
  }

  async function loadExams() {
    try {
      const user = getUser();
      const teacherId = user?.uid || user?.email;
      const all = await apiGetExams();
      exams = all.filter(e => e.teacherId === teacherId);
    } catch { console.error('Error al cargar exámenes'); }
    finally { loading = false; render(); }
  }

  function selectExam(exam) {
    selectedExam = exam;
    unsubStudents = listenToActiveStudents(exam.code, (students) => {
      const now = Date.now();
      allStudents = students.filter(s => {
        const last = s.lastActivity || s.joinedAt;
        return (now - last) < 30000;
      });
      render();
    });
    unsubMessages = listenToMessages(exam.code, (msgs) => {
      messages = msgs.sort((a,b) => b.timestamp - a.timestamp);
      render();
    });
    cleanupInterval = setInterval(() => {
      const now = Date.now();
      allStudents.forEach(async s => {
        const last = s.lastActivity || s.joinedAt;
        if ((now - last) > 60000) {
          try { await removeActiveStudent(selectedExam.code, s.id); } catch {}
        }
      });
    }, 10000);
    render();
  }

  function deselectExam() {
    if (unsubStudents) { unsubStudents(); unsubStudents = null; }
    if (unsubMessages) { unsubMessages(); unsubMessages = null; }
    if (cleanupInterval) { clearInterval(cleanupInterval); cleanupInterval = null; }
    selectedExam = null; allStudents = []; messages = [];
    render();
  }

  async function handleUnblock(student) {
    if (!confirm(`¿Desbloquear a ${student.name}?\n\nEl estudiante podrá continuar su examen inmediatamente.`)) return;
    unblocking = true; render();
    try {
      await unblockStudent(selectedExam.code, student.id);
      alert(`✅ ${student.name} ha sido desbloqueado.`);
    } catch { alert('❌ Error al desbloquear al estudiante. Intenta nuevamente.'); }
    finally { unblocking = false; render(); }
  }

  async function handleRespond(msgId) {
    if (!responseText.trim()) { alert('Escribe una respuesta'); return; }
    try {
      await respondToStudent(selectedExam.code, msgId, responseText);
      alert('✅ Respuesta enviada al estudiante');
      responseText = ''; selectedMsg = null; render();
    } catch { alert('❌ Error al enviar la respuesta'); }
  }

  function render() {
    if (loading) {
      app.innerHTML = `<div class="text-center" style="padding:4rem"><div class="spinner"></div><p class="text-gray mt-3">Cargando exámenes...</p></div>`;
      return;
    }

    if (!selectedExam) {
      app.innerHTML = `
        <div style="max-width:800px;margin:0 auto">
          <div class="flex-between mb-4">
            <div>
              <h1 class="font-bold" style="font-size:1.75rem">
                <i class="fa-solid fa-tower-broadcast" style="margin-right:.5rem;color:#2563eb"></i>Monitoreo en Tiempo Real
              </h1>
              <p class="text-gray text-sm mt-1">Selecciona un examen para comenzar a monitorear</p>
            </div>
            <button class="btn btn-outline" id="back-btn">
              <i class="fa-solid fa-arrow-left" style="margin-right:.4rem"></i>Volver
            </button>
          </div>
          <div class="card">
            <h2 class="font-bold mb-3" style="font-size:1.1rem">
              <i class="fa-solid fa-file-lines" style="margin-right:.4rem;color:#2563eb"></i>Exámenes disponibles
            </h2>
            ${exams.length === 0
              ? `<div class="text-center text-gray" style="padding:3rem">
                  <i class="fa-solid fa-inbox" style="font-size:2.5rem;color:#cbd5e1"></i>
                  <p class="mt-3">No hay exámenes disponibles</p>
                  <button class="btn btn-primary mt-3" id="create-btn">
                    <i class="fa-solid fa-plus" style="margin-right:.4rem"></i>Crear primer examen
                  </button>
                </div>`
              : `<div class="space-y">
                  ${exams.map(e => `
                    <div class="card" style="cursor:pointer;border:2px solid #e2e8f0;transition:all .2s;padding:1.1rem" data-exam="${e.id}">
                      <div class="flex-between">
                        <div>
                          <h3 class="font-bold">${e.title}</h3>
                          <p class="text-sm text-gray mt-1">
                            <i class="fa-solid fa-key" style="margin-right:.3rem"></i>Código:
                            <span class="font-mono font-bold text-blue">${e.code}</span>
                          </p>
                        </div>
                        <div style="text-align:right">
                          <p class="text-sm text-gray">
                            <i class="fa-solid fa-clock" style="margin-right:.3rem"></i>${e.durationMinutes} min
                          </p>
                          <p class="text-xs text-gray">
                            <i class="fa-solid fa-circle-question" style="margin-right:.3rem"></i>${e.questions?.length || 0} preguntas
                          </p>
                        </div>
                      </div>
                    </div>
                  `).join('')}
                </div>`
            }
          </div>
        </div>`;

      document.getElementById('back-btn').onclick = () => navigate('/docente');
      const createBtn = document.getElementById('create-btn');
      if (createBtn) createBtn.onclick = () => navigate('/docente');
      document.querySelectorAll('[data-exam]').forEach(el => {
        el.onmouseenter = () => { el.style.borderColor = '#2563eb'; el.style.background = '#eff6ff'; };
        el.onmouseleave = () => { el.style.borderColor = '#e2e8f0'; el.style.background = ''; };
        el.onclick = () => { const e = exams.find(x => x.id === el.dataset.exam); if (e) selectExam(e); };
      });
      return;
    }

    const blocked = allStudents.filter(s => s.isBlocked);
    const unread  = messages.filter(m => !m.read);

    app.innerHTML = `
      <div style="max-width:1000px;margin:0 auto">
        <div class="flex-between mb-4">
          <div>
            <h1 class="font-bold" style="font-size:1.5rem">
              <i class="fa-solid fa-tower-broadcast" style="margin-right:.5rem;color:#2563eb"></i>${selectedExam.title}
            </h1>
            <p class="text-gray text-sm mt-1">
              <i class="fa-solid fa-key" style="margin-right:.3rem"></i>Código:
              <span class="font-mono font-bold text-blue">${selectedExam.code}</span>
              &nbsp;·&nbsp;
              <i class="fa-solid fa-clock" style="margin-right:.3rem"></i>${selectedExam.durationMinutes} min
            </p>
          </div>
          <button class="btn btn-outline" id="deselect-btn">
            <i class="fa-solid fa-arrow-left" style="margin-right:.4rem"></i>Cambiar examen
          </button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1rem">
          <div class="card text-center">
            <i class="fa-solid fa-users" style="font-size:1.5rem;color:#2563eb;margin-bottom:.5rem"></i>
            <p style="font-size:2rem;font-weight:700;color:#2563eb">${allStudents.length}</p>
            <p class="text-sm text-gray">Estudiantes activos</p>
          </div>
          <div class="card text-center">
            <i class="fa-solid fa-lock" style="font-size:1.5rem;color:#dc2626;margin-bottom:.5rem"></i>
            <p style="font-size:2rem;font-weight:700;color:#dc2626">${blocked.length}</p>
            <p class="text-sm text-gray">Bloqueados</p>
          </div>
          <div class="card text-center">
            <i class="fa-solid fa-envelope" style="font-size:1.5rem;color:#d97706;margin-bottom:.5rem"></i>
            <p style="font-size:2rem;font-weight:700;color:#d97706">${unread.length}</p>
            <p class="text-sm text-gray">Mensajes sin leer</p>
          </div>
        </div>

        <div class="card mb-4">
          <h2 class="font-bold mb-3" style="font-size:1.1rem">
            <i class="fa-solid fa-users" style="margin-right:.4rem;color:#2563eb"></i>Estudiantes en examen
          </h2>
          ${allStudents.length === 0
            ? `<div class="text-center text-gray" style="padding:2.5rem">
                <i class="fa-solid fa-hourglass-half" style="font-size:2rem;color:#cbd5e1"></i>
                <p class="mt-2">Esperando estudiantes...</p>
              </div>`
            : `<div class="overflow-x">
                <table>
                  <thead><tr>
                    <th>Estudiante</th><th>Estado</th><th>Tiempo restante</th>
                    <th>Respondidas</th><th>Infracciones</th><th>Última actividad</th><th>Acción</th>
                  </tr></thead>
                  <tbody>
                    ${allStudents.map(s => `
                      <tr style="${s.isBlocked ? 'background:#fef2f2' : ''}">
                        <td>
                          <p class="font-bold text-sm">${s.name || 'Sin nombre'}</p>
                          <p class="text-xs text-gray">${s.email || ''}</p>
                        </td>
                        <td>
                          ${s.isBlocked
                            ? `<span class="badge badge-red"><i class="fa-solid fa-lock" style="margin-right:.3rem"></i>Bloqueado</span>`
                            : `<span class="badge badge-green"><i class="fa-solid fa-circle-check" style="margin-right:.3rem"></i>Activo</span>`}
                        </td>
                        <td class="font-mono">${fmt(s.timeLeft)}</td>
                        <td>${s.answeredCount || 0} / ${selectedExam.questions?.length || 0}</td>
                        <td>
                          <span style="color:${(s.violations||0) > 2 ? '#dc2626' : '#374151'};font-weight:${(s.violations||0) > 2 ? '700' : '400'}">
                            ${(s.violations||0) > 2 ? '<i class="fa-solid fa-triangle-exclamation" style="margin-right:.3rem"></i>' : ''}
                            ${s.violations || 0}
                          </span>
                        </td>
                        <td class="text-xs text-gray">${fmtTs(s.lastActivity || s.joinedAt)}</td>
                        <td>
                          ${s.isBlocked
                            ? `<button class="btn btn-primary text-xs" data-unblock="${s.id}" ${unblocking ? 'disabled' : ''}>
                                ${unblocking
                                  ? '<i class="fa-solid fa-spinner fa-spin" style="margin-right:.3rem"></i>Espera...'
                                  : '<i class="fa-solid fa-lock-open" style="margin-right:.3rem"></i>Desbloquear'}
                              </button>`
                            : `<button class="btn btn-danger text-xs" data-block="${s.id}">
                                <i class="fa-solid fa-lock" style="margin-right:.3rem"></i>Bloquear
                              </button>`}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>`
          }
        </div>

        <div class="card">
          <h2 class="font-bold mb-3" style="font-size:1.1rem">
            <i class="fa-solid fa-comments" style="margin-right:.4rem;color:#2563eb"></i>Mensajes de estudiantes
            ${unread.length > 0 ? `<span class="badge badge-red" style="margin-left:.5rem">${unread.length} nuevos</span>` : ''}
          </h2>
          ${messages.length === 0
            ? `<div class="text-center text-gray" style="padding:2rem">
                <i class="fa-solid fa-inbox" style="font-size:1.75rem;color:#cbd5e1"></i>
                <p class="mt-2 text-sm">No hay mensajes</p>
              </div>`
            : `<div class="space-y">
                ${messages.map(m => `
                  <div class="info-box ${m.read ? '' : 'info-box-blue'}" style="border-left:3px solid ${m.read ? '#e2e8f0' : '#2563eb'}">
                    <div class="flex-between mb-1">
                      <p class="font-bold text-sm">
                        <i class="fa-solid fa-user" style="margin-right:.3rem;color:#64748b"></i>
                        ${m.studentName || m.studentUid}
                      </p>
                      <p class="text-xs text-gray">
                        <i class="fa-solid fa-clock" style="margin-right:.3rem"></i>${fmtTs(m.timestamp)}
                      </p>
                    </div>
                    <p class="text-sm mb-2">${m.message}</p>
                    ${m.response
                      ? `<div style="background:#f0fdf4;border-radius:.4rem;padding:.5rem .75rem;margin-top:.5rem">
                          <p class="text-xs text-gray mb-1">
                            <i class="fa-solid fa-reply" style="margin-right:.3rem"></i>Tu respuesta:
                          </p>
                          <p class="text-sm">${m.response}</p>
                        </div>`
                      : `<div>
                          ${selectedMsg === m.id
                            ? `<div style="display:flex;gap:.5rem;margin-top:.5rem">
                                <input class="input text-sm" id="resp-input" placeholder="Escribe tu respuesta..." value="${responseText}" style="flex:1"/>
                                <button class="btn btn-primary text-xs" data-send="${m.id}">
                                  <i class="fa-solid fa-paper-plane" style="margin-right:.3rem"></i>Enviar
                                </button>
                                <button class="btn btn-outline text-xs" id="cancel-resp">
                                  <i class="fa-solid fa-xmark"></i>
                                </button>
                              </div>`
                            : `<button class="btn btn-outline text-xs" data-reply="${m.id}">
                                <i class="fa-solid fa-reply" style="margin-right:.3rem"></i>Responder
                              </button>`}
                        </div>`
                    }
                  </div>
                `).join('')}
              </div>`
          }
        </div>
      </div>`;

    document.getElementById('deselect-btn').onclick = deselectExam;

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

    const cancelResp = document.getElementById('cancel-resp');
    if (cancelResp) cancelResp.onclick = () => { selectedMsg = null; responseText = ''; render(); };

    const respInput = document.getElementById('resp-input');
    if (respInput) {
      respInput.oninput = e => { responseText = e.target.value; };
      respInput.focus();
    }

    document.querySelectorAll('[data-send]').forEach(btn => {
      btn.onclick = () => handleRespond(btn.dataset.send);
    });
  }

  loadExams();
}