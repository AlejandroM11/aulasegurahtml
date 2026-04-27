// ===== RAG SYSTEM — Groq + llama3 =====

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

// ── Extrae texto de un PDF usando PDF.js ──
async function extractTextFromPDF(file) {
  const buffer = await file.arrayBuffer();
  const pdf    = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page    = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text.trim();
}

// ── Divide el texto en chunks para no exceder el contexto ──
function chunkText(text, maxChars = 4000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxChars) {
    chunks.push(text.slice(i, i + maxChars));
  }
  return chunks;
}

// ── Llama a Groq con llama3 ──
async function callGroq(prompt) {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_API_KEY}`
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2048
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Error al conectar con Groq');
  }

  const data = await res.json();
  return data.choices[0].message.content;
}

// ── Genera preguntas a partir del texto del temario ──
async function generateQuestionsFromText(text, numQuestions = 5) {
  const chunks  = chunkText(text);
  const context = chunks[0]; // Usamos el primer chunk más relevante

  const prompt = `Eres un asistente educativo. Basándote ÚNICAMENTE en el siguiente texto, genera exactamente ${numQuestions} preguntas de opción múltiple para un examen.

TEXTO DEL TEMARIO:
"""
${context}
"""

INSTRUCCIONES:
- Genera exactamente ${numQuestions} preguntas
- Cada pregunta debe tener exactamente 4 opciones (A, B, C, D)
- Solo una opción es correcta
- Las preguntas deben estar basadas estrictamente en el texto proporcionado
- Responde ÚNICAMENTE con un array JSON válido, sin texto adicional, sin explicaciones, sin bloques de código

FORMATO EXACTO (responde solo esto):
[
  {
    "text": "¿Pregunta aquí?",
    "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
    "correctIndex": 0
  }
]

