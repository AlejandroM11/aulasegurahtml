function renderRegister(app) {
  app.innerHTML = `
    <div class="card" style="max-width:440px;margin:0 auto;overflow:hidden">
      <img src="https://img.freepik.com/free-vector/students-taking-exam-online_52683-39549.jpg"
        alt="Registro" style="width:100%;height:160px;object-fit:cover;border-radius:.75rem;margin-bottom:1rem"/>
      <h2 class="text-center font-bold" style="font-size:1.5rem;margin-bottom:.25rem">Crear cuenta</h2>
      <p class="text-center text-gray text-sm mb-4">Únete a Aula Segura y comienza a aprender</p>

      <form id="reg-form" class="space-y">
        <div class="form-group">
          <label class="label">Nombre completo</label>
          <input class="input" type="text" id="reg-name" placeholder="Juan Pérez"/>
        </div>
        <div class="form-group">
          <label class="label">Correo</label>
          <input class="input" type="email" id="reg-email" required placeholder="correo@ejemplo.com"/>
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
      <button class="btn btn-outline btn-full" id="google-reg-btn">🔵 Google</button>

      <p class="text-center text-sm mt-4">
        ¿Ya tienes cuenta? <a href="#/login" class="text-blue" style="text-decoration:underline">Inicia sesión</a>
      </p>
    </div>
  `;

  const form = document.getElementById('reg-form');
  const btn = document.getElementById('reg-btn');

  form.onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    const pw = document.getElementById('reg-pw').value;
    const name = document.getElementById('reg-name').value;
    const role = document.getElementById('reg-role').value;

    if (!isValidEmailDomain(email)) { alert(getEmailValidationError(email)); return; }

    btn.disabled = true; btn.textContent = 'Registrando...';
    try {
      const res = await apiRegister({ email, password: pw, name, role });
      if (res.ok) {
        setUser({ uid: res.uid, email: res.email, name: res.name, role: res.role, fromGoogle: false });
        alert('✅ Cuenta creada exitosamente');
        navigate(role === 'docente' ? '/docente' : '/estudiante');
      } else {
        alert('❌ ' + res.error);
      }
    } catch(err) {
      alert('❌ Error al crear la cuenta: ' + (err.response?.data?.error || err.message));
    } finally {
      btn.disabled = false; btn.textContent = 'Registrarme';
    }
  };

  document.getElementById('google-reg-btn').onclick = async () => {
    const role = document.getElementById('reg-role').value;
    try {
      const u = await loginWithGoogle(role);
      if (u) { setUser(u); navigate(u.role === 'docente' ? '/docente' : '/estudiante'); }
    } catch(err) { alert('Error al registrarse con Google'); }
  };
}
