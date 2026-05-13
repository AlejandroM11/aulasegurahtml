function renderPerfil(app) {
  const user = getUser();
  if (!user) { navigate('/login'); return; }

  let saving = false;
  let newName = user.name || '';
  let newPhoto = user.photo || '';
  let pwCurrent = '', pwNew = '', pwConfirm = '';
  let activeSection = 'info';
  let uploadPreview = null;

  // Iniciales para avatar por defecto
  function getInitials(name) {
    if (!name) return '?';
    return name.trim().split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }

  function getAvatarColor(str) {
    const colors = [
      ['#2563eb','#1d4ed8'], ['#7c3aed','#6d28d9'],
      ['#0891b2','#0e7490'], ['#059669','#047857'],
      ['#dc2626','#b91c1c'], ['#d97706','#b45309']
    ];
    let hash = 0;
    for (let c of (str||'')) hash = c.charCodeAt(0) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  }

  function renderAvatar(size = 96, fontSize = '2rem') {
    const src = uploadPreview || newPhoto;
    const [c1, c2] = getAvatarColor(user.email);
    if (src) {
      return `<img src="${src}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;display:block;" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
              <div style="display:none;width:${size}px;height:${size}px;border-radius:50%;background:linear-gradient(135deg,${c1},${c2});align-items:center;justify-content:center;font-size:${fontSize};font-weight:800;color:#fff">${getInitials(newName)}</div>`;
    }
    return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:linear-gradient(135deg,${c1},${c2});display:flex;align-items:center;justify-content:center;font-size:${fontSize};font-weight:800;color:#fff">${getInitials(newName)}</div>`;
  }

  function roleLabel(role) {
    return role === 'docente'
      ? `<span style="background:#dbeafe;color:#1d4ed8;padding:.2rem .75rem;border-radius:999px;font-size:.78rem;font-weight:700"><i class="fa-solid fa-chalkboard-teacher" style="margin-right:.35rem"></i>Docente</span>`
      : `<span style="background:#dcfce7;color:#15803d;padding:.2rem .75rem;border-radius:999px;font-size:.78rem;font-weight:700"><i class="fa-solid fa-user-graduate" style="margin-right:.35rem"></i>Estudiante</span>`;
  }

  function render() {
    app.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

        .pf-page { font-family: 'Plus Jakarta Sans', sans-serif; max-width: 860px; margin: 0 auto; padding: 2rem 1rem; position: relative; z-index: 1; }

        /* hero banner */
        .pf-hero {
          background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #7c3aed 100%);
          border-radius: 1.5rem; padding: 2.5rem 2rem 5rem;
          position: relative; overflow: hidden; margin-bottom: 0;
        }
        .pf-hero::before {
          content: ''; position: absolute; inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='20'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
        .pf-hero-back {
          display: inline-flex; align-items: center; gap: .5rem;
          color: rgba(255,255,255,.8); font-size: .875rem; font-weight: 600;
          background: rgba(255,255,255,.15); border: none; border-radius: .6rem;
          padding: .4rem .85rem; cursor: pointer; transition: all .2s;
          backdrop-filter: blur(4px); margin-bottom: 1.5rem;
        }
        .pf-hero-back:hover { background: rgba(255,255,255,.25); color: #fff; }

        .pf-hero-info { display: flex; align-items: center; gap: 1.5rem; position: relative; }
        .pf-avatar-wrap {
          position: relative; flex-shrink: 0;
          filter: drop-shadow(0 8px 24px rgba(0,0,0,.25));
        }
        .pf-avatar-ring {
          padding: 3px; border-radius: 50%;
          background: linear-gradient(135deg, rgba(255,255,255,.6), rgba(255,255,255,.2));
        }
        .pf-avatar-edit {
          position: absolute; bottom: 2px; right: 2px;
          width: 2rem; height: 2rem; border-radius: 50%;
          background: #fff; border: 2px solid #e2e8f0;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer; font-size: .75rem; color: #2563eb;
          transition: all .2s; box-shadow: 0 2px 8px rgba(0,0,0,.2);
        }
        .pf-avatar-edit:hover { background: #2563eb; color: #fff; border-color: #2563eb; }

        .pf-hero-text h1 {
          font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 800;
          color: #fff; margin-bottom: .35rem; letter-spacing: -.02em;
        }
        .pf-hero-text p { color: rgba(255,255,255,.75); font-size: .9rem; margin-bottom: .6rem; }

        /* card body */
        .pf-body {
          background: #fff; border-radius: 1.25rem;
          box-shadow: 0 4px 24px rgba(0,0,0,.08);
          border: 1px solid #e2e8f0;
          margin-top: -3rem; position: relative; overflow: hidden;
          z-index: 1;
        }
        body.dark .pf-body { background: #1e293b; border-color: #334155; }

        /* tabs */
        .pf-tabs {
          display: flex; border-bottom: 1px solid #e2e8f0;
          padding: 0 1.5rem; gap: 0;
        }
        body.dark .pf-tabs { border-color: #334155; }
        .pf-tab {
          padding: 1.1rem 1.25rem; font-size: .875rem; font-weight: 600;
          color: #64748b; border: none; background: none; cursor: pointer;
          border-bottom: 2.5px solid transparent; margin-bottom: -1px;
          transition: all .2s; display: flex; align-items: center; gap: .5rem;
          font-family: 'Plus Jakarta Sans', sans-serif;
        }
        .pf-tab:hover { color: #2563eb; }
        .pf-tab.active { color: #2563eb; border-bottom-color: #2563eb; }
        body.dark .pf-tab { color: #94a3b8; }
        body.dark .pf-tab.active { color: #60a5fa; border-bottom-color: #60a5fa; }

        /* content */
        .pf-content { padding: 2rem 1.5rem; animation: pfFadeIn .3s ease; }
        @keyframes pfFadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

        /* fields */
        .pf-field { margin-bottom: 1.25rem; }
        .pf-label {
          display: block; font-size: .8rem; font-weight: 700;
          color: #64748b; text-transform: uppercase; letter-spacing: .06em;
          margin-bottom: .45rem;
        }
        body.dark .pf-label { color: #94a3b8; }
        .pf-input {
          width: 100%; padding: .7rem 1rem;
          border: 1.5px solid #e2e8f0; border-radius: .75rem;
          font-size: .95rem; color: #1e293b; background: #f8fafc;
          font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all .2s;
        }
        .pf-input:focus { outline: none; border-color: #2563eb; background: #fff; box-shadow: 0 0 0 3px rgba(37,99,235,.1); }
        body.dark .pf-input { background: #0f172a; border-color: #334155; color: #e2e8f0; }
        body.dark .pf-input:focus { border-color: #60a5fa; background: #0f172a; }
        .pf-input:disabled { opacity: .6; cursor: not-allowed; }
        .pf-input-icon { position: relative; }
        .pf-input-icon i { position: absolute; left: .9rem; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: .85rem; }
        .pf-input-icon .pf-input { padding-left: 2.5rem; }

        .pf-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        @media(max-width:600px) { .pf-grid-2 { grid-template-columns: 1fr; } }

        /* readonly pill */
        .pf-readonly {
          padding: .7rem 1rem; border-radius: .75rem;
          background: #f1f5f9; border: 1.5px solid #e2e8f0;
          font-size: .95rem; color: #475569; display: flex;
          align-items: center; gap: .6rem;
        }
        body.dark .pf-readonly { background: #0f172a; border-color: #334155; color: #94a3b8; }

        /* photo url section */
        .pf-photo-section {
          background: #f8fafc; border: 1.5px dashed #d1d5db;
          border-radius: 1rem; padding: 1.25rem;
          margin-bottom: 1.25rem; text-align: center;
        }
        body.dark .pf-photo-section { background: #0f172a; border-color: #334155; }
        .pf-photo-preview {
          width: 72px; height: 72px; border-radius: 50%;
          margin: 0 auto .75rem; overflow: hidden;
          box-shadow: 0 4px 12px rgba(0,0,0,.1);
          display: flex; align-items: center; justify-content: center;
        }

        /* save btn */
        .pf-save {
          width: 100%; padding: .85rem; border-radius: .85rem;
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: #fff; font-size: 1rem; font-weight: 700;
          border: none; cursor: pointer; font-family: 'Plus Jakarta Sans', sans-serif;
          transition: all .2s; margin-top: .5rem;
          box-shadow: 0 4px 16px rgba(37,99,235,.3);
        }
        .pf-save:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(37,99,235,.4); }
        .pf-save:disabled { opacity: .6; cursor: not-allowed; transform: none; }

        /* password strength */
        .pw-strength { height: 4px; border-radius: 999px; background: #e2e8f0; margin-top: .5rem; overflow: hidden; }
        .pw-strength-fill { height: 100%; border-radius: 999px; transition: width .3s, background .3s; }

        /* info cards */
        .pf-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1.5rem; }
        @media(max-width:600px) { .pf-info-grid { grid-template-columns: 1fr; } }
        .pf-info-card {
          background: #f8fafc; border: 1px solid #e2e8f0;
          border-radius: 1rem; padding: 1rem 1.1rem;
          display: flex; align-items: center; gap: .85rem;
        }
        body.dark .pf-info-card { background: #0f172a; border-color: #334155; }
        .pf-info-icon {
          width: 2.5rem; height: 2.5rem; border-radius: .65rem;
          display: flex; align-items: center; justify-content: center;
          font-size: 1rem; flex-shrink: 0;
        }
        .pf-info-val { font-weight: 700; font-size: .95rem; color: #1e293b; }
        body.dark .pf-info-val { color: #f1f5f9; }
        .pf-info-lbl { font-size: .72rem; color: #64748b; margin-top: .1rem; }
        body.dark .pf-info-lbl { color: #94a3b8; }

        /* danger zone */
        .pf-danger {
          background: #fef2f2; border: 1.5px solid #fecaca;
          border-radius: 1rem; padding: 1.25rem;
          display: flex; align-items: center; justify-content: space-between; gap: 1rem;
        }
        body.dark .pf-danger { background: #450a0a; border-color: #7f1d1d; }
      </style>

      <div class="pf-page">

        <!-- SVG fondo sutil -->
        <svg style="position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:0" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" fill="none">
          <defs>
            <linearGradient id="pfb1" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2563eb" stop-opacity=".05"/><stop offset="100%" stop-color="#7c3aed" stop-opacity=".03"/></linearGradient>
            <linearGradient id="pfb2" x1="1" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7c3aed" stop-opacity=".04"/><stop offset="100%" stop-color="#2563eb" stop-opacity=".02"/></linearGradient>
          </defs>
          <circle cx="0" cy="0" r="400" fill="url(#pfb1)"><animate attributeName="r" values="400;430;400" dur="10s" repeatCount="indefinite"/></circle>
          <circle cx="1440" cy="900" r="350" fill="url(#pfb2)"><animate attributeName="r" values="350;380;350" dur="12s" begin="2s" repeatCount="indefinite"/></circle>
          <circle cx="1440" cy="0" r="240" fill="url(#pfb1)" opacity=".6"><animate attributeName="r" values="240;265;240" dur="8s" begin="1s" repeatCount="indefinite"/></circle>
        </svg>

        <!-- Hero banner -->
        <div class="pf-hero" style="position:relative;z-index:1">
          <!-- SVG decorativo en el hero -->
          <svg style="position:absolute;right:1.5rem;top:50%;transform:translateY(-50%);opacity:.12;pointer-events:none" width="160" height="160" viewBox="0 0 160 160" fill="none">
            <circle cx="80" cy="80" r="70" stroke="white" stroke-width="1.5" stroke-dasharray="9 6">
              <animateTransform attributeName="transform" type="rotate" values="0 80 80;360 80 80" dur="22s" repeatCount="indefinite"/>
            </circle>
            <circle cx="80" cy="80" r="48" stroke="white" stroke-width="1" stroke-dasharray="6 5">
              <animateTransform attributeName="transform" type="rotate" values="360 80 80;0 80 80" dur="15s" repeatCount="indefinite"/>
            </circle>
            <circle cx="80" cy="80" r="24" fill="white" opacity=".15">
              <animate attributeName="r" values="24;28;24" dur="3s" repeatCount="indefinite"/>
            </circle>
            <circle cx="150" cy="80" r="7" fill="white" opacity=".7">
              <animateTransform attributeName="transform" type="rotate" values="0 80 80;360 80 80" dur="22s" repeatCount="indefinite"/>
            </circle>
            <circle cx="128" cy="80" r="5" fill="white" opacity=".5">
              <animateTransform attributeName="transform" type="rotate" values="360 80 80;0 80 80" dur="15s" repeatCount="indefinite"/>
            </circle>
          </svg>

          <button class="pf-hero-back" id="pf-back">
            <i class="fa-solid fa-arrow-left"></i> Volver
          </button>
          <div class="pf-hero-info">
            <div class="pf-avatar-wrap">
              <div class="pf-avatar-ring">
                ${renderAvatar(88, '1.75rem')}
              </div>
              <label class="pf-avatar-edit" title="Cambiar foto" id="photo-edit-trigger" style="cursor:pointer">
                <i class="fa-solid fa-camera"></i>
              </label>
            </div>
            <div class="pf-hero-text">
              <h1>${newName || 'Sin nombre'}</h1>
              <p>${user.email}</p>
              ${roleLabel(user.role)}
            </div>
          </div>
        </div>

        <!-- Card principal -->
        <div class="pf-body">
          <div class="pf-tabs">
            <button class="pf-tab ${activeSection==='info'?'active':''}" id="tab-info">
              <i class="fa-solid fa-user"></i> Mi perfil
            </button>
            <button class="pf-tab ${activeSection==='foto'?'active':''}" id="tab-foto">
              <i class="fa-solid fa-image"></i> Foto
            </button>
            <button class="pf-tab ${activeSection==='pw'?'active':''}" id="tab-pw">
              <i class="fa-solid fa-lock"></i> Contraseña
            </button>
          </div>

          <div class="pf-content">
            ${activeSection === 'info' ? renderSectionInfo() : ''}
            ${activeSection === 'foto' ? renderSectionFoto() : ''}
            ${activeSection === 'pw'   ? renderSectionPw()   : ''}
          </div>
        </div>

      </div>
    `;

    // Tab events
    document.getElementById('tab-info').onclick = () => { activeSection = 'info'; render(); };
    document.getElementById('tab-foto').onclick = () => { activeSection = 'foto'; render(); };
    document.getElementById('tab-pw').onclick   = () => { activeSection = 'pw';   render(); };

    // Back
    document.getElementById('pf-back').onclick = () => {
      navigate(user.role === 'docente' ? '/docente' : '/estudiante');
    };

    // Camera icon → foto tab
    document.getElementById('photo-edit-trigger').onclick = () => { activeSection = 'foto'; render(); };

    if (activeSection === 'info') bindInfoEvents();
    if (activeSection === 'foto') bindFotoEvents();
    if (activeSection === 'pw')   bindPwEvents();
  }

  // ── Sección: Info ──
  function renderSectionInfo() {
    const joinDate = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString('es-ES', { day:'2-digit', month:'long', year:'numeric' })
      : 'Desconocido';

    return `
      <div class="pf-info-grid">
        <div class="pf-info-card">
          <div class="pf-info-icon" style="background:#dbeafe">
            <i class="fa-solid fa-shield-halved" style="color:#2563eb"></i>
          </div>
          <div>
            <div class="pf-info-val">${user.role === 'docente' ? 'Docente' : 'Estudiante'}</div>
            <div class="pf-info-lbl">Rol en la plataforma</div>
          </div>
        </div>
        <div class="pf-info-card">
          <div class="pf-info-icon" style="background:#dcfce7">
            <i class="fa-solid fa-calendar-check" style="color:#16a34a"></i>
          </div>
          <div>
            <div class="pf-info-val">${joinDate}</div>
            <div class="pf-info-lbl">Miembro desde</div>
          </div>
        </div>
      </div>

      <div class="pf-field">
        <label class="pf-label">Nombre completo</label>
        <div class="pf-input-icon">
          <i class="fa-solid fa-user"></i>
          <input class="pf-input" id="pf-name" type="text" value="${newName}" placeholder="Tu nombre completo" maxlength="60"/>
        </div>
      </div>

      <div class="pf-field">
        <label class="pf-label">Correo electrónico</label>
        <div class="pf-readonly">
          <i class="fa-solid fa-envelope" style="color:#94a3b8"></i>
          <span>${user.email}</span>
          <span style="margin-left:auto;font-size:.72rem;background:#f1f5f9;padding:.15rem .55rem;border-radius:999px;color:#64748b">No editable</span>
        </div>
      </div>

      <div class="pf-field">
        <label class="pf-label">UID</label>
        <div class="pf-readonly" style="font-family:monospace;font-size:.8rem">
          <i class="fa-solid fa-fingerprint" style="color:#94a3b8"></i>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${user.uid}</span>
        </div>
      </div>

      <button class="pf-save" id="pf-save-info" ${saving ? 'disabled' : ''}>
        ${saving ? '<i class="fa-solid fa-spinner fa-spin" style="margin-right:.5rem"></i>Guardando...' : '<i class="fa-solid fa-floppy-disk" style="margin-right:.5rem"></i>Guardar cambios'}
      </button>
    `;
  }

  function bindInfoEvents() {
    document.getElementById('pf-name').oninput = e => { newName = e.target.value; };
    document.getElementById('pf-save-info').onclick = saveInfo;
  }

  async function saveInfo() {
    if (!newName.trim()) { alert('El nombre no puede estar vacío'); return; }
    saving = true; render();
    try {
      // Actualizar en Firebase DB
      await fbDB.ref(`users/${user.uid}`).update({ name: newName.trim() });
      // Actualizar en localStorage
      const updated = { ...user, name: newName.trim() };
      setUser(updated);
      alert('✅ Nombre actualizado correctamente');
    } catch (err) {
      alert('❌ Error al guardar: ' + err.message);
    } finally {
      saving = false; render();
    }
  }

  // ── Sección: Foto ──
  function renderSectionFoto() {
    const src = uploadPreview || newPhoto;
    const [c1, c2] = getAvatarColor(user.email);

    return `
      <div class="pf-photo-section">
        <div class="pf-photo-preview">
          ${src
            ? `<img src="${src}" style="width:72px;height:72px;object-fit:cover;border-radius:50%" onerror="this.style.display='none'"/>`
            : `<div style="width:72px;height:72px;border-radius:50%;background:linear-gradient(135deg,${c1},${c2});display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:800;color:#fff">${getInitials(newName)}</div>`}
        </div>
        <p style="font-size:.85rem;font-weight:700;color:#374151;margin-bottom:.25rem">Foto de perfil actual</p>
        <p style="font-size:.75rem;color:#94a3b8">Pega una URL de imagen o ingresa una dirección web</p>
      </div>

      <div class="pf-field">
        <label class="pf-label">URL de la foto</label>
        <div class="pf-input-icon">
          <i class="fa-solid fa-link"></i>
          <input class="pf-input" id="pf-photo-url" type="url"
            value="${newPhoto}"
            placeholder="https://ejemplo.com/mi-foto.jpg"/>
        </div>
        <p style="font-size:.72rem;color:#94a3b8;margin-top:.35rem">
          <i class="fa-solid fa-circle-info" style="margin-right:.3rem"></i>
          Usa una imagen pública (Imgur, GitHub, Google Photos, etc.)
        </p>
      </div>

      <div style="display:flex;gap:.75rem;margin-top:.5rem">
        <button class="btn btn-outline" style="flex:1;font-family:'Plus Jakarta Sans',sans-serif" id="pf-preview-btn">
          <i class="fa-solid fa-eye" style="margin-right:.4rem"></i>Vista previa
        </button>
        <button class="pf-save" style="flex:2;margin-top:0" id="pf-save-foto" ${saving ? 'disabled' : ''}>
          ${saving ? '<i class="fa-solid fa-spinner fa-spin" style="margin-right:.5rem"></i>Guardando...' : '<i class="fa-solid fa-floppy-disk" style="margin-right:.5rem"></i>Guardar foto'}
        </button>
      </div>

      ${newPhoto || uploadPreview ? `
        <button class="btn btn-danger" style="width:100%;margin-top:.75rem;font-family:'Plus Jakarta Sans',sans-serif" id="pf-remove-photo">
          <i class="fa-solid fa-trash" style="margin-right:.4rem"></i>Quitar foto
        </button>
      ` : ''}
    `;
  }

  function bindFotoEvents() {
    document.getElementById('pf-photo-url').oninput = e => {
      newPhoto = e.target.value.trim();
      uploadPreview = null;
    };

    document.getElementById('pf-preview-btn').onclick = () => {
      const url = document.getElementById('pf-photo-url').value.trim();
      if (!url) { alert('Ingresa una URL primero'); return; }
      uploadPreview = url;
      newPhoto = url;
      render();
    };

    document.getElementById('pf-save-foto').onclick = saveFoto;

    const removeBtn = document.getElementById('pf-remove-photo');
    if (removeBtn) removeBtn.onclick = () => {
      newPhoto = ''; uploadPreview = null;
      render();
    };
  }

  async function saveFoto() {
    const url = document.getElementById('pf-photo-url')?.value.trim() || newPhoto;
    saving = true; render();
    try {
      await fbDB.ref(`users/${user.uid}`).update({ photo: url });
      const updated = { ...user, photo: url };
      setUser(updated);
      newPhoto = url; uploadPreview = null;
      alert('✅ Foto actualizada correctamente');
    } catch (err) {
      alert('❌ Error al guardar: ' + err.message);
    } finally {
      saving = false; render();
    }
  }

  // ── Sección: Contraseña ──
  function renderSectionPw() {
    const strength = getPwStrength(pwNew);

    return `
      <div class="info-box info-box-blue mb-4">
        <p class="text-sm">
          <i class="fa-solid fa-circle-info" style="margin-right:.4rem"></i>
          ${user.fromGoogle && !user.hasPassword
            ? 'Tu cuenta usa Google. Crea una contraseña para también poder entrar con email y contraseña.'
            : 'Ingresa tu contraseña actual para poder cambiarla.'}
        </p>
      </div>

      ${!user.fromGoogle || user.hasPassword ? `
        <div class="pf-field">
          <label class="pf-label">Contraseña actual</label>
          <div class="pf-input-icon">
            <i class="fa-solid fa-lock"></i>
            <input class="pf-input" id="pf-pw-current" type="password" value="${pwCurrent}" placeholder="Tu contraseña actual"/>
          </div>
        </div>
      ` : ''}

      <div class="pf-field">
        <label class="pf-label">Nueva contraseña</label>
        <div class="pf-input-icon">
          <i class="fa-solid fa-key"></i>
          <input class="pf-input" id="pf-pw-new" type="password" value="${pwNew}" placeholder="Mínimo 6 caracteres"/>
        </div>
        ${pwNew ? `
          <div class="pw-strength mt-2">
            <div class="pw-strength-fill" style="width:${strength.pct}%;background:${strength.color}"></div>
          </div>
          <p style="font-size:.72rem;color:${strength.color};margin-top:.3rem;font-weight:600">${strength.label}</p>
        ` : ''}
      </div>

      <div class="pf-field">
        <label class="pf-label">Confirmar nueva contraseña</label>
        <div class="pf-input-icon">
          <i class="fa-solid fa-key"></i>
          <input class="pf-input" id="pf-pw-confirm" type="password" value="${pwConfirm}" placeholder="Repite la nueva contraseña"/>
        </div>
        ${pwConfirm && pwNew !== pwConfirm
          ? `<p style="font-size:.72rem;color:#dc2626;margin-top:.3rem;font-weight:600"><i class="fa-solid fa-xmark" style="margin-right:.3rem"></i>Las contraseñas no coinciden</p>`
          : pwConfirm && pwNew === pwConfirm
            ? `<p style="font-size:.72rem;color:#16a34a;margin-top:.3rem;font-weight:600"><i class="fa-solid fa-check" style="margin-right:.3rem"></i>Las contraseñas coinciden</p>`
            : ''}
      </div>

      <button class="pf-save" id="pf-save-pw" ${saving ? 'disabled' : ''}>
        ${saving ? '<i class="fa-solid fa-spinner fa-spin" style="margin-right:.5rem"></i>Cambiando...' : '<i class="fa-solid fa-shield-halved" style="margin-right:.5rem"></i>Cambiar contraseña'}
      </button>
    `;
  }

  function getPwStrength(pw) {
    if (!pw || pw.length < 3) return { pct: 0, color: '#e2e8f0', label: '' };
    let score = 0;
    if (pw.length >= 6)  score++;
    if (pw.length >= 10) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (score <= 1) return { pct: 25,  color: '#dc2626', label: 'Muy débil' };
    if (score === 2) return { pct: 50,  color: '#f59e0b', label: 'Débil' };
    if (score === 3) return { pct: 70,  color: '#3b82f6', label: 'Buena' };
    return                { pct: 100, color: '#16a34a', label: 'Fuerte 💪' };
  }

  function bindPwEvents() {
    const currentInput  = document.getElementById('pf-pw-current');
    const newInput      = document.getElementById('pf-pw-new');
    const confirmInput  = document.getElementById('pf-pw-confirm');

    if (currentInput) currentInput.oninput = e => { pwCurrent = e.target.value; };
    if (newInput) newInput.oninput = e => { pwNew = e.target.value; renderKeepFocus(render, 'pf-pw-new'); };
    if (confirmInput) confirmInput.oninput = e => { pwConfirm = e.target.value; renderKeepFocus(render, 'pf-pw-confirm'); };

    document.getElementById('pf-save-pw').onclick = savePw;
  }

  async function savePw() {
    if (pwNew.length < 6) { alert('La contraseña debe tener al menos 6 caracteres'); return; }
    if (pwNew !== pwConfirm) { alert('Las contraseñas no coinciden'); return; }

    saving = true; render();

    try {
      const fbUser = fbAuth.currentUser;
      if (!fbUser) throw new Error('No hay sesión activa de Firebase');

      // Si tiene contraseña actual, re-autenticar primero
      if (!user.fromGoogle || user.hasPassword) {
        if (!pwCurrent) { alert('Ingresa tu contraseña actual'); saving = false; render(); return; }
        const credential = firebase.auth.EmailAuthProvider.credential(user.email, pwCurrent);
        await fbUser.reauthenticateWithCredential(credential);
      }

      await fbUser.updatePassword(pwNew);
      await fbDB.ref(`users/${user.uid}`).update({ hasPassword: true });
      setUser({ ...user, hasPassword: true });

      pwCurrent = ''; pwNew = ''; pwConfirm = '';
      alert('✅ Contraseña actualizada correctamente');
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        alert('❌ La contraseña actual es incorrecta');
      } else if (err.code === 'auth/requires-recent-login') {
        alert('⚠️ Por seguridad vuelve a iniciar sesión e intenta de nuevo');
      } else {
        alert('❌ Error: ' + err.message);
      }
    } finally {
      saving = false; render();
    }
  }

  render();
}