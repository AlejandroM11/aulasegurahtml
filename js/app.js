// ===== ROUTER =====

const ROUTES = {
  '/':           renderHome,
  '/login':      renderLogin,
  '/register':   renderRegister,
  '/invitado':   renderGuest,
  '/estudiante': renderStudent,
  '/docente':    renderTeacher,
  '/monitor':    renderMonitor,
  '/resultados': renderResults,
  '/examenes':   renderExamenes,
  '/perfil':     renderPerfil,
};

const TEACHER_ROUTES   = ['/docente', '/monitor', '/resultados', '/examenes', '/perfil'];
const STUDENT_ROUTES   = ['/estudiante'];
const AUTH_ONLY_ROUTES = ['/login', '/register'];

// Rutas donde el chat flotante debe permanecer visible
const CHAT_ROUTES = ['/docente', '/monitor', '/resultados'];

function navigate(path) {
  location.hash = path;
}

function getHash() {
  return location.hash.replace('#', '') || '/';
}

function router() {
  const path = getHash();
  const user = getUser();
  const app  = document.getElementById('app');

  // Limpiar modo examen si el estudiante navega fuera de /estudiante
  if (path !== '/estudiante' && typeof window._examCleanupFull === 'function') {
    window._examCleanupFull();
    window._examCleanupFull = null;
  }

  if (path === '/' && user) {
    navigate(user.role === 'docente' ? '/docente' : '/estudiante');
    return;
  }

  if (TEACHER_ROUTES.includes(path)) {
    if (!user)                    { navigate('/login');      return; }
    if (user.role !== 'docente')  { navigate('/estudiante'); return; }
  }
  if (STUDENT_ROUTES.includes(path)) {
    if (!user)                      { navigate('/login');   return; }
    if (user.role !== 'estudiante') { navigate('/docente'); return; }
  }
  if (AUTH_ONLY_ROUTES.includes(path) && user) {
    redirectByRole(user);
    return;
  }

  if (!CHAT_ROUTES.includes(path)) destroyChat?.();

  const renderPage = ROUTES[path] || renderHome;
  app.innerHTML = '';
  window.scrollTo({ top: 0, behavior: 'instant' });
  renderPage(app);
  updateNavbar();
}

// ===== NAVBAR =====

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

