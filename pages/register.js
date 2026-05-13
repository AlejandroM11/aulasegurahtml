function renderRegister(app) {
  app.innerHTML = `
    <style>
      .reg-wrap {
        min-height: calc(100vh - var(--nav-height));
        display: grid;
        grid-template-columns: 1fr 460px 1fr;
        align-items: stretch;
        padding: 0; overflow: hidden;
      }
      @media (max-width: 1100px) {
        .reg-wrap { grid-template-columns: 1fr; padding: 2rem 1rem; }
        .reg-side  { display: none !important; }
      }
      .reg-side {
        display: flex; align-items: stretch;
        overflow: hidden;
        background: linear-gradient(160deg, #eff6ff 0%, #f5f3ff 100%);
      }
      body.dark .reg-side { background: linear-gradient(160deg, #0d1117 0%, #13111c 100%); }
      .reg-side svg { width: 100%; height: 100%; display: block; }
      .reg-form-col {
        display: flex; align-items: center; justify-content: center;
        padding: 2rem 1.5rem;
        background: var(--gray-50);
      }
      body.dark .reg-form-col { background: #0d1117; }
      .auth-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-2xl);
        padding: 2.25rem 2rem;
        width: 100%; max-width: 420px;
        box-shadow: 0 4px 24px rgba(0,0,0,.07);
        animation: cardIn .3s cubic-bezier(.4,0,.2,1) both;
      }
      body.dark .auth-card { background: var(--surface-raised); border-color: var(--border-strong); }
      .auth-title { font-size: 1.5rem; font-weight: 800; letter-spacing: -.025em; color: var(--text-primary); text-align: center; margin-bottom: .25rem; }
      .auth-sub   { text-align: center; color: var(--text-muted); font-size: .875rem; margin-bottom: 1.75rem; }
      .auth-divider {
        display: flex; align-items: center; gap: .75rem;
        margin: 1.1rem 0; color: var(--text-muted);
        font-size: .72rem; font-weight: 600; text-transform: uppercase; letter-spacing: .07em;
      }
      .auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
      body.dark .auth-divider::before, body.dark .auth-divider::after { background: var(--border-strong); }
      .auth-footer { text-align: center; margin-top: 1.25rem; font-size: .875rem; color: var(--text-muted); }
      .auth-footer a { color: var(--blue-600); font-weight: 600; text-decoration: none; }
      body.dark .auth-footer a { color: var(--blue-300); }
      .role-selector { display: grid; grid-template-columns: 1fr 1fr; gap: .5rem; margin-top: .35rem; }
      .role-option {
        border: 2px solid var(--border-strong); border-radius: var(--radius-lg);
        padding: .75rem .5rem; cursor: pointer; transition: all .18s;
        text-align: center; background: var(--surface);
      }
      .role-option:hover { border-color: var(--blue-400); background: var(--blue-50); }
      .role-option.selected { border-color: var(--blue-600); background: var(--blue-50); box-shadow: 0 0 0 1px var(--blue-600); }
      body.dark .role-option { background: var(--gray-900); border-color: var(--gray-700); }
      body.dark .role-option.selected { border-color: var(--blue-500); background: rgba(37,99,235,.12); }
      .role-option i { font-size: 1.3rem; display: block; margin-bottom: .35rem; }
      .role-option span { font-size: .82rem; font-weight: 600; color: var(--text-primary); }
    </style>

    <div class="reg-wrap">

      <!-- SVG izquierdo -->
      <div class="reg-side">
        <svg viewBox="0 0 300 800" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2563eb" stop-opacity=".85"/><stop offset="100%" stop-color="#7c3aed" stop-opacity=".2"/></linearGradient>
            <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7c3aed" stop-opacity=".75"/><stop offset="100%" stop-color="#2563eb" stop-opacity=".15"/></linearGradient>
            <linearGradient id="gl" x1="0" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#2563eb"/><stop offset="100%" stop-color="#7c3aed"/></linearGradient>
          </defs>

          <!-- Donut -->
          <g transform="translate(150,220)">
            <circle cx="0" cy="0" r="95" stroke="#e2e8f0" stroke-width="18" fill="none"/>
            <circle cx="0" cy="0" r="95" stroke="#2563eb" stroke-width="18" fill="none" stroke-dasharray="230 367" stroke-linecap="round">
              <animateTransform attributeName="transform" type="rotate" values="-90;270" dur="9s" repeatCount="indefinite"/>
              <animate attributeName="stroke-dasharray" values="230 367;290 307;230 367" dur="4.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0" cy="0" r="95" stroke="#7c3aed" stroke-width="18" fill="none" stroke-dasharray="115 482" stroke-dashoffset="-242" stroke-linecap="round">
              <animateTransform attributeName="transform" type="rotate" values="-90;270" dur="9s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0" cy="0" r="95" stroke="#22c55e" stroke-width="18" fill="none" stroke-dasharray="55 542" stroke-dashoffset="-368" stroke-linecap="round">
              <animateTransform attributeName="transform" type="rotate" values="-90;270" dur="9s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0" cy="0" r="58" fill="white" opacity=".95"><animate attributeName="r" values="58;61;58" dur="3s" repeatCount="indefinite"/></circle>
            <circle cx="0" cy="0" r="13" fill="#2563eb"><animate attributeName="fill" values="#2563eb;#7c3aed;#2563eb" dur="4.5s" repeatCount="indefinite"/><animate attributeName="r" values="13;16;13" dur="3s" repeatCount="indefinite"/></circle>
          </g>

          <!-- Barras -->
          <rect x="22"  y="500" width="32" height="0" rx="8" fill="url(#g1)"><animate attributeName="height" values="0;140;110;140" dur="3s"   repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/><animate attributeName="y" values="500;360;390;360" dur="3s"   repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/></rect>
          <rect x="64"  y="500" width="32" height="0" rx="8" fill="url(#g2)"><animate attributeName="height" values="0;95;180;95"   dur="3.5s" begin=".25s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/><animate attributeName="y" values="500;405;320;405" dur="3.5s" begin=".25s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/></rect>
          <rect x="106" y="500" width="32" height="0" rx="8" fill="url(#g1)"><animate attributeName="height" values="0;165;105;165" dur="4s"   begin=".5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/><animate attributeName="y" values="500;335;395;335" dur="4s"   begin=".5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/></rect>
          <rect x="148" y="500" width="32" height="0" rx="8" fill="url(#g2)"><animate attributeName="height" values="0;75;150;75"   dur="3.2s" begin=".75s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/><animate attributeName="y" values="500;425;350;425" dur="3.2s" begin=".75s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/></rect>
          <rect x="190" y="500" width="32" height="0" rx="8" fill="url(#g1)"><animate attributeName="height" values="0;120;170;120" dur="3.8s" begin="1s"   repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/><animate attributeName="y" values="500;380;330;380" dur="3.8s" begin="1s"   repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/></rect>
          <rect x="232" y="500" width="32" height="0" rx="8" fill="url(#g2)"><animate attributeName="height" values="0;100;155;100" dur="4.2s" begin="1.25s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/><animate attributeName="y" values="500;400;345;400" dur="4.2s" begin="1.25s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/></rect>
          <line x1="10" y1="502" x2="290" y2="502" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4 3"/>

          <!-- Línea tendencia -->
          <polyline points="38,465 80,485 122,445 164,470 206,442 248,458" stroke="url(#gl)" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="380" stroke-dashoffset="380">
            <animate attributeName="stroke-dashoffset" values="380;0;0;380" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.2 1 0.4 0;0.4 0 0.2 1"/>
          </polyline>

          <!-- Partículas -->
          <circle cx="25"  cy="70"  r="3" fill="#2563eb" opacity=".2"><animate attributeName="cy" values="70;45;70"   dur="6s" repeatCount="indefinite"/></circle>
          <circle cx="265" cy="100" r="2" fill="#7c3aed" opacity=".2"><animate attributeName="cy" values="100;75;100" dur="5s" begin="1s" repeatCount="indefinite"/></circle>
          <circle cx="150" cy="680" r="3" fill="#2563eb" opacity=".2"><animate attributeName="cy" values="680;655;680" dur="5.5s" repeatCount="indefinite"/></circle>
          <circle cx="60"  cy="720" r="2" fill="#7c3aed" opacity=".2"><animate attributeName="cy" values="720;695;720" dur="4.5s" begin="2s" repeatCount="indefinite"/></circle>
        </svg>
      </div>

      <!-- Formulario central -->
      <div class="reg-form-col">
        <div class="auth-card">
          <div style="display:flex;justify-content:center;margin-bottom:1.25rem">
            <svg width="100" height="100" viewBox="0 0 110 110" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter:drop-shadow(0 8px 24px rgba(124,58,237,.3))">
              <defs>
                <linearGradient id="rgBg" x1="0" y1="0" x2="110" y2="110" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#4c1d95"/><stop offset="100%" stop-color="#7c3aed"/></linearGradient>
                <linearGradient id="rgUser" x1="20" y1="20" x2="90" y2="90" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#c4b5fd"/><stop offset="100%" stop-color="#ffffff"/></linearGradient>
                <linearGradient id="rgPlus" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#34d399"/><stop offset="100%" stop-color="#10b981"/></linearGradient>
              </defs>
              <circle cx="55" cy="55" r="50" fill="url(#rgBg)"><animate attributeName="r" values="50;52;50" dur="3.5s" repeatCount="indefinite"/></circle>
              <circle cx="55" cy="55" r="50" stroke="#a78bfa" stroke-width="1.5" fill="none" opacity="0"><animate attributeName="r" values="50;68;68" dur="2.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.5;0;0" dur="2.8s" repeatCount="indefinite"/></circle>
              <circle cx="55" cy="38" r="13" fill="url(#rgUser)"><animate attributeName="r" values="13;14;13" dur="2s" repeatCount="indefinite"/></circle>
              <path d="M28 80 c0-15 12-24 27-24 s27 9 27 24" fill="url(#rgUser)" opacity="0.95"/>
              <g><animateTransform attributeName="transform" type="scale" values="0.5;1;1;0.5" dur="2.5s" repeatCount="indefinite" additive="sum" calcMode="spline" keySplines="0.4 0 0.2 1; 0.2 1 0.4 0; 0.4 0 0.2 1"/><animate attributeName="opacity" values="0;1;1;0" dur="2.5s" repeatCount="indefinite"/><circle cx="76" cy="36" r="13" fill="url(#rgPlus)"/><line x1="70" y1="36" x2="82" y2="36" stroke="white" stroke-width="3" stroke-linecap="round"/><line x1="76" y1="30" x2="76" y2="42" stroke="white" stroke-width="3" stroke-linecap="round"/></g>
              <path d="M43 68 l8 8 16-16" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke-dasharray="30" stroke-dashoffset="30" opacity="0"><animate attributeName="stroke-dashoffset" values="30;0;0;30" dur="2.5s" begin="0.5s" repeatCount="indefinite"/><animate attributeName="opacity" values="0;1;1;0" dur="2.5s" begin="0.5s" repeatCount="indefinite"/></path>
            </svg>
          </div>

          <h2 class="auth-title">Crear cuenta</h2>
          <p class="auth-sub">Únete a Aula Segura</p>

          <form id="reg-form" style="display:flex;flex-direction:column;gap:.9rem">
            <div class="form-group">
              <label class="label">Nombre completo</label>
              <input class="input" type="text" id="reg-name" placeholder="Juan Pérez"/>
            </div>
            <div class="form-group">
              <label class="label">Correo</label>
              <input class="input" type="email" id="reg-email" required placeholder="correo@ejemplo.com"/>
              <p id="reg-email-error" class="text-xs" style="min-height:1rem;margin-top:.2rem"></p>
            </div>
            <div class="form-group">
              <label class="label">Contraseña</label>
              <input class="input" type="password" id="reg-pw" required minlength="6" placeholder="Mínimo 6 caracteres"/>
            </div>
            <div class="form-group">
              <label class="label">Rol</label>
              <div class="role-selector">
                <div class="role-option selected" data-role="estudiante" id="role-estudiante">
                  <i class="fa-solid fa-user-graduate" style="color:#16a34a"></i>
                  <span>Estudiante</span>
                </div>
                <div class="role-option" data-role="docente" id="role-docente">
                  <i class="fa-solid fa-chalkboard-user" style="color:#2563eb"></i>
                  <span>Docente</span>
                </div>
              </div>
              <input type="hidden" id="reg-role" value="estudiante"/>
            </div>
            <button type="submit" class="btn btn-primary btn-full" id="reg-btn" style="padding:.8rem;font-size:.95rem;border-radius:var(--radius-lg)">
              <i class="fa-solid fa-user-plus" style="margin-right:.4rem"></i>Registrarme
            </button>
          </form>

          <div class="auth-divider">O regístrate con</div>
          <button class="btn btn-outline btn-full" id="google-reg-btn" style="padding:.7rem;gap:.6rem;border-radius:var(--radius-lg)">
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:1.1rem;height:1.1rem"/>
            Continuar con Google
          </button>

          <p class="auth-footer">¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a></p>
        </div>
      </div>

      <!-- SVG derecho -->
      <div class="reg-side">
        <svg viewBox="0 0 300 800" preserveAspectRatio="xMidYMid meet" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="wa1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7c3aed" stop-opacity=".28"/><stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/></linearGradient>
            <linearGradient id="wa2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2563eb" stop-opacity=".2"/><stop offset="100%" stop-color="#2563eb" stop-opacity="0"/></linearGradient>
            <linearGradient id="wl1" x1="0" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#2563eb"/></linearGradient>
            <linearGradient id="wl2" x1="0" y1="0" x2="300" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#2563eb"/><stop offset="100%" stop-color="#22c55e"/></linearGradient>
          </defs>

          <!-- Círculos orbitales arriba -->
          <g transform="translate(150,180)">
            <circle cx="0" cy="0" r="100" stroke="#7c3aed" stroke-width="1.2" fill="none" stroke-dasharray="7 5" opacity=".2">
              <animateTransform attributeName="transform" type="rotate" values="0;360" dur="22s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0" cy="0" r="65" stroke="#2563eb" stroke-width="1" fill="none" stroke-dasharray="5 4" opacity=".2">
              <animateTransform attributeName="transform" type="rotate" values="360;0" dur="15s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0" cy="0" r="35" stroke="#7c3aed" stroke-width="1" fill="none" stroke-dasharray="3 3" opacity=".15">
              <animateTransform attributeName="transform" type="rotate" values="0;360" dur="9s" repeatCount="indefinite"/>
            </circle>
            <!-- Punto en órbita exterior -->
            <circle cx="100" cy="0" r="7" fill="#7c3aed" opacity=".7">
              <animateTransform attributeName="transform" type="rotate" values="0;360" dur="22s" repeatCount="indefinite"/>
              <animate attributeName="r" values="7;9;7" dur="3s" repeatCount="indefinite"/>
            </circle>
            <!-- Punto en órbita media -->
            <circle cx="65" cy="0" r="5" fill="#2563eb" opacity=".7">
              <animateTransform attributeName="transform" type="rotate" values="120;480" dur="15s" repeatCount="indefinite"/>
            </circle>
            <!-- Punto en órbita interior -->
            <circle cx="35" cy="0" r="4" fill="#22c55e" opacity=".8">
              <animateTransform attributeName="transform" type="rotate" values="240;600" dur="9s" repeatCount="indefinite"/>
              <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite"/>
            </circle>
            <!-- Centro -->
            <circle cx="0" cy="0" r="14" fill="#7c3aed" opacity=".3">
              <animate attributeName="r" values="14;18;14" dur="3s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0" cy="0" r="7" fill="#7c3aed" opacity=".8">
              <animate attributeName="r" values="7;9;7" dur="3s" repeatCount="indefinite"/>
            </circle>
          </g>

          <!-- Onda 1 -->
          <path d="M0,430 C60,400 90,460 150,420 C210,380 240,440 300,405 L300,580 L0,580 Z" fill="url(#wa1)">
            <animate attributeName="d" values="M0,430 C60,400 90,460 150,420 C210,380 240,440 300,405 L300,580 L0,580 Z;M0,415 C60,445 90,395 150,435 C210,410 240,390 300,420 L300,580 L0,580 Z;M0,430 C60,400 90,460 150,420 C210,380 240,440 300,405 L300,580 L0,580 Z" dur="6s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1"/>
          </path>
          <path d="M0,430 C60,400 90,460 150,420 C210,380 240,440 300,405" stroke="url(#wl1)" stroke-width="2.5" fill="none" stroke-linecap="round">
            <animate attributeName="d" values="M0,430 C60,400 90,460 150,420 C210,380 240,440 300,405;M0,415 C60,445 90,395 150,435 C210,410 240,390 300,420;M0,430 C60,400 90,460 150,420 C210,380 240,440 300,405" dur="6s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1"/>
          </path>

          <!-- Onda 2 -->
          <path d="M0,475 C70,450 100,500 160,465 C220,430 255,485 300,455 L300,580 L0,580 Z" fill="url(#wa2)">
            <animate attributeName="d" values="M0,475 C70,450 100,500 160,465 C220,430 255,485 300,455 L300,580 L0,580 Z;M0,460 C70,485 100,445 160,480 C220,455 255,440 300,470 L300,580 L0,580 Z;M0,475 C70,450 100,500 160,465 C220,430 255,485 300,455 L300,580 L0,580 Z" dur="7s" begin="1s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1"/>
          </path>
          <path d="M0,475 C70,450 100,500 160,465 C220,430 255,485 300,455" stroke="url(#wl2)" stroke-width="2" fill="none" stroke-linecap="round" opacity=".65">
            <animate attributeName="d" values="M0,475 C70,450 100,500 160,465 C220,430 255,485 300,455;M0,460 C70,485 100,445 160,480 C220,455 255,440 300,470;M0,475 C70,450 100,500 160,465 C220,430 255,485 300,455" dur="7s" begin="1s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1"/>
          </path>
          <line x1="0" y1="582" x2="300" y2="582" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="4 3"/>

          <!-- Punto deslizante -->
          <circle r="7" fill="#7c3aed" stroke="white" stroke-width="2.5">
            <animateMotion dur="6s" repeatCount="indefinite"><mpath href="#wp1"/></animateMotion>
          </circle>
          <path id="wp1" d="M0,430 C60,400 90,460 150,420 C210,380 240,440 300,405" fill="none"/>

          <!-- Partículas -->
          <circle cx="30"  cy="650" r="3" fill="#7c3aed" opacity=".2"><animate attributeName="cy" values="650;625;650" dur="5s" repeatCount="indefinite"/></circle>
          <circle cx="240" cy="680" r="2" fill="#2563eb" opacity=".2"><animate attributeName="cy" values="680;655;680" dur="4.5s" begin="1s" repeatCount="indefinite"/></circle>
          <circle cx="140" cy="720" r="2.5" fill="#22c55e" opacity=".2"><animate attributeName="cy" values="720;695;720" dur="6s" begin=".5s" repeatCount="indefinite"/></circle>
          <circle cx="50"  cy="50"  r="2.5" fill="#7c3aed" opacity=".2"><animate attributeName="cy" values="50;30;50" dur="5s" repeatCount="indefinite"/></circle>
          <circle cx="260" cy="70"  r="2"   fill="#2563eb" opacity=".2"><animate attributeName="cy" values="70;50;70" dur="4s" begin="2s" repeatCount="indefinite"/></circle>
        </svg>
      </div>

    </div>

    <!-- Modal Google -->
    <div id="google-pw-modal" class="modal-overlay" style="display:none">
      <div class="modal-box" style="max-width:480px">
        <div style="text-align:center;margin-bottom:1.25rem">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:2.5rem;margin-bottom:.75rem"/>
          <h3 class="font-bold" style="font-size:1.2rem">Crea tu contraseña</h3>
          <p class="text-gray text-sm mt-1">Así también podrás iniciar sesión con tu correo y contraseña.</p>
        </div>
        <div id="google-pw-user-info" style="background:var(--gray-100);border-radius:var(--radius-lg);padding:.75rem 1rem;margin-bottom:1rem;display:flex;align-items:center;gap:.75rem">
          <img id="google-pw-photo" src="" style="width:2.5rem;height:2.5rem;border-radius:50%;object-fit:cover;display:none"/>
          <div><p class="font-bold text-sm" id="google-pw-name"></p><p class="text-xs text-gray" id="google-pw-email"></p></div>
        </div>
        <div class="space-y">
          <div class="form-group"><label class="label">Nueva contraseña</label><input class="input" type="password" id="google-pw-input" placeholder="Mínimo 6 caracteres" minlength="6"/></div>
          <div class="form-group"><label class="label">Confirmar contraseña</label><input class="input" type="password" id="google-pw-confirm" placeholder="Repite la contraseña"/><p id="google-pw-error" class="text-xs" style="min-height:1rem;margin-top:.25rem;color:#dc2626"></p></div>
        </div>
        <div class="flex-row mt-4">
          <button class="btn btn-outline" style="flex:1" id="google-pw-skip">Omitir</button>
          <button class="btn btn-primary" style="flex:1" id="google-pw-save"><i class="fa-solid fa-lock" style="margin-right:.4rem"></i>Guardar</button>
        </div>
      </div>
    </div>
  `;

  const btn = document.getElementById('reg-btn');
  bindEmailValidation('reg-email', 'reg-email-error');

  document.querySelectorAll('.role-option').forEach(opt => {
    opt.onclick = () => {
      document.querySelectorAll('.role-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      document.getElementById('reg-role').value = opt.dataset.role;
    };
  });

  document.getElementById('reg-form').onsubmit = async (e) => {
    e.preventDefault();
    const email = document.getElementById('reg-email').value;
    const pw    = document.getElementById('reg-pw').value;
    const name  = document.getElementById('reg-name').value;
    const role  = document.getElementById('reg-role').value;
    if (!isValidEmailDomain(email)) { alert(getEmailValidationError(email)); return; }
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:.4rem"></i>Registrando...';
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
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-user-plus" style="margin-right:.4rem"></i>Registrarme';
    }
  };

  document.getElementById('google-reg-btn').onclick = async () => {
    const role = document.getElementById('reg-role').value;
    try {
      const result = await fbAuth.signInWithPopup(googleProvider);
      const u = result.user;
      const snap = await fbDB.ref(`users/${u.uid}`).get();
      if (snap.exists()) { const userData = snap.val(); setUser(userData); redirectByRole(userData); return; }
      const newUser = { uid: u.uid, email: u.email, name: u.displayName || '', photo: u.photoURL || '', role, fromGoogle: true, createdAt: new Date().toISOString() };
      await fbDB.ref(`users/${u.uid}`).set(newUser);
      setUser(newUser);
      showGooglePasswordModal(u, newUser);
    } catch (err) { alert('Error al registrarse con Google: ' + err.message); }
  };

  function showGooglePasswordModal(firebaseUser, userData) {
    const modal = document.getElementById('google-pw-modal');
    document.getElementById('google-pw-name').textContent  = userData.name  || 'Usuario';
    document.getElementById('google-pw-email').textContent = userData.email || '';
    const photoEl = document.getElementById('google-pw-photo');
    if (userData.photo) { photoEl.src = userData.photo; photoEl.style.display = 'block'; }
    modal.style.display = 'flex';
    const pwInput   = document.getElementById('google-pw-input');
    const pwConfirm = document.getElementById('google-pw-confirm');
    const pwError   = document.getElementById('google-pw-error');
    const saveBtn   = document.getElementById('google-pw-save');
    pwInput.focus();
    pwConfirm.oninput = () => { pwError.textContent = (pwConfirm.value && pwInput.value !== pwConfirm.value) ? '❌ Las contraseñas no coinciden' : ''; };
    document.getElementById('google-pw-skip').onclick = () => { modal.style.display = 'none'; redirectByRole(userData); };
    saveBtn.onclick = async () => {
      const pw = pwInput.value.trim(), confirm = pwConfirm.value.trim();
      if (pw.length < 6)  { pwError.textContent = '❌ Mínimo 6 caracteres'; return; }
      if (pw !== confirm) { pwError.textContent = '❌ Las contraseñas no coinciden'; return; }
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:.4rem"></i>Guardando...';
      try {
        await firebaseUser.updatePassword(pw);
        await fbDB.ref(`users/${firebaseUser.uid}`).update({ hasPassword: true });
        modal.style.display = 'none';
        alert('✅ Contraseña creada.');
        redirectByRole(userData);
      } catch (err) {
        pwError.textContent = err.code === 'auth/requires-recent-login' ? '⚠️ Vuelve a iniciar sesión con Google.' : '❌ Error: ' + err.message;
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-lock" style="margin-right:.4rem"></i>Guardar';
      }
    };
  }
}
