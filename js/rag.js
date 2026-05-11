// ===== RAG SYSTEM — Groq + llama3 =====

const GROQ_API_KEY = null;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

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

function chunkTextSmart(text, maxChars = 1800) {
  const paragraphs = text.split('\n').filter(p => p.trim().length > 0);
  const chunks = [];
  let current  = '';

  for (const p of paragraphs) {
    if (p.length > maxChars) {
      if (current) { chunks.push(current.trim()); current = ''; }
      for (let i = 0; i < p.length; i += maxChars) {
        chunks.push(p.slice(i, i + maxChars));
      }
      continue;
    }
    if ((current + '\n' + p).length > maxChars) {
      if (current) chunks.push(current.trim());
      current = p;
    } else {
      current = current ? current + '\n' + p : p;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// ── MODIFICADO: ahora recibe questionTypes para saber si incluir ecuaciones ──
async function generateQuestionsFromText(text, numQuestions = 5, questionTypes = []) {
  const wantsEquation = questionTypes.includes('eq');
  const wantsOpen     = questionTypes.includes('open');
  const wantsMC       = questionTypes.includes('mc') || questionTypes.length === 0;

  const typeInstruction = wantsEquation
    ? `El docente REQUIERE que al menos la mitad de las preguntas sean de tipo ECUACIÓN matemática.
Para preguntas de ecuación usa este formato:
{
  "text": "Enunciado de la pregunta en español (sin LaTeX aquí)",
  "type": "open",
  "isMath": true,
  "latex": "expresión LaTeX de la ecuación, ej: \\\\frac{dy}{dx} + 2y = e^{-x}",
  "correctLatex": "solución en LaTeX si aplica, ej: y = Ce^{-2x}"
}
El campo "latex" es obligatorio cuando isMath es true. Usa LaTeX estándar sin $$ ni \\[ \\].`
    : `Genera preguntas variadas.${wantsOpen ? ' Incluye preguntas de respuesta abierta.' : ''}${wantsMC ? ' Incluye preguntas de opción múltiple.' : ''}
Si el contenido es de matemáticas o física, puedes usar isMath:true con latex cuando sea apropiado.`;

  const systemPrompt = `Eres un generador experto de preguntas de examen educativo.
Genera exactamente ${numQuestions} preguntas basadas en el texto proporcionado.

${typeInstruction}

Responde ÚNICAMENTE con un array JSON válido. Sin texto adicional, sin backticks, sin comentarios.
El array debe empezar con [ y terminar con ].

Formatos válidos:

Opción múltiple:
{
  "text": "¿Pregunta?",
  "type": "mc",
  "options": ["Opción A", "Opción B", "Opción C", "Opción D"],
  "correctIndex": 0,
  "isMath": false
}

Ecuación / respuesta abierta matemática:
{
  "text": "Resuelve la siguiente ecuación diferencial:",
  "type": "open",
  "isMath": true,
  "latex": "\\\\frac{d^2y}{dx^2} + 4y = 0",
  "correctLatex": "y = C_1\\\\cos(2x) + C_2\\\\sin(2x)"
}

Respuesta abierta sin ecuación:
{
  "text": "Explica con tus palabras el concepto de...",
  "type": "open",
  "isMath": false
}`;

  const res = await fetch(`${API_BASE}/groq/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, numQuestions, systemPrompt })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Error al generar preguntas');
  }

  const data = await res.json();
  if (!data.ok) throw new Error(data.error || 'Error al generar preguntas');
  return data.questions;
}

// ── Modal del generador de preguntas ──
function openRAGModal(onQuestionsSelected) {
  const existing = document.getElementById('rag-modal');
  if (existing) existing.remove();

  document.body.insertAdjacentHTML('beforeend', `
    <div id="rag-modal" class="modal-overlay">
      <div class="modal-box" style="max-width:1100px">

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

        <!-- Paso 1 -->
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

          <!-- MODIFICADO: controles de número de preguntas + tipos -->
          <div style="display:flex;align-items:flex-start;gap:.75rem;margin-top:1rem;flex-wrap:wrap">
            <div class="form-group" style="flex:0 0 auto">
              <label class="label text-xs">Número de preguntas</label>
              <select class="input" id="rag-num-questions">
                <option value="3">3 preguntas</option>
                <option value="5" selected>5 preguntas</option>
                <option value="8">8 preguntas</option>
                <option value="10">10 preguntas</option>
              </select>
            </div>

            <!-- NUEVO: selector de tipos de pregunta -->
            <div class="form-group" style="flex:1;min-width:200px">
              <label class="label text-xs">Tipos de pregunta a generar</label>
              <div style="display:flex;gap:.6rem;flex-wrap:wrap;margin-top:.4rem">
                <label style="display:flex;align-items:center;gap:.35rem;font-size:.8rem;cursor:pointer;
                  padding:.35rem .65rem;border-radius:.5rem;border:1.5px solid #e2e8f0;background:#f8fafc">
                  <input type="checkbox" value="mc" class="rag-qtype" checked style="accent-color:#7c3aed;width:.85rem;height:.85rem"/>
                  <i class="fa-solid fa-list-ul" style="color:#2563eb;font-size:.75rem"></i>
                  <span>Opción múltiple</span>
                </label>
                <label style="display:flex;align-items:center;gap:.35rem;font-size:.8rem;cursor:pointer;
                  padding:.35rem .65rem;border-radius:.5rem;border:1.5px solid #e2e8f0;background:#f8fafc">
                  <input type="checkbox" value="open" class="rag-qtype" style="accent-color:#7c3aed;width:.85rem;height:.85rem"/>
                  <i class="fa-solid fa-pen-to-square" style="color:#16a34a;font-size:.75rem"></i>
                  <span>Abierta</span>
                </label>
                <label style="display:flex;align-items:center;gap:.35rem;font-size:.8rem;cursor:pointer;
                  padding:.35rem .65rem;border-radius:.5rem;border:1.5px solid #ddd6fe;background:#f5f3ff">
                  <input type="checkbox" value="eq" class="rag-qtype" style="accent-color:#7c3aed;width:.85rem;height:.85rem"/>
                  <i class="fa-solid fa-square-root-variable" style="color:#7c3aed;font-size:.75rem"></i>
                  <span style="color:#6d28d9;font-weight:600">Ecuación</span>
                </label>
              </div>
              <p class="text-xs text-gray mt-1" style="font-style:italic">
                "Ecuación" genera preguntas con fórmulas matemáticas que el estudiante responde con teclado matemático.
              </p>
            </div>

            <div style="padding-top:1.5rem;flex-shrink:0">
              <button class="btn btn-full" id="rag-generate-btn"
                style="background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;padding:.65rem 1.5rem">
                <i class="fa-solid fa-wand-magic-sparkles" style="margin-right:.4rem"></i>
                Generar preguntas
              </button>
            </div>
          </div>

          <div id="rag-error" class="info-box info-box-red mt-3" style="display:none"></div>
        </div>

        <!-- Paso 2: preguntas + chat lateral -->
        <div id="rag-step-2" style="display:none">
          <div class="info-box info-box-green mb-3">
            <p class="text-sm font-bold">
              <i class="fa-solid fa-circle-check" style="margin-right:.4rem"></i>
              Preguntas generadas. Selecciona las que quieras y usa el asistente para editarlas.
            </p>
          </div>

          <div style="display:grid;grid-template-columns:1fr 420px;gap:1.5rem;align-items:start">

            <!-- Lista de preguntas -->
            <div>
              <div id="rag-questions-list" class="space-y" style="max-height:380px;overflow-y:auto;padding-right:.25rem"></div>
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

            <!-- Chat del asistente -->
            <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:1rem;display:flex;flex-direction:column;height:560px;" id="rag-chat-panel">
              <div style="background:linear-gradient(135deg,#7c3aed,#2563eb);padding:.75rem 1rem;border-radius:.85rem .85rem 0 0;flex-shrink:0">
                <p style="color:#fff;font-weight:700;font-size:.875rem;">
                  <i class="fa-solid fa-robot" style="margin-right:.4rem"></i>Asistente de edición ARDI
                </p>
                <p style="color:rgba(255,255,255,.75);font-size:.7rem;">Pídeme que edite cualquier pregunta</p>
              </div>

              <div id="rag-chat-messages" style="flex:1;overflow-y:auto;padding:.75rem;display:flex;flex-direction:column;gap:.5rem;">
                <div style="display:flex;gap:.4rem;align-items:flex-end">
                  <div style="width:1.5rem;height:1.5rem;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#2563eb);display:flex;align-items:center;justify-content:center;flex-shrink:0">
                    <i class="fa-solid fa-robot" style="color:#fff;font-size:.6rem"></i>
                  </div>
                  <div style="background:#fff;border:1px solid #e2e8f0;border-radius:.75rem;border-bottom-left-radius:.15rem;padding:.5rem .75rem;font-size:.78rem;line-height:1.5;color:#1e293b;max-width:90%">
                    Hola 👋 Puedo ayudarte a editar las preguntas. Por ejemplo:<br/>
                    <span style="color:#7c3aed">• "Haz la pregunta 2 más difícil"</span><br/>
                    <span style="color:#7c3aed">• "Convierte la pregunta 1 en ecuación"</span><br/>
                    <span style="color:#7c3aed">• "Agrega una pregunta de integral"</span>
                  </div>
                </div>
              </div>

              <div style="padding:.6rem;border-top:1px solid #e2e8f0;display:flex;gap:.4rem;flex-shrink:0">
                <textarea id="rag-chat-input"
                  placeholder="Ej: convierte la pregunta 2 en ecuación..."
                  rows="1"
                  style="flex:1;padding:.45rem .7rem;border-radius:.6rem;border:1.5px solid #d1d5db;font-size:.78rem;font-family:inherit;resize:none;max-height:70px;outline:none;transition:border .2s;background:#fff;color:#1e293b;"></textarea>
                <button id="rag-chat-send"
                  style="width:2.1rem;height:2.1rem;border-radius:.6rem;border:none;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;align-self:flex-end;transition:transform .2s">
                  <i class="fa-solid fa-paper-plane" style="font-size:.75rem"></i>
                </button>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  `);

  // ── Estado del modal ──
  let generatedQuestions = [];
  let selectedIndexes    = new Set();
  let pdfText            = '';
  let ragChatHistory     = [];
  let ragChatTyping      = false;

  const modal    = document.getElementById('rag-modal');
  const step1    = document.getElementById('rag-step-1');
  const step2    = document.getElementById('rag-step-2');
  const errorBox = document.getElementById('rag-error');

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

  dropZone.onclick    = () => pdfInput.click();
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

  // ── MODIFICADO: Generar preguntas leyendo los tipos seleccionados ──
  document.getElementById('rag-generate-btn').onclick = async () => {
    const inputType   = document.querySelector('input[name="rag-input-type"]:checked').value;
    const numQ        = Number(document.getElementById('rag-num-questions').value);
    const generateBtn = document.getElementById('rag-generate-btn');

    // Leer tipos de pregunta seleccionados
    const questionTypes = [...document.querySelectorAll('.rag-qtype:checked')].map(cb => cb.value);

    let text = inputType === 'texto'
      ? document.getElementById('rag-text-input').value.trim()
      : pdfText;

    if (!text || text.length < 50) {
      errorBox.style.display = '';
      errorBox.innerHTML = '<i class="fa-solid fa-triangle-exclamation" style="margin-right:.4rem"></i>Agrega más contenido al temario (mínimo 50 caracteres)';
      return;
    }

    errorBox.style.display = 'none';
    generateBtn.disabled = true;

    const chunks = chunkTextSmart(text, 1800);
    const questionsPerChunk = Math.max(1, Math.ceil(numQ / chunks.length));
    let allQuestions = [];

    const setProgress = (msg) => {
      generateBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin" style="margin-right:.4rem"></i>${msg}`;
    };

    try {
      for (let i = 0; i < chunks.length; i++) {
        if (allQuestions.length >= numQ) break;

        const remaining  = numQ - allQuestions.length;
        const toGenerate = Math.min(questionsPerChunk, remaining);

        setProgress(`Procesando parte ${i + 1} de ${chunks.length}...`);

        try {
          // MODIFICADO: se pasa questionTypes a la función
          const questions = await generateQuestionsFromText(chunks[i], toGenerate, questionTypes);
          if (Array.isArray(questions)) allQuestions.push(...questions);
        } catch (chunkErr) {
          console.warn(`Chunk ${i + 1} falló:`, chunkErr.message);
        }
      }

      if (allQuestions.length === 0) {
        throw new Error('No se pudieron generar preguntas. Intenta con menos preguntas o un texto más corto.');
      }

      generatedQuestions = allQuestions.slice(0, numQ);
      selectedIndexes    = new Set(generatedQuestions.map((_, i) => i));
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

  // ── Helpers MathQuill para el modal ──
  function getMQ() {
    return window.MathQuill ? window.MathQuill.getInterface(2) : null;
  }

  function renderLatexInEl(el, latex) {
    if (!el || !latex) return;
    const MQ = getMQ();
    if (MQ) {
      try { el.innerHTML = ''; MQ.StaticMath(el).latex(latex); return; } catch (_) {}
    }
    el.innerHTML = `<code style="font-family:monospace;font-size:.85rem;color:#7c3aed;background:#f5f3ff;padding:.1rem .35rem;border-radius:.3rem">${latex}</code>`;
  }

  // ── MODIFICADO: Render de preguntas — badge especial para ecuaciones ──
  function renderGeneratedQuestions() {
    const list = document.getElementById('rag-questions-list');
    if (!list) return;
    document.getElementById('rag-selected-count').textContent = selectedIndexes.size;

    list.innerHTML = generatedQuestions.map((q, idx) => {
      const isOpen   = q.type === 'open';
      const isMathQ  = q.isMath && q.latex;

      const typeBadge = isMathQ
        ? `<span style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;
            padding:.15rem .45rem;border-radius:999px;background:#ede9fe;color:#6d28d9;margin-left:.4rem">
            <i class="fa-solid fa-square-root-variable" style="margin-right:.2rem"></i>Ecuación</span>`
        : isOpen
          ? `<span style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;
              padding:.15rem .45rem;border-radius:999px;background:#dcfce7;color:#15803d;margin-left:.4rem">
              Abierta</span>`
          : `<span style="font-size:.65rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;
              padding:.15rem .45rem;border-radius:999px;background:#dbeafe;color:#1d4ed8;margin-left:.4rem">
              Múltiple</span>`;

      const mathLatexId = `rag-q-latex-${idx}`;

      return `
        <div style="padding:.75rem;border-radius:.75rem;border:2px solid ${selectedIndexes.has(idx) ? '#7c3aed' : '#e2e8f0'};
          background:${selectedIndexes.has(idx) ? '#f5f3ff' : '#f8fafc'};cursor:pointer;transition:all .2s"
          data-qidx="${idx}">
          <div style="display:flex;align-items:flex-start;gap:.6rem">
            <input type="checkbox" ${selectedIndexes.has(idx) ? 'checked' : ''}
              style="margin-top:.2rem;width:1rem;height:1rem;accent-color:#7c3aed;flex-shrink:0"
              data-cb="${idx}"/>
            <div style="flex:1;min-width:0">
              <p class="font-bold text-sm mb-1">
                ${idx + 1}. ${q.text} ${typeBadge}
              </p>
              ${isMathQ ? `
                <div id="${mathLatexId}" style="
                  background:#f5f3ff;border:1px solid #ddd6fe;border-radius:.5rem;
                  padding:.4rem .75rem;margin-bottom:.5rem;font-size:1.05rem;min-height:2rem;
                "></div>
                ${q.correctLatex ? `
                  <p style="font-size:.7rem;color:#6d28d9;margin-bottom:.35rem">
                    <i class="fa-solid fa-key" style="margin-right:.3rem"></i>
                    Respuesta esperada: <code style="font-size:.75rem">${q.correctLatex}</code>
                  </p>` : ''}
                <p style="font-size:.7rem;color:#7c3aed;font-style:italic">
                  <i class="fa-solid fa-keyboard" style="margin-right:.3rem"></i>El estudiante responde con teclado matemático
                </p>
              ` : !isOpen ? `
                <div style="display:flex;flex-wrap:wrap;gap:.25rem">
                  ${(q.options || []).map((opt, i) => `
                    <span style="font-size:.72rem;padding:.15rem .5rem;border-radius:999px;
                      background:${i === q.correctIndex ? '#ede9fe' : '#f1f5f9'};
                      color:${i === q.correctIndex ? '#7c3aed' : '#475569'};
                      font-weight:${i === q.correctIndex ? '700' : '400'}">
                      ${i === q.correctIndex ? '<i class="fa-solid fa-check" style="margin-right:.2rem"></i>' : ''}${opt}
                    </span>
                  `).join('')}
                </div>
              ` : `
                <p style="font-size:.72rem;color:#64748b;font-style:italic">
                  <i class="fa-solid fa-pen-to-square" style="margin-right:.3rem"></i>Respuesta abierta del estudiante
                </p>
              `}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Renderizar LaTeX después del innerHTML
    setTimeout(() => {
      generatedQuestions.forEach((q, idx) => {
        if (q.isMath && q.latex) {
          renderLatexInEl(document.getElementById(`rag-q-latex-${idx}`), q.latex);
        }
      });
    }, 50);

    list.querySelectorAll('[data-qidx]').forEach(el => {
      el.onclick = () => {
        const idx = Number(el.dataset.qidx);
        if (selectedIndexes.has(idx)) selectedIndexes.delete(idx);
        else selectedIndexes.add(idx);
        renderGeneratedQuestions();
      };
    });
  }

  // ── Chat del asistente dentro del modal ──
  function ragChatAddMessage(role, content) {
    const messagesEl = document.getElementById('rag-chat-messages');
    if (!messagesEl) return;
    const isUser = role === 'user';
    const div = document.createElement('div');
    div.style.cssText = `display:flex;gap:.4rem;align-items:flex-end;${isUser ? 'flex-direction:row-reverse' : ''}`;
    div.innerHTML = `
      <div style="width:1.5rem;height:1.5rem;border-radius:50%;background:${isUser ? '#e2e8f0' : 'linear-gradient(135deg,#7c3aed,#2563eb)'};display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <i class="fa-solid ${isUser ? 'fa-user' : 'fa-robot'}" style="color:${isUser ? '#475569' : '#fff'};font-size:.6rem"></i>
      </div>
      <div style="background:${isUser ? 'linear-gradient(135deg,#7c3aed,#2563eb)' : '#fff'};color:${isUser ? '#fff' : '#1e293b'};border:${isUser ? 'none' : '1px solid #e2e8f0'};border-radius:.75rem;${isUser ? 'border-bottom-right-radius:.15rem' : 'border-bottom-left-radius:.15rem'};padding:.5rem .75rem;font-size:.78rem;line-height:1.5;max-width:88%">
        ${content.replace(/\n/g, '<br/>')}
      </div>
    `;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function ragChatShowTyping() {
    const messagesEl = document.getElementById('rag-chat-messages');
    if (!messagesEl) return;
    const div = document.createElement('div');
    div.id = 'rag-typing';
    div.style.cssText = 'display:flex;gap:.4rem;align-items:flex-end';
    div.innerHTML = `
      <div style="width:1.5rem;height:1.5rem;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#2563eb);display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <i class="fa-solid fa-robot" style="color:#fff;font-size:.6rem"></i>
      </div>
      <div style="background:#fff;border:1px solid #e2e8f0;border-radius:.75rem;border-bottom-left-radius:.15rem;padding:.5rem .75rem">
        <div style="display:flex;gap:.25rem">
          <span style="width:.35rem;height:.35rem;border-radius:50%;background:#94a3b8;animation:typingDot 1.2s infinite;display:block"></span>
          <span style="width:.35rem;height:.35rem;border-radius:50%;background:#94a3b8;animation:typingDot 1.2s .2s infinite;display:block"></span>
          <span style="width:.35rem;height:.35rem;border-radius:50%;background:#94a3b8;animation:typingDot 1.2s .4s infinite;display:block"></span>
        </div>
      </div>
    `;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function ragChatHideTyping() {
    document.getElementById('rag-typing')?.remove();
  }

  // ── MODIFICADO: ragChatSend con prompt mejorado para ecuaciones ──
  async function ragChatSend() {
    const inputEl = document.getElementById('rag-chat-input');
    const sendEl  = document.getElementById('rag-chat-send');
    if (!inputEl || ragChatTyping) return;

    const text = inputEl.value.trim();
    if (!text) return;

    inputEl.value = '';
    inputEl.style.height = 'auto';
    ragChatAddMessage('user', text);

    const questionsContext = generatedQuestions.map((q, i) => {
      let line = `Pregunta ${i + 1} [${q.isMath && q.latex ? 'ECUACIÓN' : q.type === 'open' ? 'ABIERTA' : 'MÚLTIPLE'}]: ${q.text}`;
      if (q.isMath && q.latex)    line += `\nLaTeX: ${q.latex}`;
      if (q.correctLatex)         line += `\nRespuesta LaTeX: ${q.correctLatex}`;
      if (q.type === 'mc' && q.options) line += `\nOpciones: ${q.options.map((o, j) => `${j === q.correctIndex ? '✓' : ''}${o}`).join(' | ')}`;
      return line;
    }).join('\n\n');

    // MODIFICADO: systemPrompt completo con soporte de ecuaciones
    const systemPrompt = `Eres un asistente educativo integrado en un generador de preguntas de examen.

El docente tiene estas preguntas generadas:
${questionsContext}

Tu tarea es ayudar a EDITAR o MEJORAR esas preguntas según lo que pida el docente.

IMPORTANTE — cuando edites preguntas devuelve SOLO el JSON de TODAS las preguntas.
Sin texto adicional, sin backticks, sin comentarios. Empieza con [ y termina con ].

Tipos de pregunta válidos:

1. Opción múltiple:
{
  "text": "¿Pregunta?",
  "type": "mc",
  "options": ["A", "B", "C", "D"],
  "correctIndex": 0,
  "isMath": false
}

2. Ecuación matemática (para física, cálculo, álgebra, etc.):
{
  "text": "Enunciado en español sin LaTeX",
  "type": "open",
  "isMath": true,
  "latex": "\\\\frac{d}{dx}(x^2 + 3x)",
  "correctLatex": "2x + 3"
}

3. Respuesta abierta sin ecuación:
{
  "text": "Explica...",
  "type": "open",
  "isMath": false
}

Cuando el docente pida:
- "convierte en ecuación", "hazla matemática", "ponle fórmula" → usa type:"open", isMath:true, agrega latex relevante al tema
- "agrega una pregunta de integral / derivada / edo / etc." → crea una pregunta nueva con isMath:true y latex apropiado
- "haz más difícil / fácil / cambia opciones" → edita manteniendo el type original

Si el docente hace una pregunta general sin pedir edición, responde brevemente en español sin devolver JSON.`;

    ragChatHistory.push({ role: 'user', content: text });
    ragChatTyping = true;
    if (sendEl) sendEl.disabled = true;
    ragChatShowTyping();

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', content: systemPrompt + '\n\nMensaje del docente: ' + text }
          ]
        })
      });

      const data = await res.json();
      ragChatHideTyping();

      if (!data.ok) {
        ragChatAddMessage('bot', '❌ Error: ' + (data.error || 'Sin respuesta'));
        return;
      }

      const reply = data.message.trim();

      const jsonStart = reply.indexOf('[');
      const jsonEnd   = reply.lastIndexOf(']');

      if (jsonStart !== -1 && jsonEnd !== -1) {
        try {
          const parsed = JSON.parse(reply.slice(jsonStart, jsonEnd + 1));
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].text) {
            generatedQuestions = parsed;
            selectedIndexes = new Set(generatedQuestions.map((_, i) => i));
            renderGeneratedQuestions();
            ragChatAddMessage('bot', `✅ Listo, actualicé ${parsed.length} pregunta${parsed.length !== 1 ? 's' : ''}. Revísalas en el panel izquierdo.`);
            ragChatHistory.push({ role: 'assistant', content: reply });
            return;
          }
        } catch (_) { /* no era JSON válido, tratar como texto */ }
      }

      ragChatAddMessage('bot', reply);
      ragChatHistory.push({ role: 'assistant', content: reply });

    } catch {
      ragChatHideTyping();
      ragChatAddMessage('bot', '❌ Error de conexión.');
    } finally {
      ragChatTyping = false;
      if (sendEl) sendEl.disabled = false;
      if (inputEl) inputEl.focus();
    }
  }

  // Eventos del chat interno
  setTimeout(() => {
    const chatInput = document.getElementById('rag-chat-input');
    const chatSend  = document.getElementById('rag-chat-send');
    if (chatInput) {
      chatInput.oninput = () => {
        chatInput.style.height = 'auto';
        chatInput.style.height = Math.min(chatInput.scrollHeight, 70) + 'px';
      };
      chatInput.onkeydown = e => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); ragChatSend(); }
      };
    }
    if (chatSend) chatSend.onclick = ragChatSend;
  }, 100);

  // Volver al paso 1
  document.getElementById('rag-back-btn').onclick = () => {
    step1.style.display = '';
    step2.style.display = 'none';
  };

  // ── MODIFICADO: Agregar preguntas — conserva correctLatex para ecuaciones ──
  document.getElementById('rag-add-btn').onclick = () => {
    if (selectedIndexes.size === 0) {
      alert('Selecciona al menos una pregunta');
      return;
    }
    const selected = generatedQuestions
      .filter((_, i) => selectedIndexes.has(i))
      .map(q => {
        // Si la IA marcó la pregunta como matemática, convertirla a type "eq"
        // para que student.js active MathQuill y el teclado matemático
        const isMathQuestion = (q.isMath === true) && q.latex;
        const resolvedType   = isMathQuestion ? 'eq' : (q.type || 'mc');

        const base = {
          id:     crypto.randomUUID(),
          text:   q.text,
          type:   resolvedType,
          isMath: isMathQuestion || false,
        };

        if (isMathQuestion) {
          // "latex" de la IA → "referenceLatex" que student.js muestra como referencia del profesor
          base.referenceLatex = q.latex;
        }

        if (resolvedType === 'mc') {
          base.options      = q.options      || [];
          base.correctIndex = q.correctIndex ?? 0;
        }

        if (q.correctAnswer) base.correctAnswer = q.correctAnswer;

        return base;
      });
    onQuestionsSelected(selected);
    modal.remove();
  };
}