function renderLogin(app) {
  app.innerHTML = `
    <div class="card" style="max-width:420px;margin:0 auto">

      <!-- Logo / ícono -->
      <div style="text-align:center;margin-bottom:1.5rem">
        <div style="
          width:64px;height:64px;border-radius:1rem;
          background:linear-gradient(135deg,#1e3a5f,#2563eb);
          display:inline-flex;align-items:center;justify-content:center;
          box-shadow:0 8px 24px rgba(37,99,235,.3);margin-bottom:1rem
        ">
          <i class="fa-solid fa-shield-halved" style="color:#fff;font-size:1.6rem"></i>
        </div>
        <h2 class="font-bold" style="font-size:1.5rem;margin-bottom:.25rem">Iniciar sesión</h2>
        <p class="text-gray text-sm">Accede a tu cuenta para continuar</p>
      </div>

      <form id="login-form" style="display:flex;flex-direction:column;gap:1rem">
        <div class="form-group">
          <label class="label">Correo electrónico</label>
          <input class="input" type="email" id="login-email" required placeholder="correo@ejemplo.com" autocomplete="email"/>
          <p id="login-email-error" class="text-xs" style="min-height:1rem;margin-top:.25rem;color:#dc2626"></p>
        </div>
        <div class="form-group">
          <label class="label">Contraseña</label>
          <input class="input" type="password" id="login-pw" required placeholder="••••••••" autocomplete="current-password"/>
        </div>
        <button type="submit" class="btn btn-primary btn-full" id="login-btn" style="padding:.75rem;font-size:.95rem">
          <i class="fa-solid fa-right-to-bracket" style="margin-right:.4rem"></i>Entrar
        </button>
      </form>

      <div class="divider" style="margin:1.25rem 0">O continúa con</div>

      <div style="display:flex;flex-direction:column;gap:.6rem">
        <button class="btn btn-outline btn-full" id="google-btn" style="padding:.7rem;gap:.6rem">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:1.1rem;height:1.1rem"/>
          Continuar con Google
        </button>
        <button class="btn btn-gradient btn-full" id="guest-btn" style="padding:.7rem">
          <i class="fa-solid fa-bolt" style="margin-right:.4rem"></i>Acceso rápido (sin cuenta)
        </button>
      </div>

      <p class="text-center text-sm" style="margin-top:1.5rem;color:#64748b">
        ¿No tienes cuenta?
        <a href="#/register" class="text-blue" style="text-decoration:underline;font-weight:600">Regístrate</a>
      </p>
    </div>

    <!-- Modal: crear contraseña para usuarios que solo tenían Google -->
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

        <div id="set-pw-user-info" style="background:#f1f5f9;border-radius:.75rem;padding:.75rem 1rem;margin-bottom:1.25rem;display:flex;align-items:center;gap:.75rem">
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
          <button class="btn btn-outline" style="flex:1" id="set-pw-skip">Omitir por ahora</button>
          <button class="btn btn-primary" style="flex:1" id="set-pw-save">
            <i class="fa-solid fa-lock" style="margin-right:.4rem"></i>Guardar
          </button>
        </div>
      </div>
    </div>
  `;

  const btn = document.getElementById('login-btn');
  bindEmailValidation('login-email', 'login-email-error');

  // ── Login con email/contraseña ──
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
        alert('⚠️ Esta cuenta fue creada con Google. Usa el botón "Continuar con Google" para entrar.');
      } else {
        alert('❌ ' + (msg || 'Error al iniciar sesión'));
      }
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-right-to-bracket" style="margin-right:.4rem"></i>Entrar';
    }
  };

  document.getElementById('guest-btn').onclick = () => navigate('/invitado');

  // ── Login con Google ──
  document.getElementById('google-btn').onclick = async () => {
    try {
      const result   = await fbAuth.signInWithPopup(googleProvider);
      const u        = result.user;
      const snap     = await fbDB.ref(`users/${u.uid}`).get();

      if (!snap.exists()) {
        alert('No tienes cuenta registrada. Por favor regístrate primero.');
        return;
      }

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

  // ── Modal para crear contraseña (usuarios Google sin contraseña) ──
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

      if (pw.length < 6)    { pwError.textContent = '❌ Mínimo 6 caracteres'; return; }
      if (pw !== confirm)   { pwError.textContent = '❌ Las contraseñas no coinciden'; return; }

      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:.4rem"></i>Guardando...';
      pwError.textContent = '';

      try {
        await firebaseUser.updatePassword(pw);
        await fbDB.ref(`users/${firebaseUser.uid}`).update({ hasPassword: true });
        modal.style.display = 'none';
        alert('✅ ¡Contraseña creada! Ya puedes entrar con tu correo y contraseña.');
        redirectByRole(userData);
      } catch (err) {
        pwError.textContent = err.code === 'auth/requires-recent-login'
          ? '⚠️ Sesión expirada. Vuelve a iniciar sesión con Google e intenta de nuevo.'
          : '❌ ' + err.message;
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-lock" style="margin-right:.4rem"></i>Guardar';
      }
    };
  }
}
