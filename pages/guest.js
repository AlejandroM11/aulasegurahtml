function renderGuest(app) {
  app.innerHTML = `
    <style>
      .guest-wrap {
        min-height: calc(100vh - var(--nav-height));
        display: flex; align-items: center; justify-content: center;
        padding: 2rem 1rem;
        position: relative; overflow: hidden;
      }
      .guest-card {
        position: relative; z-index: 1;
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-2xl);
        width: 100%; max-width: 460px;
        overflow: hidden;
        box-shadow: 0 4px 24px rgba(0,0,0,.08);
        animation: cardIn .3s cubic-bezier(.4,0,.2,1) both;
      }
      body.dark .guest-card { background: var(--surface-raised); border-color: var(--border-strong); }

      .guest-hero {
        background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 60%, #7c3aed 100%);
        padding: 2rem 2rem 1.75rem;
        text-align: center;
        position: relative; overflow: hidden;
      }
      .guest-hero-title {
        font-size: 1.5rem; font-weight: 800; color: #fff;
        letter-spacing: -.025em; margin-bottom: .3rem;
      }
      .guest-hero-sub { color: rgba(255,255,255,.75); font-size: .875rem; }

      .guest-body { padding: 1.75rem 2rem 2rem; }

      .guest-code-input {
        text-align: center;
        font-family: 'JetBrains Mono', monospace !important;
        font-size: 1.6rem !important;
        font-weight: 700 !important;
        letter-spacing: .18em !important;
        text-transform: uppercase;
      }
    </style>

    <!-- SVG fondo sutil -->
    <svg style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0"
      viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none">
      <defs>
        <linearGradient id="gb1" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#2563eb" stop-opacity=".06"/>
          <stop offset="100%" stop-color="#7c3aed" stop-opacity=".04"/>
        </linearGradient>
        <linearGradient id="gb2" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#7c3aed" stop-opacity=".05"/>
          <stop offset="100%" stop-color="#2563eb" stop-opacity=".03"/>
        </linearGradient>
      </defs>
      <circle cx="0" cy="0" r="420" fill="url(#gb1)">
        <animate attributeName="r" values="420;455;420" dur="9s" repeatCount="indefinite"/>
      </circle>
      <circle cx="1440" cy="900" r="380" fill="url(#gb2)">
        <animate attributeName="r" values="380;415;380" dur="11s" begin="2s" repeatCount="indefinite"/>
      </circle>
      <circle cx="1440" cy="0" r="260" fill="url(#gb1)" opacity=".7">
        <animate attributeName="r" values="260;290;260" dur="7s" begin="1s" repeatCount="indefinite"/>
      </circle>
    </svg>

    <div class="guest-wrap">
      <div class="guest-card">

        <!-- Hero con SVG animado -->
        <div class="guest-hero">
          <!-- SVG decorativo de fondo en el hero -->
          <svg style="position:absolute;right:1rem;top:50%;transform:translateY(-50%);opacity:.12;pointer-events:none"
            width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="52" stroke="white" stroke-width="1.5" stroke-dasharray="7 5">
              <animateTransform attributeName="transform" type="rotate"
                values="0 60 60;360 60 60" dur="18s" repeatCount="indefinite"/>
            </circle>
            <circle cx="60" cy="60" r="34" stroke="white" stroke-width="1" stroke-dasharray="5 4">
              <animateTransform attributeName="transform" type="rotate"
                values="360 60 60;0 60 60" dur="12s" repeatCount="indefinite"/>
            </circle>
            <circle cx="112" cy="60" r="5" fill="white" opacity=".8">
              <animateTransform attributeName="transform" type="rotate"
                values="0 60 60;360 60 60" dur="18s" repeatCount="indefinite"/>
            </circle>
            <circle cx="94" cy="60" r="4" fill="white" opacity=".6">
              <animateTransform attributeName="transform" type="rotate"
                values="360 60 60;0 60 60" dur="12s" repeatCount="indefinite"/>
            </circle>
          </svg>

          <!-- SVG animado: rayo de acceso rápido -->
          <div style="display:flex;justify-content:center;margin-bottom:1rem;position:relative;z-index:1">
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none"
              style="filter:drop-shadow(0 4px 16px rgba(0,0,0,.25))">
              <defs>
                <linearGradient id="guestIconBg" x1="0" y1="0" x2="72" y2="72" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#1e3a5f"/>
                  <stop offset="100%" stop-color="#2563eb"/>
                </linearGradient>
              </defs>
              <circle cx="36" cy="36" r="34" fill="url(#guestIconBg)">
                <animate attributeName="r" values="34;36;34" dur="3s" repeatCount="indefinite"/>
              </circle>
              <circle cx="36" cy="36" r="34" stroke="rgba(255,255,255,.3)" stroke-width="1.5" fill="none" opacity="0">
                <animate attributeName="r" values="34;48;48" dur="2.5s" repeatCount="indefinite"/>
                <animate attributeName="opacity" values="0.5;0;0" dur="2.5s" repeatCount="indefinite"/>
              </circle>
              <!-- Rayo -->
              <path d="M40 18 L28 38 L36 38 L32 54 L44 34 L36 34 Z"
                fill="white" opacity=".95">
                <animate attributeName="opacity" values=".95;1;.95" dur="1.5s" repeatCount="indefinite"/>
              </path>
            </svg>
          </div>

          <h2 class="guest-hero-title" style="position:relative;z-index:1">Acceso Rápido</h2>
          <p class="guest-hero-sub" style="position:relative;z-index:1">
            Ingresa al examen sin necesidad de crear una cuenta
          </p>
        </div>

        <!-- Formulario -->
        <div class="guest-body">
          <form id="guest-form" style="display:flex;flex-direction:column;gap:1rem">
            <div class="form-group">
              <label class="label">
                <i class="fa-solid fa-user" style="margin-right:.4rem;color:#2563eb"></i>
                Tu nombre completo
              </label>
              <input class="input" type="text" id="guest-name"
                placeholder="Juan Pérez"
                required minlength="3" maxlength="50" autofocus/>
            </div>

            <div class="form-group">
              <label class="label">
                <i class="fa-solid fa-key" style="margin-right:.4rem;color:#2563eb"></i>
                Código del examen
              </label>
              <input class="input guest-code-input" type="text" id="guest-code"
                placeholder="ABC123" required maxlength="10"/>
            </div>

            <button type="submit" class="btn btn-primary btn-full" id="guest-btn"
              style="padding:.85rem;font-size:.95rem;border-radius:var(--radius-lg);margin-top:.25rem">
              <i class="fa-solid fa-bolt" style="margin-right:.4rem"></i>Comenzar examen
            </button>
          </form>

          <div class="info-box info-box-blue mt-4" style="font-size:.82rem">
            <div style="display:flex;flex-direction:column;gap:.35rem">
              <span><i class="fa-solid fa-circle-check" style="margin-right:.5rem;color:#2563eb"></i>No necesitas crear una cuenta</span>
              <span><i class="fa-solid fa-clock" style="margin-right:.5rem;color:#2563eb"></i>Tu sesión es temporal</span>
              <span><i class="fa-solid fa-shield-halved" style="margin-right:.5rem;color:#2563eb"></i>Tus respuestas se guardan automáticamente</span>
            </div>
          </div>

          <p style="text-align:center;margin-top:1.25rem;font-size:.85rem;color:var(--text-muted)">
            ¿Ya tienes cuenta?
            <a href="#/login" style="color:#2563eb;font-weight:600;text-decoration:none">Inicia sesión</a>
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
    if (!code)           { alert('❌ Ingresa el código del examen'); return; }

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:.4rem"></i>Verificando...';

    try {
      const res = await apiGetExamByCode(code);
      if (res?.ok && res.exam) {
        // Guardar el examen en sessionStorage para que renderStudent lo use directamente
        // y salte la pantalla de join — evita la doble pantalla
        try {
          sessionStorage.setItem('_guestExam', JSON.stringify(res.exam));
          sessionStorage.removeItem('_examReloadFlag');
        } catch (_) {}

        setUser({
          uid:      guestUid(),
          email:    `invitado_${Date.now()}@temporal.local`,
          name,
          role:     'estudiante',
          isGuest:  true,
          examCode: code
        });

        navigate('/estudiante');
      } else {
        alert('❌ Código de examen inválido');
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-bolt" style="margin-right:.4rem"></i>Comenzar examen';
      }
    } catch {
      alert('❌ Código de examen no encontrado');
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-bolt" style="margin-right:.4rem"></i>Comenzar examen';
    }
  };
}