function getAvatarColor(str) {
  const colors = ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#dc2626', '#d97706'];
  let hash = 0;
  for (const c of (str || '')) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function buildNavBrandHTML() {
  return `
    <a href="#/" class="nav-brand">
      <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" class="nav-logo-svg">
        <defs>
          <linearGradient id="shieldGrad" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#1e3a5f"/>
            <stop offset="100%" stop-color="#2563eb"/>
          </linearGradient>
          <linearGradient id="lockGrad" x1="0" y1="0" x2="20" y2="20" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stop-color="#60a5fa"/>
            <stop offset="100%" stop-color="#ffffff"/>
          </linearGradient>
        </defs>
        <path d="M22 3L5 10v10c0 9.5 7.2 18.4 17 20.9C31.8 38.4 39 29.5 39 20V10L22 3z"
          fill="url(#shieldGrad)" stroke="#3b82f6" stroke-width="1.2" stroke-linejoin="round">
          <animate attributeName="opacity" values="1;0.85;1" dur="3s" repeatCount="indefinite"/>
        </path>
        <path d="M22 7L9 13v8c0 7.5 5.7 14.5 13 16.5C29.3 35.5 35 28.5 35 21v-8L22 7z"
          fill="rgba(255,255,255,0.07)"/>
        <rect x="15" y="22" width="14" height="10" rx="2.5" fill="url(#lockGrad)" opacity="0.95"/>
        <path d="M17 22v-3.5a5 5 0 0 1 10 0V22"
          stroke="white" stroke-width="2.2" stroke-linecap="round" fill="none"/>
        <circle cx="22" cy="26.5" r="1.8" fill="#1e3a5f">
          <animate attributeName="r" values="1.8;2.2;1.8" dur="2.5s" repeatCount="indefinite"/>
        </circle>
      </svg>
      <span class="nav-brand-text">Aula<strong>Segura</strong></span>
    </a>
  `;
}

function buildAvatarHTML(user) {
  const initials = getInitials(user.name);
  const color    = getAvatarColor(user.email);
  const fallback = `<div style="display:none;width:2rem;height:2rem;border-radius:50%;background:${color};align-items:center;justify-content:center;font-size:.7rem;font-weight:800;color:#fff">${initials}</div>`;

  if (user.photo) {
    return `<img src="${user.photo}" style="width:2rem;height:2rem;border-radius:50%;object-fit:cover;display:block"
              onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>${fallback}`;
  }
  return `<div style="width:2rem;height:2rem;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800;color:#fff">${initials}</div>`;
}

function updateNavbar() {
  const user    = getUser();
  const actions = document.getElementById('nav-actions');
  const isDark  = document.body.classList.contains('dark');

  actions.innerHTML = `
    <style>
      .nav-profile-btn {
        display: flex; align-items: center; gap: .5rem;
        padding: .3rem .7rem .3rem .3rem;
        border-radius: 999px; border: 1.5px solid #e2e8f0;
        background: #fff; cursor: pointer; transition: all .2s;
        text-decoration: none;
      }
      .nav-profile-btn:hover { border-color: #2563eb; background: #eff6ff; }
      body.dark .nav-profile-btn { background: #1e293b; border-color: #334155; }
      body.dark .nav-profile-btn:hover { border-color: #3b82f6; background: #1e3a5f; }
      .nav-profile-name {
        font-size: .82rem; font-weight: 600; color: #374151;
        max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      }
      body.dark .nav-profile-name { color: #e2e8f0; }
      .nav-role-dot { width: .45rem; height: .45rem; border-radius: 50%; display: inline-block; margin-right: .3rem; }

      /* ── Menú móvil ── */
      .nav-mobile-menu-btn {
        display: none;
        align-items: center; justify-content: center;
        width: 2.4rem; height: 2.4rem;
        border-radius: var(--radius-md);
        border: 1.5px solid var(--border-strong, #cbd5e1);
        background: transparent; cursor: pointer;
        color: var(--text-secondary, #475569);
        font-size: 1rem; transition: all .2s;
      }
      .nav-mobile-menu-btn:hover { background: var(--gray-100, #f1f5f9); border-color: #2563eb; color: #2563eb; }
      body.dark .nav-mobile-menu-btn { border-color: #334155; color: #94a3b8; }
      body.dark .nav-mobile-menu-btn:hover { background: #1e293b; border-color: #3b82f6; color: #60a5fa; }

      .nav-mobile-dropdown {
        display: none;
        position: fixed;
        top: var(--nav-height, 64px);
        left: 0; right: 0;
        background: var(--surface, #fff);
        border-bottom: 1px solid var(--border, #e2e8f0);
        box-shadow: 0 8px 24px rgba(0,0,0,.1);
        z-index: 49;
        padding: .75rem 1rem;
        flex-direction: column;
        gap: .5rem;
        animation: slideDown .2s ease;
      }
      body.dark .nav-mobile-dropdown { background: #0d1117; border-color: #21262d; }
      @keyframes slideDown {
        from { opacity: 0; transform: translateY(-8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .nav-mobile-dropdown.open { display: flex; }

      .nav-mobile-item {
        display: flex; align-items: center; gap: .75rem;
        padding: .75rem 1rem;
        border-radius: var(--radius-lg);
        text-decoration: none;
        font-size: .9rem; font-weight: 600;
        color: var(--text-primary, #0d1117);
        background: transparent;
        border: none; cursor: pointer; width: 100%;
        transition: background .15s;
        font-family: inherit;
      }
      .nav-mobile-item:hover { background: var(--gray-100, #f1f5f9); }
      body.dark .nav-mobile-item { color: #e6edf3; }
      body.dark .nav-mobile-item:hover { background: #161b22; }
      .nav-mobile-item i { width: 1.1rem; text-align: center; color: #64748b; }
      body.dark .nav-mobile-item i { color: #8b949e; }
      .nav-mobile-divider { height: 1px; background: var(--border, #e2e8f0); margin: .25rem 0; }
      body.dark .nav-mobile-divider { background: #21262d; }

      /* Mostrar/ocultar según breakpoint */
      @media (max-width: 640px) {
        .nav-desktop-actions { display: none !important; }
        .nav-mobile-menu-btn { display: flex !important; }
      }
      @media (min-width: 641px) {
        .nav-mobile-menu-btn { display: none !important; }
        .nav-mobile-dropdown { display: none !important; }
      }
    </style>

    <!-- Acciones desktop (ocultas en móvil) -->
    <div class="nav-desktop-actions" style="display:flex;align-items:center;gap:.5rem">
      <button class="btn btn-outline" id="theme-toggle-desk">${isDark ? '☀️ Claro' : '🌙 Oscuro'}</button>
      ${user ? `
        <a href="#/perfil" class="nav-profile-btn" id="nav-profile">
          ${buildAvatarHTML(user)}
          <div style="display:flex;flex-direction:column;line-height:1.2">
            <span class="nav-profile-name">${user.name || user.email.split('@')[0]}</span>
            <span style="font-size:.68rem;color:#94a3b8">
              <span class="nav-role-dot" style="background:${user.role === 'docente' ? '#2563eb' : '#16a34a'}"></span>${user.role}
            </span>
          </div>
          <i class="fa-solid fa-chevron-down" style="font-size:.65rem;color:#94a3b8"></i>
        </a>
        <button class="btn btn-outline" id="nav-logout-desk" style="padding:.4rem .85rem;font-size:.85rem">
          <i class="fa-solid fa-right-from-bracket" style="margin-right:.3rem"></i>Salir
        </button>
      ` : `
        <a href="#/login" class="btn btn-primary">Ingresar</a>
        <a href="#/register" class="btn btn-outline">Crear cuenta</a>
      `}
    </div>

    <!-- Botón hamburguesa (solo móvil) -->
    <button class="nav-mobile-menu-btn" id="nav-mobile-toggle" aria-label="Menú">
      <i class="fa-solid fa-bars"></i>
    </button>

    <!-- Dropdown móvil -->
    <div class="nav-mobile-dropdown" id="nav-mobile-dropdown">
      ${user ? `
        <!-- Info del usuario -->
        <div style="display:flex;align-items:center;gap:.75rem;padding:.5rem 1rem .75rem;border-bottom:1px solid var(--border,#e2e8f0);margin-bottom:.25rem">
          ${buildAvatarHTML(user)}
          <div>
            <p style="font-weight:700;font-size:.9rem;color:var(--text-primary)">${user.name || user.email.split('@')[0]}</p>
            <p style="font-size:.72rem;color:#94a3b8">${user.email}</p>
          </div>
        </div>
        <a href="#/perfil" class="nav-mobile-item" id="mob-perfil">
          <i class="fa-solid fa-user" style="color:#2563eb"></i>Mi perfil
        </a>
        ${user.role === 'docente' ? `
          <a href="#/docente" class="nav-mobile-item" id="mob-docente">
            <i class="fa-solid fa-chalkboard-user" style="color:#7c3aed"></i>Panel docente
          </a>
          <a href="#/monitor" class="nav-mobile-item" id="mob-monitor">
            <i class="fa-solid fa-tower-broadcast" style="color:#0891b2"></i>Monitoreo
          </a>
          <a href="#/resultados" class="nav-mobile-item" id="mob-results">
            <i class="fa-solid fa-chart-bar" style="color:#16a34a"></i>Resultados
          </a>
        ` : ''}
        <div class="nav-mobile-divider"></div>
        <button class="nav-mobile-item" id="mob-theme">
          <i class="fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}" style="color:#d97706"></i>
          ${isDark ? 'Modo claro' : 'Modo oscuro'}
        </button>
        <button class="nav-mobile-item" id="mob-logout" style="color:#dc2626">
          <i class="fa-solid fa-right-from-bracket" style="color:#dc2626"></i>Cerrar sesión
        </button>
      ` : `
        <a href="#/login" class="nav-mobile-item">
          <i class="fa-solid fa-right-to-bracket" style="color:#2563eb"></i>Ingresar
        </a>
        <a href="#/register" class="nav-mobile-item">
          <i class="fa-solid fa-user-plus" style="color:#7c3aed"></i>Crear cuenta
        </a>
        <div class="nav-mobile-divider"></div>
        <button class="nav-mobile-item" id="mob-theme">
          <i class="fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}" style="color:#d97706"></i>
          ${isDark ? 'Modo claro' : 'Modo oscuro'}
        </button>
      `}
    </div>
  `;

  // Desktop events
  document.getElementById('theme-toggle-desk')?.addEventListener('click', toggleTheme);
  document.getElementById('nav-logout-desk')?.addEventListener('click', () => { logout(); navigate('/login'); });

  // Mobile toggle
  const mobileBtn      = document.getElementById('nav-mobile-toggle');
  const mobileDropdown = document.getElementById('nav-mobile-dropdown');

  mobileBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    mobileDropdown?.classList.toggle('open');
    const isOpen = mobileDropdown?.classList.contains('open');
    mobileBtn.innerHTML = `<i class="fa-solid ${isOpen ? 'fa-xmark' : 'fa-bars'}"></i>`;
  });

  // Cerrar dropdown al hacer clic fuera
  document.addEventListener('click', function closeMob(e) {
    if (!mobileDropdown?.contains(e.target) && !mobileBtn?.contains(e.target)) {
      mobileDropdown?.classList.remove('open');
      if (mobileBtn) mobileBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
      document.removeEventListener('click', closeMob);
    }
  });

  // Mobile menu item events
  document.getElementById('mob-theme')?.addEventListener('click', () => {
    toggleTheme();
    mobileDropdown?.classList.remove('open');
  });
  document.getElementById('mob-logout')?.addEventListener('click', () => {
    logout(); navigate('/login');
    mobileDropdown?.classList.remove('open');
  });
  ['mob-perfil','mob-docente','mob-monitor','mob-results'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => {
      mobileDropdown?.classList.remove('open');
      if (mobileBtn) mobileBtn.innerHTML = '<i class="fa-solid fa-bars"></i>';
    });
  });

  // Alias para compatibilidad con código que busca theme-toggle o nav-logout
  // (el CSS responsive ya oculta el desktop en móvil)
}

