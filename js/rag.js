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

function chunkText(text, maxChars = 4000) {
  const chunks = [];
  for (let i = 0; i < text.length; i += maxChars) {
    chunks.push(text.slice(i, i + maxChars));
  }
  return chunks;
}

async function generateQuestionsFromText(text, numQuestions = 5) {
  const res = await fetch(`${API_BASE}/groq/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, numQuestions })
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
      <div class="modal-box" style="max-width:720px">

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

        <!-- Paso 2: preguntas + chat lateral -->
        <div id="rag-step-2" style="display:none">
          <div class="info-box info-box-green mb-3">
            <p class="text-sm font-bold">
              <i class="fa-solid fa-circle-check" style="margin-right:.4rem"></i>
              Preguntas generadas. Selecciona las que quieras y usa el asistente para editarlas.
            </p>
          </div>

          <div style="display:grid;grid-template-columns:1fr 340px;gap:1rem;align-items:start">

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
            <div style="background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:1rem;display:flex;flex-direction:column;height:460px;" id="rag-chat-panel">
              <div style="background:linear-gradient(135deg,#7c3aed,#2563eb);padding:.75rem 1rem;border-radius:.85rem .85rem 0 0;flex-shrink:0">
                <p style="color:#fff;font-weight:700;font-size:.875rem;">
                  <i class="fa-solid fa-robot" style="margin-right:.4rem"></i>Asistente de edición
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
                    <span style="color:#7c3aed">• "Cambia las opciones de la 1"</span><br/>
                    <span style="color:#7c3aed">• "Reescribe la 3 sobre otro concepto"</span>
                  </div>
                </div>
              </div>

              <div style="padding:.6rem;border-top:1px solid #e2e8f0;display:flex;gap:.4rem;flex-shrink:0">
                <textarea id="rag-chat-input"
                  placeholder="Ej: haz la pregunta 1 más difícil..."
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

  // Generar preguntas
  document.getElementById('rag-generate-btn').onclick = async () => {
    const inputType   = document.querySelector('input[name="rag-input-type"]:checked').value;
    const numQ        = Number(document.getElementById('rag-num-questions').value);
    const generateBtn = document.getElementById('rag-generate-btn');

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
    generateBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right:.4rem"></i>Generando...';

    try {
      generatedQuestions = await generateQuestionsFromText(text, numQ);
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

  // ── Render de preguntas ──
  function renderGeneratedQuestions() {
    const list = document.getElementById('rag-questions-list');
    if (!list) return;
    document.getElementById('rag-selected-count').textContent = selectedIndexes.size;

    list.innerHTML = generatedQuestions.map((q, idx) => `
      <div style="padding:.75rem;border-radius:.75rem;border:2px solid ${selectedIndexes.has(idx) ? '#7c3aed' : '#e2e8f0'};
        background:${selectedIndexes.has(idx) ? '#f5f3ff' : '#f8fafc'};cursor:pointer;transition:all .2s"
        data-qidx="${idx}">
        <div style="display:flex;align-items:flex-start;gap:.6rem">
          <input type="checkbox" ${selectedIndexes.has(idx) ? 'checked' : ''}
            style="margin-top:.2rem;width:1rem;height:1rem;accent-color:#7c3aed;flex-shrink:0"
            data-cb="${idx}"/>
          <div style="flex:1">
            <p class="font-bold text-sm mb-1">${idx + 1}. ${q.text}</p>
            <div style="display:flex;flex-wrap:wrap;gap:.25rem">
              ${q.options.map((opt, i) => `
                <span style="font-size:.72rem;padding:.15rem .5rem;border-radius:999px;
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

  async function ragChatSend() {
    const inputEl = document.getElementById('rag-chat-input');
    const sendEl  = document.getElementById('rag-chat-send');
    if (!inputEl || ragChatTyping) return;

    const text = inputEl.value.trim();
    if (!text) return;

    inputEl.value = '';
    inputEl.style.height = 'auto';
    ragChatAddMessage('user', text);

    // Construir contexto: preguntas actuales + instrucción
    const questionsContext = generatedQuestions.map((q, i) =>
      `Pregunta ${i + 1}: ${q.text}\nOpciones: ${q.options.map((o, j) => `${j === q.correctIndex ? '✓' : ''}${o}`).join(' | ')}`
    ).join('\n\n');

    const systemPrompt = `Eres un asistente educativo integrado en un generador de preguntas de examen.

El docente tiene estas preguntas generadas:
${questionsContext}

Tu tarea es ayudar a EDITAR o MEJORAR esas preguntas según lo que pida el docente.

IMPORTANTE:
- Cuando te pidan editar una o varias preguntas, devuelve SOLO el JSON actualizado de TODAS las preguntas (incluso las que no cambiaron), en este formato exacto, sin texto adicional:
[
  {
    "text": "¿Pregunta?",
    "options": ["A", "B", "C", "D"],
    "correctIndex": 0
  }
]

- Si el docente hace una pregunta general o pide explicación, responde de forma conversacional breve en español.
- NO incluyas bloques de código markdown, NO uses triple backtick.
- Si devuelves JSON, que sea solo el array, empezando con [ y terminando con ].`;

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

      // Detectar si la respuesta es JSON (lista de preguntas editadas)
      const jsonStart = reply.indexOf('[');
      const jsonEnd   = reply.lastIndexOf(']');

      if (jsonStart !== -1 && jsonEnd !== -1) {
        try {
          const parsed = JSON.parse(reply.slice(jsonStart, jsonEnd + 1));
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].text) {
            generatedQuestions = parsed;
            // Mantener selección: seleccionar todas las nuevas
            selectedIndexes = new Set(generatedQuestions.map((_, i) => i));
            renderGeneratedQuestions();
            ragChatAddMessage('bot', `✅ Listo, actualicé ${parsed.length} pregunta${parsed.length !== 1 ? 's' : ''}. Revísalas en el panel izquierdo.`);
            ragChatHistory.push({ role: 'assistant', content: reply });
            return;
          }
        } catch (_) { /* no era JSON válido, tratar como texto */ }
      }

      // Respuesta conversacional
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

  // Agregar preguntas seleccionadas
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