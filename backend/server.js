const express = require('express');
const cors    = require('cors');
const admin   = require('firebase-admin');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({
  credential:  admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL
});
const db = admin.database();

function dbRef(path) { return db.ref(path); }

async function getAll(path) {
  const snap = await dbRef(path).get();
  if (!snap.exists()) return [];
  const val = snap.val();
  return Object.entries(val).map(([key, value]) => ({ id: key, ...value }));
}

// AUTH
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name, role } = req.body;
  if (!email || !password || !role)
    return res.status(400).json({ ok: false, error: 'Faltan campos obligatorios' });
  try {
    const userRecord = await admin.auth().createUser({ email, password, displayName: name });
    const userData = { uid: userRecord.uid, email, name: name || '', role, createdAt: new Date().toISOString() };
    await dbRef(`users/${userRecord.uid}`).set(userData);
    res.json({ ok: true, ...userData });
  } catch (err) {
    const msg = err.code === 'auth/email-already-exists' ? 'Este correo ya esta registrado' : err.message;
    res.status(400).json({ ok: false, error: msg });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ ok: false, error: 'Faltan campos' });
  try {
    const fetch = (await import('node-fetch')).default;
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true })
    });
    const data = await response.json();
    if (data.error) return res.status(401).json({ ok: false, error: 'Correo o contrasena incorrectos' });
    const snap = await dbRef(`users/${data.localId}`).get();
    if (!snap.exists()) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });
    res.json({ ok: true, user: snap.val() });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// EVALUACIONES
app.get('/api/evaluaciones', async (req, res) => {
  try {
    const items = await getAll('evaluaciones');
    res.json(items.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
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

// NOTAS
app.get('/api/notas', async (req, res) => {
  try {
    const items = await getAll('notas');
    res.json(items.sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || '')));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/notas', async (req, res) => {
  try {
    const ref = await dbRef('notas').push(req.body);
    res.json({ ok: true, id: ref.key });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GROQ — una llamada por tipo garantiza distribucion real
app.post('/api/groq/generate', async (req, res) => {
  const { text, numQuestions = 5, distribution } = req.body;
  if (!text || text.length < 50)
    return res.status(400).json({ ok: false, error: 'Texto muy corto' });

  try {
    const fetch  = (await import('node-fetch')).default;
    const snip   = text.slice(0, 3500);
    const apiKey = process.env.GROQ_API_KEY;

    // Prompt especializado por tipo
    function buildPrompt(type, n) {
      const intro = `Basandote en este texto educativo, genera EXACTAMENTE ${n} pregunta${n > 1 ? 's' : ''} del tipo indicado.\nTEXTO:\n"""\n${snip}\n"""\nDevuelve SOLO el array JSON, sin texto extra, sin markdown.\n\n`;
      if (type === 'mc')
        return intro + 'TIPO: Opcion multiple, UNA sola respuesta correcta.\nFORMATO: [{"text":"...","type":"mc","options":["A","B","C","D"],"correctIndex":0,"isMath":false}]';
      if (type === 'multi')
        return intro + 'TIPO: Seleccion multiple, DOS O MAS respuestas correctas. correctIndexes DEBE tener minimo 2 indices.\nFORMATO: [{"text":"...","type":"multi","options":["A","B","C","D"],"correctIndexes":[0,2],"isMath":false}]';
      if (type === 'open')
        return intro + 'TIPO: Pregunta abierta de texto libre, sin opciones.\nFORMATO: [{"text":"Explica...","type":"open","isMath":false}]';
      if (type === 'eq')
        return intro + 'TIPO: Ecuacion matematica. isMath:true, campo "latex" con LaTeX valido SIN signos $ (ej: "x^2-4=0", "\\frac{d}{dx}(x^2)"). "text" es el enunciado en espanol.\nFORMATO: [{"text":"Resuelve:","type":"open","isMath":true,"latex":"x^2-4=0","correctLatex":"x=2 o x=-2"}]';
      return intro + '[]';
    }

    async function callGroq(type, n) {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: buildPrompt(type, n) }],
          temperature: 0.6,
          max_tokens: 2000
        })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error?.message || 'Error Groq');
      const raw = d.choices[0].message.content.replace(/```json/g, '').replace(/```/g, '').trim();
      const s = raw.indexOf('['), e = raw.lastIndexOf(']');
      if (s === -1 || e === -1) return [];
      try { return JSON.parse(raw.slice(s, e + 1)); } catch { return []; }
    }

    function sanitize(q, forcedType) {
      if (!q || !q.text) return null;
      if (forcedType) q.type = forcedType;
      if (q.type === 'mc') {
        if (!Array.isArray(q.options)) return null;
        q.options = [...new Set(q.options.map(String))].slice(0, 4);
        while (q.options.length < 4) q.options.push('Opcion ' + (q.options.length + 1));
        if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex >= q.options.length) q.correctIndex = 0;
        q.isMath = false;
      }
      if (q.type === 'multi') {
        if (!Array.isArray(q.options)) return null;
        q.options = [...new Set(q.options.map(String))].slice(0, 4);
        while (q.options.length < 4) q.options.push('Opcion ' + (q.options.length + 1));
        if (!Array.isArray(q.correctIndexes) || q.correctIndexes.length < 2) q.correctIndexes = [0, 1];
        q.correctIndexes = [...new Set(q.correctIndexes.filter(i => i >= 0 && i < q.options.length))];
        if (q.correctIndexes.length < 2) q.correctIndexes = [0, 1];
        q.isMath = false;
      }
      if (q.type === 'open' && q.isMath) {
        if (!q.latex) return null;
        q.latex = q.latex.replace(/^\$+|\$+$/g, '').replace(/^\\\[|\\\]$/g, '').trim();
      }
      return q;
    }

    const dist = distribution || {};
    const tasks = [
      dist.mc    > 0 ? { type: 'mc',    n: dist.mc    } : null,
      dist.multi > 0 ? { type: 'multi', n: dist.multi } : null,
      dist.open  > 0 ? { type: 'open',  n: dist.open  } : null,
      dist.eq    > 0 ? { type: 'eq',    n: dist.eq    } : null,
    ].filter(Boolean);

    if (tasks.length === 0) {
      tasks.push({ type: 'mc',   n: Math.ceil(numQuestions / 2) });
      tasks.push({ type: 'open', n: Math.floor(numQuestions / 2) });
    }

    const settled = await Promise.allSettled(
      tasks.map(({ type, n }) => callGroq(type, n).then(qs =>
        qs.map(q => sanitize(q, type === 'eq' ? 'open' : type)).filter(Boolean)
      ))
    );

    let questions = settled
      .filter(r => r.status === 'fulfilled')
      .flatMap(r => r.value);

    if (questions.length === 0)
      return res.status(500).json({ ok: false, error: 'No se generaron preguntas' });

    // Mezclar aleatoriamente
    for (let i = questions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [questions[i], questions[j]] = [questions[j], questions[i]];
    }

    res.json({ ok: true, questions });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// CHATBOT
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !messages.length)
    return res.status(400).json({ ok: false, error: 'Faltan mensajes' });
  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'Eres un asistente educativo de Aula Segura. Ayuda a docentes a crear y mejorar preguntas de examen. Cuando te pidan generar preguntas, devuelve un array JSON con el formato: [{"text":"...","type":"mc","options":["A","B","C","D"],"correctIndex":0}]. Si no piden preguntas, responde en espanol de forma concisa.' },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Error de Groq');
    res.json({ ok: true, message: data.choices[0].message.content });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));
