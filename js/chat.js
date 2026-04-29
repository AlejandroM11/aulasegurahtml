// ===== CHATBOT — Aula Segura IA =====

const ARDY_IMG = 'https://www.unibague.edu.co/images/2022/ardy/hola-ardy.png';

function initChat() {
  if (document.getElementById('chat-btn')) return;

  document.body.insertAdjacentHTML('beforeend', `
    <style>
      #chat-btn {
        position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 500;
        width: 3.5rem; height: 3.5rem; border-radius: 50%;
        background: linear-gradient(135deg, #7c3aed, #2563eb);
        border: none; cursor: pointer;
        box-shadow: 0 4px 20px rgba(124,58,237,.45);
        display: flex; align-items: center; justify-content: center;
        transition: transform .2s, box-shadow .2s;
        overflow: hidden; padding: 0;
      }
      #chat-btn:hover { transform: scale(1.1); box-shadow: 0 8px 28px rgba(124,58,237,.55); }
      #chat-btn img { width: 100%; height: 100%; object-fit: cover; border-radius: 50%; }

      #chat-widget {
        position: fixed; bottom: 5.5rem; right: 1.5rem; z-index: 500;
        width: 360px; max-height: 520px;
        background: #fff; border-radius: 1.25rem;
        box-shadow: 0 20px 60px rgba(0,0,0,.2);
        display: none; flex-direction: column;
        overflow: hidden; animation: popIn .2s ease;
        border: 1px solid #e2e8f0;
      }
      body.dark #chat-widget { background: #1e293b; border-color: #334155; }

      #chat-header {
        background: linear-gradient(135deg, #7c3aed, #2563eb);
        padding: .75rem 1.1rem;
        display: flex; align-items: center; gap: .75rem; justify-content: space-between;
      }
      #chat-header-info { display: flex; align-items: center; gap: .65rem; }
      #chat-header-avatar {
        width: 2.75rem; height: 2.75rem; border-radius: 50%;
        background: #fff; overflow: hidden; flex-shrink: 0;
        border: 2px solid rgba(255,255,255,.4);
        box-shadow: 0 2px 8px rgba(0,0,0,.2);
      }
      #chat-header-avatar img { width: 100%; height: 100%; object-fit: cover; }
      #chat-header-text p { color: #fff; font-weight: 700; font-size: .95rem; line-height: 1.2; }
      #chat-header-text span { color: rgba(255,255,255,.75); font-size: .72rem; }
      #chat-close { background: none; border: none; color: #fff; cursor: pointer; font-size: 1.1rem; padding: .2rem; flex-shrink: 0; }

      #chat-messages {
        flex: 1; overflow-y: auto; padding: 1rem;
        display: flex; flex-direction: column; gap: .75rem;
        max-height: 340px;
      }

      .chat-msg { display: flex; gap: .5rem; align-items: flex-end; }
      .chat-msg.user { flex-direction: row-reverse; }

      .chat-bubble {
        max-width: 78%; padding: .65rem .9rem;
        border-radius: 1rem; font-size: .875rem; line-height: 1.5;
      }
      .chat-msg.user .chat-bubble {
        background: linear-gradient(135deg, #7c3aed, #2563eb);
        color: #fff; border-bottom-right-radius: .25rem;
      }
      .chat-msg.bot .chat-bubble {
        background: #f1f5f9; color: #1e293b;
        border-bottom-left-radius: .25rem;
      }
      body.dark .chat-msg.bot .chat-bubble { background: #334155; color: #e2e8f0; }

      .chat-avatar {
        width: 1.75rem; height: 1.75rem; border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        font-size: .75rem; flex-shrink: 0; overflow: hidden;
        background: #fff; border: 1.5px solid #e2e8f0;
      }
      .chat-msg.bot .chat-avatar img { width: 100%; height: 100%; object-fit: cover; }
      .chat-msg.user .chat-avatar { background: #e2e8f0; color: #475569; border: none; }
      body.dark .chat-msg.user .chat-avatar { background: #475569; color: #e2e8f0; }

      .chat-typing {
        display: flex; gap: .3rem; padding: .65rem .9rem;
        background: #f1f5f9; border-radius: 1rem; width: fit-content;
      }
      body.dark .chat-typing { background: #334155; }
      .chat-typing span {
        width: .45rem; height: .45rem; border-radius: 50%;
        background: #94a3b8; animation: typingDot 1.2s infinite;
      }
      .chat-typing span:nth-child(2) { animation-delay: .2s; }
      .chat-typing span:nth-child(3) { animation-delay: .4s; }
      @keyframes typingDot {
        0%,60%,100% { transform: translateY(0); opacity: .4; }
        30% { transform: translateY(-4px); opacity: 1; }
      }

      #chat-input-area {
        padding: .75rem; border-top: 1px solid #e2e8f0;
        display: flex; gap: .5rem;
      }
      body.dark #chat-input-area { border-color: #334155; }
      #chat-input {
        flex: 1; padding: .55rem .85rem; border-radius: .75rem;
        border: 1.5px solid #d1d5db; font-size: .875rem;
        background: #fff; color: #1e293b; resize: none;
        font-family: inherit; max-height: 80px; outline: none;
        transition: border .2s;
      }
      #chat-input:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,.15); }
      body.dark #chat-input { background: #0f172a; border-color: #475569; color: #e2e8f0; }
      #chat-send {
        width: 2.5rem; height: 2.5rem; border-radius: .75rem; border: none;
        background: linear-gradient(135deg,#7c3aed,#2563eb);
        color: #fff; cursor: pointer; flex-shrink: 0;
        display: flex; align-items: center; justify-content: center;
        transition: transform .2s; align-self: flex-end;
      }
      #chat-send:hover:not(:disabled) { transform: scale(1.05); }
      #chat-send:disabled { opacity: .5; cursor: not-allowed; }
    </style>

    <!-- Botón flotante con Ardy -->
    <button id="chat-btn" title="Habla con Ardy">
      <img src="${ARDY_IMG}" alt="Ardy"
        onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<i class=\\'fa-solid fa-robot\\'style=\\'color:#fff;font-size:1.3rem\\'></i>')"/>
    </button>

    <div id="chat-widget">
      <div id="chat-header">
        <div id="chat-header-info">
          <div id="chat-header-avatar">
            <img src="${ARDY_IMG}" alt="Ardy"/>
          </div>
          <div id="chat-header-text">
            <p>ARDI IA</p>
            <span>Powered by LLaMA 3 · Groq</span>
          </div>
        </div>
        <button id="chat-close"><i class="fa-solid fa-xmark"></i></button>
      </div>

      <div id="chat-messages">
        <div class="chat-msg bot">
          <div class="chat-avatar">
            <img src="${ARDY_IMG}" alt="Ardy"/>
          </div>
          <div class="chat-bubble">¡Hola! Soy tu asistente educativo ARDI!! yo te ayudo a informarte sobre cualquier tema de tus preguntas para tus estudiantes :D.</div>
        </div>
      </div>

      <div id="chat-input-area">
        <textarea id="chat-input" placeholder="Escribe tu mensaje..." rows="1"></textarea>
        <button id="chat-send"><i class="fa-solid fa-paper-plane"></i></button>
      </div>
    </div>
  `);

  let chatHistory = [];
  let isTyping = false;
  const widget   = document.getElementById('chat-widget');
  const btn      = document.getElementById('chat-btn');
  const closeBtn = document.getElementById('chat-close');
  const input    = document.getElementById('chat-input');
  const sendBtn  = document.getElementById('chat-send');
  const messages = document.getElementById('chat-messages');

  btn.onclick = () => {
    const isOpen = widget.style.display === 'flex';
    widget.style.display = isOpen ? 'none' : 'flex';
    if (!isOpen) input.focus();
  };
  closeBtn.onclick = () => { widget.style.display = 'none'; };

  input.oninput = () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 80) + 'px';
  };

  input.onkeydown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };
  sendBtn.onclick = sendMessage;

  function addMessage(role, content) {
    const isUser = role === 'user';
    const div = document.createElement('div');
    div.className = `chat-msg ${isUser ? 'user' : 'bot'}`;
    const avatarHTML = isUser
      ? `<i class="fa-solid fa-user"></i>`
      : `<img src="${ARDY_IMG}" alt="Ardy" style="width:100%;height:100%;object-fit:cover"/>`;
    div.innerHTML = `
      <div class="chat-avatar">${avatarHTML}</div>
      <div class="chat-bubble">${content.replace(/\n/g, '<br/>')}</div>
    `;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function showTyping() {
    const div = document.createElement('div');
    div.className = 'chat-msg bot';
    div.id = 'chat-typing-indicator';
    div.innerHTML = `
      <div class="chat-avatar">
        <img src="${ARDY_IMG}" alt="Ardy" style="width:100%;height:100%;object-fit:cover"/>
      </div>
      <div class="chat-typing"><span></span><span></span><span></span></div>
    `;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
  }

  function hideTyping() {
    document.getElementById('chat-typing-indicator')?.remove();
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isTyping) return;

    input.value = ''; input.style.height = 'auto';
    addMessage('user', text);
    chatHistory.push({ role: 'user', content: text });

    isTyping = true; sendBtn.disabled = true;
    showTyping();

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: chatHistory })
      });

      const data = await res.json();
      hideTyping();

      if (data.ok) {
        addMessage('bot', data.message);
        chatHistory.push({ role: 'assistant', content: data.message });
      } else {
        addMessage('bot', '❌ Error: ' + (data.error || 'No se pudo obtener respuesta'));
      }
    } catch {
      hideTyping();
      addMessage('bot', '❌ Error de conexión. Verifica tu internet.');
    } finally {
      isTyping = false; sendBtn.disabled = false;
      input.focus();
    }
  }
}

function destroyChat() {
  document.getElementById('chat-btn')?.remove();
  document.getElementById('chat-widget')?.remove();
}