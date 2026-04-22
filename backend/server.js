// ─────────────────────────────────────────────
// IMPORTS Y CONFIG
// ─────────────────────────────────────────────
const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccount.json');

// Firebase Admin init
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://aulasegura-d535e-default-rtdb.firebaseio.com'
});

const db = admin.firestore();
const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// ─────────────────────────────────────────────
// SERVIR FRONTEND DESDE /backend
// ─────────────────────────────────────────────

// Sirve todos tus archivos: css/, js/, pages/, index.html
app.use(express.static(path.join(__dirname)));

// Cuando alguien entre a http://localhost:3000 → carga index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !role)
    return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' });

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name
    });

    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      name: name || '',
      role,
      createdAt: new Date().toISOString()
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
    const fetch = (await import('node-fetch')).default;
    const apiKey = 'AIzaSyCgbKJO_Wd2IgRxfH-NtVmgul4bdreWqtk';
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });

    const data = await response.json();
    if (data.error) return res.status(401).json({ ok: false, error: 'Correo o contraseña incorrectos' });

    const userDoc = await db.collection('users').doc(data.localId).get();
    if (!userDoc.exists)
      return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });

    res.json({ ok: true, user: userDoc.data() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────
// EVALUACIONES
// ─────────────────────────────────────────────
app.get('/api/evaluaciones', async (req, res) => {
  try {
    const { teacherId } = req.query;

    let query = db.collection('evaluaciones');

    // 🔥 SI VIENE teacherId → FILTRAR
    if (teacherId) {
      query = query.where('teacherId', '==', teacherId);
    }

    const snap = await query.orderBy('createdAt', 'desc').get();

    res.json(snap.docs.map(d => ({
      id: d.id,
      ...d.data()
    })));

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
app.get('/api/evaluaciones/code/:code', async (req, res) => {
  try {
    const snap = await db.collection('evaluaciones')
      .where('code', '==', req.params.code.toUpperCase())
      .limit(1)
      .get();

    if (snap.empty)
      return res.status(404).json({ ok: false, error: 'Examen no encontrado' });

    const doc = snap.docs[0];
    res.json({ ok: true, exam: { id: doc.id, ...doc.data() } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/evaluaciones', async (req, res) => {
  try {
    const data = { ...req.body, createdAt: new Date().toISOString() };
    const ref = await db.collection('evaluaciones').add(data);
    res.json({ ok: true, id: ref.id, ...data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/evaluaciones/:id', async (req, res) => {
  try {
    await db.collection('evaluaciones').doc(req.params.id).update(req.body);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/evaluaciones/:id', async (req, res) => {
  try {
    await db.collection('evaluaciones').doc(req.params.id).delete();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// NOTAS
// ─────────────────────────────────────────────
app.get('/api/notas', async (req, res) => {
  try {
    const { teacherId } = req.query;

    // Obtener los IDs de exámenes del profesor para filtrar sus notas
    if (teacherId) {
      const examsSnap = await db.collection('evaluaciones')
        .where('teacherId', '==', teacherId)
        .get();

      const examIds  = new Set(examsSnap.docs.map(d => d.id));
      const examCodes = new Set(examsSnap.docs.map(d => d.data().code));

      const notasSnap = await db.collection('notas').orderBy('submittedAt', 'desc').get();
      const notas = notasSnap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(n => examIds.has(n.examId) || examCodes.has(n.code));

      return res.json(notas);
    }

    // Sin teacherId devuelve todo (compatibilidad)
    const snap = await db.collection('notas').orderBy('submittedAt', 'desc').get();
    res.json(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notas', async (req, res) => {
  try {
    const ref = await db.collection('notas').add(req.body);
    res.json({ ok: true, id: ref.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`)
);