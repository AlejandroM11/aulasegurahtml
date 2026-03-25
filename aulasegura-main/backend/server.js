const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

// ── Firebase Admin init ──
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://aulasegura-d535e-default-rtdb.firebaseio.com'
  // ⚠️ Reemplaza esta URL con la de TU proyecto si creaste uno nuevo
});

const db = admin.firestore();
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// ═══════════════════════════════════
//  AUTH
// ═══════════════════════════════════

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !role)
    return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' });

  try {
    // Crear usuario en Firebase Auth
    const userRecord = await admin.auth().createUser({ email, password, displayName: name });

    // Guardar perfil en Firestore
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid, email, name: name || '', role, createdAt: new Date().toISOString()
    });

    res.json({ ok: true, uid: userRecord.uid, email, name: name || '', role });
  } catch (err) {
    const msg = err.code === 'auth/email-already-exists'
      ? 'Este correo ya está registrado'
      : err.message;
    res.status(400).json({ ok: false, error: msg });
  }
});

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ ok: false, error: 'Faltan campos' });

  try {
    // Firebase Admin no verifica contraseñas directamente,
    // usamos la REST API de Firebase Auth
    const fetch = (await import('node-fetch')).default;
    const apiKey = 'AIzaSyCgbKJO_Wd2IgRxfH-NtVmgul4bdreWqtk'; // tu apiKey del firebaseConfig
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });

    const data = await response.json();
    if (data.error) return res.status(401).json({ ok: false, error: 'Correo o contraseña incorrectos' });

    // Traer perfil de Firestore
    const userDoc = await db.collection('users').doc(data.localId).get();
    if (!userDoc.exists) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });

    const user = userDoc.data();
    res.json({ ok: true, user });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ═══════════════════════════════════
//  EVALUACIONES
// ═══════════════════════════════════

// GET /api/evaluaciones
app.get('/api/evaluaciones', async (req, res) => {
  try {
    const snap = await db.collection('evaluaciones').orderBy('createdAt', 'desc').get();
    const exams = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/evaluaciones/code/:code
app.get('/api/evaluaciones/code/:code', async (req, res) => {
  try {
    const snap = await db.collection('evaluaciones')
      .where('code', '==', req.params.code.toUpperCase()).limit(1).get();
    if (snap.empty) return res.status(404).json({ ok: false, error: 'Examen no encontrado' });
    const doc = snap.docs[0];
    res.json({ ok: true, exam: { id: doc.id, ...doc.data() } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/evaluaciones
app.post('/api/evaluaciones', async (req, res) => {
  try {
    const data = { ...req.body, createdAt: new Date().toISOString() };
    const ref = await db.collection('evaluaciones').add(data);
    res.json({ ok: true, id: ref.id, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/evaluaciones/:id
app.put('/api/evaluaciones/:id', async (req, res) => {
  try {
    await db.collection('evaluaciones').doc(req.params.id).update(req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/evaluaciones/:id
app.delete('/api/evaluaciones/:id', async (req, res) => {
  try {
    await db.collection('evaluaciones').doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════
//  NOTAS / SUBMISSIONS
// ═══════════════════════════════════

// GET /api/notas
app.get('/api/notas', async (req, res) => {
  try {
    const snap = await db.collection('notas').orderBy('submittedAt', 'desc').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/notas
app.post('/api/notas', async (req, res) => {
  try {
    const ref = await db.collection('notas').add(req.body);
    res.json({ ok: true, id: ref.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Start server ──
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en http://localhost:${PORT}`));