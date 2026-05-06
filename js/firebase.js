// ===== FIREBASE INIT =====
const firebaseConfig = {
  apiKey: "AIzaSyA5yRZNLV1qjA_o63RcGf0qKPehCuHIlgw",
  authDomain: "aulahtml-c94fa.firebaseapp.com",
  databaseURL: "https://aulahtml-c94fa-default-rtdb.firebaseio.com",
  projectId: "aulahtml-c94fa",
  storageBucket: "aulahtml-c94fa.firebasestorage.app",
  messagingSenderId: "736905199684",
  appId: "1:736905199684:web:3fd073449fdc9b5f02bc11"
};

firebase.initializeApp(firebaseConfig);
const fbAuth = firebase.auth();
const fbDB   = firebase.database();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// ===== HELPERS DE REALTIME DATABASE =====

function dbRef(path) {
  return fbDB.ref(path);
}

function studentRef(examCode, uid) {
  return dbRef(`active_exams/${examCode}/students/${uid}`);
}

function messagesRef(examCode) {
  return dbRef(`active_exams/${examCode}/messages`);
}

/** Registra un estudiante como activo en el examen */
function registerActiveStudent(examCode, studentData) {
  return studentRef(examCode, studentData.uid).set({
    uid: studentData.uid,
    email: studentData.email,
    name: studentData.name,
    joinedAt: Date.now(),
    status: 'active',
    timeLeft: studentData.timeLeft,
    answeredCount: 0,
    violations: 0,
    isBlocked: false,
    lastActivity: Date.now()
  });
}

/** Actualiza el estado del estudiante (tiempo, respuestas, infracciones) */
function updateStudentStatus(examCode, uid, updates) {
  return studentRef(examCode, uid).update({ ...updates, lastActivity: Date.now() });
}

/** Bloquea a un estudiante con una razón */
function blockStudent(examCode, uid, reason) {
  return studentRef(examCode, uid).update({
    isBlocked: true, blockReason: reason,
    blockedAt: Date.now(), status: 'blocked'
  });
}

/** Desbloquea a un estudiante */
function unblockStudent(examCode, uid) {
  return studentRef(examCode, uid).update({
    isBlocked: false, blockReason: null,
    unblockedAt: Date.now(), status: 'active'
  });
}

/** Elimina al estudiante de la lista de activos */
function removeActiveStudent(examCode, uid) {
  return studentRef(examCode, uid).remove();
}

/** Envía un mensaje del estudiante al docente */
function sendMessageToTeacher(examCode, uid, message, studentName, studentEmail) {
  return messagesRef(examCode).push({
    studentUid: uid,
    studentName: studentName || uid,
    studentEmail: studentEmail || '',
    message,
    timestamp: Date.now(),
    read: false
  });
}

/** Responde a un mensaje de estudiante */
function respondToStudent(examCode, messageId, response) {
  return messagesRef(examCode).child(messageId).update({
    response, respondedAt: Date.now(), read: true
  });
}

/** Elimina un mensaje del inbox */
function deleteMessage(examCode, messageId) {
  return messagesRef(examCode).child(messageId).remove();
}

/** Marca un mensaje como leído */
function markMessageRead(examCode, messageId) {
  return messagesRef(examCode).child(messageId).update({ read: true });
}

/** Escucha en tiempo real los estudiantes activos de un examen */
function listenToActiveStudents(examCode, callback) {
  const ref = dbRef(`active_exams/${examCode}/students`);
  ref.on('value', snap => {
    const students = [];
    snap.forEach(child => students.push({ id: child.key, ...child.val() }));
    callback(students);
  });
  return () => ref.off('value');
}

/** Escucha en tiempo real los mensajes de un examen */
function listenToMessages(examCode, callback) {
  const ref = messagesRef(examCode);
  ref.on('value', snap => {
    const msgs = [];
    snap.forEach(child => msgs.push({ id: child.key, ...child.val() }));
    callback(msgs);
  });
  return () => ref.off('value');
}

/** Escucha el estado de bloqueo de un estudiante específico */
function listenToBlockStatus(examCode, uid, callback) {
  const ref = studentRef(examCode, uid);
  ref.on('value', snap => {
    const data = snap.val();
    if (data) callback(data.isBlocked, data.blockReason);
  });
  return () => ref.off('value');
}

async function loginWithGoogle(role) {
  try {
    const result = await fbAuth.signInWithPopup(googleProvider);
    const u = result.user;

    const snap = await fbDB.ref(`users/${u.uid}`).get();

    if (snap.exists()) {
      const existing = snap.val();
      if (existing.role !== role) {
        alert(`Esta cuenta ya está registrada como ${existing.role}.`);
        return null;
      }
      setUser(existing);
      return existing;
    }

    const newUser = {
      uid: u.uid, email: u.email,
      name: u.displayName || '', photo: u.photoURL || '',
      role, fromGoogle: true, createdAt: new Date().toISOString()
    };
    await fbDB.ref(`users/${u.uid}`).set(newUser);
    setUser(newUser);
    return newUser;
  } catch (err) {
    alert('Error al iniciar sesión con Google: ' + err.message);
    return null;
  }
}