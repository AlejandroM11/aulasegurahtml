function renderHome(app) {
  app.innerHTML = `
    <style>
      .home-wrap { position: relative; overflow: hidden; }

      /* ── Partículas ── */
      .particles { position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;will-change:transform; }
      .particle  { position:absolute;border-radius:50%;background:radial-gradient(circle,rgba(37,99,235,.1),transparent 70%);animation:floatUp ease-in-out infinite;will-change:transform,opacity; }
      @keyframes floatUp { 0%{transform:translateY(100vh);opacity:0} 15%{opacity:.6} 85%{opacity:.25} 100%{transform:translateY(-10vh);opacity:0} }

      /* ── Hero ── */
      .home-hero { display:flex;flex-direction:column-reverse;gap:3rem;padding:4rem 0 3rem;align-items:center;position:relative;z-index:1; }
      @media(min-width:768px){ .home-hero{flex-direction:row;padding:5rem 0 4rem;gap:4rem;} }
      .hero-text  { flex:1;animation:slideUp .7s ease both; }
      .hero-visual{ flex:1;display:flex;justify-content:center;align-items:center;animation:slideUp .7s .15s ease both; }
      @keyframes slideUp { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }

      .hero-title { font-size:clamp(2.2rem,5vw,3.4rem);font-weight:900;line-height:1.15;margin-bottom:1.25rem; }
      .hero-title .brand {
        background:linear-gradient(135deg,#2563eb,#7c3aed,#2563eb);
        background-size:200% auto;
        -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
        animation:shimmer 3s linear infinite;
      }
      @keyframes shimmer { to{background-position:200% center} }
      .hero-desc { font-size:1.1rem;color:#475569;max-width:480px;line-height:1.7;margin-bottom:2rem; }
      body.dark .hero-desc { color:#94a3b8; }

      .hero-cta { display:flex;flex-direction:column;gap:.75rem; }
      .hero-cta .btn-main {
        display:flex;align-items:center;justify-content:center;gap:.5rem;
        padding:1rem 1.75rem;border-radius:1rem;font-size:1.05rem;font-weight:700;
        background:linear-gradient(135deg,#7c3aed,#2563eb);
        color:#fff;text-decoration:none;border:none;cursor:pointer;
        transition:transform .2s,box-shadow .2s;
        box-shadow:0 4px 20px rgba(37,99,235,.35);position:relative;overflow:hidden;
      }
      .hero-cta .btn-main::after {
        content:'';position:absolute;inset:0;
        background:linear-gradient(105deg,transparent 40%,rgba(255,255,255,.15) 50%,transparent 60%);
        transform:translateX(-100%);transition:transform .5s ease;
      }
      .hero-cta .btn-main:hover { transform:translateY(-3px);box-shadow:0 10px 32px rgba(37,99,235,.45); }
      .hero-cta .btn-main:hover::after { transform:translateX(100%); }
      .hero-cta .btn-row { display:flex;gap:.75rem; }
      .hero-cta .btn-sec {
        flex:1;display:flex;align-items:center;justify-content:center;
        padding:.75rem 1rem;border-radius:.85rem;font-size:.95rem;font-weight:600;
        border:2px solid #d1d5db;color:#374151;text-decoration:none;background:transparent;transition:all .2s;
      }
      .hero-cta .btn-sec:hover { border-color:#2563eb;color:#2563eb;background:#eff6ff;transform:translateY(-2px); }
      body.dark .hero-cta .btn-sec { border-color:#475569;color:#e2e8f0; }
      body.dark .hero-cta .btn-sec:hover { border-color:#60a5fa;color:#60a5fa;background:#1e3a5f; }

      /* ── Stats strip ── */
      .stats-strip {
        display:flex;justify-content:center;gap:0;flex-wrap:wrap;
        padding:2rem 0 3rem;position:relative;z-index:1;
        animation:slideUp .7s .3s ease both;
      }
      .stat-item {
        text-align:center;padding:1.25rem 2.5rem;
        position:relative;
      }
      .stat-item:not(:last-child)::after {
        content:'';position:absolute;right:0;top:25%;bottom:25%;
        width:1px;background:linear-gradient(180deg,transparent,#cbd5e1,transparent);
      }
      body.dark .stat-item:not(:last-child)::after { background:linear-gradient(180deg,transparent,#334155,transparent); }
      .stat-num { font-size:2.4rem;font-weight:900;color:#2563eb;display:block;line-height:1;letter-spacing:-.03em; }
      body.dark .stat-num { color:#60a5fa; }
      .stat-lbl { font-size:.78rem;color:#64748b;margin-top:.3rem;text-transform:uppercase;letter-spacing:.06em; }
      body.dark .stat-lbl { color:#94a3b8; }

      /* ── Divider ── */
      .home-divider { display:flex;align-items:center;gap:1rem;margin:1rem 0 2.5rem;opacity:.5; }
      .home-divider span { flex:1;height:1px;background:#cbd5e1; }
      .home-divider i { font-size:.75rem;color:#94a3b8;white-space:nowrap;text-transform:uppercase;letter-spacing:.08em;font-weight:600; }

      /* ── Feature cards ── */
      .home-features { display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem;margin-top:1rem;position:relative;z-index:1; }
      .home-feature-card {
        background:#fff;border:1px solid #e2e8f0;border-radius:1.5rem;padding:1.75rem;
        box-shadow:0 2px 12px rgba(0,0,0,.06);
        transition:transform .3s,box-shadow .3s,border-color .3s;
        opacity:0;transform:translateY(28px);animation:slideUp .6s ease forwards;
        position:relative;overflow:hidden;
      }
      body.dark .home-feature-card { background:#1e293b;border-color:#334155; }
      .home-feature-card:nth-child(1){animation-delay:.4s}
      .home-feature-card:nth-child(2){animation-delay:.55s}
      .home-feature-card:nth-child(3){animation-delay:.7s}
      .home-feature-card:nth-child(4){animation-delay:.85s}
      .home-feature-card:nth-child(5){animation-delay:1s}
      .home-feature-card:nth-child(6){animation-delay:1.15s}
      .home-feature-card::before {
        content:'';position:absolute;inset:0;
        background:linear-gradient(135deg,rgba(37,99,235,.06),transparent);
        opacity:0;transition:opacity .3s;
      }
      .home-feature-card:hover { transform:translateY(-6px);box-shadow:0 20px 48px rgba(0,0,0,.12);border-color:#93c5fd; }
      .home-feature-card:hover::before { opacity:1; }
      body.dark .home-feature-card:hover { border-color:#3b82f6;box-shadow:0 20px 48px rgba(0,0,0,.35); }
      .home-feature-card::after {
        content:'';position:absolute;bottom:0;left:0;height:3px;width:0;
        background:linear-gradient(90deg,#2563eb,#7c3aed);
        transition:width .35s ease;border-radius:0 0 1.5rem 1.5rem;
      }
      .home-feature-card:hover::after { width:100%; }

      .feat-icon-wrap {
        width:3.5rem;height:3.5rem;border-radius:1rem;
        display:flex;align-items:center;justify-content:center;
        margin-bottom:1rem;transition:transform .3s;position:relative;
      }
      .home-feature-card:hover .feat-icon-wrap { transform:scale(1.15) rotate(-5deg); }
      .feat-title { font-size:1.05rem;font-weight:700;color:#1e293b;margin-bottom:.5rem; }
      body.dark .feat-title { color:#e2e8f0; }
      .feat-desc { font-size:.875rem;color:#64748b;line-height:1.65; }
      body.dark .feat-desc { color:#94a3b8; }

      /* SVG decorativo en cada card */
      .feat-card-svg { position:absolute;bottom:-8px;right:-8px;opacity:.06;pointer-events:none; }
      body.dark .feat-card-svg { opacity:.08; }

      /* ── Sección CTA final ── */
      .home-cta-section {
        margin:3rem 0 1rem;padding:3rem 2.5rem;
        background:linear-gradient(135deg,#1e3a5f 0%,#2563eb 60%,#7c3aed 100%);
        border-radius:2rem;position:relative;overflow:hidden;
        text-align:center;z-index:1;
        animation:slideUp .6s 1.2s ease both;opacity:0;
      }
      .home-cta-section h2 { font-size:clamp(1.5rem,3vw,2rem);font-weight:800;color:#fff;margin-bottom:.75rem;letter-spacing:-.02em; }
      .home-cta-section p  { color:rgba(255,255,255,.8);font-size:.95rem;margin-bottom:1.75rem; }
      .home-cta-btns { display:flex;gap:1rem;justify-content:center;flex-wrap:wrap; }
      .cta-btn-white {
        padding:.85rem 1.75rem;border-radius:1rem;font-size:.95rem;font-weight:700;
        background:#fff;color:#1e3a5f;border:none;cursor:pointer;text-decoration:none;
        transition:all .2s;display:inline-flex;align-items:center;gap:.5rem;
        box-shadow:0 4px 16px rgba(0,0,0,.15);
      }
      .cta-btn-white:hover { transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,.2); }
      .cta-btn-outline-white {
        padding:.85rem 1.75rem;border-radius:1rem;font-size:.95rem;font-weight:700;
        background:rgba(255,255,255,.15);color:#fff;border:2px solid rgba(255,255,255,.4);
        cursor:pointer;text-decoration:none;transition:all .2s;
        display:inline-flex;align-items:center;gap:.5rem;backdrop-filter:blur(8px);
      }
      .cta-btn-outline-white:hover { background:rgba(255,255,255,.25);border-color:rgba(255,255,255,.7); }

      /* ── Footer ── */
      .home-footer { text-align:center;padding:2.5rem 0 1rem;font-size:.85rem;color:#94a3b8;position:relative;z-index:1;animation:slideUp .6s 1.4s ease both;opacity:0; }
    </style>

    <div class="home-wrap">
      <div class="particles" id="home-particles"></div>

      <!-- ── HERO ── -->
      <div class="home-hero">
        <div class="hero-text">
          <div style="display:inline-flex;align-items:center;gap:.5rem;background:#eff6ff;border:1px solid #bfdbfe;border-radius:999px;padding:.35rem .9rem;font-size:.78rem;font-weight:700;color:#1d4ed8;margin-bottom:1.25rem;animation:slideUp .5s ease both">
            <span style="width:.5rem;height:.5rem;border-radius:50%;background:#22c55e;animation:pulseDot 1.5s infinite"></span>
            Sistema activo · Monitoreo en tiempo real
          </div>
          <h1 class="hero-title">
            La plataforma de<br>exámenes más <span class="brand">segura</span>
          </h1>
          <p class="hero-desc">
            Control antifraude avanzado, monitoreo en tiempo real e inteligencia artificial
            para docentes y estudiantes.
          </p>
          <div class="hero-cta">
            <a href="#/invitado" class="btn-main">
              <i class="fa-solid fa-bolt"></i> Acceso Rápido — sin cuenta
            </a>
            <div class="btn-row">
              <a href="#/login"    class="btn-sec"><i class="fa-solid fa-right-to-bracket" style="margin-right:.4rem"></i>Ingresar</a>
              <a href="#/register" class="btn-sec"><i class="fa-solid fa-user-plus" style="margin-right:.4rem"></i>Crear cuenta</a>
            </div>
          </div>
        </div>

        <div class="hero-visual">
          <div class="hero-img-wrap">
            <svg width="340" height="310" viewBox="0 0 320 300" fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style="width:min(340px,100%);height:auto;display:block;filter:drop-shadow(0 24px 48px rgba(37,99,235,.22))">
              <defs>
                <linearGradient id="monitorGrad" x1="0" y1="0" x2="320" y2="300" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#e0eaff"/><stop offset="100%" stop-color="#c7d7ff"/>
                </linearGradient>
                <linearGradient id="screenGrad" x1="40" y1="40" x2="280" y2="200" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#1e3a5f"/><stop offset="100%" stop-color="#2563eb"/>
                </linearGradient>
                <linearGradient id="shieldHeroGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stop-color="#7c3aed"/><stop offset="100%" stop-color="#2563eb"/>
                </linearGradient>
                <filter id="glow"><feGaussianBlur stdDeviation="3" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              <rect x="30" y="30" width="260" height="180" rx="16" fill="url(#monitorGrad)" stroke="#bfdbfe" stroke-width="2"/>
              <rect x="46" y="46" width="228" height="148" rx="10" fill="url(#screenGrad)"/>
              <rect x="70" y="72" width="12" height="12" rx="3" fill="#22c55e"><animate attributeName="opacity" values="0.9;1;0.9" dur="2s" repeatCount="indefinite"/></rect>
              <rect x="90" y="74" width="80" height="8" rx="4" fill="rgba(255,255,255,.7)"/>
              <rect x="178" y="74" width="40" height="8" rx="4" fill="rgba(255,255,255,.3)"/>
              <rect x="70" y="94" width="12" height="12" rx="3" fill="#22c55e"><animate attributeName="opacity" values="0.9;1;0.9" dur="2s" begin="0.3s" repeatCount="indefinite"/></rect>
              <rect x="90" y="96" width="100" height="8" rx="4" fill="rgba(255,255,255,.7)"/>
              <rect x="198" y="96" width="30" height="8" rx="4" fill="rgba(255,255,255,.3)"/>
              <rect x="70" y="116" width="12" height="12" rx="3" fill="#f59e0b"><animate attributeName="opacity" values="1;0.4;1" dur="1.2s" repeatCount="indefinite"/></rect>
              <rect x="90" y="118" width="60" height="8" rx="4" fill="rgba(255,255,255,.5)"/>
              <rect x="154" y="118" width="3" height="8" rx="1" fill="rgba(255,255,255,.9)"><animate attributeName="opacity" values="1;0;1" dur="0.8s" repeatCount="indefinite"/></rect>
              <rect x="70" y="138" width="12" height="12" rx="3" fill="rgba(255,255,255,.2)"/>
              <rect x="90" y="140" width="110" height="8" rx="4" fill="rgba(255,255,255,.2)"/>
              <rect x="70" y="160" width="12" height="12" rx="3" fill="rgba(255,255,255,.2)"/>
              <rect x="90" y="162" width="75" height="8" rx="4" fill="rgba(255,255,255,.2)"/>
              <rect x="70" y="182" width="180" height="6" rx="3" fill="rgba(255,255,255,.15)"/>
              <rect x="70" y="182" width="110" height="6" rx="3" fill="#22c55e"><animate attributeName="width" values="60;110;110" dur="2s" fill="freeze"/></rect>
              <rect x="140" y="210" width="40" height="22" rx="4" fill="#bfdbfe"/>
              <rect x="110" y="230" width="100" height="10" rx="5" fill="#93c5fd"/>
              <g filter="url(#glow)">
                <g><animateTransform attributeName="transform" type="translate" values="0,0;0,-10;0,0" dur="3s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.2 1;0.4 0 0.2 1"/>
                  <ellipse cx="232" cy="108" rx="28" ry="6" fill="rgba(37,99,235,.2)"><animate attributeName="rx" values="28;20;28" dur="3s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.2;0.08;0.2" dur="3s" repeatCount="indefinite"/></ellipse>
                  <path d="M232 58 L208 68 v16 c0 14 10.5 27 24 30.5 C245.5 111 256 98 256 84 V68 Z" fill="url(#shieldHeroGrad)" stroke="rgba(255,255,255,.4)" stroke-width="1.5"/>
                  <path d="M222 84 l6 6 12-12" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke-dasharray="25" stroke-dashoffset="25"><animate attributeName="stroke-dashoffset" values="25;0" dur="0.6s" begin="0.8s" fill="freeze"/></path>
                  <circle cx="232" cy="84" r="30" stroke="#7c3aed" stroke-width="1.5" fill="none" opacity="0"><animate attributeName="r" values="30;46;46" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0;0" dur="2s" repeatCount="indefinite"/></circle>
                </g>
              </g>
              <rect x="60" y="248" width="80" height="24" rx="12" fill="#dcfce7" stroke="#86efac" stroke-width="1.5" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.5s" begin="1.5s" fill="freeze"/></rect>
              <text x="100" y="264" text-anchor="middle" font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="700" fill="#15803d" opacity="0">✓ SEGURO<animate attributeName="opacity" values="0;1" dur="0.5s" begin="1.5s" fill="freeze"/></text>
              <rect x="180" y="248" width="80" height="24" rx="12" fill="#dbeafe" stroke="#93c5fd" stroke-width="1.5" opacity="0"><animate attributeName="opacity" values="0;1" dur="0.5s" begin="1.8s" fill="freeze"/></rect>
              <circle cx="196" cy="260" r="4" fill="#2563eb" opacity="0"><animate attributeName="opacity" values="0;1;1" dur="0.5s" begin="1.8s" fill="freeze"/><animate attributeName="r" values="4;5;4" dur="1s" begin="2s" repeatCount="indefinite"/></circle>
              <text x="213" y="264" font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="700" fill="#1d4ed8" opacity="0">EN VIVO<animate attributeName="opacity" values="0;1" dur="0.5s" begin="1.8s" fill="freeze"/></text>
            </svg>
          </div>
        </div>
      </div>

      <!-- ── STATS ── -->
      <div style="background:var(--surface,#fff);border:1px solid var(--border,#e2e8f0);border-radius:1.5rem;box-shadow:0 2px 12px rgba(0,0,0,.05);position:relative;z-index:1;animation:slideUp .7s .3s ease both;opacity:0;overflow:hidden">
        <div class="stats-strip" style="padding:1.5rem 0;margin:0">
          <div class="stat-item">
            <span class="stat-num" data-target="100">0</span>
            <div class="stat-lbl">% Antifraude</div>
          </div>
          <div class="stat-item">
            <span class="stat-num">∞</span>
            <div class="stat-lbl">Estudiantes</div>
          </div>
          <div class="stat-item">
            <span class="stat-num" data-target="4">0</span>
            <div class="stat-lbl">Tipos de pregunta</div>
          </div>
          <div class="stat-item">
            <span class="stat-num">IA</span>
            <div class="stat-lbl">Generación automática</div>
          </div>
        </div>
      </div>

      <!-- ── FEATURES ── -->
      <div class="home-divider" style="margin-top:3rem">
        <span></span><i>Funcionalidades principales</i><span></span>
      </div>

      <div class="home-features">

        <!-- Card 1: Antifraude -->
        <div class="home-feature-card">
          <svg class="feat-card-svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
            <path d="M60 10 L20 28 v28 c0 26 17 50 40 57 C83 106 100 81 100 56 V28 Z" stroke="#2563eb" stroke-width="8" fill="none"/>
          </svg>
          <div class="feat-icon-wrap" style="background:#eff6ff">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="#2563eb" opacity=".2" stroke="#2563eb" stroke-width="1.5" stroke-linejoin="round"/>
              <path d="M9 12l2 2 4-4" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="12" r="2" fill="#2563eb" opacity="0"><animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite"/><animate attributeName="r" values="2;8;2" dur="2s" repeatCount="indefinite"/></circle>
            </svg>
          </div>
          <div class="feat-title">Control Antifraude</div>
          <p class="feat-desc">Detección automática de pérdida de foco, bloqueo instantáneo y modo pantalla completa obligatorio.</p>
          <div style="margin-top:1rem;display:flex;gap:.4rem;flex-wrap:wrap">
            <span style="font-size:.7rem;font-weight:700;background:#eff6ff;color:#1d4ed8;padding:.2rem .6rem;border-radius:999px;border:1px solid #bfdbfe">Fullscreen</span>
            <span style="font-size:.7rem;font-weight:700;background:#eff6ff;color:#1d4ed8;padding:.2rem .6rem;border-radius:999px;border:1px solid #bfdbfe">Bloqueo auto</span>
            <span style="font-size:.7rem;font-weight:700;background:#eff6ff;color:#1d4ed8;padding:.2rem .6rem;border-radius:999px;border:1px solid #bfdbfe">Infracciones</span>
          </div>
        </div>

        <!-- Card 2: Monitoreo -->
        <div class="home-feature-card">
          <svg class="feat-card-svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
            <circle cx="60" cy="60" r="50" stroke="#16a34a" stroke-width="6" fill="none" stroke-dasharray="8 6">
              <animateTransform attributeName="transform" type="rotate" values="0 60 60;360 60 60" dur="20s" repeatCount="indefinite"/>
            </circle>
          </svg>
          <div class="feat-icon-wrap" style="background:#f0fdf4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M1 6s4-2 11-2 11 2 11 2" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M1 12s4-2 11-2 11 2 11 2" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round"/>
              <path d="M1 18s4-2 11-2 11 2 11 2" stroke="#16a34a" stroke-width="1.5" stroke-linecap="round"/>
              <circle cx="12" cy="12" r="3" fill="#16a34a"><animate attributeName="r" values="3;4;3" dur="1.5s" repeatCount="indefinite"/></circle>
            </svg>
          </div>
          <div class="feat-title">Monitoreo en Tiempo Real</div>
          <p class="feat-desc">Panel del docente con todos los estudiantes activos, su progreso, infracciones y chat directo.</p>
          <div style="margin-top:1rem;display:flex;gap:.4rem;flex-wrap:wrap">
            <span style="font-size:.7rem;font-weight:700;background:#f0fdf4;color:#15803d;padding:.2rem .6rem;border-radius:999px;border:1px solid #bbf7d0">En vivo</span>
            <span style="font-size:.7rem;font-weight:700;background:#f0fdf4;color:#15803d;padding:.2rem .6rem;border-radius:999px;border:1px solid #bbf7d0">Chat</span>
            <span style="font-size:.7rem;font-weight:700;background:#f0fdf4;color:#15803d;padding:.2rem .6rem;border-radius:999px;border:1px solid #bbf7d0">Desbloqueo</span>
          </div>
        </div>

        <!-- Card 3: IA -->
        <div class="home-feature-card">
          <svg class="feat-card-svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
            <path d="M20 60 Q40 20 60 60 Q80 100 100 60" stroke="#7c3aed" stroke-width="6" fill="none" stroke-linecap="round">
              <animate attributeName="d" values="M20 60 Q40 20 60 60 Q80 100 100 60;M20 60 Q40 100 60 60 Q80 20 100 60;M20 60 Q40 20 60 60 Q80 100 100 60" dur="3s" repeatCount="indefinite"/>
            </path>
          </svg>
          <div class="feat-icon-wrap" style="background:#faf5ff">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" stroke="#7c3aed" stroke-width="1.5" fill="none"/>
              <path d="M8 12h8M12 8v8" stroke="#7c3aed" stroke-width="2" stroke-linecap="round"/>
              <circle cx="12" cy="12" r="2" fill="#7c3aed"><animate attributeName="r" values="2;3;2" dur="1.5s" repeatCount="indefinite"/></circle>
            </svg>
          </div>
          <div class="feat-title">Generación con IA</div>
          <p class="feat-desc">Crea preguntas automáticamente desde PDFs o texto usando LLaMA 3. Mezcla de 4 tipos de pregunta.</p>
          <div style="margin-top:1rem;display:flex;gap:.4rem;flex-wrap:wrap">
            <span style="font-size:.7rem;font-weight:700;background:#faf5ff;color:#6d28d9;padding:.2rem .6rem;border-radius:999px;border:1px solid #ddd6fe">LLaMA 3</span>
            <span style="font-size:.7rem;font-weight:700;background:#faf5ff;color:#6d28d9;padding:.2rem .6rem;border-radius:999px;border:1px solid #ddd6fe">PDF</span>
            <span style="font-size:.7rem;font-weight:700;background:#faf5ff;color:#6d28d9;padding:.2rem .6rem;border-radius:999px;border:1px solid #ddd6fe">Auto-mix</span>
          </div>
        </div>

        <!-- Card 4: Matemáticas -->
        <div class="home-feature-card">
          <svg class="feat-card-svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
            <text x="10" y="80" font-family="serif" font-size="60" fill="#0891b2" opacity=".5">∑</text>
          </svg>
          <div class="feat-icon-wrap" style="background:#ecfeff">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M4 4h16v2L12 12l8 6v2H4v-2l8-6L4 6V4z" stroke="#0891b2" stroke-width="1.5" stroke-linejoin="round" fill="none"/>
            </svg>
          </div>
          <div class="feat-title">Preguntas Matemáticas</div>
          <p class="feat-desc">Editor MathQuill integrado para ecuaciones. Los estudiantes responden con teclado matemático interactivo.</p>
          <div style="margin-top:1rem;display:flex;gap:.4rem;flex-wrap:wrap">
            <span style="font-size:.7rem;font-weight:700;background:#ecfeff;color:#0e7490;padding:.2rem .6rem;border-radius:999px;border:1px solid #a5f3fc">MathQuill</span>
            <span style="font-size:.7rem;font-weight:700;background:#ecfeff;color:#0e7490;padding:.2rem .6rem;border-radius:999px;border:1px solid #a5f3fc">LaTeX</span>
            <span style="font-size:.7rem;font-weight:700;background:#ecfeff;color:#0e7490;padding:.2rem .6rem;border-radius:999px;border:1px solid #a5f3fc">Teclado</span>
          </div>
        </div>

        <!-- Card 5: Resultados -->
        <div class="home-feature-card">
          <svg class="feat-card-svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
            <rect x="20" y="80" width="16" height="30" rx="4" fill="#16a34a" opacity=".4"/>
            <rect x="44" y="60" width="16" height="50" rx="4" fill="#2563eb" opacity=".4"/>
            <rect x="68" y="40" width="16" height="70" rx="4" fill="#7c3aed" opacity=".4"/>
            <rect x="92" y="50" width="16" height="60" rx="4" fill="#16a34a" opacity=".4"/>
          </svg>
          <div class="feat-icon-wrap" style="background:#f0fdf4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <rect x="3" y="12" width="4" height="9" rx="1" fill="#16a34a"/>
              <rect x="10" y="8" width="4" height="13" rx="1" fill="#2563eb"/>
              <rect x="17" y="4" width="4" height="17" rx="1" fill="#7c3aed"/>
            </svg>
          </div>
          <div class="feat-title">Resultados y Analíticas</div>
          <p class="feat-desc">Calificación automática, retroalimentación por pregunta y exportación de resultados en PDF.</p>
          <div style="margin-top:1rem;display:flex;gap:.4rem;flex-wrap:wrap">
            <span style="font-size:.7rem;font-weight:700;background:#f0fdf4;color:#15803d;padding:.2rem .6rem;border-radius:999px;border:1px solid #bbf7d0">Auto-calificación</span>
            <span style="font-size:.7rem;font-weight:700;background:#f0fdf4;color:#15803d;padding:.2rem .6rem;border-radius:999px;border:1px solid #bbf7d0">PDF</span>
          </div>
        </div>

        <!-- Card 6: Acceso rápido -->
        <div class="home-feature-card">
          <svg class="feat-card-svg" width="120" height="120" viewBox="0 0 120 120" fill="none">
            <path d="M60 10 L75 50 L110 50 L82 72 L92 110 L60 88 L28 110 L38 72 L10 50 L45 50 Z" stroke="#d97706" stroke-width="5" fill="none" opacity=".5"/>
          </svg>
          <div class="feat-icon-wrap" style="background:#fffbeb">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="#d97706" stroke="#d97706" stroke-width="1" stroke-linejoin="round"/>
            </svg>
          </div>
          <div class="feat-title">Acceso sin Cuenta</div>
          <p class="feat-desc">Los estudiantes pueden entrar con solo su nombre y el código del examen. Sin registro requerido.</p>
          <div style="margin-top:1rem;display:flex;gap:.4rem;flex-wrap:wrap">
            <span style="font-size:.7rem;font-weight:700;background:#fffbeb;color:#92400e;padding:.2rem .6rem;border-radius:999px;border:1px solid #fde68a">Sin registro</span>
            <span style="font-size:.7rem;font-weight:700;background:#fffbeb;color:#92400e;padding:.2rem .6rem;border-radius:999px;border:1px solid #fde68a">Código único</span>
          </div>
        </div>

      </div>

      <!-- ── CTA FINAL ── -->
      <div class="home-cta-section">
        <!-- SVG decorativo -->
        <svg style="position:absolute;right:2rem;top:50%;transform:translateY(-50%);opacity:.1;pointer-events:none" width="200" height="160" viewBox="0 0 200 160" fill="none">
          <circle cx="100" cy="80" r="70" stroke="white" stroke-width="1.5" stroke-dasharray="9 6"><animateTransform attributeName="transform" type="rotate" values="0 100 80;360 100 80" dur="25s" repeatCount="indefinite"/></circle>
          <circle cx="100" cy="80" r="45" stroke="white" stroke-width="1" stroke-dasharray="6 5"><animateTransform attributeName="transform" type="rotate" values="360 100 80;0 100 80" dur="16s" repeatCount="indefinite"/></circle>
          <circle cx="170" cy="80" r="7" fill="white" opacity=".8"><animateTransform attributeName="transform" type="rotate" values="0 100 80;360 100 80" dur="25s" repeatCount="indefinite"/></circle>
        </svg>
        <h2>¿Listo para empezar?</h2>
        <p>Crea tu cuenta gratis y comienza a aplicar exámenes seguros hoy mismo.</p>
        <div class="home-cta-btns">
          <a href="#/register" class="cta-btn-white">
            <i class="fa-solid fa-user-plus"></i> Crear cuenta gratis
          </a>
          <a href="#/invitado" class="cta-btn-outline-white">
            <i class="fa-solid fa-bolt"></i> Acceso rápido
          </a>
        </div>
      </div>

      <!-- ── CARTA UNIVERSIDAD ── -->
      <div style="
        margin:2rem 0 1rem;
        background:var(--surface,#fff);
        border:1px solid var(--border,#e2e8f0);
        border-radius:1.5rem;
        overflow:hidden;
        box-shadow:0 2px 12px rgba(0,0,0,.06);
        position:relative;z-index:1;
        animation:slideUp .6s 1.3s ease both;opacity:0;
        display:flex;flex-wrap:wrap;
      ">
        <!-- Mapa embed -->
        <div style="flex:1;min-width:280px;min-height:220px;position:relative">
          <iframe
            src="https://maps.google.com/maps?q=Universidad+de+Ibagu%C3%A9,+Carrera+22+Calle+67B,+Ibagu%C3%A9,+Tolima,+Colombia&output=embed&z=15"
            style="width:100%;height:100%;min-height:220px;border:none;display:block"
            allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
            title="Ubicación Universidad de Ibagué">
          </iframe>
        </div>
        <!-- Info -->
        <div style="flex:1;min-width:260px;padding:1.75rem 2rem;display:flex;flex-direction:column;justify-content:center;gap:1rem">
          <div style="display:flex;align-items:center;gap:.75rem">
            <div style="
              width:2.75rem;height:2.75rem;border-radius:.75rem;flex-shrink:0;
              background:linear-gradient(135deg,#1e3a5f,#2563eb);
              display:flex;align-items:center;justify-content:center;
              box-shadow:0 4px 12px rgba(37,99,235,.3);
            ">
              <i class="fa-solid fa-graduation-cap" style="color:#fff;font-size:1rem"></i>
            </div>
            <div>
              <p style="font-weight:800;font-size:1rem;color:var(--text-primary,#0d1117);letter-spacing:-.01em">Universidad de Ibagué</p>
              <p style="font-size:.75rem;color:var(--text-muted,#8896a7);margin-top:.1rem">UNIBAGUÉ · Fundada en 1980</p>
            </div>
          </div>

          <div style="display:flex;flex-direction:column;gap:.65rem">
            <div style="display:flex;align-items:flex-start;gap:.65rem">
              <i class="fa-solid fa-location-dot" style="color:#2563eb;font-size:.9rem;margin-top:.15rem;flex-shrink:0"></i>
              <div>
                <p style="font-size:.82rem;font-weight:600;color:var(--text-primary,#0d1117)">Carrera 22 Calle 67B</p>
                <p style="font-size:.78rem;color:var(--text-muted,#8896a7)">Ibagué, Tolima, Colombia</p>
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:.65rem">
              <i class="fa-solid fa-building-columns" style="color:#2563eb;font-size:.9rem;flex-shrink:0"></i>
              <p style="font-size:.82rem;color:var(--text-secondary,#4a5568)">Universidad privada sin ánimo de lucro</p>
            </div>
            <div style="display:flex;align-items:center;gap:.65rem">
              <i class="fa-solid fa-globe" style="color:#2563eb;font-size:.9rem;flex-shrink:0"></i>
              <a href="https://www.unibague.edu.co" target="_blank" rel="noopener"
                style="font-size:.82rem;color:#2563eb;text-decoration:none;font-weight:600">
                www.unibague.edu.co
              </a>
            </div>
            <div style="display:flex;align-items:center;gap:.65rem">
              <i class="fa-solid fa-phone" style="color:#2563eb;font-size:.9rem;flex-shrink:0"></i>
              <p style="font-size:.82rem;color:var(--text-secondary,#4a5568)">+57 (8) 276 0010</p>
            </div>
          </div>

          <div style="
            background:#eff6ff;border:1px solid #bfdbfe;border-radius:.85rem;
            padding:.65rem .9rem;font-size:.78rem;color:#1d4ed8;line-height:1.5;
          ">
            <i class="fa-solid fa-circle-info" style="margin-right:.4rem"></i>
            AulaSegura es un proyecto académico desarrollado por estudiantes de la Universidad de Ibagué.
          </div>
        </div>
      </div>

      <footer class="home-footer">
        © ${new Date().getFullYear()} Aula Segura — Kevin Martinez y Cristian Reyes
      </footer>

    </div>
  `;

  // Partículas
  const container = document.getElementById('home-particles');
  if (container) {
    for (let i = 0; i < 14; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size  = 80 + Math.random() * 120;
      const dur   = 22 + Math.random() * 18;
      const delay = -(Math.random() * dur);
      p.style.cssText = [
        `width:${size}px`, `height:${size}px`,
        `left:${5 + Math.random() * 90}%`,
        `bottom:-${size}px`,
        `animation-duration:${dur}s`,
        `animation-delay:${delay}s`,
        `opacity:0`,
      ].join(';');
      container.appendChild(p);
    }
  }

  // Contador animado
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
