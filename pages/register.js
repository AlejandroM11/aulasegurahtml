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
  `;

  const btn = document.getElementById('reg-btn');
  bindEmailValidation('reg-email', 'reg-email-error');

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

  document.getElementById('google-reg-btn').onclick = async () => {
    const role = document.getElementById('reg-role').value;
    const u = await loginWithGoogle(role);
    if (u) { setUser(u); redirectByRole(u); }
  };
}