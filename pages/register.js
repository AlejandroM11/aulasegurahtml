function renderRegister(app) {
  app.innerHTML = `
    <div class="card" style="max-width:440px;margin:0 auto">
      <img src="https://cdn-icons-png.flaticon.com/512/3534/3534139.png"
        alt="Registro" style="width:140px;height:140px;object-fit:contain;display:block;margin:0 auto 1rem"/>
      <h2 class="text-center font-bold" style="font-size:1.5rem;margin-bottom:.25rem">Crear cuenta</h2>
      <p class="text-center text-gray text-sm mb-4">Únete a Aula Segura</p>

      <form id="reg-form" class="space-y">
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
          <select class="input" id="reg-role">
            <option value="estudiante">Estudiante</option>
            <option value="docente">Docente</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary btn-full" id="reg-btn">Registrarme</button>
      </form>

      <div class="divider">O regístrate con</div>
      <button class="btn btn-outline btn-full" id="google-reg-btn" style="display:flex;align-items:center;justify-content:center;gap:.6rem">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:1.2rem;height:1.2rem"/>
        Continuar con Google
      </button>

      <p class="text-center text-sm mt-4">
        ¿Ya tienes cuenta? <a href="#/login" class="text-blue" style="text-decoration:underline">Inicia sesión</a>
      </p>
    </div>

    <!-- Modal: crear contraseña tras Google -->
    <div id="google-pw-modal" class="modal-overlay" style="display:none">
      <div class="modal-box" style="max-width:520px">
        <div style="text-align:center;margin-bottom:1.25rem">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:2.5rem;margin-bottom:.75rem"/>
          <h3 class="font-bold" style="font-size:1.2rem">Crea tu contraseña</h3>
          <p class="text-gray text-sm mt-1">
            Así también podrás iniciar sesión con tu correo y contraseña,<br/>sin necesidad de Google.
          </p>
        </div>

        <div id="google-pw-user-info" style="background:#f1f5f9;border-radius:.75rem;padding:.75rem 1rem;margin-bottom:1rem;display:flex;align-items:center;gap:.75rem">
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
            <p id="google-pw-error" class="text-xs text-red" style="min-height:1rem;margin-top:.25rem"></p>
          </div>
        </div>

        <div class="flex-row mt-4">
          <button class="btn btn-outline" style="flex:1" id="google-pw-skip">
            Omitir por ahora
          </button>
          <button class="btn btn-primary" style="flex:1" id="google-pw-save">
            <i class="fa-solid fa-lock" style="margin-right:.4rem"></i>Guardar contraseña
          </button>
        </div>

        <p class="text-center text-xs text-gray mt-3">
          <i class="fa-solid fa-circle-info" style="margin-right:.3rem"></i>
          Puedes cambiarla después desde tu perfil
        </p>
      </div>
    </div>
  `;

  const btn = document.getElementById('reg-btn');
  bindEmailValidation('reg-email', 'reg-email-error');

  // ── Registro normal ──
  document.getElementById('reg-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    const pw    = document.getElementById('reg-pw').value;
    const name  = document.getElementById('reg-name').value;
    const role  = document.getElementById('reg-role').value;

    if (!isValidEmailDomain(email)) { alert(getEmailValidationError(email)); return; }

    btn.disabled = true; btn.textContent = 'Registrando...';
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
      btn.disabled = false; btn.textContent = 'Registrarme';
    }
  };

  // ── Registro con Google ──
  document.getElementById('google-reg-btn').onclick = async () => {
    const role = document.getElementById('reg-role').value;
    try {
      const result = await fbAuth.signInWithPopup(googleProvider);
      const u = result.user;
      const snap = await fbDB.ref(`users/${u.uid}`).get();

      if (snap.exists()) {
        // Ya tiene cuenta — simplemente iniciar sesión
        const userData = snap.val();
        setUser(userData);
        redirectByRole(userData);
        return;
      }

      // Cuenta nueva con Google — guardar en DB y pedir contraseña
      const newUser = {
        uid: u.uid, email: u.email,
        name: u.displayName || '', photo: u.photoURL || '',
        role, fromGoogle: true, createdAt: new Date().toISOString()
      };
      await fbDB.ref(`users/${u.uid}`).set(newUser);
      setUser(newUser);

      // Mostrar modal para crear contraseña
      showGooglePasswordModal(u, newUser);

    } catch (err) {
      alert('Error al registrarse con Google: ' + err.message);
    }
  };

  // ── Modal para crear contraseña ──
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
    if (userData.photo) {
      photoEl.src = userData.photo;
      photoEl.style.display = 'block';
    }

    modal.style.display = 'flex';
    pwInput.focus();

    // Validación en tiempo real
    pwConfirm.oninput = () => {
      if (pwConfirm.value && pwInput.value !== pwConfirm.value) {
        pwError.textContent = '❌ Las contraseñas no coinciden';
        pwError.style.color = '#dc2626';
      } else {
        pwError.textContent = '';
      }
    };

    // Omitir
    skipBtn.onclick = () => {
      modal.style.display = 'none';
      redirectByRole(userData);
    };

    // Guardar contraseña
    saveBtn.onclick = async () => {
      const pw      = pwInput.value.trim();
      const confirm = pwConfirm.value.trim();

      if (pw.length < 6) {
        pwError.textContent = '❌ La contraseña debe tener al menos 6 caracteres';
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
        // Actualizar contraseña en Firebase Auth
        await firebaseUser.updatePassword(pw);

        // Marcar en DB que ya tiene contraseña configurada
        await fbDB.ref(`users/${firebaseUser.uid}`).update({ hasPassword: true });

        modal.style.display = 'none';
        alert('✅ Contraseña creada. Ya puedes iniciar sesión con tu correo y contraseña.');
        redirectByRole(userData);
      } catch (err) {
        // Firebase puede requerir re-autenticación reciente
        if (err.code === 'auth/requires-recent-login') {
          pwError.textContent = '⚠️ Por seguridad, vuelve a iniciar sesión con Google e intenta de nuevo.';
        } else {
          pwError.textContent = '❌ Error: ' + err.message;
        }
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-lock" style="margin-right:.4rem"></i>Guardar contraseña';
      }
    };
  }
}