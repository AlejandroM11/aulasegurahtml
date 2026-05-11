function renderLogin(app) {
  app.innerHTML = `
    <div class="card" style="max-width:440px;margin:0 auto">
      <img src="https://cdn-icons-png.flaticon.com/512/3371/3371723.png"
        alt="Login" style="width:140px;height:140px;object-fit:contain;display:block;margin:0 auto 1rem"/>
      <h2 class="text-center font-bold" style="font-size:1.5rem;margin-bottom:.25rem">Iniciar sesión</h2>
      <p class="text-center text-gray text-sm mb-4">Accede a tu cuenta para continuar</p>

      <form id="login-form" class="space-y">
        <div class="form-group">
          <label class="label">Correo</label>
          <input class="input" type="email" id="login-email" required placeholder="correo@ejemplo.com"/>
          <p id="login-email-error" class="text-xs" style="min-height:1rem;margin-top:.25rem"></p>
        </div>
        <div class="form-group">
          <label class="label">Contraseña</label>
          <input class="input" type="password" id="login-pw" required placeholder="••••••••"/>
        </div>
        <button type="submit" class="btn btn-primary btn-full" id="login-btn">Entrar</button>
      </form>

      <div class="divider">O</div>
      <button class="btn btn-gradient btn-full mb-2" id="guest-btn">Entrar como invitado</button>
      <button class="btn btn-outline btn-full" id="google-btn" style="display:flex;align-items:center;justify-content:center;gap:.6rem">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:1.2rem;height:1.2rem"/>
        Continuar con Google
      </button>

      <p class="text-center text-sm mt-4">
        ¿No tienes cuenta? <a href="#/register" class="text-blue" style="text-decoration:underline">Regístrate</a>
      </p>
    </div>

    <!-- Modal: crear contraseña (usuarios que solo tenían Google) -->
    <div id="set-pw-modal" class="modal-overlay" style="display:none">
      <div class="modal-box" style="max-width:520px">
            <i class="fa-solid fa-lock" style="color:#fff;font-size:1.4rem"></i>
          </div>
          <h3 class="font-bold" style="font-size:1.2rem">Crea tu contraseña</h3>
          <p class="text-gray text-sm mt-1">
            Tu cuenta fue creada con Google.<br/>
            Crea una contraseña para también poder entrar con tu correo.
          </p>
        </div>

        <div id="set-pw-user-info" style="background:#f1f5f9;border-radius:.75rem;padding:.75rem 1rem;margin-bottom:1rem;display:flex;align-items:center;gap:.75rem">
          <img id="set-pw-photo" src="" style="width:2.5rem;height:2.5rem;border-radius:50%;object-fit:cover;display:none"/>
          <div>
            <p class="font-bold text-sm" id="set-pw-name"></p>
            <p class="text-xs text-gray" id="set-pw-email-display"></p>
          </div>
        </div>

        <div class="space-y">
          <div class="form-group">
            <label class="label">Nueva contraseña</label>
            <input class="input" type="password" id="set-pw-input" placeholder="Mínimo 6 caracteres"/>
          </div>
          <div class="form-group">
            <label class="label">Confirmar contraseña</label>
            <input class="input" type="password" id="set-pw-confirm" placeholder="Repite la contraseña"/>
            <p id="set-pw-error" class="text-xs" style="min-height:1rem;margin-top:.25rem;color:#dc2626"></p>
          </div>
        </div>

        <div class="flex-row mt-4">
          <button class="btn btn-outline" style="flex:1" id="set-pw-skip">
            Omitir por ahora
          </button>
          <button class="btn btn-primary" style="flex:1" id="set-pw-save">
            <i class="fa-solid fa-lock" style="margin-right:.4rem"></i>Guardar
          </button>
        </div>
      </div>
    </div>
  `;

  const btn = document.getElementById('login-btn');
  bindEmailValidation('login-email', 'login-email-error');

  // ── Login normal con email/contraseña ──
  document.getElementById('login-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const pw    = document.getElementById('login-pw').value;

    if (!isValidEmailDomain(email)) { alert(getEmailValidationError(email)); return; }

    btn.disabled = true; btn.textContent = 'Entrando...';
    try {
      const res = await apiLogin({ email, password: pw });
      if (res.ok && res.user) { setUser(res.user); redirectByRole(res.user); }
      else alert('❌ ' + (res.error || 'Error al iniciar sesión'));
    } catch (err) {
      const msg = err.response?.data?.error || err.message || '';
      // Detectar si el error es porque el usuario solo tiene Google (no tiene contraseña)
      if (msg.toLowerCase().includes('no password') || msg.toLowerCase().includes('sign-in provider')) {
        alert('⚠️ Esta cuenta fue creada con Google. Usa el botón "Continuar con Google" para entrar.');
      } else {
        alert('❌ ' + (msg || 'Error al iniciar sesión'));
      }
    } finally {
      btn.disabled = false; btn.textContent = 'Entrar';
    }
  };

  document.getElementById('guest-btn').onclick = () => navigate('/invitado');

  // ── Login con Google ──
  document.getElementById('google-btn').onclick = async () => {
    try {
      const result = await fbAuth.signInWithPopup(googleProvider);
      const u      = result.user;
      const snap   = await fbDB.ref(`users/${u.uid}`).get();

      if (!snap.exists()) {
        alert('No tienes cuenta registrada. Por favor regístrate primero.');
        return;
      }

      const userData = snap.val();
      setUser(userData);

      // Si la cuenta es de Google y aún no tiene contraseña, ofrecer crearla
      if (userData.fromGoogle && !userData.hasPassword) {
        showSetPasswordModal(u, userData);
      } else {
        redirectByRole(userData);
      }
    } catch (err) {
      alert('Error al iniciar sesión con Google: ' + err.message);
    }
  };

  // ── Modal para crear contraseña desde login ──
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
    if (userData.photo) {
      photoEl.src = userData.photo;
      photoEl.style.display = 'block';
    }

    modal.style.display = 'flex';
    pwInput.focus();

    pwConfirm.oninput = () => {
      if (pwConfirm.value && pwInput.value !== pwConfirm.value) {
        pwError.textContent = '❌ Las contraseñas no coinciden';
      } else {
        pwError.textContent = '';
      }
    };

    skipBtn.onclick = () => {
      modal.style.display = 'none';
      redirectByRole(userData);
    };

    saveBtn.onclick = async () => {
      const pw      = pwInput.value.trim();
      const confirm = pwConfirm.value.trim();

      if (pw.length < 6) {
        pwError.textContent = '❌ Mínimo 6 caracteres';
        return;
      }
      if (pw !== confirm) {
        pwError.textContent = '❌ Las contraseñas no coinciden';
        return;
      }

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
        if (err.code === 'auth/requires-recent-login') {
          pwError.textContent = '⚠️ Sesión expirada. Vuelve a iniciar sesión con Google e intenta de nuevo.';
        } else {
          pwError.textContent = '❌ ' + err.message;
        }
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-lock" style="margin-right:.4rem"></i>Guardar';
      }
    };
  }
}