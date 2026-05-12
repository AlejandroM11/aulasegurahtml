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
      <div class="nav-brand-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="rgba(255,255,255,.25)" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <span>AulaSegura</span>
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
    </style>
    <button class="btn btn-outline" id="theme-toggle">${isDark ? '☀️ Claro' : '🌙 Oscuro'}</button>
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
      <button class="btn btn-outline" id="nav-logout" style="padding:.4rem .85rem;font-size:.85rem">
        <i class="fa-solid fa-right-from-bracket" style="margin-right:.3rem"></i>Salir
      </button>
    ` : `
      <a href="#/login" class="btn btn-primary">Ingresar</a>
      <a href="#/register" class="btn btn-outline">Crear cuenta</a>
    `}
  `;

  document.getElementById('theme-toggle').onclick = toggleTheme;
  document.getElementById('nav-logout')?.addEventListener('click', () => { logout(); navigate('/login'); });
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
