function renderHome(app) {
  app.innerHTML = `
    <style>
      .home-wrap { position: relative; overflow: hidden; }

      .particles {
        position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden;
      }
      .particle {
        position: absolute; border-radius: 50%;
        background: radial-gradient(circle, rgba(37,99,235,.18), transparent 70%);
        animation: floatUp linear infinite;
      }

      @keyframes floatUp {
        0%   { transform: translateY(100vh) scale(0);   opacity: 0; }
        10%  { opacity: 1; }
        90%  { opacity: .4; }
        100% { transform: translateY(-120px) scale(1.2); opacity: 0; }
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
            <img src="https://cdn-icons-png.flaticon.com/512/5231/5231719.png" alt="Examen seguro"/>
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
        <div class="stat-item">
          <span class="stat-num" data-text="∞">∞</span>
          <div class="stat-lbl">Estudiantes</div>
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
    for (let i = 0; i < 18; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = 60 + Math.random() * 120;
      p.style.cssText = `
        width:${size}px; height:${size}px;
        left:${Math.random() * 100}%;
        animation-duration:${8 + Math.random() * 14}s;
        animation-delay:${Math.random() * 10}s;
      `;
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