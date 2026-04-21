function renderStudent(app) {
  // ===== STATE =====
  let exam = null, ans = {}, timer = 0, fin = false;
  let loading = false, submitting = false, isBlocked = false;
  let blockReason = '', violations = [], blockMessage = '';
  let intervalId = null, statusIntervalId = null;
  let isExamActive = false, hasSubmitted = false;
  let isCurrentlyBlocked = false, justBlocked = false, listenerInit = false;
  let unsubscribeBlock = null;
  const user = getUser() || {};

  // Pre-fill code for guests
  const guestCode = user.isGuest ? user.examCode : '';

  function renderText(v) {
    if (v == null) return '';
    if (typeof v === 'object') { try { return JSON.stringify(v); } catch { return String(v); } }
    return String(v);
  }

  function fmt(s) {
    const m = Math.floor(s / 60), sec = s % 60;
    return `${m}:${String(sec).padStart(2,'0')}`;
  }

  // ===== SCREENS =====
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
              <li>• El profesor verá tus acciones instantáneamente</li>
              <li>• No presiones Escape ni salgas de pantalla completa</li>
              <li>• Si te bloquean, solo el profesor puede desbloquearte</li>
            </ul>
          </div>
        </div>
      </div>
    `;
    const codeInput = document.getElementById('exam-code');
    codeInput.oninput = () => { codeInput.value = codeInput.value.toUpperCase(); };
    codeInput.onkeypress = (e) => { if (e.key === 'Enter') joinExam(); };
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
      if (res.ok && res.exam) {
        exam = res.exam; ans = {}; violations = []; isBlocked = false;
        isCurrentlyBlocked = false; hasSubmitted = false; justBlocked = false; listenerInit = false;
        startExam();
      } else {
        alert('❌ Código inválido');
        if (btn) { btn.disabled = false; btn.textContent = 'Ingresar'; }
      }
    } catch(err) {
      alert('❌ ' + (err.response?.data?.error || err.message));
      if (btn) { btn.disabled = false; btn.textContent = 'Ingresar'; }
    }
  }

  function startExam() {
    timer = (exam.durationMinutes || 0) * 60;
    registerActiveStudent(exam.code, {
      uid: user.uid || user.email, email: user.email, name: user.name, timeLeft: timer
    }).catch(console.error);

    // Listen block status
    unsubscribeBlock = listenToBlockStatus(exam.code, user.uid || user.email, (blocked, reason) => {
      if (!listenerInit) { listenerInit = true; return; }
      if (justBlocked) return;
      if (blocked && !isCurrentlyBlocked) {
        isCurrentlyBlocked = true; isExamActive = false;
        isBlocked = true; blockReason = renderText(reason || 'Bloqueado por el profesor');
        if (intervalId) { clearInterval(intervalId); intervalId = null; }
        showBlocked();
      } else if (!blocked && isCurrentlyBlocked) {
        isCurrentlyBlocked = false; isBlocked = false; blockReason = '';
        try { alert('✅ Has sido desbloqueado por el profesor. Puedes continuar, pero ten más cuidado.'); } catch {}
        if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(()=>{});
        isExamActive = true;
        if (!intervalId && timer > 0) startTimer();
        showExam();
      }
    });

    // Status update interval
    statusIntervalId = setInterval(() => {
      const answeredCount = Object.keys(ans).filter(k => ans[k] !== undefined && ans[k] !== '').length;
      updateStudentStatus(exam.code, user.uid || user.email, {
        timeLeft: timer, answeredCount, violations: violations.length, lastActivity: Date.now()
      }).catch(console.error);
    }, 5000);

    // Fullscreen
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(()=>{});
    }

    startTimer();
    armAntiFraud();
    showExam();
  }

  function startTimer() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
      timer--;
      updateTimerDisplay();
      if (timer <= 0) {
        clearInterval(intervalId); intervalId = null;
        if (!hasSubmitted) finishExam(true);
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const el = document.getElementById('exam-timer');
    if (el) el.textContent = fmt(timer);
    const answered = Object.keys(ans).filter(k => ans[k] !== undefined && ans[k] !== '').length;
    const total = exam.questions?.length || 0;
    const fill = document.getElementById('progress-fill');
    if (fill) fill.style.width = `${total ? (answered/total)*100 : 0}%`;
    const prog = document.getElementById('progress-text');
    if (prog) prog.textContent = `${answered} de ${total} respondidas`;
  }

  // ===== ANTI-FRAUD =====
  function armAntiFraud() {
    isExamActive = true;

    const onKey = (e) => {
      if (!isExamActive) return;
      if (e.key === 'Escape') { e.preventDefault(); blockExam('Presionaste Escape para salir de pantalla completa'); }
      else if (e.key === 'Meta' || e.metaKey) { e.preventDefault(); blockExam('Presionaste la tecla Windows'); }
      else if (e.altKey && e.key === 'Tab') { e.preventDefault(); blockExam('Intentaste cambiar de ventana (Alt+Tab)'); }
      else if (e.ctrlKey && e.shiftKey && e.key === 'Escape') { e.preventDefault(); blockExam('Intentaste abrir el Administrador de Tareas'); }
      else if (e.key === 'F11') { e.preventDefault(); blockExam('Intentaste cambiar pantalla completa con F11'); }
      else if (e.key === 'F12') { e.preventDefault(); blockExam('Intentaste abrir DevTools (F12)'); }
      else if (e.key === 'PrintScreen') { e.preventDefault(); blockExam('Intentaste tomar una captura de pantalla'); }
      else if (e.ctrlKey && e.key === 'p') { e.preventDefault(); blockExam('Intentaste imprimir (Ctrl+P)'); }
    };
    const onBlur = () => { if (isExamActive) blockExam('Saliste de la ventana del examen'); };
    const onVis = () => { if (isExamActive && document.hidden) blockExam('Cambiaste de pestaña o minimizaste el navegador'); };
    const onFS = () => { if (isExamActive && !document.fullscreenElement) blockExam('Saliste del modo pantalla completa'); };
    const onCtx = (e) => { if (isExamActive) { e.preventDefault(); addViolation('Intentaste abrir el menú contextual'); } };

    document.addEventListener('keydown', onKey, true);
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVis);
    document.addEventListener('fullscreenchange', onFS);
    document.addEventListener('contextmenu', onCtx);

    // Store for cleanup
    window._examCleanup = () => {
      document.removeEventListener('keydown', onKey, true);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVis);
      document.removeEventListener('fullscreenchange', onFS);
      document.removeEventListener('contextmenu', onCtx);
    };

    // Cleanup on page unload
    window.onbeforeunload = () => {
      if (exam && !fin) removeActiveStudent(exam.code, user.uid || user.email).catch(()=>{});
    };
  }

  async function blockExam(reason) {
    if (isCurrentlyBlocked || fin || hasSubmitted) return;
    isCurrentlyBlocked = true; justBlocked = true; isExamActive = false;
    isBlocked = true; blockReason = renderText(reason);
    addViolation(reason);
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
    try { await blockStudent(exam.code, user.uid || user.email, reason); } catch {}
    setTimeout(() => { justBlocked = false; }, 3000);
    showBlocked();
  }

  async function addViolation(reason) {
    violations.push({ reason, timestamp: new Date().toISOString() });
    try {
      await updateStudentStatus(exam.code, user.uid || user.email, {
        violations: violations.length, lastViolation: reason
      });
    } catch {}
  }

  async function finishExam(forced) {
    if (!exam || hasSubmitted || submitting) return;
    hasSubmitted = true; submitting = true; isExamActive = false;
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
    if (statusIntervalId) { clearInterval(statusIntervalId); statusIntervalId = null; }
    if (window._examCleanup) { window._examCleanup(); window._examCleanup = null; }
    if (unsubscribeBlock) { try { unsubscribeBlock(); } catch {} unsubscribeBlock = null; }

    try { await removeActiveStudent(exam.code, user.uid || user.email); } catch {}

    const submission = {
      examId: exam.id, code: exam.code, title: exam.title,
      studentEmail: user.email || 'anónimo', studentName: user.name || 'Estudiante',
      submittedAt: new Date().toISOString(), answers: ans,
      violations, wasBlocked: isBlocked, blockReason: blockReason || null, forced
    };

    try {
      await apiCreateSubmission(submission);
      fin = true;
      if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
      showSuccess();
      setTimeout(() => resetExam(), 3000);
    } catch(err) {
      hasSubmitted = false; submitting = false;
      alert('❌ Error al enviar el examen');
    }
  }

  function resetExam() {
    if (exam && user) removeActiveStudent(exam.code, user.uid || user.email).catch(()=>{});
    exam = null; ans = {}; timer = 0; fin = false; isBlocked = false;
    blockReason = ''; violations = []; hasSubmitted = false; isExamActive = false;
    isCurrentlyBlocked = false; justBlocked = false; listenerInit = false;
    if (intervalId) { clearInterval(intervalId); intervalId = null; }
    if (statusIntervalId) { clearInterval(statusIntervalId); statusIntervalId = null; }
    if (unsubscribeBlock) { try { unsubscribeBlock(); } catch {} unsubscribeBlock = null; }
    if (window._examCleanup) { window._examCleanup(); window._examCleanup = null; }
    window.onbeforeunload = null;
    showJoin();
  }

  // ===== RENDER SCREENS =====
  function showBlocked() {
    app.innerHTML = `
      <div class="blocked-screen">
        <div style="max-width:600px;width:100%">
          <div class="blocked-icon">🚫</div>
          <h1 style="font-size:clamp(2rem,6vw,3.5rem);font-weight:900;margin:.5rem 0">EXAMEN BLOQUEADO</h1>
          <div style="background:rgba(255,255,255,.2);backdrop-filter:blur(8px);padding:1.25rem;border-radius:1rem;margin:1rem 0;border:2px solid rgba(255,255,255,.3)">
            <p style="font-size:1.1rem;font-weight:700;margin-bottom:.5rem">Razón del bloqueo:</p>
            <p style="font-size:1rem">${renderText(blockReason)}</p>
          </div>
          ${violations.length > 0 ? `
            <div style="background:rgba(255,255,255,.1);padding:1rem;border-radius:.75rem;margin-bottom:1rem;text-align:left;max-height:180px;overflow-y:auto">
              <p style="font-weight:700;margin-bottom:.5rem">📋 Historial (${violations.length}):</p>
              ${violations.map((v,i) => `<div style="font-size:.85rem;background:rgba(255,255,255,.1);padding:.5rem;border-radius:.5rem;margin-bottom:.35rem"><b>${i+1}.</b> ${renderText(v.reason)}</div>`).join('')}
            </div>
          ` : ''}
          <button class="btn" id="msg-btn" style="background:#fff;color:#dc2626;font-size:1rem;padding:.85rem 2rem;margin-bottom:1rem;font-weight:700">
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
      <!-- Message Modal -->
      <div id="msg-modal" class="modal-overlay" style="display:none">
        <div class="modal-box" style="max-width:440px">
          <h3 class="font-bold" style="font-size:1.25rem;margin-bottom:.75rem">Enviar mensaje al profesor</h3>
          <p class="text-gray text-sm mb-3">Explica tu situación. El profesor recibirá tu mensaje en tiempo real.</p>
          <textarea class="input" id="msg-text" rows="5" placeholder="Escribe tu mensaje aquí..." style="resize:none"></textarea>
          <div class="flex-row mt-4">
            <button class="btn btn-outline" style="flex:1" id="msg-cancel">Cancelar</button>
            <button class="btn btn-primary" style="flex:1" id="msg-send">✅ Enviar</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById('msg-btn').onclick = () => {
      document.getElementById('msg-modal').style.display = 'flex';
    };
    document.getElementById('msg-cancel').onclick = () => {
      document.getElementById('msg-modal').style.display = 'none';
    };
    document.getElementById('msg-send').onclick = async () => {
      const msg = document.getElementById('msg-text').value.trim();
      if (!msg) { alert('Escribe un mensaje'); return; }
      try {
        await sendMessageToTeacher(exam.code, user.uid || user.email, msg);
        alert('✅ Mensaje enviado al profesor. Espera su respuesta.');
        document.getElementById('msg-modal').style.display = 'none';
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
    isExamActive = false;
    if (intervalId) clearInterval(intervalId);
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
              const answer = ans[q.id];
              const answered = answer !== undefined && answer !== '';
              return `
                <div class="${answered ? 'review-answered' : 'review-unanswered'}">
                  <p class="font-bold mb-1">${idx+1}. ${renderText(q.text)}</p>
                  ${q.type === 'mc' ? `<p class="text-sm" style="margin-left:1rem">${answered ? '✅ ' + renderText(q.options?.[answer]) : '❌ Sin responder'}</p>` : ''}
                  ${q.type === 'open' ? `<p class="text-sm" style="margin-left:1rem">${answered ? renderText(answer) : '❌ Sin responder'}</p>` : ''}
                </div>
              `;
            }).join('')}
          </div>
          <div class="flex-row mt-4">
            <button class="btn btn-outline" style="flex:1" id="back-btn2">← Seguir</button>
            <button class="btn btn-primary" style="flex:1" id="submit-btn" ${submitting ? 'disabled' : ''}>
              ${submitting ? 'Enviando...' : '✅ Enviar'}
            </button>
          </div>
        </div>
      </div>
    `;
    const backFn = () => {
      isExamActive = true;
      if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(()=>{});
      startTimer();
      showExam();
    };
    document.getElementById('back-btn').onclick = backFn;
    document.getElementById('back-btn2').onclick = backFn;
    document.getElementById('submit-btn').onclick = () => finishExam(false);
  }

  function showExam() {
    const questions = Array.isArray(exam.questions) ? exam.questions : [];
    const answered = Object.keys(ans).filter(k => ans[k] !== undefined && ans[k] !== '').length;
    const total = questions.length;

    app.innerHTML = `
      <div style="max-width:800px;margin:0 auto">
        <div class="exam-header">
          <div class="flex-between mb-3">
            <div>
              <h1 style="font-size:1.4rem;font-weight:800">${renderText(exam.title)}</h1>
              <p style="font-size:.85rem;opacity:.85">Código: ${renderText(exam.code)}</p>
            </div>
            <div style="text-align:right">
              <div class="exam-timer" id="exam-timer">${fmt(timer)}</div>
              <p style="font-size:.75rem;opacity:.75">Restante</p>
            </div>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" id="progress-fill" style="width:${total ? (answered/total)*100 : 0}%"></div>
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

    document.getElementById('review-btn').onclick = showReview;
    document.getElementById('submit-btn').onclick = () => finishExam(false);

    // Attach answer handlers
    questions.forEach(q => {
      if (q.type === 'mc' && q.options) {
        q.options.forEach((_, i) => {
          const radio = document.getElementById(`opt-${q.id}-${i}`);
          if (radio) radio.onchange = () => {
            ans[q.id] = i;
            // Update option styles
            q.options.forEach((__, j) => {
              const lbl = document.getElementById(`lbl-${q.id}-${j}`);
              if (lbl) lbl.className = `option-label${ans[q.id] === j ? ' selected' : ''}`;
            });
            updateTimerDisplay();
          };
        });
      }
      if (q.type === 'open') {
        const ta = document.getElementById(`open-${q.id}`);
        if (ta) ta.oninput = () => { ans[q.id] = ta.value; updateTimerDisplay(); };
      }
    });
  }

  function renderQuestion(q, idx) {
    const delay = idx * 0.05;
    return `
      <div class="card question-card" style="animation-delay:${delay}s">
        <p class="font-bold" style="font-size:1.05rem;margin-bottom:1rem">${idx+1}. ${renderText(q.text)}</p>
        ${q.type === 'mc' && q.options ? q.options.map((opt, i) => `
          <label id="lbl-${q.id}-${i}" class="option-label${ans[q.id] === i ? ' selected' : ''}">
            <input type="radio" id="opt-${q.id}-${i}" name="q-${q.id}" ${ans[q.id] === i ? 'checked' : ''} style="width:1.1rem;height:1.1rem"/>
            <span>${renderText(opt)}</span>
          </label>
        `).join('') : ''}
        ${q.type === 'open' ? `
          <textarea id="open-${q.id}" class="input" rows="4" placeholder="Escribe tu respuesta..."
            style="resize:none">${ans[q.id] || ''}</textarea>
        ` : ''}
      </div>
    `;
  }

  // ===== INIT =====
  showJoin();
}
