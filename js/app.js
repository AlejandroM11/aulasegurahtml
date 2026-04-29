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
  '/perfil': renderPerfil, 
};

const TEACHER_ROUTES = ['/docente', '/monitor', '/resultados', '/examenes', '/perfil'];
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
  if (path !== '/docente' && path !== '/monitor' && path !== '/resultados') {
    destroyChat?.();
  }
  renderPage(app);
  updateNavbar();
}

// ── Reemplaza la función updateNavbar en js/app.js ──

function updateNavbar() {
  const user    = getUser();
  const actions = document.getElementById('nav-actions');
  const isDark  = document.body.classList.contains('dark');

  function getInitials(name) {
    if (!name) return '?';
    return name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function getAvatarColor(str) {
    const colors = ['#2563eb','#7c3aed','#0891b2','#059669','#dc2626','#d97706'];
    let hash = 0;
    for (let c of (str||'')) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  function avatarHTML(user) {
    if (user.photo) {
      return `<img src="${user.photo}" style="width:2rem;height:2rem;border-radius:50%;object-fit:cover;display:block"
                onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
              <div style="display:none;width:2rem;height:2rem;border-radius:50%;background:${getAvatarColor(user.email)};align-items:center;justify-content:center;font-size:.7rem;font-weight:800;color:#fff">
                ${getInitials(user.name)}
              </div>`;
    }
    return `<div style="width:2rem;height:2rem;border-radius:50%;background:${getAvatarColor(user.email)};display:flex;align-items:center;justify-content:center;font-size:.7rem;font-weight:800;color:#fff">
              ${getInitials(user.name)}
            </div>`;
  }

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
      .nav-role-dot {
        width: .45rem; height: .45rem; border-radius: 50%;
        display: inline-block; margin-right: .3rem;
      }
    </style>
    <button class="btn btn-outline" id="theme-toggle">${isDark ? '☀️ Claro' : '🌙 Oscuro'}</button>
    ${user ? `
      <a href="#/perfil" class="nav-profile-btn" id="nav-profile">
        ${avatarHTML(user)}
        <div style="display:flex;flex-direction:column;line-height:1.2">
          <span class="nav-profile-name">${user.name || user.email.split('@')[0]}</span>
          <span style="font-size:.68rem;color:#94a3b8">
            <span class="nav-role-dot" style="background:${user.role==='docente'?'#2563eb':'#16a34a'}"></span>${user.role}
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
