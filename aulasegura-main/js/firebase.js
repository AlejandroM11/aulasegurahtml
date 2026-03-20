// ===== FIREBASE INIT =====
const firebaseConfig = {
  apiKey: "AIzaSyCgbKJO_Wd2IgRxfH-NtVmgul4bdreWqtk",
  authDomain: "aulasegura-d535e.firebaseapp.com",
  projectId: "aulasegura-d535e",
  storageBucket: "aulasegura-d535e.firebasestorage.app",
  messagingSenderId: "918650073829",
  appId: "1:918650073829:web:8884dd5e11c571c60a9a0c",
  databaseURL: "https://aulasegura-d535e-default-rtdb.firebaseio.com"
};

firebase.initializeApp(firebaseConfig);
const fbAuth = firebase.auth();
const fbDB = firebase.database();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// ===== REALTIME DB HELPERS =====
function registerActiveStudent(examCode, studentData) {
  return fbDB.ref(`active_exams/${examCode}/students/${studentData.uid}`).set({
    uid: studentData.uid, email: studentData.email, name: studentData.name,
    joinedAt: Date.now(), status: 'active', timeLeft: studentData.timeLeft,
    answeredCount: 0, violations: 0, isBlocked: false, lastActivity: Date.now()
  });
}

function updateStudentStatus(examCode, studentUid, updates) {
  return fbDB.ref(`active_exams/${examCode}/students/${studentUid}`).update({ ...updates, lastActivity: Date.now() });
}

function blockStudent(examCode, studentUid, reason) {
  return fbDB.ref(`active_exams/${examCode}/students/${studentUid}`).update({
    isBlocked: true, blockReason: reason, blockedAt: Date.now(), status: 'blocked'
  });
}

function unblockStudent(examCode, studentUid) {
  return fbDB.ref(`active_exams/${examCode}/students/${studentUid}`).update({
    isBlocked: false, blockReason: null, unblockedAt: Date.now(), status: 'active'
  });
}

function sendMessageToTeacher(examCode, studentUid, message) {
  return fbDB.ref(`active_exams/${examCode}/messages`).push({
    studentUid, message, timestamp: Date.now(), read: false
  });
}

function respondToStudent(examCode, messageId, response) {
  return fbDB.ref(`active_exams/${examCode}/messages/${messageId}`).update({
    response, respondedAt: Date.now(), read: true
  });
}

function removeActiveStudent(examCode, studentUid) {
  return fbDB.ref(`active_exams/${examCode}/students/${studentUid}`).remove();
}

function listenToActiveStudents(examCode, callback) {
  const ref = fbDB.ref(`active_exams/${examCode}/students`);
  ref.on('value', snap => {
    const students = [];
    snap.forEach(child => students.push({ id: child.key, ...child.val() }));
    callback(students);
  });
  return () => ref.off('value');
}

function listenToMessages(examCode, callback) {
  const ref = fbDB.ref(`active_exams/${examCode}/messages`);
  ref.on('value', snap => {
    const msgs = [];
    snap.forEach(child => msgs.push({ id: child.key, ...child.val() }));
    callback(msgs);
  });
  return () => ref.off('value');
}

function listenToBlockStatus(examCode, studentUid, callback) {
  const ref = fbDB.ref(`active_exams/${examCode}/students/${studentUid}`);
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
    let list = JSON.parse(localStorage.getItem('users') || '[]');
    let existing = list.find(x => x.email === u.email);
    if (existing) {
      if (existing.role !== role) { alert(`Esta cuenta ya está registrada como ${existing.role}.`); return null; }
      setUser(existing); return existing;
    }
    const newUser = { uid: u.uid, email: u.email, name: u.displayName, photo: u.photoURL, role, fromGoogle: true };
    list.push(newUser);
    localStorage.setItem('users', JSON.stringify(list));
    setUser(newUser);
    return newUser;
  } catch(err) {
    console.error(err);
    alert('Error al iniciar sesión con Google');
    return null;
  }
}
