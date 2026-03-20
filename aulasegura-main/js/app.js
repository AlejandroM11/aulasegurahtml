// ===== ROUTER =====
const routes = {
  '/': renderHome,
  '/login': renderLogin,
  '/register': renderRegister,
  '/invitado': renderGuest,
  '/estudiante': renderStudent,
  '/docente': renderTeacher,
  '/monitor': renderMonitor,
  '/resultados': renderResults,
};

function navigate(path) {
  location.hash = path;
}

function getHash() {
  return location.hash.replace('#', '') || '/';
}

function router() {
  const path = getHash();
  const user = getUser();
  const app = document.getElementById('app');

  // Protected route logic
  const teacherRoutes = ['/docente', '/monitor', '/resultados'];
  const studentRoutes = ['/estudiante'];

  if (teacherRoutes.includes(path)) {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'docente') { navigate('/estudiante'); return; }
  }
  if (studentRoutes.includes(path)) {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'estudiante') { navigate('/docente'); return; }
  }
  if ((path === '/login' || path === '/register') && user) {
    navigate(user.role === 'docente' ? '/docente' : '/estudiante');
    return;
  }

  const render = routes[path] || renderHome;
  app.innerHTML = '';
  render(app);
  updateNavbar();
}

function updateNavbar() {
  const user = getUser();
  const actions = document.getElementById('nav-actions');
  const dark = document.body.classList.contains('dark');

  actions.innerHTML = `
    <button class="btn btn-outline" id="theme-toggle">${dark ? '☀️ Claro' : '🌙 Oscuro'}</button>
    ${user ? `
      <span class="nav-user hide-mobile">${user.email} · <b>${user.role}</b></span>
      <button class="btn btn-primary" id="nav-logout">Salir</button>
    ` : `
      <a href="#/login" class="btn btn-primary">Ingresar</a>
      <a href="#/register" class="btn btn-outline">Crear cuenta</a>
    `}
  `;

  document.getElementById('theme-toggle').onclick = toggleTheme;
  const logoutBtn = document.getElementById('nav-logout');
  if (logoutBtn) logoutBtn.onclick = () => { logout(); navigate('/login'); };
}

function toggleTheme() {
  const dark = document.body.classList.toggle('dark');
  localStorage.setItem('theme', dark ? 'dark' : 'light');
  updateNavbar();
}

// Init theme
if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');

// Auto-hide banner
setTimeout(() => { const b = document.getElementById('banner'); if (b) b.remove(); }, 5000);

// Listen to auth changes
window.addEventListener('auth-changed', updateNavbar);
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
