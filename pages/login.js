function renderLogin(app) {
  app.innerHTML = `
    <style>
      .auth-wrap {
        min-height: calc(100vh - var(--nav-height));
        display: flex; align-items: center; justify-content: center;
        padding: 2rem 1rem;
      }
      .auth-card {
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

    <div class="auth-wrap">
      <div class="auth-card">

        <div class="auth-logo-ring">
          <img src="https://cdn-icons-png.flaticon.com/512/3371/3371723.png"
            alt="Login" style="width:36px;height:36px;object-fit:contain;filter:brightness(0) invert(1)"/>
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
