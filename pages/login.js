function renderLogin(app) {
  app.innerHTML = `
    <style>
      .auth-wrap {
        min-height: calc(100vh - var(--nav-height));
        display: flex; align-items: center; justify-content: center;
        padding: 2rem 1rem;
        position: relative; overflow: hidden;
      }
      .auth-card {
        position: relative; z-index: 1;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-2xl);
        padding: 2.5rem 2.25rem;
        width: 100%; max-width: 440px;
        box-shadow: 0 4px 24px rgba(0,0,0,.07), 0 1px 4px rgba(0,0,0,.04);
        animation: cardIn .3s cubic-bezier(.4,0,.2,1) both;
      }
      body.dark .auth-card {
        background: var(--surface-raised);
        border-color: var(--border-strong);
      }
      .auth-logo-ring {
        width: 64px; height: 64px; border-radius: 50%;
        background: linear-gradient(135deg, #1e3a5f, #2563eb);
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 1.5rem;
        box-shadow: 0 8px 24px rgba(37,99,235,.3);
      }
      .auth-title {
        font-size: 1.6rem; font-weight: 800; letter-spacing: -.025em;
        color: var(--text-primary); text-align: center; margin-bottom: .3rem;
      }
      .auth-sub {
        text-align: center; color: var(--text-muted); font-size: .875rem;
        margin-bottom: 2rem;
      }
      .auth-field { margin-bottom: 1rem; }
      .auth-field .label { margin-bottom: .4rem; }
      .auth-input-wrap { position: relative; }
      .auth-input-wrap i {
        position: absolute; left: .9rem; top: 50%; transform: translateY(-50%);
        color: var(--text-muted); font-size: .85rem; pointer-events: none;
      }
      .auth-input-wrap .input { padding-left: 2.5rem; }
      .auth-divider {
        display: flex; align-items: center; gap: .75rem;
        margin: 1.25rem 0; color: var(--text-muted);
        font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .07em;
      }
      .auth-divider::before, .auth-divider::after {
        content: ''; flex: 1; height: 1px; background: var(--border);
      }
      body.dark .auth-divider::before, body.dark .auth-divider::after { background: var(--border-strong); }
      .auth-footer {
        text-align: center; margin-top: 1.5rem;
        font-size: .875rem; color: var(--text-muted);
      }
      .auth-footer a { color: var(--blue-600); font-weight: 600; text-decoration: none; }
      .auth-footer a:hover { text-decoration: underline; }
      body.dark .auth-footer a { color: var(--blue-300); }
    </style>

    <!-- SVG sutil de fondo -->
    <svg style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lb1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2563eb" stop-opacity=".06"/><stop offset="100%" stop-color="#1e3a5f" stop-opacity=".04"/></linearGradient>
        <linearGradient id="lb2" x1="1" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1e3a5f" stop-opacity=".05"/><stop offset="100%" stop-color="#2563eb" stop-opacity=".03"/></linearGradient>
      </defs>
      <circle cx="0" cy="0" r="420" fill="url(#lb1)"><animate attributeName="r" values="420;450;420" dur="8s" repeatCount="indefinite"/></circle>
      <circle cx="1440" cy="900" r="380" fill="url(#lb2)"><animate attributeName="r" values="380;410;380" dur="10s" begin="2s" repeatCount="indefinite"/></circle>
      <circle cx="1440" cy="0" r="260" fill="url(#lb1)" opacity=".7"><animate attributeName="r" values="260;285;260" dur="7s" begin="1s" repeatCount="indefinite"/></circle>
      <circle cx="0" cy="900" r="200" fill="url(#lb2)" opacity=".6"><animate attributeName="r" values="200;220;200" dur="9s" begin="3s" repeatCount="indefinite"/></circle>
      <line x1="200" y1="0" x2="0" y2="200" stroke="#2563eb" stroke-width="1" opacity=".04"/>
      <line x1="1440" y1="700" x2="1240" y2="900" stroke="#1e3a5f" stroke-width="1" opacity=".04"/>
    </svg>

    <div class="auth-wrap">
      <div class="auth-card">

        <div style="display:flex;justify-content:center;margin-bottom:1.5rem">
          <!-- SVG animado: llave desbloqueando candado -->
          <svg width="110" height="110" viewBox="0 0 110 110" fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style="filter:drop-shadow(0 8px 24px rgba(37,99,235,.3))">
            <defs>
              <linearGradient id="lgBg" x1="0" y1="0" x2="110" y2="110" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#1e3a5f"/>
                <stop offset="100%" stop-color="#2563eb"/>
              </linearGradient>
              <linearGradient id="lgKey" x1="0" y1="0" x2="60" y2="60" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#fbbf24"/>
                <stop offset="100%" stop-color="#f59e0b"/>
              </linearGradient>
              <linearGradient id="lgLock" x1="20" y1="20" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#60a5fa"/>
                <stop offset="100%" stop-color="#ffffff"/>
              </linearGradient>
            </defs>

            <!-- Círculo de fondo con pulso -->
            <circle cx="55" cy="55" r="50" fill="url(#lgBg)">
              <animate attributeName="r" values="50;52;50" dur="3s" repeatCount="indefinite"/>
            </circle>
            <!-- Anillo exterior pulsante -->
            <circle cx="55" cy="55" r="50" stroke="#3b82f6" stroke-width="1.5"
              fill="none" opacity="0">
              <animate attributeName="r" values="50;66;66" dur="2.5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.5;0;0" dur="2.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="55" cy="55" r="50" stroke="#7c3aed" stroke-width="1"
              fill="none" opacity="0">
              <animate attributeName="r" values="50;66;66" dur="2.5s" begin="1.25s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.3;0;0" dur="2.5s" begin="1.25s" repeatCount="indefinite"/>
            </circle>

            <!-- Cuerpo del candado -->
            <rect x="36" y="52" width="38" height="28" rx="7"
              fill="url(#lgLock)" opacity="0.95"/>

            <!-- Arco del candado — animado abriéndose -->
            <path d="M44 52 v-10 a11 11 0 0 1 22 0" stroke="white" stroke-width="4"
              stroke-linecap="round" fill="none">
              <animateTransform attributeName="transform" type="rotate"
                values="0 55 42; -25 55 42; 0 55 42" dur="3s"
                repeatCount="indefinite" calcMode="spline"
                keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"/>
            </path>

            <!-- Ojo del candado -->
            <circle cx="55" cy="64" r="4" fill="#1e3a5f">
              <animate attributeName="r" values="4;5;4" dur="2s" repeatCount="indefinite"/>
            </circle>
            <!-- Ranura del candado -->
            <rect x="53.5" y="64" width="3" height="7" rx="1.5" fill="#1e3a5f"/>

            <!-- Llave animada entrando -->
            <g>
              <animateTransform attributeName="transform" type="translate"
                values="-20,0; 0,0; 0,0; -20,0" dur="3s"
                repeatCount="indefinite" calcMode="spline"
                keySplines="0.4 0 0.2 1; 0.2 1 0.4 0; 0.4 0 0.2 1"/>
              <animate attributeName="opacity" values="0;1;1;0" dur="3s" repeatCount="indefinite"/>
              <!-- Mango de la llave -->
              <circle cx="22" cy="38" r="8" stroke="url(#lgKey)" stroke-width="3" fill="none"/>
              <circle cx="22" cy="38" r="3" fill="url(#lgKey)"/>
              <!-- Cuerpo de la llave -->
              <line x1="28" y1="43" x2="46" y2="61" stroke="url(#lgKey)" stroke-width="3" stroke-linecap="round"/>
              <!-- Dientes de la llave -->
              <line x1="40" y1="57" x2="44" y2="53" stroke="url(#lgKey)" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="44" y1="61" x2="48" y2="57" stroke="url(#lgKey)" stroke-width="2.5" stroke-linecap="round"/>
            </g>

            <!-- Check de acceso concedido -->
            <path d="M44 66 l7 7 14-14" stroke="#1e3a5f" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round" fill="none" opacity="0">
              <animate attributeName="opacity" values="0;0;0;1;1;0" dur="3s" repeatCount="indefinite"/>
            </path>
          </svg>
        </div>

        <h2 class="auth-title">Iniciar sesión</h2>
        <p class="auth-sub">Accede a tu cuenta para continuar</p>

        <form id="login-form" style="display:flex;flex-direction:column;gap:0">
          <div class="auth-field">
            <label class="label">Correo electrónico</label>
            <div class="auth-input-wrap">
              <i class="fa-solid fa-envelope"></i>
              <input class="input" type="email" id="login-email" required
                placeholder="correo@ejemplo.com" autocomplete="email"/>
            </div>
            <p id="login-email-error" class="text-xs" style="min-height:1rem;margin-top:.25rem;color:#dc2626"></p>
          </div>
          <div class="auth-field">
            <label class="label">Contraseña</label>
            <div class="auth-input-wrap">
              <i class="fa-solid fa-lock"></i>
              <input class="input" type="password" id="login-pw" required
                placeholder="••••••••" autocomplete="current-password"/>
            </div>
          </div>
          <button type="submit" class="btn btn-primary btn-full mt-2" id="login-btn"
            style="padding:.8rem;font-size:.95rem;border-radius:var(--radius-lg)">
            <i class="fa-solid fa-right-to-bracket" style="margin-right:.4rem"></i>Entrar
          </button>
        </form>

        <div class="auth-divider">O continúa con</div>

        <div style="display:flex;flex-direction:column;gap:.6rem">
          <button class="btn btn-outline btn-full" id="google-btn"
            style="padding:.7rem;gap:.6rem;border-radius:var(--radius-lg)">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              style="width:1.1rem;height:1.1rem"/>
            Continuar con Google
          </button>
          <button class="btn btn-gradient btn-full" id="guest-btn"
            style="padding:.7rem;border-radius:var(--radius-lg)">
            <i class="fa-solid fa-bolt" style="margin-right:.4rem"></i>Acceso rápido (sin cuenta)
          </button>
        </div>

        <p class="auth-footer">
          ¿No tienes cuenta?
          <a href="#/register">Regístrate</a>
        </p>
      </div>
    </div>

    <!-- Modal: crear contraseña para usuarios Google -->
    <div id="set-pw-modal" class="modal-overlay" style="display:none">
      <div class="modal-box" style="max-width:440px">
        <div style="text-align:center;margin-bottom:1.25rem">
          <div style="width:3.5rem;height:3.5rem;background:linear-gradient(135deg,#7c3aed,#2563eb);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:.75rem">
            <i class="fa-solid fa-lock" style="color:#fff;font-size:1.3rem"></i>
          </div>
          <h3 class="font-bold" style="font-size:1.2rem">Crea tu contraseña</h3>
          <p class="text-gray text-sm" style="margin-top:.35rem">
            Tu cuenta fue creada con Google.<br/>
            Crea una contraseña para entrar también con tu correo.
          </p>
        </div>

        <div id="set-pw-user-info" style="background:var(--gray-100);border-radius:var(--radius-lg);padding:.75rem 1rem;margin-bottom:1.25rem;display:flex;align-items:center;gap:.75rem">
          <img id="set-pw-photo" src="" style="width:2.5rem;height:2.5rem;border-radius:50%;object-fit:cover;display:none"/>
          <div>
            <p class="font-bold text-sm" id="set-pw-name"></p>
            <p class="text-xs text-gray" id="set-pw-email-display"></p>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:.85rem;margin-bottom:1rem">
          <div class="form-group">
            <label class="label">Nueva contraseña</label>
            <input class="input" type="password" id="set-pw-input" placeholder="Mínimo 6 caracteres" autocomplete="new-password"/>
          </div>
          <div class="form-group">
            <label class="label">Confirmar contraseña</label>
            <input class="input" type="password" id="set-pw-confirm" placeholder="Repite la contraseña" autocomplete="new-password"/>
            <p id="set-pw-error" class="text-xs" style="min-height:1rem;margin-top:.25rem;color:#dc2626"></p>
          </div>
        </div>

        <div style="display:flex;gap:.75rem">
          <button class="btn btn-outline" style="flex:1" id="set-pw-skip">Omitir</button>
          <button class="btn btn-primary" style="flex:1" id="set-pw-save">
            <i class="fa-solid fa-lock" style="margin-right:.4rem"></i>Guardar
          </button>
        </div>
      </div>
    </div>
  `;

  const btn = document.getElementById('login-btn');
  bindEmailValidation('login-email', 'login-email-error');

  document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pw    = document.getElementById('login-pw').value;
    if (!isValidEmailDomain(email)) { alert(getEmailValidationError(email)); return; }
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:.4rem"></i>Entrando...';
    try {
      const res = await apiLogin({ email, password: pw });
      if (res.ok && res.user) { setUser(res.user); redirectByRole(res.user); }
      else alert('❌ ' + (res.error || 'Error al iniciar sesión'));
    } catch (err) {
      const msg = err.response?.data?.error || err.message || '';
      if (msg.toLowerCase().includes('no password') || msg.toLowerCase().includes('sign-in provider')) {
        alert('⚠️ Esta cuenta fue creada con Google. Usa el botón "Continuar con Google".');
      } else {
        alert('❌ ' + (msg || 'Error al iniciar sesión'));
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-right-to-bracket" style="margin-right:.4rem"></i>Entrar';
    }
  };

  document.getElementById('guest-btn').onclick = () => navigate('/invitado');

  document.getElementById('google-btn').onclick = async () => {
    try {
      const result   = await fbAuth.signInWithPopup(googleProvider);
      const u        = result.user;
      const snap     = await fbDB.ref(`users/${u.uid}`).get();
      if (!snap.exists()) { alert('No tienes cuenta registrada. Por favor regístrate primero.'); return; }
      const userData = snap.val();
      setUser(userData);
      if (userData.fromGoogle && !userData.hasPassword) {
        showSetPasswordModal(u, userData);
      } else {
        redirectByRole(userData);
      }
    } catch (err) {
      alert('Error al iniciar sesión con Google: ' + err.message);
    }
  };

  function showSetPasswordModal(firebaseUser, userData) {
    const modal     = document.getElementById('set-pw-modal');
    const nameEl    = document.getElementById('set-pw-name');
    const emailEl   = document.getElementById('set-pw-email-display');
    const photoEl   = document.getElementById('set-pw-photo');
    const pwInput   = document.getElementById('set-pw-input');
    const pwConfirm = document.getElementById('set-pw-confirm');
    const pwError   = document.getElementById('set-pw-error');
    const saveBtn   = document.getElementById('set-pw-save');
    const skipBtn   = document.getElementById('set-pw-skip');

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
        alert('✅ ¡Contraseña creada!');
        redirectByRole(userData);
      } catch (err) {
        pwError.textContent = err.code === 'auth/requires-recent-login'
          ? '⚠️ Sesión expirada. Vuelve a iniciar sesión con Google.'
          : '❌ ' + err.message;
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-lock" style="margin-right:.4rem"></i>Guardar';
      }
    };
  }
}