function toggleTheme() {
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateNavbar();
}

// ===== INIT =====
if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
setTimeout(() => document.getElementById('banner')?.remove(), 5000);

// Al cargar la app, si hay un examen abandonado pendiente de limpiar en Firebase,
// procesarlo antes de que renderStudent lo haga (cubre el caso de reload desde otra ruta)
(function cleanupAbandonedExamOnLoad() {
  try {
    const raw = sessionStorage.getItem('_examAbandoned');
    if (!raw) return;
    sessionStorage.removeItem('_examAbandoned');
    const { code, uid, ts } = JSON.parse(raw);
    if (Date.now() - ts < 300000 && code && uid) {
      // removeActiveStudent está disponible globalmente desde firebase.js
      if (typeof removeActiveStudent === 'function') {
        removeActiveStudent(code, uid).catch(() => {});
      }
    }
  } catch (_) {}
})();

// beforeunload: se dispara en reload, cierre de pestaña y navegación fuera del origen
window.addEventListener('beforeunload', () => {
  if (typeof window._examCleanupFull === 'function') {
    window._examCleanupFull();
  }
});

// pagehide: más confiable en Safari/iOS y cuando el navegador optimiza el unload
window.addEventListener('pagehide', () => {
  if (typeof window._examCleanupFull === 'function') {
    window._examCleanupFull();
  }
});

window.addEventListener('auth-changed', updateNavbar);
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
