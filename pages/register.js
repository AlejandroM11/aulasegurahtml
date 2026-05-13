function renderRegister(app) {
  app.innerHTML = `
    <style>
      .reg-wrap {
        min-height: calc(100vh - var(--nav-height));
        display: grid;
        grid-template-columns: 1fr 480px 1fr;
        align-items: stretch;
        padding: 0;
        position: relative;
        overflow: hidden;
      }
      @media (max-width: 1100px) {
        .reg-wrap { grid-template-columns: 1fr; align-items: center; padding: 2rem 1rem; }
        .reg-side  { display: none !important; }
      }
      .reg-side {
        display: flex;
        align-items: center; justify-content: center;
        overflow: hidden;
        min-height: calc(100vh - var(--nav-height));
      }
      .reg-side svg {
        width: 100%;
        height: 100%;
        min-height: calc(100vh - var(--nav-height));
      }
      .auth-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: var(--radius-2xl);
        padding: 2.5rem 2.25rem;
        width: 480px;
        max-width: 480px;
        min-width: 480px;
        box-shadow: 0 4px 24px rgba(0,0,0,.07), 0 1px 4px rgba(0,0,0,.04);
        animation: cardIn .3s cubic-bezier(.4,0,.2,1) both;
        position: relative; z-index: 1;
        margin: 2rem 0;
        align-self: center;
        justify-self: center;
      }
      body.dark .auth-card { background: var(--surface-raised); border-color: var(--border-strong); }
      .auth-title {
        font-size: 1.6rem; font-weight: 800; letter-spacing: -.025em;
        color: var(--text-primary); text-align: center; margin-bottom: .3rem;
      }
      .auth-sub { text-align: center; color: var(--text-muted); font-size: .875rem; margin-bottom: 2rem; }
      .auth-divider {
        display: flex; align-items: center; gap: .75rem;
        margin: 1.25rem 0; color: var(--text-muted);
        font-size: .75rem; font-weight: 600; text-transform: uppercase; letter-spacing: .07em;
      }
      .auth-divider::before, .auth-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
      body.dark .auth-divider::before, body.dark .auth-divider::after { background: var(--border-strong); }
      .auth-footer { text-align: center; margin-top: 1.5rem; font-size: .875rem; color: var(--text-muted); }
      .auth-footer a { color: var(--blue-600); font-weight: 600; text-decoration: none; }
      .auth-footer a:hover { text-decoration: underline; }
      body.dark .auth-footer a { color: var(--blue-300); }
      .role-selector { display: grid; grid-template-columns: 1fr 1fr; gap: .6rem; margin-top: .4rem; }
      .role-option {
        border: 2px solid var(--border-strong); border-radius: var(--radius-lg);
        padding: .85rem .75rem; cursor: pointer; transition: all .18s;
        text-align: center; background: var(--surface);
      }
      .role-option:hover { border-color: var(--blue-400); background: var(--blue-50); }
      .role-option.selected { border-color: var(--blue-600); background: var(--blue-50); box-shadow: 0 0 0 1px var(--blue-600); }
      body.dark .role-option { background: var(--gray-900); border-color: var(--gray-700); }
      body.dark .role-option:hover { border-color: var(--blue-500); background: rgba(37,99,235,.08); }
      body.dark .role-option.selected { border-color: var(--blue-500); background: rgba(37,99,235,.12); }
      .role-option i { font-size: 1.4rem; display: block; margin-bottom: .4rem; }
      .role-option span { font-size: .85rem; font-weight: 600; color: var(--text-primary); }
    </style>

    <div class="reg-wrap">

      <!-- Panel izquierdo — gráfico sutil centrado -->
      <div class="reg-side">
        <svg viewBox="0 0 260 600" fill="none" xmlns="http://www.w3.org/2000/svg"
          style="width:100%;height:100%;max-height:calc(100vh - var(--nav-height))">
          <defs>
            <linearGradient id="bG1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#2563eb" stop-opacity=".8"/>
              <stop offset="100%" stop-color="#7c3aed" stop-opacity=".2"/>
            </linearGradient>
            <linearGradient id="bG2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#7c3aed" stop-opacity=".7"/>
              <stop offset="100%" stop-color="#2563eb" stop-opacity=".15"/>
            </linearGradient>
            <linearGradient id="lG" x1="0" y1="0" x2="260" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#2563eb"/>
              <stop offset="100%" stop-color="#7c3aed"/>
            </linearGradient>
          </defs>

          <!-- Donut centrado verticalmente -->
          <g transform="translate(130, 185)">
            <circle cx="0" cy="0" r="90" stroke="#e2e8f0" stroke-width="16" fill="none"/>
            <circle cx="0" cy="0" r="90" stroke="#2563eb" stroke-width="16" fill="none"
              stroke-dasharray="220 345" stroke-linecap="round">
              <animateTransform attributeName="transform" type="rotate" values="-90;270" dur="9s" repeatCount="indefinite"/>
              <animate attributeName="stroke-dasharray" values="220 345;280 285;220 345" dur="4.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0" cy="0" r="90" stroke="#7c3aed" stroke-width="16" fill="none"
              stroke-dasharray="110 455" stroke-dashoffset="-230" stroke-linecap="round">
              <animateTransform attributeName="transform" type="rotate" values="-90;270" dur="9s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0" cy="0" r="90" stroke="#22c55e" stroke-width="16" fill="none"
              stroke-dasharray="50 515" stroke-dashoffset="-350" stroke-linecap="round">
              <animateTransform attributeName="transform" type="rotate" values="-90;270" dur="9s" repeatCount="indefinite"/>
            </circle>
            <!-- Centro -->
            <circle cx="0" cy="0" r="55" fill="white" opacity=".95">
              <animate attributeName="r" values="55;58;55" dur="3s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0" cy="0" r="12" fill="#2563eb">
              <animate attributeName="fill" values="#2563eb;#7c3aed;#2563eb" dur="4.5s" repeatCount="indefinite"/>
              <animate attributeName="r" values="12;15;12" dur="3s" repeatCount="indefinite"/>
            </circle>
          </g>

          <!-- Barras debajo del donut -->
          <g>
            <rect x="18"  y="420" width="30" height="0" rx="8" fill="url(#bG1)">
              <animate attributeName="height" values="0;130;105;130" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
              <animate attributeName="y"      values="420;290;315;290" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
            </rect>
            <rect x="58"  y="420" width="30" height="0" rx="8" fill="url(#bG2)">
              <animate attributeName="height" values="0;90;170;90" dur="3.5s" begin=".25s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
              <animate attributeName="y"      values="420;330;250;330" dur="3.5s" begin=".25s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
            </rect>
            <rect x="98"  y="420" width="30" height="0" rx="8" fill="url(#bG1)">
              <animate attributeName="height" values="0;155;100;155" dur="4s" begin=".5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
              <animate attributeName="y"      values="420;265;320;265" dur="4s" begin=".5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
            </rect>
            <rect x="138" y="420" width="30" height="0" rx="8" fill="url(#bG2)">
              <animate attributeName="height" values="0;70;140;70" dur="3.2s" begin=".75s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
              <animate attributeName="y"      values="420;350;280;350" dur="3.2s" begin=".75s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
            </rect>
            <rect x="178" y="420" width="30" height="0" rx="8" fill="url(#bG1)">
              <animate attributeName="height" values="0;115;160;115" dur="3.8s" begin="1s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
              <animate attributeName="y"      values="420;305;260;305" dur="3.8s" begin="1s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
            </rect>
            <rect x="218" y="420" width="30" height="0" rx="8" fill="url(#bG2)">
              <animate attributeName="height" values="0;95;145;95" dur="4.2s" begin="1.25s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
              <animate attributeName="y"      values="420;325;275;325" dur="4.2s" begin="1.25s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
            </rect>
            <line x1="8" y1="422" x2="252" y2="422" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4 3"/>
          </g>

          <!-- Línea de tendencia -->
          <polyline points="33,390 73,410 113,370 153,395 193,368 233,380"
            stroke="url(#lG)" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"
            stroke-dasharray="350" stroke-dashoffset="350">
            <animate attributeName="stroke-dashoffset" values="350;0;0;350" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.2 1 0.4 0;0.4 0 0.2 1"/>
          </polyline>

          <!-- Partículas sutiles -->
          <circle cx="20"  cy="50"  r="3" fill="#2563eb" opacity=".2"><animate attributeName="cy" values="50;30;50"   dur="6s" repeatCount="indefinite"/></circle>
          <circle cx="230" cy="80"  r="2" fill="#7c3aed" opacity=".25"><animate attributeName="cy" values="80;55;80"   dur="5s" begin="1s" repeatCount="indefinite"/></circle>
          <circle cx="130" cy="540" r="3" fill="#2563eb" opacity=".2"><animate attributeName="cy" values="540;520;540" dur="5.5s" repeatCount="indefinite"/></circle>
          <circle cx="60"  cy="570" r="2" fill="#7c3aed" opacity=".2"><animate attributeName="cy" values="570;550;570" dur="4.5s" begin="2s" repeatCount="indefinite"/></circle>
        </svg>
      </div>
          <defs>
            <linearGradient id="barGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#2563eb"/>
              <stop offset="100%" stop-color="#7c3aed" stop-opacity=".4"/>
            </linearGradient>
            <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#7c3aed"/>
              <stop offset="100%" stop-color="#2563eb" stop-opacity=".3"/>
            </linearGradient>
            <linearGradient id="lineGrad" x1="0" y1="0" x2="280" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#2563eb"/>
              <stop offset="100%" stop-color="#7c3aed"/>
            </linearGradient>
            <linearGradient id="bgLeft" x1="0" y1="0" x2="280" y2="700" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#eff6ff"/>
              <stop offset="100%" stop-color="#f5f3ff"/>
            </linearGradient>
          </defs>

          <!-- Fondo suave -->
          <rect width="280" height="700" fill="url(#bgLeft)"/>

          <!-- Donut chart -->
          <g transform="translate(140, 160)">
            <circle cx="0" cy="0" r="80" stroke="#e2e8f0" stroke-width="18" fill="none"/>
            <circle cx="0" cy="0" r="80" stroke="#2563eb" stroke-width="18" fill="none"
              stroke-dasharray="200 302" stroke-dashoffset="0" stroke-linecap="round">
              <animateTransform attributeName="transform" type="rotate" values="0;360" dur="8s" repeatCount="indefinite"/>
              <animate attributeName="stroke-dasharray" values="200 302;260 242;200 302" dur="4s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0" cy="0" r="80" stroke="#7c3aed" stroke-width="18" fill="none"
              stroke-dasharray="100 402" stroke-dashoffset="-210" stroke-linecap="round">
              <animateTransform attributeName="transform" type="rotate" values="0;360" dur="8s" repeatCount="indefinite"/>
              <animate attributeName="stroke-dasharray" values="100 402;70 432;100 402" dur="4s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0" cy="0" r="80" stroke="#22c55e" stroke-width="18" fill="none"
              stroke-dasharray="55 447" stroke-dashoffset="-320" stroke-linecap="round">
              <animateTransform attributeName="transform" type="rotate" values="0;360" dur="8s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0" cy="0" r="48" fill="white" opacity=".9">
              <animate attributeName="r" values="48;51;48" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0" cy="0" r="14" fill="#2563eb">
              <animate attributeName="r" values="14;17;14" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="fill" values="#2563eb;#7c3aed;#2563eb" dur="4s" repeatCount="indefinite"/>
            </circle>
          </g>

          <!-- Barras -->
          <g>
            <rect x="20"  y="420" width="34" height="0" rx="7" fill="url(#barGrad1)">
              <animate attributeName="height" values="0;160;130;160" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
              <animate attributeName="y"      values="420;260;290;260" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
            </rect>
            <rect x="64"  y="420" width="34" height="0" rx="7" fill="url(#barGrad2)">
              <animate attributeName="height" values="0;100;200;100" dur="3.5s" begin=".3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
              <animate attributeName="y"      values="420;320;220;320" dur="3.5s" begin=".3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
            </rect>
            <rect x="108" y="420" width="34" height="0" rx="7" fill="url(#barGrad1)">
              <animate attributeName="height" values="0;180;110;180" dur="4s" begin=".6s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
              <animate attributeName="y"      values="420;240;310;240" dur="4s" begin=".6s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
            </rect>
            <rect x="152" y="420" width="34" height="0" rx="7" fill="url(#barGrad2)">
              <animate attributeName="height" values="0;80;150;80" dur="3.2s" begin=".9s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
              <animate attributeName="y"      values="420;340;270;340" dur="3.2s" begin=".9s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
            </rect>
            <rect x="196" y="420" width="34" height="0" rx="7" fill="url(#barGrad1)">
              <animate attributeName="height" values="0;130;190;130" dur="3.8s" begin="1.2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
              <animate attributeName="y"      values="420;290;230;290" dur="3.8s" begin="1.2s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
            </rect>
            <rect x="240" y="420" width="34" height="0" rx="7" fill="url(#barGrad2)">
              <animate attributeName="height" values="0;110;160;110" dur="4.2s" begin="1.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
              <animate attributeName="y"      values="420;310;260;310" dur="4.2s" begin="1.5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1;0.4 0 0.2 1"/>
            </rect>
            <line x1="10" y1="422" x2="270" y2="422" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4 3"/>
          </g>

          <!-- Línea de tendencia -->
          <polyline points="37,360 81,390 125,330 169,370 213,340 257,355"
            stroke="url(#lineGrad)" stroke-width="2.5" fill="none"
            stroke-linecap="round" stroke-linejoin="round"
            stroke-dasharray="400" stroke-dashoffset="400">
            <animate attributeName="stroke-dashoffset" values="400;0;0;400" dur="4s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.2 1 0.4 0;0.4 0 0.2 1"/>
          </polyline>

          <!-- Partículas -->
          <circle cx="30"  cy="550" r="4" fill="#2563eb" opacity=".3"><animate attributeName="cy" values="550;520;550" dur="5s" repeatCount="indefinite"/></circle>
          <circle cx="220" cy="580" r="3" fill="#7c3aed" opacity=".4"><animate attributeName="cy" values="580;550;580" dur="4.5s" begin="1s" repeatCount="indefinite"/></circle>
          <circle cx="140" cy="620" r="3" fill="#22c55e" opacity=".3"><animate attributeName="cy" values="620;595;620" dur="6s" begin=".5s" repeatCount="indefinite"/></circle>
          <circle cx="60"  cy="650" r="2.5" fill="#2563eb" opacity=".25"><animate attributeName="cy" values="650;625;650" dur="5.5s" begin="2s" repeatCount="indefinite"/></circle>
          <circle cx="250" cy="640" r="2" fill="#7c3aed" opacity=".3"><animate attributeName="cy" values="640;615;640" dur="4s" begin="1.5s" repeatCount="indefinite"/></circle>
        </svg>
      </div>

      <!-- Formulario central -->
      <div class="auth-card">
        <div style="display:flex;justify-content:center;margin-bottom:1.5rem">
          <svg width="110" height="110" viewBox="0 0 110 110" fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style="filter:drop-shadow(0 8px 24px rgba(124,58,237,.3))">
            <defs>
              <linearGradient id="rgBg" x1="0" y1="0" x2="110" y2="110" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#4c1d95"/>
                <stop offset="100%" stop-color="#7c3aed"/>
              </linearGradient>
              <linearGradient id="rgUser" x1="20" y1="20" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#c4b5fd"/>
                <stop offset="100%" stop-color="#ffffff"/>
              </linearGradient>
              <linearGradient id="rgPlus" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#34d399"/>
                <stop offset="100%" stop-color="#10b981"/>
              </linearGradient>
            </defs>
            <circle cx="55" cy="55" r="50" fill="url(#rgBg)">
              <animate attributeName="r" values="50;52;50" dur="3.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="55" cy="55" r="50" stroke="#a78bfa" stroke-width="1.5" fill="none" opacity="0">
              <animate attributeName="r" values="50;68;68" dur="2.8s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.5;0;0" dur="2.8s" repeatCount="indefinite"/>
            </circle>
            <circle cx="55" cy="55" r="50" stroke="#7c3aed" stroke-width="1" fill="none" opacity="0">
              <animate attributeName="r" values="50;68;68" dur="2.8s" begin="1.4s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.3;0;0" dur="2.8s" begin="1.4s" repeatCount="indefinite"/>
            </circle>
            <circle cx="55" cy="38" r="13" fill="url(#rgUser)">
              <animate attributeName="r" values="13;14;13" dur="2s" repeatCount="indefinite"/>
            </circle>
            <path d="M28 80 c0-15 12-24 27-24 s27 9 27 24" fill="url(#rgUser)" opacity="0.95"/>
            <g>
              <animateTransform attributeName="transform" type="scale"
                values="0.5;1;1;0.5" dur="2.5s" repeatCount="indefinite"
                additive="sum" calcMode="spline" keySplines="0.4 0 0.2 1; 0.2 1 0.4 0; 0.4 0 0.2 1"/>
              <animate attributeName="opacity" values="0;1;1;0" dur="2.5s" repeatCount="indefinite"/>
              <circle cx="76" cy="36" r="13" fill="url(#rgPlus)"/>
              <line x1="70" y1="36" x2="82" y2="36" stroke="white" stroke-width="3" stroke-linecap="round"/>
              <line x1="76" y1="30" x2="76" y2="42" stroke="white" stroke-width="3" stroke-linecap="round"/>
            </g>
            <g opacity="0">
              <animate attributeName="opacity" values="0;0;1;0" dur="3s" begin="1s" repeatCount="indefinite"/>
              <circle cx="30" cy="30" r="2.5" fill="#fbbf24"/>
              <circle cx="82" cy="72" r="2" fill="#34d399"/>
              <circle cx="25" cy="68" r="1.8" fill="#a78bfa"/>
            </g>
            <path d="M43 68 l8 8 16-16" stroke="white" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round" fill="none"
              stroke-dasharray="30" stroke-dashoffset="30" opacity="0">
              <animate attributeName="stroke-dashoffset" values="30;0;0;30" dur="2.5s" begin="0.5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0;1;1;0" dur="2.5s" begin="0.5s" repeatCount="indefinite"/>
            </path>
          </svg>
        </div>

        <h2 class="auth-title">Crear cuenta</h2>
        <p class="auth-sub">Únete a Aula Segura</p>

        <form id="reg-form" style="display:flex;flex-direction:column;gap:1rem">
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
          <button type="submit" class="btn btn-primary btn-full" id="reg-btn"
            style="padding:.8rem;font-size:.95rem;border-radius:var(--radius-lg)">
            <i class="fa-solid fa-user-plus" style="margin-right:.4rem"></i>Registrarme
          </button>
        </form>

        <div class="auth-divider">O regístrate con</div>
        <button class="btn btn-outline btn-full" id="google-reg-btn"
          style="padding:.7rem;gap:.6rem;border-radius:var(--radius-lg)">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:1.2rem;height:1.2rem"/>
          Continuar con Google
        </button>

        <p class="auth-footer">
          ¿Ya tienes cuenta? <a href="#/login">Inicia sesión</a>
        </p>
      </div>

      <!-- Panel derecho — onda suave centrada -->
      <div class="reg-side">
        <svg viewBox="0 0 260 600" fill="none" xmlns="http://www.w3.org/2000/svg"
          style="width:100%;height:100%;max-height:calc(100vh - var(--nav-height))">
          <defs>
            <linearGradient id="wArea1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#7c3aed" stop-opacity=".25"/>
              <stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/>
            </linearGradient>
            <linearGradient id="wArea2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#2563eb" stop-opacity=".18"/>
              <stop offset="100%" stop-color="#2563eb" stop-opacity="0"/>
            </linearGradient>
            <linearGradient id="wLine1" x1="0" y1="0" x2="260" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#7c3aed"/>
              <stop offset="100%" stop-color="#2563eb"/>
            </linearGradient>
            <linearGradient id="wLine2" x1="0" y1="0" x2="260" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#2563eb"/>
              <stop offset="100%" stop-color="#22c55e"/>
            </linearGradient>
          </defs>

          <!-- Onda 1 — área morada -->
          <path d="M0,280 C50,250 80,310 130,270 C180,230 210,290 260,255 L260,420 L0,420 Z"
            fill="url(#wArea1)">
            <animate attributeName="d"
              values="M0,280 C50,250 80,310 130,270 C180,230 210,290 260,255 L260,420 L0,420 Z;
                      M0,265 C50,290 80,240 130,285 C180,260 210,240 260,270 L260,420 L0,420 Z;
                      M0,280 C50,250 80,310 130,270 C180,230 210,290 260,255 L260,420 L0,420 Z"
              dur="6s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1"/>
          </path>
          <path d="M0,280 C50,250 80,310 130,270 C180,230 210,290 260,255"
            stroke="url(#wLine1)" stroke-width="2.5" fill="none" stroke-linecap="round">
            <animate attributeName="d"
              values="M0,280 C50,250 80,310 130,270 C180,230 210,290 260,255;
                      M0,265 C50,290 80,240 130,285 C180,260 210,240 260,270;
                      M0,280 C50,250 80,310 130,270 C180,230 210,290 260,255"
              dur="6s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1"/>
          </path>

          <!-- Onda 2 — área azul, desfasada -->
          <path d="M0,320 C60,295 90,345 140,310 C190,275 220,330 260,300 L260,420 L0,420 Z"
            fill="url(#wArea2)">
            <animate attributeName="d"
              values="M0,320 C60,295 90,345 140,310 C190,275 220,330 260,300 L260,420 L0,420 Z;
                      M0,305 C60,330 90,285 140,325 C190,300 220,280 260,315 L260,420 L0,420 Z;
                      M0,320 C60,295 90,345 140,310 C190,275 220,330 260,300 L260,420 L0,420 Z"
              dur="7s" begin="1s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1"/>
          </path>
          <path d="M0,320 C60,295 90,345 140,310 C190,275 220,330 260,300"
            stroke="url(#wLine2)" stroke-width="2" fill="none" stroke-linecap="round" opacity=".7">
            <animate attributeName="d"
              values="M0,320 C60,295 90,345 140,310 C190,275 220,330 260,300;
                      M0,305 C60,330 90,285 140,325 C190,300 220,280 260,315;
                      M0,320 C60,295 90,345 140,310 C190,275 220,330 260,300"
              dur="7s" begin="1s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1"/>
          </path>

          <!-- Línea base -->
          <line x1="0" y1="422" x2="260" y2="422" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="4 3"/>

          <!-- Punto deslizante onda 1 -->
          <circle r="6" fill="#7c3aed" stroke="white" stroke-width="2.5">
            <animateMotion dur="6s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1">
              <mpath href="#wPath1"/>
            </animateMotion>
          </circle>
          <path id="wPath1" d="M0,280 C50,250 80,310 130,270 C180,230 210,290 260,255" fill="none"/>

          <!-- Punto deslizante onda 2 -->
          <circle r="5" fill="#2563eb" stroke="white" stroke-width="2">
            <animateMotion dur="7s" begin="1s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1">
              <mpath href="#wPath2"/>
            </animateMotion>
          </circle>
          <path id="wPath2" d="M0,320 C60,295 90,345 140,310 C190,275 220,330 260,300" fill="none"/>

          <!-- Círculos decorativos arriba — sutiles -->
          <circle cx="130" cy="130" r="70" stroke="#7c3aed" stroke-width="1.2"
            fill="none" stroke-dasharray="6 5" opacity=".2">
            <animateTransform attributeName="transform" type="rotate" values="0 130 130;360 130 130" dur="20s" repeatCount="indefinite"/>
          </circle>
          <circle cx="130" cy="130" r="45" stroke="#2563eb" stroke-width="1"
            fill="none" stroke-dasharray="4 4" opacity=".2">
            <animateTransform attributeName="transform" type="rotate" values="360 130 130;0 130 130" dur="14s" repeatCount="indefinite"/>
          </circle>
          <circle cx="130" cy="130" r="18" fill="#7c3aed" opacity=".15">
            <animate attributeName="r" values="18;22;18" dur="3s" repeatCount="indefinite"/>
          </circle>
          <circle cx="130" cy="130" r="8" fill="#7c3aed" opacity=".5">
            <animate attributeName="r" values="8;10;8" dur="3s" repeatCount="indefinite"/>
          </circle>

          <!-- Partículas sutiles -->
          <circle cx="30"  cy="480" r="3" fill="#7c3aed" opacity=".2"><animate attributeName="cy" values="480;460;480" dur="5s" repeatCount="indefinite"/></circle>
          <circle cx="200" cy="510" r="2" fill="#2563eb" opacity=".2"><animate attributeName="cy" values="510;490;510" dur="4.5s" begin="1s" repeatCount="indefinite"/></circle>
          <circle cx="120" cy="550" r="2.5" fill="#22c55e" opacity=".2"><animate attributeName="cy" values="550;530;550" dur="6s" begin=".5s" repeatCount="indefinite"/></circle>
          <circle cx="50"  cy="40"  r="2.5" fill="#7c3aed" opacity=".2"><animate attributeName="cy" values="40;20;40" dur="5s" repeatCount="indefinite"/></circle>
          <circle cx="220" cy="60"  r="2"   fill="#2563eb" opacity=".2"><animate attributeName="cy" values="60;40;60" dur="4s" begin="2s" repeatCount="indefinite"/></circle>
        </svg>
      </div>
          <defs>
            <linearGradient id="rAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#7c3aed" stop-opacity=".3"/>
              <stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/>
            </linearGradient>
            <linearGradient id="rLineGrad" x1="0" y1="0" x2="280" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#7c3aed"/>
              <stop offset="100%" stop-color="#2563eb"/>
            </linearGradient>
            <linearGradient id="bgRight" x1="0" y1="0" x2="280" y2="700" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stop-color="#f5f3ff"/>
              <stop offset="100%" stop-color="#eff6ff"/>
            </linearGradient>
          </defs>

          <!-- Fondo suave -->
          <rect width="280" height="700" fill="url(#bgRight)"/>

          <!-- Red de nodos arriba -->
          <g transform="translate(140, 160)">
            <line x1="-90" y1="30"  x2="0"   y2="-70" stroke="#2563eb" stroke-width="1.5" opacity=".4" stroke-dasharray="4 3">
              <animate attributeName="opacity" values=".4;.9;.4" dur="2s" repeatCount="indefinite"/>
            </line>
            <line x1="0"   y1="-70" x2="85"  y2="20"  stroke="#7c3aed" stroke-width="1.5" opacity=".4" stroke-dasharray="4 3">
              <animate attributeName="opacity" values=".4;.9;.4" dur="2.5s" begin=".5s" repeatCount="indefinite"/>
            </line>
            <line x1="-90" y1="30"  x2="30"  y2="90"  stroke="#2563eb" stroke-width="1.2" opacity=".35" stroke-dasharray="4 3">
              <animate attributeName="opacity" values=".35;.8;.35" dur="3s" begin="1s" repeatCount="indefinite"/>
            </line>
            <line x1="85"  y1="20"  x2="30"  y2="90"  stroke="#7c3aed" stroke-width="1.2" opacity=".35" stroke-dasharray="4 3">
              <animate attributeName="opacity" values=".35;.8;.35" dur="2.8s" begin=".3s" repeatCount="indefinite"/>
            </line>
            <line x1="0"   y1="-70" x2="30"  y2="90"  stroke="#22c55e" stroke-width="1" opacity=".3" stroke-dasharray="4 3">
              <animate attributeName="opacity" values=".3;.7;.3" dur="3.5s" begin=".8s" repeatCount="indefinite"/>
            </line>
            <line x1="-90" y1="30"  x2="85"  y2="20"  stroke="#2563eb" stroke-width="1" opacity=".25" stroke-dasharray="4 3">
              <animate attributeName="opacity" values=".25;.6;.25" dur="4s" begin="1.2s" repeatCount="indefinite"/>
            </line>
            <!-- Nodos -->
            <circle cx="-90" cy="30"  r="14" fill="#2563eb" opacity=".9">
              <animate attributeName="r" values="14;17;14" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="-90" cy="30"  r="14" stroke="#2563eb" stroke-width="2" fill="none" opacity="0">
              <animate attributeName="r" values="14;28;28" dur="2s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.5;0;0" dur="2s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0"   cy="-70" r="18" fill="#7c3aed">
              <animate attributeName="r" values="18;21;18" dur="2.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="0"   cy="-70" r="18" stroke="#7c3aed" stroke-width="2" fill="none" opacity="0">
              <animate attributeName="r" values="18;34;34" dur="2.5s" begin="1s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.5;0;0" dur="2.5s" begin="1s" repeatCount="indefinite"/>
            </circle>
            <circle cx="85"  cy="20"  r="13" fill="#2563eb" opacity=".9">
              <animate attributeName="r" values="13;16;13" dur="3s" begin=".5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="30"  cy="90"  r="11" fill="#22c55e">
              <animate attributeName="r" values="11;14;11" dur="2.2s" begin="1s" repeatCount="indefinite"/>
            </circle>
            <circle cx="30"  cy="90"  r="11" stroke="#22c55e" stroke-width="2" fill="none" opacity="0">
              <animate attributeName="r" values="11;24;24" dur="2.2s" begin="1.5s" repeatCount="indefinite"/>
              <animate attributeName="opacity" values="0.5;0;0" dur="2.2s" begin="1.5s" repeatCount="indefinite"/>
            </circle>
          </g>

          <!-- Gráfico de área -->
          <path d="M0,430 C40,410 70,370 110,350 C150,330 170,380 210,340 C240,310 265,320 280,305 L280,500 L0,500 Z"
            fill="url(#rAreaGrad)">
            <animate attributeName="d"
              values="M0,430 C40,410 70,370 110,350 C150,330 170,380 210,340 C240,310 265,320 280,305 L280,500 L0,500 Z;
                      M0,410 C40,390 70,350 110,370 C150,390 170,350 210,320 C240,295 265,340 280,325 L280,500 L0,500 Z;
                      M0,430 C40,410 70,370 110,350 C150,330 170,380 210,340 C240,310 265,320 280,305 L280,500 L0,500 Z"
              dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1"/>
          </path>
          <path d="M0,430 C40,410 70,370 110,350 C150,330 170,380 210,340 C240,310 265,320 280,305"
            stroke="url(#rLineGrad)" stroke-width="2.5" fill="none" stroke-linecap="round">
            <animate attributeName="d"
              values="M0,430 C40,410 70,370 110,350 C150,330 170,380 210,340 C240,310 265,320 280,305;
                      M0,410 C40,390 70,350 110,370 C150,390 170,350 210,320 C240,295 265,340 280,325;
                      M0,430 C40,410 70,370 110,350 C150,330 170,380 210,340 C240,310 265,320 280,305"
              dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1"/>
          </path>
          <line x1="0" y1="502" x2="280" y2="502" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4 3"/>

          <!-- Punto deslizante -->
          <circle r="7" fill="#7c3aed" stroke="white" stroke-width="2.5">
            <animateMotion dur="5s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1">
              <mpath href="#rPath"/>
            </animateMotion>
          </circle>
          <path id="rPath" d="M0,430 C40,410 70,370 110,350 C150,330 170,380 210,340 C240,310 265,320 280,305" fill="none"/>

          <!-- Partículas -->
          <circle cx="25"  cy="560" r="4"   fill="#7c3aed" opacity=".3"><animate attributeName="cy" values="560;535;560" dur="5s" repeatCount="indefinite"/></circle>
          <circle cx="200" cy="590" r="3"   fill="#2563eb" opacity=".4"><animate attributeName="cy" values="590;565;590" dur="4.5s" begin="1s" repeatCount="indefinite"/></circle>
          <circle cx="130" cy="630" r="3"   fill="#22c55e" opacity=".3"><animate attributeName="cy" values="630;605;630" dur="6s" begin=".5s" repeatCount="indefinite"/></circle>
          <circle cx="60"  cy="660" r="2.5" fill="#7c3aed" opacity=".25"><animate attributeName="cy" values="660;635;660" dur="5.5s" begin="2s" repeatCount="indefinite"/></circle>
          <circle cx="245" cy="645" r="2"   fill="#2563eb" opacity=".3"><animate attributeName="cy" values="645;620;645" dur="4s" begin="1.5s" repeatCount="indefinite"/></circle>
          <circle cx="140" cy="40"  r="3"   fill="#7c3aed" opacity=".3"><animate attributeName="cy" values="40;20;40" dur="5s" repeatCount="indefinite"/></circle>
          <circle cx="50"  cy="70"  r="2.5" fill="#2563eb" opacity=".25"><animate attributeName="cy" values="70;50;70" dur="4s" begin="1s" repeatCount="indefinite"/></circle>
          <circle cx="240" cy="55"  r="2"   fill="#22c55e" opacity=".3"><animate attributeName="cy" values="55;35;55" dur="6s" begin=".5s" repeatCount="indefinite"/></circle>
        </svg>
      </div>

    </div>

    <!-- Modal: crear contraseña tras Google -->
    <div id="google-pw-modal" class="modal-overlay" style="display:none">
      <div class="modal-box" style="max-width:520px">
        <div style="text-align:center;margin-bottom:1.25rem">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:2.5rem;margin-bottom:.75rem"/>
          <h3 class="font-bold" style="font-size:1.2rem">Crea tu contraseña</h3>
          <p class="text-gray text-sm mt-1">Así también podrás iniciar sesión con tu correo y contraseña.</p>
        </div>
        <div id="google-pw-user-info" style="background:var(--gray-100);border-radius:var(--radius-lg);padding:.75rem 1rem;margin-bottom:1rem;display:flex;align-items:center;gap:.75rem">
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
            <p id="google-pw-error" class="text-xs" style="min-height:1rem;margin-top:.25rem;color:#dc2626"></p>
          </div>
        </div>
        <div class="flex-row mt-4">
          <button class="btn btn-outline" style="flex:1" id="google-pw-skip">Omitir</button>
          <button class="btn btn-primary" style="flex:1" id="google-pw-save">
            <i class="fa-solid fa-lock" style="margin-right:.4rem"></i>Guardar contraseña
          </button>
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
      const newUser = {
        uid: u.uid, email: u.email,
        name: u.displayName || '', photo: u.photoURL || '',
        role, fromGoogle: true, createdAt: new Date().toISOString()
      };
      await fbDB.ref(`users/${u.uid}`).set(newUser);
      setUser(newUser);
      showGooglePasswordModal(u, newUser);
    } catch (err) {
      alert('Error al registrarse con Google: ' + err.message);
    }
  };

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
        alert('✅ Contraseña creada.');
        redirectByRole(userData);
      } catch (err) {
        pwError.textContent = err.code === 'auth/requires-recent-login'
          ? '⚠️ Vuelve a iniciar sesión con Google e intenta de nuevo.'
          : '❌ Error: ' + err.message;
      } finally {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="fa-solid fa-lock" style="margin-right:.4rem"></i>Guardar contraseña';
      }
    };
  }
}
