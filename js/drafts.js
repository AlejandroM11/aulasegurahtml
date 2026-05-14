// ===== BORRADORES — AulaSegura =====
// Almacena el progreso del examen en localStorage.
// Privado por usuario (uid), TTL de 2 minutos.
// Si se recarga dentro de los 2 min → se puede restaurar.
// Pasados los 2 min → se borra automáticamente.

const DRAFT_TTL_MS  = 2 * 60 * 1000; // 2 minutos
const DRAFT_PREFIX  = 'as_draft_';

/** Clave única por usuario */
function draftKey(uid) {
  return `${DRAFT_PREFIX}${uid}`;
}

/** Guarda el borrador actual del examen en curso */
function saveDraft(uid, data) {
  if (!uid) return;
  try {
    const entry = {
      ts:   Date.now(),
      data: {
        title:              data.title              || '',
        code:               data.code               || '',
        dur:                data.dur                || 30,
        showCorrectAnswers: data.showCorrectAnswers || false,
        questions:          data.questions          || [],
        selectedExamId:     data.selectedExamId     || null,
      }
    };
    localStorage.setItem(draftKey(uid), JSON.stringify(entry));
  } catch (_) {}
}

/** Lee el borrador si existe y no ha expirado (< 2 min) */
function loadDraft(uid) {
  if (!uid) return null;
  try {
    const raw = localStorage.getItem(draftKey(uid));
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry?.ts || !entry?.data) return null;
    // Expirado
    if (Date.now() - entry.ts > DRAFT_TTL_MS) {
      deleteDraft(uid);
      return null;
    }
    return entry;
  } catch (_) { return null; }
}

/** Elimina el borrador del usuario */
function deleteDraft(uid) {
  if (!uid) return;
  try { localStorage.removeItem(draftKey(uid)); } catch (_) {}
}

/** Devuelve true si hay un borrador válido (no expirado) */
function hasDraft(uid) {
  return loadDraft(uid) !== null;
}

/** Formatea el tiempo restante del borrador */
function draftTimeLeft(uid) {
  try {
    const raw = localStorage.getItem(draftKey(uid));
    if (!raw) return null;
    const { ts } = JSON.parse(raw);
    const left = DRAFT_TTL_MS - (Date.now() - ts);
    if (left <= 0) return null;
    const secs = Math.ceil(left / 1000);
    return secs >= 60
      ? `${Math.floor(secs / 60)}m ${secs % 60}s`
      : `${secs}s`;
  } catch (_) { return null; }
}
