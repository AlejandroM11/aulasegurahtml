function renderHome(app) {
  app.innerHTML = `
    <style>
      .home-wrap { position: relative; overflow: hidden; }

      .particles {
        position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
        will-change: transform;
      }
      .particle {
        position: absolute; border-radius: 50%;
        background: radial-gradient(circle, rgba(37,99,235,.12), transparent 70%);
        animation: floatUp ease-in-out infinite;
        will-change: transform, opacity;
      }

      @keyframes floatUp {
        0%   { transform: translateY(100vh); opacity: 0; }
        15%  { opacity: .7; }
        85%  { opacity: .3; }
        100% { transform: translateY(-10vh); opacity: 0; }
      }

      .home-hero {
        display: flex; flex-direction: column-reverse;
        gap: 3rem; padding: 4rem 0 3rem;
        align-items: center; position: relative; z-index: 1;
      }
      @media (min-width: 768px) {
        .home-hero { flex-direction: row; padding: 5rem 0 4rem; }
      }

      .hero-text { flex: 1; animation: slideUp .7s ease both; }
      .hero-visual { flex: 1; display: flex; justify-content: center; align-items: center;
        animation: slideUp .7s .15s ease both; }

      @keyframes slideUp {
        from { opacity: 0; transform: translateY(32px); }
        to   { opacity: 1; transform: translateY(0); }
      }

      .hero-title {
        font-size: clamp(2.2rem, 5vw, 3.4rem);
        font-weight: 900; line-height: 1.15; margin-bottom: 1.25rem;
      }
      .hero-title .brand {
        background: linear-gradient(135deg, #2563eb, #7c3aed, #2563eb);
        background-size: 200% auto;
        -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: shimmer 3s linear infinite;
      }
      @keyframes shimmer {
        to { background-position: 200% center; }
      }

      .hero-desc {
        font-size: 1.1rem; color: #475569; max-width: 480px;
        line-height: 1.7; margin-bottom: 2rem;
      }
      body.dark .hero-desc { color: #94a3b8; }

      .hero-cta { display: flex; flex-direction: column; gap: .75rem; }
      .hero-cta .btn-main {
        display: flex; align-items: center; justify-content: center; gap: .5rem;
        padding: 1rem 1.75rem; border-radius: 1rem; font-size: 1.05rem; font-weight: 700;
        background: linear-gradient(135deg, #7c3aed, #2563eb);
        color: #fff; text-decoration: none; border: none; cursor: pointer;
        transition: transform .2s, box-shadow .2s;
        box-shadow: 0 4px 20px rgba(37,99,235,.35);
      }
      .hero-cta .btn-main:hover {
        transform: translateY(-3px);
        box-shadow: 0 10px 32px rgba(37,99,235,.45);
      }
      .hero-cta .btn-row { display: flex; gap: .75rem; }
      .hero-cta .btn-sec {
        flex: 1; display: flex; align-items: center; justify-content: center;
        padding: .75rem 1rem; border-radius: .85rem; font-size: .95rem; font-weight: 600;
        border: 2px solid #d1d5db; color: #374151; text-decoration: none;
        background: transparent; transition: all .2s;
      }
      .hero-cta .btn-sec:hover {
        border-color: #2563eb; color: #2563eb; background: #eff6ff;
        transform: translateY(-2px);
      }
      body.dark .hero-cta .btn-sec { border-color: #475569; color: #e2e8f0; }
      body.dark .hero-cta .btn-sec:hover { border-color: #60a5fa; color: #60a5fa; background: #1e3a5f; }

      .hero-img-wrap { position: relative; display: inline-block; }
      .hero-img-wrap::before {
        content: ''; position: absolute; inset: -12px;
        background: radial-gradient(ellipse, rgba(37,99,235,.25), transparent 70%);
        border-radius: 50%; animation: pulse-glow 3s ease-in-out infinite; z-index: -1;
      }
      @keyframes pulse-glow {
        0%, 100% { transform: scale(1);   opacity: .6; }
        50%       { transform: scale(1.1); opacity: 1; }
      }
      .hero-img-wrap img {
        width: min(320px, 100%); border-radius: 1.5rem;
        box-shadow: 0 20px 60px rgba(0,0,0,.18);
        transition: transform .4s ease; display: block;
      }
      .hero-img-wrap:hover img { transform: scale(1.03) rotate(-1deg); }

      .hero-badge {
        position: absolute; top: -14px; right: -14px;
        background: linear-gradient(135deg, #7c3aed, #2563eb);
        color: #fff; font-size: .75rem; font-weight: 700;
        padding: .4rem .85rem; border-radius: 999px;
        box-shadow: 0 4px 12px rgba(124,58,237,.4);
        animation: badgeBounce 2s ease-in-out infinite; white-space: nowrap;
      }
      @keyframes badgeBounce {
        0%, 100% { transform: translateY(0); }
        50%       { transform: translateY(-5px); }
      }

      .stats-strip {
        display: flex; justify-content: center; gap: 2.5rem; flex-wrap: wrap;
        padding: 1.5rem 0 2.5rem; position: relative; z-index: 1;
        animation: slideUp .7s .3s ease both;
      }
      .stat-item { text-align: center; }
      .stat-num { font-size: 2rem; font-weight: 900; color: #2563eb; display: block; line-height: 1; }
      body.dark .stat-num { color: #60a5fa; }
      .stat-lbl { font-size: .78rem; color: #64748b; margin-top: .2rem; }
      body.dark .stat-lbl { color: #94a3b8; }

      .home-features {
        display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1.5rem; margin-top: 1rem; position: relative; z-index: 1;
      }
      .home-feature-card {
        background: #fff; border: 1px solid #e2e8f0;
        border-radius: 1.25rem; padding: 1.75rem;
        box-shadow: 0 2px 12px rgba(0,0,0,.06);
        transition: transform .3s, box-shadow .3s, border-color .3s;
        opacity: 0; transform: translateY(28px);
        animation: slideUp .6s ease forwards;
        position: relative; overflow: hidden;
      }
      body.dark .home-feature-card { background: #1e293b; border-color: #334155; }
      .home-feature-card:nth-child(1) { animation-delay: .4s; }
      .home-feature-card:nth-child(2) { animation-delay: .55s; }
      .home-feature-card:nth-child(3) { animation-delay: .7s; }
      .home-feature-card::before {
        content: ''; position: absolute; inset: 0;
        background: linear-gradient(135deg, rgba(37,99,235,.06), transparent);
        opacity: 0; transition: opacity .3s;
      }
      .home-feature-card:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(0,0,0,.12); border-color: #93c5fd; }
      .home-feature-card:hover::before { opacity: 1; }
      body.dark .home-feature-card:hover { border-color: #3b82f6; box-shadow: 0 16px 40px rgba(0,0,0,.35); }

      .feat-icon-wrap {
        width: 3.25rem; height: 3.25rem; border-radius: .85rem;
        display: flex; align-items: center; justify-content: center;
        margin-bottom: .85rem; transition: transform .3s;
      }
      .home-feature-card:hover .feat-icon-wrap { transform: scale(1.15) rotate(-5deg); }

      .feat-title { font-size: 1.1rem; font-weight: 700; color: #1e293b; margin-bottom: .5rem; }
      body.dark .feat-title { color: #e2e8f0; }
      .feat-desc { font-size: .875rem; color: #64748b; line-height: 1.65; }
      body.dark .feat-desc { color: #94a3b8; }

      .home-feature-card::after {
        content: ''; position: absolute; bottom: 0; left: 0;
        height: 3px; width: 0;
        background: linear-gradient(90deg, #2563eb, #7c3aed);
        transition: width .35s ease; border-radius: 0 0 1.25rem 1.25rem;
      }
      .home-feature-card:hover::after { width: 100%; }

      .home-divider {
        display: flex; align-items: center; gap: 1rem;
        margin: 2.5rem 0 2rem; opacity: .4;
      }
      .home-divider span { flex: 1; height: 1px; background: #cbd5e1; }
      .home-divider i { font-size: .75rem; color: #94a3b8; white-space: nowrap; }

      .home-footer {
        text-align: center; padding: 2.5rem 0 1rem;
        font-size: .85rem; color: #94a3b8;
        position: relative; z-index: 1;
        animation: slideUp .6s .8s ease both; opacity: 0;
      }
    </style>

    <div class="home-wrap">

      <div class="particles" id="home-particles"></div>

      <div class="home-hero">
        <div class="hero-text">
          <h1 class="hero-title">
            Bienvenido a <span class="brand">Aula Segura</span>
          </h1>
          <p class="hero-desc">
            Plataforma avanzada de exámenes con control antifraude, monitoreo en tiempo real
            y herramientas para docentes y estudiantes.
          </p>
          <div class="hero-cta">
            <a href="#/invitado" class="btn-main">
              <i class="fa-solid fa-bolt"></i> Acceso Rápido (sin cuenta)
            </a>
            <div class="btn-row">
              <a href="#/login"    class="btn-sec"><i class="fa-solid fa-right-to-bracket" style="margin-right:.4rem"></i>Ingresar</a>
              <a href="#/register" class="btn-sec"><i class="fa-solid fa-user-plus" style="margin-right:.4rem"></i>Crear cuenta</a>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <div class="hero-img-wrap">
            <!-- Ilustración SVG animada: monitor + escudo de seguridad -->
            <svg width="320" height="300" viewBox="0 0 320 300" fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style="width:min(320px,100%);height:auto;display:block;filter:drop-shadow(0 24px 48px rgba(37,99,235,.22))">
              <defs>
                <linearGradient id="monitorGrad" x1="0" y1="0" x2="320" y2="300" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#e0eaff"/>
                  <stop offset="100%" stop-color="#c7d7ff"/>
                </linearGradient>
                <linearGradient id="screenGrad" x1="40" y1="40" x2="280" y2="200" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#1e3a5f"/>
                  <stop offset="100%" stop-color="#2563eb"/>
                </linearGradient>
                <linearGradient id="shieldHeroGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#7c3aed"/>
                  <stop offset="100%" stop-color="#2563eb"/>
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="blur"/>
                  <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                </filter>
              </defs>

              <!-- Base del monitor -->
              <rect x="30" y="30" width="260" height="180" rx="16" fill="url(#monitorGrad)" stroke="#bfdbfe" stroke-width="2"/>
              <!-- Pantalla -->
              <rect x="46" y="46" width="228" height="148" rx="10" fill="url(#screenGrad)"/>

              <!-- Fila 1 check verde -->
              <rect x="70" y="72" width="12" height="12" rx="3" fill="#22c55e">
                <animate attributeName="opacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite"/>
              </rect>
              <rect x="90" y="74" width="80" height="8" rx="4" fill="rgba(255,255,255,.7)"/>
              <rect x="178" y="74" width="40" height="8" rx="4" fill="rgba(255,255,255,.3)"/>

              <!-- Fila 2 check verde -->
              <rect x="70" y="94" width="12" height="12" rx="3" fill="#22c55e">
                <animate attributeName="opacity" values="0.9;1;0.9" dur="2s" begin="0.3s" repeatCount="indefinite"/>
              </rect>
              <rect x="90" y="96" width="100" height="8" rx="4" fill="rgba(255,255,255,.7)"/>
              <rect x="198" y="96" width="30" height="8" rx="4" fill="rgba(255,255,255,.3)"/>

              <!-- Fila 3 en progreso -->
              <rect x="70" y="116" width="12" height="12" rx="3" fill="#f59e0b">
                <animate attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite"/>
              </rect>
              <rect x="90" y="118" width="60" height="8" rx="4" fill="rgba(255,255,255,.5)"/>
              <rect x="154" y="118" width="3" height="8" rx="1" fill="rgba(255,255,255,.9)">
                <animate attributeName="opacity" values="1;0;1" dur="0.8s" repeatCount="indefinite"/>
              </rect>

              <!-- Filas vacías -->
              <rect x="70" y="138" width="12" height="12" rx="3" fill="rgba(255,255,255,.2)"/>
              <rect x="90" y="140" width="110" height="8" rx="4" fill="rgba(255,255,255,.2)"/>
              <rect x="70" y="160" width="12" height="12" rx="3" fill="rgba(255,255,255,.2)"/>
              <rect x="90" y="162" width="75" height="8" rx="4" fill="rgba(255,255,255,.2)"/>

              <!-- Barra de progreso -->
              <rect x="70" y="182" width="180" height="6" rx="3" fill="rgba(255,255,255,.15)"/>
              <rect x="70" y="182" width="110" height="6" rx="3" fill="#22c55e">
                <animate attributeName="width" values="60;110;110" dur="2s" fill="freeze"/>
              </rect>

              <!-- Pie del monitor -->
              <rect x="140" y="210" width="40" height="22" rx="4" fill="#bfdbfe"/>
              <rect x="110" y="230" width="100" height="10" rx="5" fill="#93c5fd"/>

              <!-- Escudo flotante con animación -->
              <g filter="url(#glow)">
                <g>
                  <animateTransform attributeName="transform" type="translate"
                    values="0,0; 0,-10; 0,0" dur="3s" repeatCount="indefinite"
                    calcMode="spline" keySplines="0.4 0 0.2 1; 0.4 0 0.2 1"/>
                  <ellipse cx="232" cy="108" rx="28" ry="6" fill="rgba(37,99,235,.2)">
                    <animate attributeName="rx" values="28;20;28" dur="3s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.2;0.08;0.2" dur="3s" repeatCount="indefinite"/>
                  </ellipse>
                  <path d="M232 58 L208 68 v16 c0 14 10.5 27 24 30.5 C245.5 111 256 98 256 84 V68 Z"
                    fill="url(#shieldHeroGrad)" stroke="rgba(255,255,255,.4)" stroke-width="1.5"/>
                  <path d="M232 63 L212 72 v13 c0 11 8.5 21.5 20 24.5 C243.5 106.5 252 96 252 85 V72 Z"
                    fill="rgba(255,255,255,.12)"/>
                  <path d="M222 84 l6 6 12-12"
                    stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"
                    fill="none" stroke-dasharray="25" stroke-dashoffset="25">
                    <animate attributeName="stroke-dashoffset" values="25;0" dur="0.6s" begin="0.8s" fill="freeze"/>
                  </path>
                  <circle cx="232" cy="84" r="30" stroke="#7c3aed" stroke-width="1.5" fill="none" opacity="0">
                    <animate attributeName="r" values="30;46;46" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.6;0;0" dur="2s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="232" cy="84" r="30" stroke="#2563eb" stroke-width="1" fill="none" opacity="0">
                    <animate attributeName="r" values="30;46;46" dur="2s" begin="1s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.4;0;0" dur="2s" begin="1s" repeatCount="indefinite"/>
                  </circle>
                </g>
              </g>

              <!-- Badge SEGURO -->
              <rect x="60" y="248" width="80" height="24" rx="12" fill="#dcfce7" stroke="#86efac" stroke-width="1.5" opacity="0">
                <animate attributeName="opacity" values="0;1" dur="0.5s" begin="1.5s" fill="freeze"/>
              </rect>
              <text x="100" y="264" text-anchor="middle"
                font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="700" fill="#15803d" opacity="0">
                ✓ SEGURO
                <animate attributeName="opacity" values="0;1" dur="0.5s" begin="1.5s" fill="freeze"/>
              </text>

              <!-- Badge EN VIVO -->
              <rect x="180" y="248" width="80" height="24" rx="12" fill="#dbeafe" stroke="#93c5fd" stroke-width="1.5" opacity="0">
                <animate attributeName="opacity" values="0;1" dur="0.5s" begin="1.8s" fill="freeze"/>
              </rect>
              <circle cx="196" cy="260" r="4" fill="#2563eb" opacity="0">
                <animate attributeName="opacity" values="0;1;1" dur="0.5s" begin="1.8s" fill="freeze"/>
                <animate attributeName="r" values="4;5;4" dur="1s" begin="2s" repeatCount="indefinite"/>
              </circle>
              <text x="213" y="264"
                font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="700" fill="#1d4ed8" opacity="0">
                EN VIVO
                <animate attributeName="opacity" values="0;1" dur="0.5s" begin="1.8s" fill="freeze"/>
              </text>
            </svg>
          </div>
        </div>
      </div>

      <div class="stats-strip">
        <div class="stat-item">
          <span class="stat-num" data-target="100">0</span>
          <div class="stat-lbl">% Antifraude</div>
        </div>
        <div class="stat-item">
          <span class="stat-num" data-text="En vivo">En vivo</span>
          <div class="stat-lbl">Monitoreo</div>
        </div>

      </div>

      <div class="home-divider">
        <span></span><i>Funcionalidades principales</i><span></span>
      </div>

      <div class="home-features">
        <div class="home-feature-card">
          <div class="feat-icon-wrap" style="background:#eff6ff">
            <i class="fa-solid fa-shield-halved" style="font-size:1.5rem;color:#2563eb"></i>
          </div>
          <div class="feat-title">Control Antifraude</div>
          <p class="feat-desc">Detección de pérdida de foco, bloqueo automático y modo pantalla completa durante el examen.</p>
        </div>
        <div class="home-feature-card">
          <div class="feat-icon-wrap" style="background:#f0fdf4">
            <i class="fa-solid fa-tower-broadcast" style="font-size:1.5rem;color:#16a34a"></i>
          </div>
          <div class="feat-title">Panel para Docentes</div>
          <p class="feat-desc">Monitorea a tus estudiantes en tiempo real, revisa por qué fueron bloqueados y desbloquéalos al instante.</p>
        </div>
        <div class="home-feature-card">
          <div class="feat-icon-wrap" style="background:#fef9c3">
            <i class="fa-solid fa-file-pen" style="font-size:1.5rem;color:#ca8a04"></i>
          </div>
          <div class="feat-title">Exámenes Inteligentes</div>
          <p class="feat-desc">Creación, edición y calificación automática de cuestionarios con sincronización inmediata.</p>
        </div>
      </div>

      <footer class="home-footer">
        © ${new Date().getFullYear()} Aula Segura — Kevin Martinez y Cristian Reyes
      </footer>

    </div>
  `;

  const container = document.getElementById('home-particles');
  if (container) {
    for (let i = 0; i < 12; i++) {
      const p    = document.createElement('div');
      p.className = 'particle';
      const size  = 90 + Math.random() * 110;
      const dur   = 22 + Math.random() * 18;   // 22–40s: muy lento y cinematográfico
      const delay = -(Math.random() * dur);     // delay negativo = ya en progreso, sin flash
      p.style.cssText = [
        `width:${size}px`,
        `height:${size}px`,
        `left:${5 + Math.random() * 90}%`,
        `bottom:-${size}px`,
        `animation-duration:${dur}s`,
        `animation-delay:${delay}s`,
        `opacity:0`,                            // empieza invisible, la animación lo muestra
      ].join(';');
      container.appendChild(p);
    }
  }

  document.querySelectorAll('.stat-num[data-target]').forEach(el => {
    const target = parseInt(el.dataset.target);
    if (!target) return;
    let current = 0;
    const step = Math.ceil(target / 40);
    const tick = setInterval(() => {
      current = Math.min(current + step, target);
      el.textContent = current;
      if (current >= target) clearInterval(tick);
    }, 30);
  });
}