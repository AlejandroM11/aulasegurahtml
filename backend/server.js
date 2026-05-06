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
  const val = snap.val();
  return Object.entries(val).map(([key, value]) => ({ id: key, ...value }));
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

    // Detectar si el contenido tiene matemáticas para ajustar el prompt
    const mathKeywords = /integral|derivad|ecuaci[oó]n|fórmula|formula|álgebra|algebra|trigonometr|cálculo|calculo|límite|limite|matriz|vector|polinomio|logaritmo|exponencial|fracción|fraccion|raíz|raiz|∫|∑|∂|√|π|∞/i;
    const hasMath = mathKeywords.test(text);

    const prompt = `Eres un asistente educativo experto. Basándote ÚNICAMENTE en el siguiente texto, genera exactamente ${numQuestions} preguntas para un examen.

TEXTO DEL TEMARIO:
"""
${text.slice(0, 4000)}
"""

INSTRUCCIONES GENERALES:
- Genera exactamente ${numQuestions} preguntas variadas
- Mezcla preguntas de opción múltiple ("mc") y preguntas abiertas ("open") según el contenido
- Responde ÚNICAMENTE con un array JSON válido, sin texto adicional, sin markdown

${hasMath ? `INSTRUCCIONES PARA CONTENIDO MATEMÁTICO (MUY IMPORTANTE):
- El texto contiene matemáticas. Cuando una pregunta involucre una expresión matemática:
  - Agrega el campo "isMath": true
  - Agrega el campo "latex" con la expresión en formato LaTeX válido (sin $$ ni \\[\\])
  - Ejemplo de latex válido: "\\frac{x^2 + 1}{2}" o "\\int_0^1 x^2 dx"
- Para preguntas abiertas con matemáticas, usa type "open" con isMath y latex
` : ''}

FORMATO EXACTO (devuelve SOLO este JSON):
[
  {
    "text": "¿Pregunta de opción múltiple?",
    "type": "mc",
    "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
    "correctIndex": 0,
    "isMath": false
  },
  {
    "text": "Resuelve la siguiente expresión:",
    "type": "open",
    "isMath": true,
    "latex": "\\frac{d}{dx}(x^3 + 2x)"
  },
  {
    "text": "¿Cuál es el resultado de la integral?",
    "type": "mc",
    "options": ["x²/2 + C", "2x + C", "x³/3 + C", "x + C"],
    "correctIndex": 2,
    "isMath": true,
    "latex": "\\int x^2 \\, dx"
  }
]

REGLAS:
- Para type "mc": incluir "options" (4 elementos) y "correctIndex"
- Para type "open": NO incluir "options" ni "correctIndex"
- "isMath" es true solo si la pregunta involucra una expresión matemática
- "latex" solo cuando isMath es true`;

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
        max_tokens: 3000
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
// CHATBOT
// ─────────────────────────────────────────────
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body;
  if (!messages || !messages.length)
    return res.status(400).json({ ok: false, error: 'Faltan mensajes' });

  try {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `Eres un asistente educativo inteligente integrado en Aula Segura, plataforma de exámenes de la Universidad de Ibagué.

Trabajas en conjunto con el sistema RAG de generación de preguntas. Cuando el docente ya generó preguntas con un temario, puedes:
- Refinar o mejorar preguntas específicas que el docente te comparta
- Generar preguntas adicionales sobre un tema que te describan
- Cambiar el nivel de dificultad de preguntas existentes
- Sugerir distractores (opciones incorrectas) más convincentes
- Explicar por qué una pregunta es buena o cómo mejorarla
- Generar preguntas de un tipo específico (conceptual, aplicación, análisis)
- Ayudar con cualquier tema educativo o pedagógico

Cuando el docente te pida generar preguntas, responde SIEMPRE en este formato JSON para que puedan agregarse directamente al examen:
[
  {
    "text": "¿Pregunta aquí?",
    "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
    "correctIndex": 0
  }
]

Si el docente no pide preguntas en formato específico, responde de forma conversacional en español, clara y concisa.`
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 1024
      })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || 'Error de Groq');
    res.json({ ok: true, message: data.choices[0].message.content });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ─────────────────────────────────────────────
// START
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en puerto ${PORT}`));