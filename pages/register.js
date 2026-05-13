function renderRegister(app) {
  app.innerHTML = `
    <style>
      .reg-wrap {
        min-height: calc(100vh - var(--nav-height));
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        padding: 2rem 1.5rem;
        position: relative;
        overflow: hidden;
      }
      @media (max-width: 1024px) {
        .reg-wrap { grid-template-columns: 1fr; justify-items: center; }
        .reg-side  { display: none !important; }
      }
      .reg-side {
        display: flex; flex-direction: column;
        align-items: center; justify-content: center;
        gap: 1.75rem; padding: 2rem; height: 100%;
        max-height: 700px;
      }
      .reg-feat {
        background: rgba(255,255,255,.85);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(226,232,240,.8);
        border-radius: 1.25rem;
        padding: 1.25rem 1.4rem;
        width: 220px;
        box-shadow: 0 4px 20px rgba(0,0,0,.07);
        animation: floatCard ease-in-out infinite;
      }
      body.dark .reg-feat {
        background: rgba(22,27,34,.85);
        border-color: rgba(48,54,61,.8);
      }
      .reg-feat:nth-child(1) { animation-duration: 5s;   animation-delay: 0s; }
      .reg-feat:nth-child(2) { animation-duration: 6s;   animation-delay: -2s; }
      .reg-feat:nth-child(3) { animation-duration: 5.5s; animation-delay: -1s; }
      @keyframes floatCard {
        0%,100% { transform: translateY(0px); }
        50%      { transform: translateY(-10px); }
      }
      .reg-feat-icon {
        width: 2.5rem; height: 2.5rem; border-radius: .75rem;
        display: flex; align-items: center; justify-content: center;
        font-size: 1.1rem; margin-bottom: .65rem;
      }
      .reg-feat-title { font-size: .875rem; font-weight: 700; color: var(--text-primary); margin-bottom: .25rem; }
      .reg-feat-desc  { font-size: .75rem; color: var(--text-muted); line-height: 1.5; }
      .reg-stat {
        display: flex; align-items: center; gap: .75rem;
        background: rgba(255,255,255,.9);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(226,232,240,.7);
        border-radius: 999px;
        padding: .6rem 1.1rem;
        box-shadow: 0 2px 12px rgba(0,0,0,.06);
        animation: floatCard ease-in-out infinite;
        width: fit-content;
      }
      body.dark .reg-stat { background: rgba(22,27,34,.9); border-color: rgba(48,54,61,.7); }
      .reg-stat:nth-child(2) { animation-duration: 4.5s; animation-delay: -0.5s; }
      .reg-stat:nth-child(4) { animation-duration: 5.5s; animation-delay: -2.5s; }
      .reg-stat-dot { width: .55rem; height: .55rem; border-radius: 50%; animation: pulseDot 1.5s infinite; }
      @keyframes pulseDot {
        0%,100% { opacity:1; } 50% { opacity:.5; }
      }
      .reg-stat-val { font-size: .95rem; font-weight: 800; color: var(--text-primary); }
      .reg-stat-lbl { font-size: .72rem; color: var(--text-muted); }
      .auth-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-2xl);
        padding: 2.5rem 2.25rem;
        width: 100%; max-width: 460px;
        box-shadow: 0 4px 24px rgba(0,0,0,.07), 0 1px 4px rgba(0,0,0,.04);
        animation: cardIn .3s cubic-bezier(.4,0,.2,1) both;
        position: relative; z-index: 1;
      }
      body.dark .auth-card { background: var(--surface-raised); border-color: var(--border-strong); }
      .auth-title {
        font-size: 1.6rem; font-weight: 800; letter-spacing: -.025em;
        color: var(--text-primary); text-align: center; margin-bottom: .3rem;
      }
      .auth-sub { text-align: center; color: var(--text-muted); font-size: .875rem; margin-bottom: 2rem; }
      .auth-divider {
        display: flex; align-items: center; gap: .75rem;
        margin: 1.25rem 0; color: var(--text-muted);
        font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .07em;
      }
      .auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
      body.dark .auth-divider::before, body.dark .auth-divider::after { background: var(--border-strong); }
      .auth-footer { text-align: center; margin-top: 1.5rem; font-size: .875rem; color: var(--text-muted); }
      .auth-footer a { color: var(--blue-600); font-weight: 600; text-decoration: none; }
      .auth-footer a:hover { text-decoration: underline; }
      body.dark .auth-footer a { color: var(--blue-300); }
      .role-selector { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; margin-top: .4rem; }
      .role-option {
        border: 2px solid var(--border-strong); border-radius: var(--radius-lg);
        padding: .85rem .75rem; cursor: pointer; transition: all .18s;
        text-align: center; background: var(--surface);
      }
      .role-option:hover { border-color: var(--blue-400); background: var(--blue-50); }
      .role-option.selected { border-color: var(--blue-600); background: var(--blue-50); box-shadow: 0 0 0 1px var(--blue-600); }
      body.dark .role-option { background: var(--gray-900); border-color: var(--gray-700); }
      body.dark .role-option:hover { border-color: var(--blue-500); background: rgba(37,99,235,.08); }
      body.dark .role-option.selected { border-color: var(--blue-500); background: rgba(37,99,235,.12); }
      .role-option i { font-size: 1.4rem; display: block; margin-bottom: .4rem; }
      .role-option span { font-size: .85rem; font-weight: 600; color: var(--text-primary); }
    </style>

    <div class="reg-wrap">

      <!-- Panel izquierdo -->
      <div class="reg-side">
        <div class="reg-feat">
          <div class="reg-feat-icon" style="background:#dbeafe">
            <i class="fa-solid fa-shield-halved" style="color:#2563eb"></i>
          </div>
          <div class="reg-feat-title">Antifraude 100%</div>
          <div class="reg-feat-desc">Monitoreo en tiempo real con detección automática de infracciones.</div>
        </div>

        <div class="reg-stat">
          <span class="reg-stat-dot" style="background:#22c55e"></span>
          <div>
            <div class="reg-stat-val">En vivo</div>
            <div class="reg-stat-lbl">Monitoreo activo</div>
          </div>
        </div>

        <div class="reg-feat">
          <div class="reg-feat-icon" style="background:#f3e8ff">
            <i class="fa-solid fa-robot" style="color:#7c3aed"></i>
          </div>
          <div class="reg-feat-title">IA Integrada</div>
          <div class="reg-feat-desc">Genera preguntas automáticamente con inteligencia artificial.</div>
        </div>

        <svg width="160" height="80" viewBox="0 0 160 80" fill="none" style="opacity:.3">
          <circle cx="20" cy="40" r="15" stroke="#2563eb" stroke-width="1.5" stroke-dasharray="4 3">
            <animateTransform attributeName="transform" type="rotate" values="0 20 40;360 20 40" dur="12s" repeatCount="indefinite"/>
          </circle>
          <circle cx="80" cy="20" r="10" stroke="#7c3aed" stroke-width="1.5" stroke-dasharray="3 3">
            <animateTransform attributeName="transform" type="rotate" values="360 80 20;0 80 20" dur="9s" repeatCount="indefinite"/>
          </circle>
          <circle cx="140" cy="55" r="18" stroke="#2563eb" stroke-width="1" stroke-dasharray="5 4">
            <animateTransform attributeName="transform" type="rotate" values="0 140 55;360 140 55" dur="15s" repeatCount="indefinite"/>
          </circle>
        </svg>
      </div>

      <!-- Formulario central -->
      <div class="auth-card">
        <div style="display:flex;justify-content:center;margin-bottom:1.5rem">
          <svg width="110" height="110" viewBox="0 0 110 110" fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style="filter:drop-shadow(0 8px 24px rgba(124,58,237,.3))">
            <defs>
              <linearGradient id="rgBg" x1="0" y1="0" x2="110" y2="110" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#4c1d95"/>
                <stop offset="100%" stop-color="#7c3aed"/>
              </linearGradient>
              <linearGradient id="rgUser" x1="20" y1="20" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#c4b5fd"/>
                <stop offset="100%" stop-color="#ffffff"/>
              </linearGradient>
              <linearGradient id="rgPlus" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#34d399"/>
                <stop offset="100%" stop-color="#10b981"/>
              </linearGradient>
            </defs>
            <circle cx="55" cy="55" r="50" fill="url(#rgBg)">
              <animate attributeName="r" values="50;52;50" dur="3.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="55" cy="55" r="50" stroke="#a78bfa" stroke-width="1.5" fill="none" opacity="0">
              <animate attributeName="r" values="50;68;68" dur="2.8s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.5;0;0" dur="2.8s" repeatCount="indefinite"/>
            </circle>
            <circle cx="55" cy="55" r="50" stroke="#7c3aed" stroke-width="1" fill="none" opacity="0">
              <animate attributeName="r" values="50;68;68" dur="2.8s" begin="1.4s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.3;0;0" dur="2.8s" begin="1.4s" repeatCount="indefinite"/>
            </circle>
            <circle cx="55" cy="38" r="13" fill="url(#rgUser)">
              <animate attributeName="r" values="13;14;13" dur="2s" repeatCount="indefinite"/>
            </circle>
            <path d="M28 80 c0-15 12-24 27-24 s27 9 27 24" fill="url(#rgUser)" opacity="0.95"/>
            <g>
              <animateTransform attributeName="transform" type="scale"
                values="0.5;1;1;0.5" dur="2.5s" repeatCount="indefinite"
                additive="sum" calcMode="spline" keySplines="0.4 0 0.2 1; 0.2 1 0.4 0; 0.4 0 0.2 1"/>
              <animate attributeName="opacity" values="0;1;1;0" dur="2.5s" repeatCount="indefinite"/>
              <circle cx="76" cy="36" r="13" fill="url(#rgPlus)"/>
              <line x1="70" y1="36" x2="82" y2="36" stroke="white" stroke-width="3" stroke-linecap="round"/>
              <line x1="76" y1="30" x2="76" y2="42" stroke="white" stroke-width="3" stroke-linecap="round"/>
            </g>
            <g opacity="0">
              <animate attributeName="opacity" values="0;0;1;0" dur="3s" begin="1s" repeatCount="indefinite"/>
              <circle cx="30" cy="30" r="2.5" fill="#fbbf24"/>
              <circle cx="82" cy="72" r="2" fill="#34d399"/>
              <circle cx="25" cy="68" r="1.8" fill="#a78bfa"/>
            </g>
            <path d="M43 68 l8 8 16-16" stroke="white" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round" fill="none"
              stroke-dasharray="30" stroke-dashoffset="30" opacity="0">
              <animate attributeName="stroke-dashoffset" values="30;0;0;30" dur="2.5s" begin="0.5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0;1;1;0" dur="2.5s" begin="0.5s" repeatCount="indefinite"/>
            </path>
          </svg>
        </div>

        <h2 class="auth-title">Crear cuenta</h2>
        <p class="auth-sub">Únete a Aula Segura</p>

        <form id="reg-form" style="display:flex;flex-direction:column;gap:1rem">
          <div class="form-group">
            <label class="label">Nombre completo</label>
            <input class="input" type="text" id="reg-name" placeholder="Juan Pérez"/>
          </div>
          <div class="form-group">
            <label class="label">Correo</label>
            <input class="input" type="email" id="reg-email" required placeholder="correo@ejemplo.com"/>
            <p id="reg-email-error" class="text-xs" style="min-height:1rem;margin-top:.25rem"></p>
          </div>
          <div class="form-group">
            <label class="label">Contraseña</label>
            <input class="input" type="password" id="reg-pw" required minlength="6" placeholder="Mínimo 6 caracteres"/>
          </div>
          <div class="form-group">
            <label class="label">Rol</label>
            <div class="role-selector">
              <div class="role-option selected" data-role="estudiante" id="role-estudiante">
                <i class="fa-solid fa-user-graduate" style="color:#16a34a"></i>
                <span>Estudiante</span>
              </div>
              <div class="role-option" data-role="docente" id="role-docente">
                <i class="fa-solid fa-chalkboard-user" style="color:#2563eb"></i>
                <span>Docente</span>
              </div>
            </div>
            <input type="hidden" id="reg-role" value="estudiante"/>
          </div>
          <button type="submit" class="btn btn-primary btn-full" id="reg-btn"
            style="padding:.8rem;font-size:.95rem;border-radius:var(--radius-lg)">
            <i class="fa-solid fa-user-plus" style="margin-right:.4rem"></i>Registrarme
          </button>
        </form>

        <div class="auth-divider">O regístrate con</div>
        <button class="btn btn-outline btn-full" id="google-reg-btn"
          style="padding:.7rem;gap:.6rem;border-radius:var(--radius-lg)">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:1.2rem;height:1.2rem"/>
          Continuar con Google
        </button>

        <p class="auth-footer">
          ¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a>
        </p>
      </div>

      <!-- Panel derecho -->
      <div class="reg-side">
        <svg width="160" height="100" viewBox="0 0 160 100" fill="none" style="opacity:.3">
          <ellipse cx="80" cy="50" rx="70" ry="30" stroke="#7c3aed" stroke-width="1.2" stroke-dasharray="5 4">
            <animateTransform attributeName="transform" type="rotate" values="0 80 50;360 80 50" dur="18s" repeatCount="indefinite"/>
          </ellipse>
          <circle cx="150" cy="50" r="5" fill="#7c3aed">
            <animateTransform attributeName="transform" type="rotate" values="0 80 50;360 80 50" dur="18s" repeatCount="indefinite"/>
          </circle>
          <ellipse cx="80" cy="50" rx="45" ry="20" stroke="#2563eb" stroke-width="1" stroke-dasharray="3 3">
            <animateTransform attributeName="transform" type="rotate" values="360 80 50;0 80 50" dur="11s" repeatCount="indefinite"/>
          </ellipse>
          <circle cx="125" cy="50" r="4" fill="#2563eb">
            <animateTransform attributeName="transform" type="rotate" values="360 80 50;0 80 50" dur="11s" repeatCount="indefinite"/>
          </circle>
        </svg>

        <div class="reg-feat">
          <div class="reg-feat-icon" style="background:#dcfce7">
            <i class="fa-solid fa-clock" style="color:#16a34a"></i>
          </div>
          <div class="reg-feat-title">Resultados al instante</div>
          <div class="reg-feat-desc">Calificación automática y retroalimentación inmediata para tus estudiantes.</div>
        </div>

        <div class="reg-stat">
          <span class="reg-stat-dot" style="background:#2563eb"></span>
          <div>
            <div class="reg-stat-val">∞ Estudiantes</div>
            <div class="reg-stat-lbl">Sin límite de usuarios</div>
          </div>
        </div>

        <div class="reg-feat">
          <div class="reg-feat-icon" style="background:#fef3c7">
            <i class="fa-solid fa-chart-bar" style="color:#d97706"></i>
          </div>
          <div class="reg-feat-title">Analíticas completas</div>
          <div class="reg-feat-desc">Visualiza el desempeño de cada estudiante con métricas detalladas.</div>
        </div>
      </div>

    </div>

    <!-- Modal: crear contraseña tras Google -->
    <div id="google-pw-modal" class="modal-overlay" style="display:none">
      <div class="modal-box" style="max-width:520px">
        <div style="text-align:center;margin-bottom:1.25rem">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:2.5rem;margin-bottom:.75rem"/>
          <h3 class="font-bold" style="font-size:1.2rem">Crea tu contraseña</h3>
          <p class="text-gray text-sm mt-1">Así también podrás iniciar sesión con tu correo y contraseña.</p>
        </div>
        <div id="google-pw-user-info" style="background:var(--gray-100);border-radius:var(--radius-lg);padding:.75rem 1rem;margin-bottom:1rem;display:flex;align-items:center;gap:.75rem">
          <img id="google-pw-photo" src="" style="width:2.5rem;height:2.5rem;border-radius:50%;object-fit:cover;display:none"/>
          <div>
            <p class="font-bold text-sm" id="google-pw-name"></p>
            <p class="text-xs text-gray" id="google-pw-email"></p>
          </div>
        </div>
        <div class="space-y">
          <div class="form-group">
            <label class="label">Nueva contraseña</label>
            <input class="input" type="password" id="google-pw-input" placeholder="Mínimo 6 caracteres" minlength="6"/>
          </div>
          <div class="form-group">
            <label class="label">Confirmar contraseña</label>
            <input class="input" type="password" id="google-pw-confirm" placeholder="Repite la contraseña"/>
            <p id="google-pw-error" class="text-xs" style="min-height:1rem;margin-top:.25rem;color:#dc2626"></p>
          </div>
        </div>
        <div class="flex-row mt-4">
          <button class="btn btn-outline" style="flex:1" id="google-pw-skip">Omitir</button>
          <button class="btn btn-primary" style="flex:1" id="google-pw-save">
            <i class="fa-solid fa-lock" style="margin-right:.4rem"></i>Guardar contraseña
          </button>
        </div>
      </div>
    </div>
  `;

  const btn = document.getElementById('reg-btn');
  bindEmailValidation('reg-email', 'reg-email-error');

  document.querySelectorAll('.role-option').forEach(opt => {
    opt.onclick = () => {
      document.querySelectorAll('.role-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      document.getElementById('reg-role').value = opt.dataset.role;
    };
  });

  document.getElementById('reg-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    const pw    = document.getElementById('reg-pw').value;
    const name  = document.getElementById('reg-name').value;
    const role  = document.getElementById('reg-role').value;
    if (!isValidEmailDomain(email)) { alert(getEmailValidationError(email)); return; }
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:.4rem"></i>Registrando...';
    try {
      const res = await apiRegister({ email, password: pw, name, role });
      if (res.ok) {
        setUser({ uid: res.uid, email: res.email, name: res.name, role: res.role });
        alert('✅ Cuenta creada exitosamente');
        redirectByRole({ role });
      } else {
        alert('❌ ' + res.error);
      }
    } catch (err) {
      alert('❌ ' + (err.response?.data?.error || err.message || 'Error al crear la cuenta'));
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-user-plus" style="margin-right:.4rem"></i>Registrarme';
    }
  };

  document.getElementById('google-reg-btn').onclick = async () => {
    const role = document.getElementById('reg-role').value;
    try {
      const result = await fbAuth.signInWithPopup(googleProvider);
      const u = result.user;
      const snap = await fbDB.ref(`users/${u.uid}`).get();
      if (snap.exists()) { const userData = snap.val(); setUser(userData); redirectByRole(userData); return; }
      const newUser = {
        uid: u.uid, email: u.email,
        name: u.displayName || '', photo: u.photoURL || '',
        role, fromGoogle: true, createdAt: new Date().toISOString()
      };
      await fbDB.ref(`users/${u.uid}`).set(newUser);
      setUser(newUser);
      showGooglePasswordModal(u, newUser);
    } catch (err) {
      alert('Error al registrarse con Google: ' + err.message);
    }
  };

  function showGooglePasswordModal(firebaseUser, userData) {
    const modal     = document.getElementById('google-pw-modal');
    const nameEl    = document.getElementById('google-pw-name');
    const emailEl   = document.getElementById('google-pw-email');
    const photoEl   = document.getElementById('google-pw-photo');
    const pwInput   = document.getElementById('google-pw-input');
    const pwConfirm = document.getElementById('google-pw-confirm');
    const pwError   = document.getElementById('google-pw-error');
    const saveBtn   = document.getElementById('google-pw-save');
    const skipBtn   = document.getElementById('google-pw-skip');

    nameEl.textContent  = userData.name  || 'Usuario';
    emailEl.textContent = userData.email || '';
    if (userData.photo) { photoEl.src = userData.photo; photoEl.style.display = 'block'; }

    modal.style.display = 'flex';
    pwInput.focus();

    pwConfirm.oninput = () => {
      pwError.textContent = (pwConfirm.value && pwInput.value !== pwConfirm.value)
        ? '❌ Las contraseñas no coinciden' : '';
    };

    skipBtn.onclick = () => { modal.style.display = 'none'; redirectByRole(userData); };

    saveBtn.onclick = async () => {
      const pw      = pwInput.value.trim();
      const confirm = pwConfirm.value.trim();
      if (pw.length < 6)  { pwError.textContent = '❌ Mínimo 6 caracteres'; return; }
      if (pw !== confirm) { pwError.textContent = '❌ Las contraseñas no coinciden'; return; }
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:.4rem"></i>Guardando...';
      pwError.textContent = '';
      try {
        await firebaseUser.updatePassword(pw);
        await fbDB.ref(`users/${firebaseUser.uid}`).update({ hasPassword: true });
        modal.style.display = 'none';
        alert('✅ Contraseña creada.');
        redirectByRole(userData);
      } catch (err) {
        pwError.textContent = err.code === 'auth/requires-recent-login'
          ? '⚠️ Vuelve a iniciar sesión con Google e intenta de nuevo.'
          : '❌ Error: ' + err.message;
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-lock" style="margin-right:.4rem"></i>Guardar contraseña';
      }
    };
  }
}
