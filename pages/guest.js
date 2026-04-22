function renderGuest(app) {
  app.innerHTML = `
    <div style="max-width:440px;margin:0 auto">
      <div class="card" style="overflow:hidden">
        <div style="background:linear-gradient(135deg,#3b82f6,#7c3aed);padding:2rem;text-align:center">
          <img src="https://images.icon-icons.com/1161/PNG/512/1487716857-user_81635.png"
            style="width:90px;height:90px;object-fit:contain;display:block;margin:0 auto .75rem;filter:brightness(0) invert(1)"/>
          <h2 style="color:#fff;font-size:1.5rem;font-weight:800">Acceso Rápido</h2>
        </div>
        <div style="padding:1.5rem">
          <p class="text-center text-gray text-sm mb-4">Ingresa al examen sin necesidad de crear una cuenta</p>
          <form id="guest-form" class="space-y">
            <div class="form-group">
              <label class="label"><i class="fa-solid fa-user" style="margin-right:.4rem;color:#2563eb"></i> Tu nombre completo</label>
              <input class="input" type="text" id="guest-name" placeholder="Juan Pérez"
                required minlength="3" maxlength="50" autofocus/>
            </div>
            <div class="form-group">
              <label class="label"><i class="fa-solid fa-key" style="margin-right:.4rem;color:#2563eb"></i> Código del examen</label>
              <input class="input font-mono" type="text" id="guest-code" placeholder="ABC123"
                required maxlength="10"
                style="text-align:center;font-size:1.2rem;font-weight:700;letter-spacing:.1em"/>
            </div>
            <button type="submit" class="btn btn-primary btn-full" id="guest-btn">
              <i class="fa-solid fa-rocket" style="margin-right:.4rem"></i> Comenzar examen
            </button>
          </form>

          <div class="info-box info-box-blue mt-4">
            <p class="font-bold text-sm mb-1"><i class="fa-solid fa-circle-info" style="margin-right:.4rem"></i> Información</p>
            <ul class="text-xs space-y-sm">
              <li><i class="fa-solid fa-circle-check" style="margin-right:.4rem;color:#2563eb"></i> No necesitas crear una cuenta</li>
              <li><i class="fa-solid fa-clock" style="margin-right:.4rem;color:#2563eb"></i> Tu sesión es temporal</li>
              <li><i class="fa-solid fa-floppy-disk" style="margin-right:.4rem;color:#2563eb"></i> Tus respuestas se guardan automáticamente</li>
            </ul>
          </div>

          <p class="text-center mt-4">
            <a href="#/login" class="text-blue text-sm" style="text-decoration:underline">
              ¿Ya tienes cuenta? Inicia sesión
            </a>
          </p>
        </div>
      </div>
    </div>
  `;

  const btn       = document.getElementById('guest-btn');
  const codeInput = document.getElementById('guest-code');

  codeInput.oninput = () => { codeInput.value = codeInput.value.toUpperCase(); };

  document.getElementById('guest-form').onsubmit = async (e) => {
    e.preventDefault();
    const name = document.getElementById('guest-name').value.trim();
    const code = codeInput.value.trim().toUpperCase();

    if (name.length < 3) { alert('❌ El nombre debe tener al menos 3 caracteres'); return; }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:.4rem"></i> Verificando...';
    try {
      const res = await apiGetExamByCode(code);
      if (res?.ok && res.exam) {
        setUser({
          uid: guestUid(),
          email: `invitado_${Date.now()}@temporal.local`,
          name, role: 'estudiante', isGuest: true, examCode: code
        });
        navigate('/estudiante');
      } else {
        alert('❌ Código de examen inválido');
      }
    } catch {
      alert('❌ Código de examen no encontrado');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-rocket" style="margin-right:.4rem"></i> Comenzar examen';
    }
  };
}