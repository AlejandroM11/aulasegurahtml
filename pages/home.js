function renderHome(app) {
  app.innerHTML = `
    <div class="hero">
      <div style="flex:1">
        <h1 style="font-size:clamp(2rem,5vw,3rem);font-weight:800;line-height:1.2">
          Bienvenido a <span class="text-blue">Aula Segura</span>
        </h1>
        <p style="margin-top:1rem;font-size:1.1rem;color:#475569;max-width:480px" class="text-gray">
          Plataforma avanzada de exámenes con control antifraude, monitoreo en tiempo real
          y herramientas para docentes y estudiantes.
        </p>
        <div class="space-y mt-6">
          <a href="#/invitado" class="btn btn-gradient btn-full" style="font-size:1.1rem;padding:.9rem 1.5rem">
            🎯 Acceso Rápido (sin cuenta)
          </a>
          <div class="flex-row" style="gap:.75rem">
            <a href="#/login" class="btn btn-outline" style="flex:1;justify-content:center">Ingresar</a>
            <a href="#/register" class="btn btn-outline" style="flex:1;justify-content:center">Crear cuenta</a>
          </div>
        </div>
      </div>
      <div style="flex:1;display:flex;justify-content:center">
        <img class="hero-img"
          src="https://cdn.pixabay.com/photo/2023/03/23/04/17/bookkeeper-adelaide-7871094_1280.jpg"
          alt="Examen seguro"/>
      </div>
    </div>

    <div class="features">
      <div class="feature-card">
        <div class="feature-title">🛡️ Control Antifraude</div>
        <p class="text-gray text-sm">Detección de pérdida de foco, bloqueo automático y modo pantalla completa durante el examen.</p>
      </div>
      <div class="feature-card">
        <div class="feature-title">📡 Panel para Docentes</div>
        <p class="text-gray text-sm">Monitorea a tus estudiantes en tiempo real, revisa por qué fueron bloqueados y desbloquéalos al instante.</p>
      </div>
      <div class="feature-card">
        <div class="feature-title">📝 Exámenes Inteligentes</div>
        <p class="text-gray text-sm">Creación, edición y calificación automática de cuestionarios con sincronización inmediata.</p>
      </div>
    </div>

    <footer class="text-center text-gray text-sm mt-8" style="padding:2rem 0">
      © ${new Date().getFullYear()} Aula Segura — Universidad de Ibagué
    </footer>
  `;
}
