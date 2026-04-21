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
};

const TEACHER_ROUTES  = ['/docente', '/monitor', '/resultados'];
const STUDENT_ROUTES  = ['/estudiante'];
const AUTH_ONLY_ROUTES = ['/login', '/register'];

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

  // Redirigir desde home si ya hay sesión
  if (path === '/' && user) {
    navigate(user.role === 'docente' ? '/docente' : '/estudiante');
    return;
  }

  // Rutas protegidas
  if (TEACHER_ROUTES.includes(path)) {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'docente') { navigate('/estudiante'); return; }
  }
  if (STUDENT_ROUTES.includes(path)) {
    if (!user) { navigate('/login'); return; }
    if (user.role !== 'estudiante') { navigate('/docente'); return; }
  }
  if (AUTH_ONLY_ROUTES.includes(path) && user) {
    redirectByRole(user);
    return;
  }

  const renderPage = ROUTES[path] || renderHome;
  app.innerHTML = '';
  renderPage(app);
  updateNavbar();
}

function updateNavbar() {
  const user    = getUser();
  const actions = document.getElementById('nav-actions');
  const isDark  = document.body.classList.contains('dark');

  actions.innerHTML = `
    <button class="btn btn-outline" id="theme-toggle">${isDark ? '☀️ Claro' : '🌙 Oscuro'}</button>
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
  const isDark = document.body.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateNavbar();
}

// ===== INIT =====
if (localStorage.getItem('theme') === 'dark') document.body.classList.add('dark');
setTimeout(() => document.getElementById('banner')?.remove(), 5000);

window.addEventListener('auth-changed', updateNavbar);
window.addEventListener('hashchange', router);
window.addEventListener('DOMContentLoaded', router);
