// ===== API — Firebase Realtime Database directo =====

// ── Auth ──

async function apiLogin({ email, password }) {
  try {
    const result = await fbAuth.signInWithEmailAndPassword(email, password);
    const uid = result.user.uid;

    // Intentar leer perfil desde Realtime DB (fuente primaria)
    const snap = await fbDB.ref(`users/${uid}`).get();
    if (snap.exists()) {
      return { ok: true, user: snap.val() };
    }

    // Fallback: pedir el perfil al backend (que lo tiene en Firestore)
    // Esto cubre usuarios registrados antes de la migración a Realtime DB
    try {
      const res = await fetch(
        (location.hostname === 'localhost' || location.hostname === '127.0.0.1'
          ? 'http://localhost:3000'
          : '') + `/api/auth/login`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        }
      );
      const data = await res.json();
      if (data.ok && data.user) {
        // Sincronizar en Realtime DB para próximas sesiones
        await fbDB.ref(`users/${uid}`).set({ ...data.user, uid });
        return { ok: true, user: { ...data.user, uid } };
      }
    } catch { /* si el backend no responde, continuar con fallback mínimo */ }

    // Último recurso: objeto mínimo desde Firebase Auth
    const fallbackUser = {
      uid,
      email: result.user.email,
      name: result.user.displayName || result.user.email,
      role: 'docente'
    };
    await fbDB.ref(`users/${uid}`).set({ ...fallbackUser, createdAt: new Date().toISOString() });
    return { ok: true, user: fallbackUser };

  } catch (err) {
    throw new Error(err.message || 'Error al iniciar sesión');
  }
}

async function apiRegister({ email, password, name, role }) {
  try {
    const result = await fbAuth.createUserWithEmailAndPassword(email, password);
    const uid = result.user.uid;
    const userData = { uid, email, name: name || '', role, createdAt: new Date().toISOString() };
    await fbDB.ref(`users/${uid}`).set(userData);
    return { ok: true, ...userData };
  } catch (err) {
    if (err.code === 'auth/email-already-in-use') throw new Error('Este correo ya está registrado');
    throw new Error(err.message || 'Error al registrar');
  }
}

// ── Evaluaciones ──

async function apiGetExams() {
  const snap = await fbDB.ref('evaluaciones').get();
  if (!snap.exists()) return [];
  const items = [];
  snap.forEach(child => items.push({ id: child.key, ...child.val() }));
  return items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
}

async function apiCreateExam(data) {
  const ref = await fbDB.ref('evaluaciones').push({ ...data, createdAt: new Date().toISOString() });
  return { ok: true, id: ref.key };
}

async function apiUpdateExam(id, data) {
  await fbDB.ref(`evaluaciones/${id}`).update(data);
  return { ok: true };
}

async function apiDeleteExam(id) {
  await fbDB.ref(`evaluaciones/${id}`).remove();
  return { ok: true };
}

async function apiGetExamByCode(code) {
  const snap = await fbDB.ref('evaluaciones').get();
  if (!snap.exists()) return { ok: false };
  let found = null;
  snap.forEach(child => {
    const val = child.val();
    if (val.code === code.toUpperCase()) found = { id: child.key, ...val };
  });
  if (!found) return { ok: false };
  return { ok: true, exam: found };
}

// ── Notas ──

async function apiGetSubmissions() {
  const snap = await fbDB.ref('notas').get();
  if (!snap.exists()) return [];
  const items = [];
  snap.forEach(child => items.push({ id: child.key, ...child.val() }));
  return items.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
}

async function apiCreateSubmission(data) {
  const ref = await fbDB.ref('notas').push(data);
  return { ok: true, id: ref.key };
}