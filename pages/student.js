function renderStudent(app) {
  // ===== ESTADO =====
  let exam = null, answers = {}, timer = 0;
  let submitting = false, finished = false;
  let isBlocked = false, blockReason = '', violations = [];
  let examActive = false, submitted = false;
  let blockedLocally = false, blockDebounce = false, listenerReady = false;
  let timerInterval = null, statusInterval = null, unsubBlock = null;

  const user      = getUser() || {};
  const studentId = user.uid || user.email;
  const guestCode = user.isGuest ? user.examCode : '';

  // ===== PANTALLA: UNIRSE =====

  function showJoin() {
    app.innerHTML = `
      <div style="max-width:520px;margin:0 auto">
        <div class="card">
          <h2 class="font-bold text-center" style="font-size:1.5rem;margin-bottom:1rem">Unirse a un examen</h2>
          <div class="flex-row">
            <input class="input" id="exam-code" placeholder="Código del examen"
              value="${guestCode}" style="flex:1;font-family:monospace;font-size:1.1rem;text-transform:uppercase"/>
            <button class="btn btn-primary" id="join-btn">Ingresar</button>
          </div>
          <div class="info-box info-box-yellow mt-4">
            <p class="font-bold mb-1">⚠️ Advertencias</p>
            <ul class="text-sm space-y-sm">
              <li>• Serás monitoreado en tiempo real</li>
              <li>• No salgas de la ventana del examen</li>
              <li>• No presiones Escape ni salgas de pantalla completa</li>
              <li>• Si te bloquean, solo el profesor puede desbloquearte</li>
            </ul>
          </div>
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
    const code = document.getElementById('exam-code')?.value?.trim().toUpperCase();
    if (!code) { alert('Por favor ingresa un código'); return; }

    const btn = document.getElementById('join-btn');
    if (btn) { btn.disabled = true; btn.textContent = 'Buscando...'; }

    try {
      const res = await apiGetExamByCode(code);
      if (res?.ok && res.exam) {
        exam = res.exam; answers = {}; violations = [];
        isBlocked = false; blockedLocally = false; submitted = false;
        blockDebounce = false; listenerReady = false;
        startExam();
      } else {
        alert('❌ Código inválido');
        if (btn) { btn.disabled = false; btn.textContent = 'Ingresar'; }
      }
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || err.message));
      if (btn) { btn.disabled = false; btn.textContent = 'Ingresar'; }
    }
  }

  // ===== INICIO DEL EXAMEN =====

  function startExam() {
    timer = (exam.durationMinutes || 0) * 60;

    registerActiveStudent(exam.code, {
      uid: studentId, email: user.email, name: user.name, timeLeft: timer
    }).catch(() => {});

    unsubBlock = listenToBlockStatus(exam.code, studentId, onBlockStatusChange);

    statusInterval = setInterval(syncStatus, 5000);

    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => {});
    }

    startTimer();
    armAntiFraud();
    showExam();
  }

  function onBlockStatusChange(blocked, reason) {
    if (!listenerReady) { listenerReady = true; return; }
    if (blockDebounce) return;

    if (blocked && !blockedLocally) {
      blockedLocally = true; examActive = false;
      isBlocked = true; blockReason = safeText(reason || 'Bloqueado por el profesor');
      clearTimerInterval();
      showBlocked();
    } else if (!blocked && blockedLocally) {
      blockedLocally = false; isBlocked = false; blockReason = '';
      alert('✅ Has sido desbloqueado. Puedes continuar, pero ten más cuidado.');
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      examActive = true;
      if (!timerInterval && timer > 0) startTimer();
      showExam();
    }
  }

  function syncStatus() {
    const answeredCount = countAnswered();
    updateStudentStatus(exam.code, studentId, {
      timeLeft: timer, answeredCount,
      violations: violations.length, lastActivity: Date.now()
    }).catch(() => {});
  }

  // ===== TIMER =====

  function startTimer() {
    clearTimerInterval();
    timerInterval = setInterval(() => {
      timer--;
      updateTimerDisplay();
      if (timer <= 0) {
        clearTimerInterval();
        if (!submitted) finishExam(true);
      }
    }, 1000);
  }

  function clearTimerInterval() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
  }

  function updateTimerDisplay() {
    const timerEl    = document.getElementById('exam-timer');
    const fillEl     = document.getElementById('progress-fill');
    const progressEl = document.getElementById('progress-text');
    const answered   = countAnswered();
    const total      = exam.questions?.length || 0;

    if (timerEl)    timerEl.textContent = fmt(timer);
    if (fillEl)     fillEl.style.width  = `${total ? (answered / total) * 100 : 0}%`;
    if (progressEl) progressEl.textContent = `${answered} de ${total} respondidas`;
  }

  function countAnswered() {
    return Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== '').length;
  }

  // ===== ANTIFRAUDE =====

  function armAntiFraud() {
    examActive = true;

    const BLOCKED_KEYS = {
      'Escape':      'Presionaste Escape para salir de pantalla completa',
      'F11':         'Intentaste cambiar pantalla completa con F11',
      'F12':         'Intentaste abrir DevTools (F12)',
      'PrintScreen': 'Intentaste tomar una captura de pantalla',
    };

    const onKey = (e) => {
      if (!examActive) return;
      if (BLOCKED_KEYS[e.key]) { e.preventDefault(); blockExam(BLOCKED_KEYS[e.key]); return; }
      if (e.key === 'Meta' || e.metaKey)                    { e.preventDefault(); blockExam('Presionaste la tecla Windows'); }
      else if (e.altKey && e.key === 'Tab')                 { e.preventDefault(); blockExam('Intentaste cambiar de ventana (Alt+Tab)'); }
      else if (e.ctrlKey && e.shiftKey && e.key === 'Escape') { e.preventDefault(); blockExam('Intentaste abrir el Administrador de Tareas'); }
      else if (e.ctrlKey && e.key === 'p')                  { e.preventDefault(); blockExam('Intentaste imprimir (Ctrl+P)'); }
    };

    const onBlur       = ()  => { if (examActive) blockExam('Saliste de la ventana del examen'); };
    const onVisibility = ()  => { if (examActive && document.hidden) blockExam('Cambiaste de pestaña o minimizaste el navegador'); };
    const onFullscreen = ()  => { if (examActive && !document.fullscreenElement) blockExam('Saliste del modo pantalla completa'); };
    const onContext    = (e) => { if (examActive) { e.preventDefault(); addViolation('Intentaste abrir el menú contextual'); } };

    document.addEventListener('keydown', onKey, true);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreen);
    document.addEventListener('contextmenu', onContext);

    window._examCleanup = () => {
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('contextmenu', onContext);
    };

    window.onbeforeunload = () => {
      if (exam && !finished) removeActiveStudent(exam.code, studentId).catch(() => {});
    };
  }

  async function blockExam(reason) {
    if (blockedLocally || finished || submitted) return;
    blockedLocally = true; blockDebounce = true; examActive = false;
    isBlocked = true; blockReason = safeText(reason);
    addViolation(reason);
    clearTimerInterval();
    try { await blockStudent(exam.code, studentId, reason); } catch {}
    setTimeout(() => { blockDebounce = false; }, 3000);
    showBlocked();
  }

  async function addViolation(reason) {
    violations.push({ reason, timestamp: new Date().toISOString() });
    try {
      await updateStudentStatus(exam.code, studentId, {
        violations: violations.length, lastViolation: reason
      });
    } catch {}
  }

  // ===== ENVÍO =====

  async function finishExam(forced) {
    if (!exam || submitted || submitting) return;
    submitted = true; submitting = true; examActive = false;

    clearTimerInterval();
    if (statusInterval) { clearInterval(statusInterval); statusInterval = null; }
    if (window._examCleanup) { window._examCleanup(); window._examCleanup = null; }
    if (unsubBlock) { try { unsubBlock(); } catch {} unsubBlock = null; }

    try { await removeActiveStudent(exam.code, studentId); } catch {}

    const submission = {
      examId: exam.id, code: exam.code, title: exam.title,
      studentEmail: user.email || 'anónimo', studentName: user.name || 'Estudiante',
      submittedAt: new Date().toISOString(),
      // Limpiar answers: eliminar undefined, convertir a objeto plano serializable
      answers: Object.fromEntries(
        Object.entries(answers).filter(([, v]) => v !== undefined && v !== '')
      ),
      violations, wasBlocked: isBlocked, blockReason: blockReason || null, forced
    };
    console.log('SUBMISSION a guardar:', JSON.stringify(submission, null, 2));

    try {
      await apiCreateSubmission(submission);
      finished = true;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      showSuccess();
      setTimeout(resetExam, 3000);
    } catch {
      submitted = false; submitting = false;
      alert('❌ Error al enviar el examen');
    }
  }

  function resetExam() {
    if (exam) removeActiveStudent(exam.code, studentId).catch(() => {});
    exam = null; answers = {}; timer = 0; finished = false;
    isBlocked = false; blockReason = ''; violations = [];
    submitted = false; examActive = false; blockedLocally = false;
    blockDebounce = false; listenerReady = false;
    clearTimerInterval();
    if (statusInterval) { clearInterval(statusInterval); statusInterval = null; }
    if (unsubBlock) { try { unsubBlock(); } catch {} unsubBlock = null; }
    if (window._examCleanup) { window._examCleanup(); window._examCleanup = null; }
    window.onbeforeunload = null;
    showJoin();
  }

  // ===== PANTALLAS =====

  function showBlocked() {
    app.innerHTML = `
      <div class="blocked-screen">
        <div style="max-width:600px;width:100%">
          <div class="blocked-icon">🚫</div>
          <h1 style="font-size:clamp(2rem,6vw,3.5rem);font-weight:900;margin:.5rem 0">EXAMEN BLOQUEADO</h1>
          <div style="background:rgba(255,255,255,.2);backdrop-filter:blur(8px);padding:1.25rem;border-radius:1rem;margin:1rem 0;border:2px solid rgba(255,255,255,.3)">
            <p style="font-size:1.1rem;font-weight:700;margin-bottom:.5rem">Razón del bloqueo:</p>
            <p style="font-size:1rem">${safeText(blockReason)}</p>
          </div>
          ${violations.length > 0 ? `
            <div style="background:rgba(255,255,255,.1);padding:1rem;border-radius:.75rem;margin-bottom:1rem;text-align:left;max-height:180px;overflow-y:auto">
              <p style="font-weight:700;margin-bottom:.5rem">📋 Historial (${violations.length}):</p>
              ${violations.map((v, i) => `
                <div style="font-size:.85rem;background:rgba(255,255,255,.1);padding:.5rem;border-radius:.5rem;margin-bottom:.35rem">
                  <b>${i + 1}.</b> ${safeText(v.reason)}
                </div>
              `).join('')}
            </div>
          ` : ''}
          <button class="btn" id="msg-btn"
            style="background:#fff;color:#dc2626;font-size:1rem;padding:.85rem 2rem;margin-bottom:1rem;font-weight:700">
            💬 Enviar mensaje al profesor
          </button>
          <div style="background:rgba(255,255,255,.1);padding:1rem;border-radius:.75rem;font-size:.8rem;text-align:left">
            <p style="font-weight:700;margin-bottom:.5rem">⚠️ INFORMACIÓN IMPORTANTE</p>
            <ul style="list-style:none;line-height:1.8">
              <li>• El profesor ha sido notificado automáticamente</li>
              <li>• Tu examen está pausado y guardado</li>
              <li>• Solo el profesor puede desbloquearte</li>
            </ul>
          </div>
        </div>
      </div>

      <div id="msg-modal" class="modal-overlay" style="display:none">
        <div class="modal-box" style="max-width:440px">
          <h3 class="font-bold" style="font-size:1.25rem;margin-bottom:.75rem">Enviar mensaje al profesor</h3>
          <p class="text-gray text-sm mb-3">Explica tu situación. El profesor lo recibirá en tiempo real.</p>
          <textarea class="input" id="msg-text" rows="5" placeholder="Escribe tu mensaje aquí..." style="resize:none"></textarea>
          <div class="flex-row mt-4">
            <button class="btn btn-outline" style="flex:1" id="msg-cancel">Cancelar</button>
            <button class="btn btn-primary" style="flex:1" id="msg-send">✅ Enviar</button>
          </div>
        </div>
      </div>
    `;

    const modal = document.getElementById('msg-modal');
    document.getElementById('msg-btn').onclick    = () => { modal.style.display = 'flex'; };
    document.getElementById('msg-cancel').onclick = () => { modal.style.display = 'none'; };
    document.getElementById('msg-send').onclick   = async () => {
      const msg = document.getElementById('msg-text').value.trim();
      if (!msg) { alert('Escribe un mensaje'); return; }
      try {
        await sendMessageToTeacher(exam.code, studentId, msg);
        alert('✅ Mensaje enviado. Espera la respuesta del profesor.');
        modal.style.display = 'none';
        document.getElementById('msg-text').value = '';
      } catch { alert('❌ Error al enviar el mensaje'); }
    };
  }

  function showSuccess() {
    app.innerHTML = `
      <div style="max-width:480px;margin:0 auto;text-align:center">
        <div class="success-screen">
          <div class="success-icon">✅</div>
          <h2 style="font-size:2.5rem;font-weight:800;margin:.75rem 0">¡Examen enviado!</h2>
          <p style="font-size:1.1rem;opacity:.9">Tus respuestas han sido guardadas</p>
        </div>
      </div>
    `;
  }

  function showReview() {
    examActive = false;
    clearTimerInterval();
    const questions = Array.isArray(exam.questions) ? exam.questions : [];

    app.innerHTML = `
      <div style="max-width:800px;margin:0 auto">
        <div class="card">
          <div class="flex-between mb-4">
            <h2 class="font-bold" style="font-size:1.4rem">📝 Revisar respuestas</h2>
            <button class="btn btn-outline" id="back-btn">← Volver</button>
          </div>
          <div class="space-y">
            ${questions.map((q, idx) => {
              const answer   = answers[q.id];
              const answered = answer !== undefined && answer !== '';
              return `
                <div class="${answered ? 'review-answered' : 'review-unanswered'}">
                  <p class="font-bold mb-1">${idx + 1}. ${safeText(q.text)}</p>
                  ${q.type === 'mc'
                    ? `<p class="text-sm" style="margin-left:1rem">${answered ? '✅ ' + safeText(q.options?.[answer]) : '❌ Sin responder'}</p>`
                    : `<p class="text-sm" style="margin-left:1rem">${answered ? safeText(answer) : '❌ Sin responder'}</p>`}
                </div>
              `;
            }).join('')}
          </div>
          <div class="flex-row mt-4">
            <button class="btn btn-outline" style="flex:1" id="back-btn2">← Seguir respondiendo</button>
            <button class="btn btn-primary" style="flex:1" id="submit-btn" ${submitting ? 'disabled' : ''}>
              ${submitting ? 'Enviando...' : '✅ Enviar examen'}
            </button>
          </div>
        </div>
      </div>
    `;

    const goBack = () => {
      examActive = true;
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      startTimer();
      showExam();
    };

    document.getElementById('back-btn').onclick  = goBack;
    document.getElementById('back-btn2').onclick = goBack;
    document.getElementById('submit-btn').onclick = () => finishExam(false);
  }

  function showExam() {
    const questions = Array.isArray(exam.questions) ? exam.questions : [];
    const answered  = countAnswered();
    const total     = questions.length;

    app.innerHTML = `
      <div style="max-width:800px;margin:0 auto">
        <div class="exam-header">
          <div class="flex-between mb-3">
            <div>
              <h1 style="font-size:1.4rem;font-weight:800">${safeText(exam.title)}</h1>
              <p style="font-size:.85rem;opacity:.85">Código: ${safeText(exam.code)}</p>
            </div>
            <div style="text-align:right">
              <div class="exam-timer" id="exam-timer">${fmt(timer)}</div>
              <p style="font-size:.75rem;opacity:.75">Restante</p>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill" style="width:${total ? (answered / total) * 100 : 0}%"></div>
          </div>
          <p style="font-size:.75rem;text-align:center;margin-top:.35rem;opacity:.85" id="progress-text">
            ${answered} de ${total} respondidas
          </p>
        </div>

        <div class="space-y" id="questions-container">
          ${questions.map((q, idx) => renderQuestion(q, idx)).join('')}
        </div>

        <div class="sticky-bar mt-4">
          <button class="btn btn-outline" style="flex:1" id="review-btn">📝 Revisar</button>
          <button class="btn btn-primary" style="flex:1" id="submit-btn" ${submitting ? 'disabled' : ''}>
            ${submitting ? 'Enviando...' : '✅ Enviar'}
          </button>
        </div>
      </div>
    `;

    document.getElementById('review-btn').onclick  = showReview;
    document.getElementById('submit-btn').onclick  = () => finishExam(false);

    questions.forEach(q => {
      if (q.type === 'mc' && q.options) {
        q.options.forEach((_, i) => {
          const radio = document.getElementById(`opt-${q.id}-${i}`);
          if (!radio) return;
          radio.onchange = () => {
            answers[q.id] = i;
            q.options.forEach((__, j) => {
              const lbl = document.getElementById(`lbl-${q.id}-${j}`);
              if (lbl) lbl.className = `option-label${answers[q.id] === j ? ' selected' : ''}`;
            });
            updateTimerDisplay();
          };
        });
      }
      if (q.type === 'open') {
        const ta = document.getElementById(`open-${q.id}`);
        if (ta) ta.oninput = () => { answers[q.id] = ta.value; updateTimerDisplay(); };
      }
    });
  }

  function renderQuestion(q, idx) {
    return `
      <div class="card question-card" style="animation-delay:${idx * 0.05}s">
        <p class="font-bold" style="font-size:1.05rem;margin-bottom:1rem">${idx + 1}. ${safeText(q.text)}</p>
        ${q.type === 'mc' && q.options ? q.options.map((opt, i) => `
          <label id="lbl-${q.id}-${i}" class="option-label${answers[q.id] === i ? ' selected' : ''}">
            <input type="radio" id="opt-${q.id}-${i}" name="q-${q.id}"
              ${answers[q.id] === i ? 'checked' : ''} style="width:1.1rem;height:1.1rem"/>
            <span>${safeText(opt)}</span>
          </label>
        `).join('') : ''}
        ${q.type === 'open' ? `
          <textarea id="open-${q.id}" class="input" rows="4"
            placeholder="Escribe tu respuesta..." style="resize:none">${answers[q.id] || ''}</textarea>
        ` : ''}
      </div>
    `;
  }

  // ===== INIT =====
  showJoin();
}
