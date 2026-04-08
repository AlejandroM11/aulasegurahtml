function renderTeacher(app) {
  let exams = [], loading = true, activeTab = 'crear';
  let title = '', code = '', dur = 30, showCorrectAnswers = false;
  let questions = [], qtext = '', qtype = 'mc', optionsRaw = 'Opción A;Opción B', correctIndex = 0;
  const user = getUser();
  if (!user || user.role !== 'docente') {
    console.error('Usuario no autorizado para acceder a la vista del profesor');
    navigate('/login');
    return;
  }
  let aiReady = false;
  let selectedExam = null, saving = false, filter = '', showRegistry = true;
  // Sección de Entrenamiento IA:
  // - Los datos se agregan al hacer clic en "Entrenar", llamando a AI.entrenarModelo()
  // - El modelo se entrena automáticamente con cada nuevo ejemplo
  // - Las predicciones se hacen en tiempo real con "Probar"
  // - Los datos persisten en localStorage para futuras sesiones

  async function initAIModule() {
    try {
      await AI.inicializarModelo({ vocabSize: 40 });
      aiReady = true;
      console.log('AI modular listo para entrenar y predecir');
    } catch (err) {
      console.warn('Error inicializando AI:', err.message || err);
    }
  }

  // Agrega un ejemplo y entrena el modelo automáticamente
  async function entrenarModelo(texto, etiqueta) {
    if (!aiReady) {
      await initAIModule();
    }
    await AI.entrenarModelo(texto, etiqueta);
    console.log('Modelo AI entrenado con nuevo ejemplo:', { texto, etiqueta });
  }

  // Predice la etiqueta de un texto
  async function predecirTexto(texto) {
    if (!aiReady) {
      await initAIModule();
    }
    const result = await AI.predecir(texto);
    console.log('Predicción AI:', result);
    return result;
  }

  async function loadExams() {
    loading = true;
    try { exams = await apiGetExams(); }
    catch { alert('Error al cargar los exámenes'); }
    finally { loading = false; render(); }
  }

  function resetForm() {
    title = ''; code = ''; dur = 30; questions = []; selectedExam = null;
    qtext = ''; optionsRaw = 'Opción A;Opción B'; correctIndex = 0; showCorrectAnswers = false;
  }

  function openExam(exam) {
    selectedExam = exam; title = exam.title; code = exam.code; dur = exam.durationMinutes;
    questions = exam.questions || []; showCorrectAnswers = exam.showCorrectAnswers || false;
    activeTab = 'crear'; render();
  }

  async function saveExam() {
    if (!title.trim() || !code.trim() || questions.length === 0) {
      return alert('Completa todos los campos y agrega al menos una pregunta');
    }
    saving = true; render();
    try {
      const examData = {
        title: title.trim(), code: code.trim().toUpperCase(),
        durationMinutes: Number(dur), questions, showCorrectAnswers,
        teacherId: user?.uid || user?.email
      };
      if (selectedExam) {
        await apiUpdateExam(selectedExam.id, examData);
        alert('✅ Examen actualizado exitosamente');
      } else {
        if (exams.find(e => e.code.toUpperCase() === code.trim().toUpperCase())) {
          alert('❌ Ya existe un examen con ese código'); saving = false; render(); return;
        }
        await apiCreateExam(examData);
        alert('✅ Examen creado exitosamente');
      }
      await loadExams();
      resetForm(); activeTab = 'lista';
    } catch(err) {
      alert('❌ ' + (err.response?.data?.error || err.message || 'Error al guardar'));
    } finally { saving = false; render(); }
  }

  async function deleteExam(exam) {
    if (!confirm(`¿Eliminar el examen "${exam.title}"? Esta acción no se puede deshacer.`)) return;
    try {
      await apiDeleteExam(exam.id);
      alert('✅ Examen eliminado');
      if (selectedExam?.id === exam.id) resetForm();
      await loadExams();
    } catch { alert('❌ Error al eliminar el examen'); }
  }

  function addQuestion() {
    if (!qtext.trim()) return alert('La pregunta está vacía');
    const q = { id: crypto.randomUUID(), text: qtext.trim(), type: qtype };
    if (qtype === 'mc') {
      const opts = optionsRaw.split(';').map(o => o.trim()).filter(Boolean);
      if (opts.length < 2) return alert('Mínimo 2 opciones');
      q.options = opts; q.correctIndex = Number(correctIndex);
    }
    questions.push(q); qtext = ''; optionsRaw = 'Opción A;Opción B'; correctIndex = 0;
    render();
  }

  function render() {
    const filtered = exams.filter(e => (e.code + e.title).toLowerCase().includes(filter.toLowerCase()));
    const opts = optionsRaw.split(';').map(o => o.trim()).filter(Boolean);

    app.innerHTML = `
      <div class="tabs">
        <button class="tab${activeTab==='crear'?' active':''}" id="tab-crear">
          ${selectedExam ? '✏️ Editando examen' : '➕ Crear examen'}
        </button>
        <button class="tab${activeTab==='lista'?' active':''}" id="tab-lista">
          📋 Registro (${exams.length})
        </button>
        <button class="tab${activeTab==='ai'?' active':''}" id="tab-ai">
          Entrenamiento IA
        </button>
        <button class="tab" id="tab-resultados">📊 Resultados</button>
        <button class="tab" id="tab-monitor">📡 Monitoreo en Tiempo Real</button>
      </div>

      ${activeTab === 'crear' ? `
        <div class="card">
          <div class="flex-between mb-3">
            <h2 class="font-bold" style="font-size:1.2rem">
              ${selectedExam ? `✏️ Editando: <span class="text-blue">${selectedExam.title}</span>` : '➕ Nuevo examen'}
            </h2>
            ${selectedExam ? `<button class="btn btn-outline text-sm" id="cancel-edit">❌ Cancelar edición</button>` : ''}
          </div>

          <div class="grid-3-md space-y" style="margin-bottom:.75rem">
            <input class="input" id="f-title" placeholder="Título del examen" value="${title}"/>
            <input class="input" id="f-code" placeholder="Código (ej: ABC123)" value="${code}" ${selectedExam ? 'disabled' : ''} style="text-transform:uppercase"/>
            <input class="input" id="f-dur" type="number" placeholder="Duración (min)" value="${dur}" min="1"/>
          </div>
          ${selectedExam ? `<p class="text-xs text-gray mb-2">💡 No puedes cambiar el código de un examen existente</p>` : ''}

          <div class="info-box info-box-blue mt-3 mb-3">
            <label style="display:flex;align-items:center;gap:.75rem;cursor:pointer">
              <input type="checkbox" id="f-show-answers" ${showCorrectAnswers ? 'checked' : ''} style="width:1.1rem;height:1.1rem"/>
              <div>
                <p class="font-bold text-sm">Mostrar respuestas correctas al estudiante</p>
                <p class="text-xs" style="margin-top:.2rem">Si activas esta opción, el estudiante verá las respuestas correctas al finalizar</p>
              </div>
            </label>
          </div>

          <!-- Add question -->
          <div class="info-box" style="background:#f8fafc;border:1px solid #e2e8f0;margin-bottom:1rem">
            <h3 class="font-bold mb-2">➕ Agregar pregunta</h3>
            <input class="input mb-2" id="f-qtext" placeholder="Texto de la pregunta" value="${qtext}"/>
            <select class="input mb-2" id="f-qtype">
              <option value="mc" ${qtype==='mc'?'selected':''}>Opción múltiple</option>
              <option value="open" ${qtype==='open'?'selected':''}>Pregunta abierta</option>
            </select>
            ${qtype === 'mc' ? `
              <div style="background:#fff;border:1px solid #e2e8f0;border-radius:.5rem;padding:.75rem;margin-bottom:.5rem">
                <label class="label text-sm">Opciones (separadas por punto y coma)</label>
                <input class="input mb-2" id="f-opts" value="${optionsRaw}" placeholder="Opción A;Opción B;Opción C"/>
                <p class="text-sm font-bold mb-1">Respuesta correcta:</p>
                ${opts.map((opt, i) => `
                  <label style="display:flex;align-items:center;gap:.5rem;margin-bottom:.35rem;cursor:pointer">
                    <input type="radio" name="correct" value="${i}" ${correctIndex==i?'checked':''} id="correct-${i}"/>
                    <span class="text-sm">${opt}</span>
                  </label>
                `).join('')}
              </div>
            ` : ''}
            <button class="btn btn-outline" id="add-q-btn">➕ Agregar pregunta</button>
          </div>

          <!-- Questions list -->
          ${questions.length > 0 ? `
            <div class="mb-3">
              <h3 class="font-bold mb-2">📝 Preguntas (${questions.length})</h3>
              <div class="space-y">
                ${questions.map((q, idx) => `
                  <div class="info-box info-box-blue" style="display:flex;justify-content:space-between;align-items:flex-start">
                    <div style="flex:1">
                      <p class="font-bold text-sm">${idx+1}. ${q.text}</p>
                      ${q.type === 'mc' ? `
                        <ul style="list-style:none;margin-top:.35rem;margin-left:1rem">
                          ${q.options.map((o,i) => `<li class="text-xs ${i===q.correctIndex?'text-green font-bold':''}">${i===q.correctIndex?'✅ ':''}${o}</li>`).join('')}
                        </ul>
                      ` : `<p class="text-xs text-gray mt-1">Pregunta abierta</p>`}
                    </div>
                    <button class="btn btn-danger text-xs" style="padding:.3rem .6rem;margin-left:.75rem" data-del="${q.id}">🗑️</button>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <button class="btn btn-primary btn-full" id="save-btn" ${saving || questions.length===0 ? 'disabled' : ''}>
            ${saving ? '⏳ Guardando...' : (selectedExam ? '💾 Guardar cambios' : '✅ Crear examen')}
          </button>
        </div>
      ` : ''}

      ${activeTab === 'lista' ? `
        <div class="card">
          <div class="flex-between mb-3">
            <h2 class="font-bold" style="font-size:1.2rem">📋 Registro de exámenes</h2>
            <div class="flex-row">
              <input class="input" id="f-filter" placeholder="Buscar..." value="${filter}" style="width:180px"/>
              <button class="btn btn-outline text-sm" id="toggle-reg">${showRegistry ? '👁️ Ocultar' : '👁️ Mostrar'}</button>
            </div>
          </div>
          ${loading ? `<div class="text-center" style="padding:2.5rem"><div class="spinner"></div><p class="text-gray mt-3">Cargando...</p></div>` :
            showRegistry ? `
              <div class="overflow-x">
                <table>
                  <thead><tr>
                    <th>Código</th><th>Título</th><th>Duración</th><th>Preguntas</th><th>Config</th><th>Acciones</th>
                  </tr></thead>
                  <tbody>
                    ${filtered.length === 0 ? `<tr><td colspan="6" class="text-center text-gray" style="padding:2rem">${filter ? 'No se encontraron exámenes' : 'No hay exámenes registrados'}</td></tr>` :
                      filtered.map(e => `
                        <tr>
                          <td class="font-mono font-bold text-blue">${e.code}</td>
                          <td>${e.title}</td>
                          <td>${e.durationMinutes} min</td>
                          <td>${e.questions?.length || 0}</td>
                          <td>${e.showCorrectAnswers
                            ? `<span class="badge badge-green">✅ Muestra respuestas</span>`
                            : `<span class="badge badge-gray">🔒 Oculta respuestas</span>`}
                          </td>
                          <td>
                            <div class="flex-row">
                              <button class="btn btn-outline text-xs" data-edit="${e.id}">✏️ Editar</button>
                              <button class="btn btn-danger text-xs" data-del-exam="${e.id}">🗑️</button>
                            </div>
                          </td>
                        </tr>
                      `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}
        </div>
      ` : ''}

      ${activeTab === 'ai' ? `
        <div class="card">
          <h2 class="font-bold mb-3" style="font-size:1.2rem">Entrenamiento IA</h2>
          <p class="text-sm text-gray mb-3">Entrena manualmente una red neuronal para clasificar respuestas como correctas o incorrectas.</p>

          <div class="info-box mb-3">
            <h3 class="font-bold mb-2">📚 Entrenar modelo</h3>
            <input class="input mb-2" id="ai-text" placeholder="Ingresa una respuesta de estudiante" value="${aiText}"/>
            <select class="input mb-2" id="ai-label">
              <option value="correcto" ${aiLabel==='correcto'?'selected':''}>✅ Correcto</option>
              <option value="incorrecto" ${aiLabel==='incorrecto'?'selected':''}>❌ Incorrecto</option>
            </select>
            <button class="btn btn-primary" id="train-ai" ${aiTraining ? 'disabled' : ''}>
              ${aiTraining ? '⏳ Entrenando...' : '🚀 Entrenar'}
            </button>
          </div>

          <div class="info-box">
            <h3 class="font-bold mb-2">🔮 Probar modelo</h3>
            <input class="input mb-2" id="ai-predict" placeholder="Texto a probar" value="${aiPredictText}"/>
            <button class="btn btn-outline" id="predict-ai">🔍 Probar</button>
            ${aiResult ? `
              <div class="mt-3 p-3 bg-gray-50 rounded">
                <p class="font-bold text-sm">Resultado:</p>
                <p class="text-sm">Texto: "${aiResult.text}"</p>
                <p class="text-sm">Predicción: <span class="font-bold ${aiResult.predictedLabel === 'correcto' ? 'text-green' : 'text-red'}">${aiResult.predictedLabel}</span></p>
                <p class="text-sm">Puntuaciones:</p>
                <ul class="text-xs">
                  ${aiResult.scores.map(s => `<li>${s.label}: ${s.score}</li>`).join('')}
                </ul>
              </div>
            ` : ''}
          </div>
        </div>
      ` : ''}
    `;

    // Tab events
    document.getElementById('tab-crear').onclick = () => { activeTab = 'crear'; if (!selectedExam) resetForm(); render(); };
    document.getElementById('tab-lista').onclick = () => { activeTab = 'lista'; render(); };
    document.getElementById('tab-ai').onclick = () => { activeTab = 'ai'; render(); };
    document.getElementById('tab-resultados').onclick = () => navigate('/resultados');
    document.getElementById('tab-monitor').onclick = () => navigate('/monitor');

    if (activeTab === 'crear') {
      document.getElementById('f-title').oninput = e => { title = e.target.value; };
      document.getElementById('f-code').oninput = e => { code = e.target.value.toUpperCase(); e.target.value = code; };
      document.getElementById('f-dur').oninput = e => { dur = e.target.value; };
      document.getElementById('f-show-answers').onchange = e => { showCorrectAnswers = e.target.checked; };
      document.getElementById('f-qtext').oninput = e => { qtext = e.target.value; };
      document.getElementById('f-qtype').onchange = e => { qtype = e.target.value; render(); };
      if (qtype === 'mc') {
        document.getElementById('f-opts').oninput = e => { optionsRaw = e.target.value; render(); };
        opts.forEach((_, i) => {
          const r = document.getElementById(`correct-${i}`);
          if (r) r.onchange = () => { correctIndex = i; };
        });
      }
      document.getElementById('add-q-btn').onclick = addQuestion;
      document.getElementById('save-btn').onclick = saveExam;
      if (selectedExam) document.getElementById('cancel-edit').onclick = () => { resetForm(); render(); };
      document.querySelectorAll('[data-del]').forEach(btn => {
        btn.onclick = () => { questions = questions.filter(q => q.id !== btn.dataset.del); render(); };
      });
    }

    if (activeTab === 'lista') {
      document.getElementById('f-filter').oninput = e => { filter = e.target.value; render(); };
      document.getElementById('toggle-reg').onclick = () => { showRegistry = !showRegistry; render(); };
      document.querySelectorAll('[data-edit]').forEach(btn => {
        btn.onclick = () => { const e = exams.find(x => x.id === btn.dataset.edit); if (e) openExam(e); };
      });
      document.querySelectorAll('[data-del-exam]').forEach(btn => {
        btn.onclick = () => { const e = exams.find(x => x.id === btn.dataset.delExam); if (e) deleteExam(e); };
      });
    }

    if (activeTab === 'ai') {
      document.getElementById('ai-text').oninput = e => { aiText = e.target.value; };
      document.getElementById('ai-label').onchange = e => { aiLabel = e.target.value; };
      document.getElementById('train-ai').onclick = async () => {
        if (!aiText.trim()) return alert('El texto no puede estar vacío');
        if (!aiLabel) return alert('Selecciona una etiqueta');
        aiTraining = true; render();
        try {
          await entrenarModelo(aiText.trim(), aiLabel);
          alert('✅ Modelo entrenado exitosamente con el nuevo ejemplo');
          aiText = ''; aiLabel = '';
        } catch (err) {
          alert('❌ Error entrenando: ' + (err.message || err));
        } finally {
          aiTraining = false; render();
        }
      };
      document.getElementById('ai-predict').oninput = e => { aiPredictText = e.target.value; };
      document.getElementById('predict-ai').onclick = async () => {
        if (!aiPredictText.trim()) return alert('El texto a probar no puede estar vacío');
        try {
          aiResult = await predecirTexto(aiPredictText.trim());
          render();
        } catch (err) {
          alert('❌ Error probando: ' + (err.message || err));
        }
      };
  }

  // Errores corregidos:
  // - Agregada validación de usuario para evitar acceso no autorizado a la vista del profesor
  // - Mejorada la estructura del código con validaciones y manejo de errores
  // - Interfaz reorganizada para mejor usabilidad y claridad
  // - Código más robusto y listo para escalar con futuras funcionalidades

  loadExams();
  initAIModule();
}
