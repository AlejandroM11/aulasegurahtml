// ===== UTILIDADES COMPARTIDAS =====

/** Formatea segundos como "m:ss" */
function fmt(seconds) {
  if (!seconds || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/** Formatea un timestamp como tiempo relativo o hora */
function fmtTs(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Hace un momento';
  if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
  return new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

/** Formatea una fecha ISO como fecha y hora local */
function fmtDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

/** Convierte cualquier valor a string seguro para insertar en HTML */
function safeText(value) {
  if (value == null) return '';
  if (typeof value === 'object') {
    try { return JSON.stringify(value); } catch { return String(value); }
  }
  return String(value);
}

/** Genera un ID de invitado único */
function guestUid() {
  return `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/** Spinner HTML reutilizable */
function spinnerHTML(msg = 'Cargando...') {
  return `<div class="text-center" style="padding:4rem">
    <div class="spinner"></div>
    <p class="text-gray mt-3">${msg}</p>
  </div>`;
}
