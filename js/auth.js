// ===== AUTENTICACIÓN (localStorage) =====

function setUser(user) {
  localStorage.setItem('user', JSON.stringify(user));
  window.dispatchEvent(new Event('auth-changed'));
}

function getUser() {
  try { return JSON.parse(localStorage.getItem('user')); }
  catch { return null; }
}

function logout() {
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth-changed'));
}

/** Redirige al dashboard según el rol del usuario */
function redirectByRole(user) {
  navigate(user.role === 'docente' ? '/docente' : '/estudiante');
}
