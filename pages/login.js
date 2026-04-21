function renderLogin(app) {
  app.innerHTML = `
    <div class="card" style="max-width:440px;margin:0 auto">
      <img src="https://cdn-icons-png.flaticon.com/512/3371/3371723.png"
        alt="Login" style="width:100%;height:160px;object-fit:cover;border-radius:.75rem;margin-bottom:1rem"/>
      <h2 class="text-center font-bold" style="font-size:1.5rem;margin-bottom:.25rem">Iniciar sesión</h2>
      <p class="text-center text-gray text-sm mb-4">Accede a tu cuenta para continuar</p>

      <form id="login-form" class="space-y">
        <div class="form-group">
          <label class="label">Correo</label>
          <input class="input" type="email" id="login-email" required placeholder="correo@ejemplo.com"/>
        </div>
        <div class="form-group">
          <label class="label">Contraseña</label>
          <input class="input" type="password" id="login-pw" required placeholder="••••••••"/>
        </div>
        <button type="submit" class="btn btn-primary btn-full" id="login-btn">Entrar</button>
      </form>

      <div class="divider">O</div>
      <button class="btn btn-gradient btn-full mb-2" id="guest-btn">Entrar como invitado</button>
      <button class="btn btn-outline btn-full" id="google-btn">Continuar con Google</button>

      <p class="text-center text-sm mt-4">
        ¿No tienes cuenta? <a href="#/register" class="text-blue" style="text-decoration:underline">Regístrate</a>
      </p>
    </div>
  `;

  const btn = document.getElementById('login-btn');

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
      alert('❌ ' + (err.response?.data?.error || err.message || 'Error al iniciar sesión'));
    } finally {
      btn.disabled = false; btn.textContent = 'Entrar';
    }
  };

  document.getElementById('guest-btn').onclick = () => navigate('/invitado');

  document.getElementById('google-btn').onclick = async () => {
    try {
      const result = await fbAuth.signInWithPopup(googleProvider);
      const u = result.user;
      const snap = await fbDB.ref(`users/${u.uid}`).get();
      if (snap.exists()) {
        const userData = snap.val();
        setUser(userData);
        redirectByRole(userData);
      } else {
        alert('No tienes cuenta registrada. Por favor regístrate primero.');
      }
    } catch (err) {
      alert('Error al iniciar sesión con Google: ' + err.message);
    }
  };
}