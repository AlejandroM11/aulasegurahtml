// ─────────────────────────────────────────────
// IMPORTS Y CONFIG
// ─────────────────────────────────────────────
const express = require('express');
const cors    = require('cors');
const admin   = require('firebase-admin');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// ─────────────────────────────────────────────
// FIREBASE ADMIN — Realtime Database
// ─────────────────────────────────────────────
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential:  admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});

const db = admin.database();

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
function dbRef(path) { return db.ref(path); }

async function getAll(path) {
  const snap = await dbRef(path).get();
  if (!snap.exists()) return [];
  const items = [];
  snap.forEach(child => items.push({ id: child.key, ...child.val() }));
  return items;
}

// ─────────────────────────────────────────────
// AUTH
// ─────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !role)
    return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' });
  try {
    const userRecord = await admin.auth().createUser({ email, password, displayName: name });
    const userData = {
      uid: userRecord.uid, email, name: name || '', role,
      createdAt: new Date().toISOString()
    };
    await dbRef(`users/${userRecord.uid}`).set(userData);
    res.json({ ok: true, ...userData });
  } catch (err) {
    const msg = err.code === 'auth/email-already-exists'
      ? 'Este correo ya está registrado' : err.message;
    res.status(400).json({ ok: false, error: msg });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ ok: false, error: 'Faltan campos' });
  try {
    const fetch = (await import('node-fetch')).default;
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    const data = await response.json();
    if (data.error) return res.status(401).json({ ok: false, error: 'Correo o contraseña incorrectos' });

    const snap = await dbRef(`users/${data.localId}`).get();
    if (!snap.exists()) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    res.json({ ok: true, user: snap.val() });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────
// EVALUACIONES
// ─────────────────────────────────────────────
app.get('/api/evaluaciones', async (req, res) => {
  try {
    const items = await getAll('evaluaciones');
    const sorted = items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    res.json(sorted);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/evaluaciones/code/:code', async (req, res) => {
  try {
    const items = await getAll('evaluaciones');
    const found = items.find(e => e.code === req.params.code.toUpperCase());
    if (!found) return res.status(404).json({ ok: false, error: 'Examen no encontrado' });
    res.json({ ok: true, exam: found });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/evaluaciones', async (req, res) => {
  try {
    const data = { ...req.body, createdAt: new Date().toISOString() };
    const ref = await dbRef('evaluaciones').push(data);
    res.json({ ok: true, id: ref.key, ...data });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/evaluaciones/:id', async (req, res) => {
  try {
    await dbRef(`evaluaciones/${req.params.id}`).update(req.body);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/evaluaciones/:id', async (req, res) => {
  try {
    await dbRef(`evaluaciones/${req.params.id}`).remove();
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─────────────────────────────────────────────
// NOTAS
// ─────────────────────────────────────────────
app.get('/api/notas', async (req, res) => {
  try {
    const items = await getAll('notas');
    const sorted = items.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
    res.json(sorted);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/notas', async (req, res) => {
  try {
    const ref = await dbRef('notas').push(req.body);
    res.json({ ok: true, id: ref.key });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─────────────────────────────────────────────
// GROQ — Generación de preguntas con IA
// ─────────────────────────────────────────────
app.post('/api/groq/generate', async (req, res) => {
  const { text, numQuestions = 5 } = req.body;
  if (!text || text.length < 50)
    return res.status(400).json({ ok: false, error: 'Texto muy corto' });

  try {
    const fetch = (await import('node-fetch')).default;
    const prompt = `Eres un asistente educativo. Basándote ÚNICAMENTE en el siguiente texto, genera exactamente ${numQuestions} preguntas de opción múltiple para un examen.

TEXTO DEL TEMARIO:
"""
${text.slice(0, 4000)}
"""

INSTRUCCIONES:
- Genera exactamente ${numQuestions} preguntas
- Cada pregunta debe tener exactamente 4 opciones (A, B, C, D)
- Solo una opción es correcta
- Responde ÚNICAMENTE con un array JSON válido, sin texto adicional

FORMATO EXACTO:
[
  {
    "text": "¿Pregunta aquí?",
    "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
    "correctIndex": 0
  }
]`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 2048
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Error de Groq');

    const content = data.choices[0].message.content
      .replace(/```json/g, '').replace(/```/g, '').trim();
    const start = content.indexOf('[');
    const end   = content.lastIndexOf(']');
    if (start === -1 || end === -1) throw new Error('Formato inválido de respuesta');

    const questions = JSON.parse(content.slice(start, end + 1));
    res.json({ ok: true, questions });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));