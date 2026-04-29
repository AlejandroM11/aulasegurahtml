function renderTeacher(app) {
  let exams = [], loading = true, saving = false;
  let activeTab = 'crear', filter = '', showRegistry = true;
  let selectedExam = null;
  let title = '', code = '', dur = 30, showCorrectAnswers = false;
  let questions = [], qtext = '', qtype = 'mc';
  let options = ['', ''], correctIndex = 0;
  const user = getUser();

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
    for (let i = 0; i < 5; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Verificar que no exista ya
    const exists = exams.some(e => e.code === result);
    return exists ? generateCode() : result;
  }
  function resetForm() {
    title = ''; code = generateCode(); dur = 30; questions = [];
    qtext = ''; options = ['', '']; correctIndex = 0;
    showCorrectAnswers = false; selectedExam = null; qtype = 'mc';
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
      const examData = { title: title.trim(), code: code.trim().toUpperCase(), durationMinutes: Number(dur), questions, showCorrectAnswers, teacherId };
      if (selectedExam) { await apiUpdateExam(selectedExam.id, examData); alert('✅ Examen actualizado exitosamente'); }
      else { await apiCreateExam(examData); alert('✅ Examen creado exitosamente'); }
      resetForm(); activeTab = 'lista';
      await loadExams();
    } catch (err) { alert('❌ ' + (err.response?.data?.error || err.message || 'Error al guardar')); }
    finally { saving = false; render(); }
  }

  async function deleteExam(exam) {
    if (!confirm(`¿Eliminar "${exam.title}"?\nEsta acción no se puede deshacer.`)) return;
    try {
      await apiDeleteExam(exam.id);
      if (selectedExam?.id === exam.id) resetForm();
      exams = exams.filter(e => e.id !== exam.id); render();
    } catch { alert('❌ Error al eliminar el examen'); }
  }

  function addQuestion() {
    if (!qtext.trim()) return alert('Escribe el texto de la pregunta');
    const q = { id: crypto.randomUUID(), text: qtext.trim(), type: qtype };
    if (qtype === 'mc') {
      const opts = options.map(o => o.trim()).filter(Boolean);
      if (opts.length < 2) return alert('Agrega al menos 2 opciones');
      if (!opts[correctIndex]?.trim()) return alert('Selecciona una opción correcta válida');
      q.options = opts; q.correctIndex = Number(correctIndex);
    }
    questions.push(q); qtext = ''; options = ['', '']; correctIndex = 0; render();
  }

  function removeQuestion(id) { questions = questions.filter(q => q.id !== id); render(); }
  function addOption() { if (options.length < 6) { options.push(''); render(); } }
  function removeOption(i) {
    if (options.length <= 2) return;
    options.splice(i, 1);
    if (correctIndex >= options.length) correctIndex = 0;
    render();
  }

  function render() {
    app.innerHTML = `
      <div style="max-width:900px;margin:0 auto">
        <div style="display:flex;gap:.5rem;margin-bottom:1.5rem;background:#fff;padding:.4rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,.07);border:1px solid #e2e8f0">
          <button class="tab-pill${activeTab==='crear'?' active':''}" id="tab-crear" style="flex:1">
            ${selectedExam ? '<i class="fa-solid fa-pen" style="margin-right:.4rem"></i>Editando' : '<i class="fa-solid fa-plus" style="margin-right:.4rem"></i>Crear examen'}
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
      <style>
        .tab-pill{background:transparent;border:none;padding:.55rem 1rem;border-radius:.75rem;font-weight:600;font-size:.875rem;cursor:pointer;color:#64748b;transition:all .2s}
        .tab-pill.active{background:#2563eb;color:#fff;box-shadow:0 2px 8px rgba(37,99,235,.3)}
        .tab-pill:hover:not(.active){background:#f1f5f9;color:#1e293b}
        .opt-row{display:flex;align-items:center;gap:.5rem;margin-bottom:.5rem}
        .correct-radio{width:1.1rem;height:1.1rem;accent-color:#2563eb;cursor:pointer;flex-shrink:0}
        .q-chip{background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:.75rem;padding:.85rem 1rem;display:flex;justify-content:space-between;align-items:flex-start;gap:.75rem;transition:border-color .2s}
        .q-chip:hover{border-color:#2563eb}
        .section-label{font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8;margin-bottom:.5rem}
      </style>
    `;
    bindTabEvents();
    if (activeTab === 'crear') bindCrearEvents();
    if (activeTab === 'lista') bindListaEvents();
  }

  function renderTabCrear() {
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.25rem;align-items:start">
        <div style="display:flex;flex-direction:column;gap:1.25rem">
          <div class="card">
            <div class="flex-between mb-3">
              <h2 class="font-bold" style="font-size:1.1rem">
                ${selectedExam ? `<i class="fa-solid fa-pen" style="margin-right:.4rem;color:#2563eb"></i><span class="text-blue">${selectedExam.title}</span>` : '<i class="fa-solid fa-file-lines" style="margin-right:.4rem;color:#2563eb"></i>Información del examen'}
              </h2>
              ${selectedExam ? `<button class="btn btn-outline text-xs" id="cancel-edit"><i class="fa-solid fa-xmark" style="margin-right:.3rem"></i>Cancelar</button>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;gap:.75rem">
              <div class="form-group">
                <label class="label">Título del examen</label>
                <input class="input" id="f-title" placeholder="Ej: Parcial de Matemáticas" value="${title}"/>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem">
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
                <div class="form-group">
                  <label class="label">Duración (min)</label>
                  <input class="input" id="f-dur" type="number" min="1" value="${dur}"/>
                </div>
              </div>
              <label style="display:flex;align-items:center;gap:.75rem;cursor:pointer;padding:.75rem;background:#f8fafc;border-radius:.75rem;border:1.5px solid #e2e8f0">
                <input type="checkbox" id="f-show-answers" ${showCorrectAnswers ? 'checked' : ''} style="width:1.1rem;height:1.1rem;accent-color:#2563eb"/>
                <div>
                  <p class="font-bold text-sm">Mostrar respuestas al finalizar</p>
                  <p class="text-xs text-gray">El estudiante verá las correctas al terminar</p>
                </div>
              </label>
            </div>
          </div>
          <div class="card">
            <h3 class="font-bold mb-3" style="font-size:1rem"><i class="fa-solid fa-circle-plus" style="margin-right:.4rem;color:#2563eb"></i>Nueva pregunta</h3>
            <div class="form-group mb-3">
              <label class="label">Texto de la pregunta</label>
              <textarea class="input" id="f-qtext" rows="3" placeholder="Escribe aquí la pregunta..." style="resize:none">${qtext}</textarea>
            </div>
            <div class="form-group mb-3">
              <label class="label">Tipo</label>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem">
                <label style="display:flex;align-items:center;gap:.5rem;padding:.6rem .85rem;border-radius:.6rem;border:2px solid ${qtype==='mc'?'#2563eb':'#e2e8f0'};cursor:pointer;background:${qtype==='mc'?'#eff6ff':'#fff'}">
                  <input type="radio" name="qtype" value="mc" ${qtype==='mc'?'checked':''} style="accent-color:#2563eb"/>
                  <i class="fa-solid fa-list-check" style="color:#2563eb;margin-right:.3rem"></i>
                  <span class="text-sm font-bold">Múltiple opción</span>
                </label>
                <label style="display:flex;align-items:center;gap:.5rem;padding:.6rem .85rem;border-radius:.6rem;border:2px solid ${qtype==='open'?'#2563eb':'#e2e8f0'};cursor:pointer;background:${qtype==='open'?'#eff6ff':'#fff'}">
                  <input type="radio" name="qtype" value="open" ${qtype==='open'?'checked':''} style="accent-color:#2563eb"/>
                  <i class="fa-solid fa-pen-to-square" style="color:#2563eb;margin-right:.3rem"></i>
                  <span class="text-sm font-bold">Pregunta abierta</span>
                </label>
              </div>
            </div>
            ${qtype === 'mc' ? `
              <div style="background:#f8fafc;border-radius:.75rem;padding:.85rem;border:1.5px solid #e2e8f0;margin-bottom:.75rem">
                <p class="section-label">Opciones de respuesta</p>
                <p class="text-xs text-gray mb-2">Marca el círculo de la respuesta correcta</p>
                ${options.map((opt, i) => `
                  <div class="opt-row">
                    <input type="radio" class="correct-radio" name="correct-opt" value="${i}" ${correctIndex==i?'checked':''} id="correct-${i}"/>
                    <input class="input text-sm" id="opt-${i}" value="${opt}" placeholder="Opción ${String.fromCharCode(65+i)}" style="flex:1"/>
                    ${options.length > 2 ? `<button class="btn btn-danger" style="padding:.3rem .55rem;font-size:.8rem" data-remove-opt="${i}"><i class="fa-solid fa-xmark"></i></button>` : ''}
                  </div>
                `).join('')}
                ${options.length < 6 ? `<button class="btn btn-outline text-xs mt-2" id="add-opt-btn" style="width:100%"><i class="fa-solid fa-plus" style="margin-right:.3rem"></i>Agregar opción</button>` : ''}
              </div>
            ` : `<div class="info-box info-box-blue mb-3"><p class="text-xs"><i class="fa-solid fa-lightbulb" style="margin-right:.4rem"></i>Las preguntas abiertas serán respondidas con texto libre.</p></div>`}
            <button class="btn btn-full mb-2" id="rag-btn" style="background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff">
              <i class="fa-solid fa-wand-magic-sparkles" style="margin-right:.4rem"></i>Generar con IA
            </button>
            <button class="btn btn-primary btn-full" id="add-q-btn">
              <i class="fa-solid fa-plus" style="margin-right:.4rem"></i>Agregar pregunta
            </button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:1.25rem">
          <div class="card" style="min-height:200px">
            <div class="flex-between mb-3">
              <h3 class="font-bold" style="font-size:1rem"><i class="fa-solid fa-clipboard-list" style="margin-right:.4rem;color:#2563eb"></i>Preguntas del examen</h3>
              <span style="background:#dbeafe;color:#1d4ed8;border-radius:999px;padding:.2rem .65rem;font-size:.8rem;font-weight:700">${questions.length}</span>
            </div>
            ${questions.length === 0 ? `
              <div class="text-center text-gray" style="padding:3rem 1rem">
                <i class="fa-solid fa-inbox" style="font-size:2.5rem;color:#cbd5e1"></i>
                <p class="text-sm mt-2">Aún no hay preguntas.<br/>Agrégalas desde el panel izquierdo.</p>
              </div>
            ` : `
              <div class="space-y">
                ${questions.map((q, idx) => `
                  <div class="q-chip">
                    <div style="flex:1">
                      <div style="display:flex;align-items:center;gap:.5rem;margin-bottom:.35rem">
                        <span style="background:${q.type==='mc'?'#dbeafe':'#dcfce7'};color:${q.type==='mc'?'#1d4ed8':'#15803d'};font-size:.7rem;font-weight:700;padding:.15rem .5rem;border-radius:999px">
                          <i class="fa-solid ${q.type==='mc'?'fa-list-check':'fa-pen-to-square'}" style="margin-right:.3rem"></i>${q.type==='mc'?'MÚLTIPLE':'ABIERTA'}
                        </span>
                        <span class="text-xs text-gray">#${idx+1}</span>
                      </div>
                      <p class="text-sm font-bold">${q.text}</p>
                      ${q.type==='mc' ? `<div style="margin-top:.4rem;display:flex;flex-wrap:wrap;gap:.3rem">${q.options.map((o,i)=>`<span style="font-size:.72rem;padding:.15rem .5rem;border-radius:999px;background:${i===q.correctIndex?'#dcfce7':'#f1f5f9'};color:${i===q.correctIndex?'#15803d':'#475569'};font-weight:${i===q.correctIndex?'700':'400'}">${i===q.correctIndex?'<i class="fa-solid fa-check" style="margin-right:.2rem"></i>':''}${o}</span>`).join('')}</div>` : `<p class="text-xs text-gray mt-1"><i class="fa-solid fa-pen-to-square" style="margin-right:.3rem"></i>Respuesta abierta</p>`}
                    </div>
                    <button class="btn btn-danger" style="padding:.3rem .55rem;font-size:.8rem;flex-shrink:0" data-del="${q.id}"><i class="fa-solid fa-trash"></i></button>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
          <button class="btn btn-primary btn-full" id="save-btn" style="padding:.85rem;font-size:1rem" ${saving || questions.length === 0 || !title.trim() || !code.trim() ? 'disabled' : ''}>
            ${saving ? '<i class="fa-solid fa-spinner fa-spin" style="margin-right:.4rem"></i>Guardando...' : selectedExam ? '<i class="fa-solid fa-floppy-disk" style="margin-right:.4rem"></i>Guardar cambios' : '<i class="fa-solid fa-circle-check" style="margin-right:.4rem"></i>Crear examen'}
          </button>
          ${questions.length === 0 ? `<p class="text-center text-xs text-gray">Agrega al menos una pregunta para guardar</p>` : ''}
        </div>
      </div>
    `;
  }

  function renderTabLista() {
    const filtered = exams.filter(e => (e.code + e.title).toLowerCase().includes(filter.toLowerCase()));
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
        ${loading ? `<div class="text-center" style="padding:2.5rem"><div class="spinner"></div><p class="text-gray mt-3">Cargando...</p></div>` : showRegistry ? renderExamsTable(filtered) : '<p class="text-center text-gray" style="padding:1rem">Lista oculta</p>'}
      </div>
    `;
  }

  function renderExamsTable(filtered) {
    if (filtered.length === 0) return `<p class="text-center text-gray" style="padding:2rem">${filter ? 'No se encontraron exámenes' : 'No hay exámenes registrados aún'}</p>`;
    return `
      <div class="overflow-x">
        <table>
          <thead><tr><th>Código</th><th>Título</th><th>Duración</th><th>Preguntas</th><th>Config</th><th>Acciones</th></tr></thead>
          <tbody>
            ${filtered.map(e => `
              <tr>
                <td class="font-mono font-bold text-blue">${e.code}</td>
                <td>${e.title}</td>
                <td><i class="fa-solid fa-clock" style="margin-right:.3rem;color:#64748b"></i>${e.durationMinutes} min</td>
                <td><i class="fa-solid fa-circle-question" style="margin-right:.3rem;color:#64748b"></i>${e.questions?.length || 0}</td>
                <td>${e.showCorrectAnswers ? `<span class="badge badge-green"><i class="fa-solid fa-eye" style="margin-right:.3rem"></i>Muestra respuestas</span>` : `<span class="badge badge-gray"><i class="fa-solid fa-eye-slash" style="margin-right:.3rem"></i>Oculta respuestas</span>`}</td>
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

  function bindTabEvents() {
    document.getElementById('tab-crear').onclick     = () => { activeTab = 'crear'; if (!selectedExam) resetForm(); render(); };
    document.getElementById('tab-lista').onclick     = () => { activeTab = 'lista'; render(); };
    document.getElementById('tab-examenes').onclick  = () => navigate('/examenes');
    document.getElementById('tab-resultados').onclick = () => navigate('/resultados');
    document.getElementById('tab-monitor').onclick   = () => navigate('/monitor');
  }

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
    document.querySelectorAll('input[name="qtype"]').forEach(r => { r.onchange = e => { qtype = e.target.value; render(); }; });
    if (qtype === 'mc') {
      options.forEach((_, i) => {
        const inp = document.getElementById(`opt-${i}`); if (inp) inp.oninput = e => { options[i] = e.target.value; };
        const radio = document.getElementById(`correct-${i}`); if (radio) radio.onchange = () => { correctIndex = i; };
      });
      const addOptBtn = document.getElementById('add-opt-btn'); if (addOptBtn) addOptBtn.onclick = addOption;
      document.querySelectorAll('[data-remove-opt]').forEach(btn => { btn.onclick = () => removeOption(Number(btn.dataset.removeOpt)); });
    }
    document.getElementById('add-q-btn').onclick = addQuestion;
    document.getElementById('save-btn').onclick   = saveExam;
    if (selectedExam) { document.getElementById('cancel-edit').onclick = () => { resetForm(); render(); }; }
    document.querySelectorAll('[data-del]').forEach(btn => { btn.onclick = () => removeQuestion(btn.dataset.del); });
    const ragBtn = document.getElementById('rag-btn');
    if (ragBtn) ragBtn.onclick = () => { openRAGModal((newQ) => { questions.push(...newQ); render(); }); };
  }

  function bindListaEvents() {
    document.getElementById('f-filter').oninput   = e => { filter = e.target.value; render(); };
    document.getElementById('toggle-reg').onclick = () => { showRegistry = !showRegistry; render(); };
    const gotoBtn = document.getElementById('goto-examenes-btn'); if (gotoBtn) gotoBtn.onclick = () => navigate('/examenes');
    document.querySelectorAll('[data-edit]').forEach(btn => { btn.onclick = () => { const e = exams.find(x => x.id === btn.dataset.edit); if (e) openExam(e); }; });
    document.querySelectorAll('[data-del-exam]').forEach(btn => { btn.onclick = () => { const e = exams.find(x => x.id === btn.dataset.delExam); if (e) deleteExam(e); }; });
  }

  loadExams().then(() => checkPendingEdit());
}