correctIndex es el índice (0-3) de la opción correcta.`;

  const response = await callGroq(prompt);

  // Limpiar respuesta y parsear JSON
  const clean = response
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();

  const start = clean.indexOf('[');
  const end   = clean.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('La IA no devolvió un formato válido');

  return JSON.parse(clean.slice(start, end + 1));
}

// ── Modal del generador de preguntas ──
function openRAGModal(onQuestionsSelected) {
  const existing = document.getElementById('rag-modal');
  if (existing) existing.remove();

  document.body.insertAdjacentHTML('beforeend', `
    <div id="rag-modal" class="modal-overlay">
      <div class="modal-box" style="max-width:680px">

        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1.25rem">
          <div>
            <h2 class="font-bold" style="font-size:1.25rem">
              <i class="fa-solid fa-wand-magic-sparkles" style="color:#7c3aed;margin-right:.5rem"></i>
              Generar preguntas con IA
            </h2>
            <p class="text-gray text-xs mt-1">Powered by Groq + LLaMA 3</p>
          </div>
          <button class="btn btn-outline text-xs" id="rag-close">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>

        <!-- Paso 1: ingresar temario -->
        <div id="rag-step-1">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:.75rem;margin-bottom:1rem">
            <label style="display:flex;align-items:center;gap:.5rem;padding:.75rem;border-radius:.75rem;border:2px solid #e2e8f0;cursor:pointer;background:#f8fafc" id="tab-texto-label">
              <input type="radio" name="rag-input-type" value="texto" checked style="accent-color:#7c3aed"/>
              <i class="fa-solid fa-align-left" style="color:#7c3aed"></i>
              <span class="text-sm font-bold">Pegar texto</span>
            </label>
            <label style="display:flex;align-items:center;gap:.5rem;padding:.75rem;border-radius:.75rem;border:2px solid #e2e8f0;cursor:pointer;background:#f8fafc" id="tab-pdf-label">
              <input type="radio" name="rag-input-type" value="pdf" style="accent-color:#7c3aed"/>
              <i class="fa-solid fa-file-pdf" style="color:#dc2626"></i>
              <span class="text-sm font-bold">Subir PDF</span>
            </label>
          </div>

          <div id="rag-texto-panel">
            <textarea class="input" id="rag-text-input" rows="7"
              placeholder="Pega aquí el contenido del temario, apuntes o cualquier material de clase..."
              style="resize:none;font-size:.9rem"></textarea>
          </div>

          <div id="rag-pdf-panel" style="display:none">
            <div style="border:2px dashed #d1d5db;border-radius:.75rem;padding:2rem;text-align:center;cursor:pointer;background:#f8fafc" id="rag-drop-zone">
              <i class="fa-solid fa-cloud-arrow-up" style="font-size:2rem;color:#94a3b8;margin-bottom:.5rem;display:block"></i>
              <p class="text-sm font-bold">Arrastra un PDF aquí</p>
              <p class="text-xs text-gray mt-1">o haz clic para seleccionar</p>
              <input type="file" id="rag-pdf-input" accept=".pdf" style="display:none"/>
            </div>
            <p id="rag-pdf-name" class="text-xs text-gray mt-2 text-center"></p>
          </div>

          <div style="display:flex;align-items:center;gap:.75rem;margin-top:1rem">
            <div class="form-group" style="flex:1">
              <label class="label text-xs">Número de preguntas a generar</label>
              <select class="input" id="rag-num-questions">
                <option value="3">3 preguntas</option>
                <option value="5" selected>5 preguntas</option>
                <option value="8">8 preguntas</option>
                <option value="10">10 preguntas</option>
              </select>
            </div>
            <div style="padding-top:1.5rem">
              <button class="btn btn-full" id="rag-generate-btn"
                style="background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;padding:.65rem 1.5rem">
                <i class="fa-solid fa-wand-magic-sparkles" style="margin-right:.4rem"></i>
                Generar preguntas
              </button>
            </div>
          </div>

          <div id="rag-error" class="info-box info-box-red mt-3" style="display:none"></div>
        </div>

        <!-- Paso 2: seleccionar preguntas generadas -->
        <div id="rag-step-2" style="display:none">
          <div class="info-box info-box-green mb-3">
            <p class="text-sm font-bold">
              <i class="fa-solid fa-circle-check" style="margin-right:.4rem"></i>
              Preguntas generadas. Selecciona las que quieras agregar al examen.
            </p>
          </div>
          <div id="rag-questions-list" class="space-y" style="max-height:400px;overflow-y:auto"></div>
          <div style="display:flex;gap:.75rem;margin-top:1rem">
            <button class="btn btn-outline" style="flex:1" id="rag-back-btn">
              <i class="fa-solid fa-arrow-left" style="margin-right:.4rem"></i>Volver
            </button>
            <button class="btn btn-primary" style="flex:1" id="rag-add-btn">
              <i class="fa-solid fa-plus" style="margin-right:.4rem"></i>
              Agregar seleccionadas (<span id="rag-selected-count">0</span>)
            </button>
          </div>
        </div>

      </div>
    </div>
  `);

  // Estado del modal
  let generatedQuestions = [];
  let selectedIndexes    = new Set();
  let pdfText            = '';

  const modal     = document.getElementById('rag-modal');
  const step1     = document.getElementById('rag-step-1');
  const step2     = document.getElementById('rag-step-2');
  const errorBox  = document.getElementById('rag-error');

  // Cerrar modal
  document.getElementById('rag-close').onclick = () => modal.remove();
  modal.onclick = e => { if (e.target === modal) modal.remove(); };

  // Cambiar entre texto y PDF
  document.querySelectorAll('input[name="rag-input-type"]').forEach(radio => {
    radio.onchange = e => {
      const isTexto = e.target.value === 'texto';
      document.getElementById('rag-texto-panel').style.display = isTexto ? '' : 'none';
      document.getElementById('rag-pdf-panel').style.display   = isTexto ? 'none' : '';
    };
  });

  // Drop zone PDF
  const dropZone = document.getElementById('rag-drop-zone');
  const pdfInput = document.getElementById('rag-pdf-input');

  dropZone.onclick = () => pdfInput.click();
  dropZone.ondragover = e => { e.preventDefault(); dropZone.style.borderColor = '#7c3aed'; };
  dropZone.ondragleave = () => { dropZone.style.borderColor = '#d1d5db'; };
  dropZone.ondrop = async e => {
    e.preventDefault();
    dropZone.style.borderColor = '#d1d5db';
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') await loadPDF(file);
  };
  pdfInput.onchange = async e => {
    const file = e.target.files[0];
    if (file) await loadPDF(file);
  };

  async function loadPDF(file) {
    document.getElementById('rag-pdf-name').textContent = `⏳ Leyendo: ${file.name}...`;
    try {
      pdfText = await extractTextFromPDF(file);
      document.getElementById('rag-pdf-name').textContent = `✅ ${file.name} (${pdfText.length} caracteres)`;
      dropZone.style.borderColor = '#16a34a';
    } catch {
      document.getElementById('rag-pdf-name').textContent = '❌ Error al leer el PDF';
    }
  }

  // Generar preguntas
  document.getElementById('rag-generate-btn').onclick = async () => {
    const inputType   = document.querySelector('input[name="rag-input-type"]:checked').value;
    const numQ        = Number(document.getElementById('rag-num-questions').value);
    const generateBtn = document.getElementById('rag-generate-btn');

    let text = '';
    if (inputType === 'texto') {
      text = document.getElementById('rag-text-input').value.trim();
    } else {
      text = pdfText;
    }

    if (!text || text.length < 50) {
      errorBox.style.display = '';
      errorBox.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="margin-right:.4rem"></i>Agrega más contenido al temario (mínimo 50 caracteres)';
      return;
    }

    errorBox.style.display = 'none';
    generateBtn.disabled = true;
    generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:.4rem"></i>Generando...';

    try {
      generatedQuestions = await generateQuestionsFromText(text, numQ);
      selectedIndexes    = new Set(generatedQuestions.map((_, i) => i)); // todas seleccionadas por defecto
      renderGeneratedQuestions();
      step1.style.display = 'none';
      step2.style.display = '';
    } catch (err) {
      errorBox.style.display = '';
      errorBox.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="margin-right:.4rem"></i>${err.message}`;
    } finally {
      generateBtn.disabled = false;
      generateBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" style="margin-right:.4rem"></i>Generar preguntas';
    }
  };

  function renderGeneratedQuestions() {
    const list = document.getElementById('rag-questions-list');
    document.getElementById('rag-selected-count').textContent = selectedIndexes.size;

    list.innerHTML = generatedQuestions.map((q, idx) => `
      <div style="padding:.85rem;border-radius:.75rem;border:2px solid ${selectedIndexes.has(idx) ? '#7c3aed' : '#e2e8f0'};
        background:${selectedIndexes.has(idx) ? '#f5f3ff' : '#f8fafc'};cursor:pointer;transition:all .2s"
        data-qidx="${idx}">
        <div style="display:flex;align-items:flex-start;gap:.75rem">
          <input type="checkbox" ${selectedIndexes.has(idx) ? 'checked' : ''}
            style="margin-top:.2rem;width:1rem;height:1rem;accent-color:#7c3aed;flex-shrink:0"
            data-cb="${idx}"/>
          <div style="flex:1">
            <p class="font-bold text-sm mb-2">${idx + 1}. ${q.text}</p>
            <div style="display:flex;flex-wrap:wrap;gap:.3rem">
              ${q.options.map((opt, i) => `
                <span style="font-size:.75rem;padding:.2rem .6rem;border-radius:999px;
                  background:${i === q.correctIndex ? '#ede9fe' : '#f1f5f9'};
                  color:${i === q.correctIndex ? '#7c3aed' : '#475569'};
                  font-weight:${i === q.correctIndex ? '700' : '400'}">
                  ${i === q.correctIndex ? '<i class="fa-solid fa-check" style="margin-right:.2rem"></i>' : ''}${opt}
                </span>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `).join('');

    // Eventos de selección
    list.querySelectorAll('[data-qidx]').forEach(el => {
      el.onclick = () => {
        const idx = Number(el.dataset.qidx);
        if (selectedIndexes.has(idx)) selectedIndexes.delete(idx);
        else selectedIndexes.add(idx);
        renderGeneratedQuestions();
      };
    });
  }

  // Volver al paso 1
  document.getElementById('rag-back-btn').onclick = () => {
    step1.style.display = '';
    step2.style.display = 'none';
  };

  // Agregar preguntas seleccionadas al examen
  document.getElementById('rag-add-btn').onclick = () => {
    if (selectedIndexes.size === 0) {
      alert('Selecciona al menos una pregunta');
      return;
    }
    const selected = generatedQuestions
      .filter((_, i) => selectedIndexes.has(i))
      .map(q => ({
        id: crypto.randomUUID(),
        text: q.text,
        type: 'mc',
        options: q.options,
        correctIndex: q.correctIndex
      }));
    onQuestionsSelected(selected);
    modal.remove();
  };
}