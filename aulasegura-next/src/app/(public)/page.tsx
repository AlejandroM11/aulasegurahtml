import Link from 'next/link'
import { Shield, Zap, Brain, BarChart3, Users, Lock } from 'lucide-react'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

const features = [
  { icon: Shield,   color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20',   title: 'Control Antifraude',        desc: 'Fullscreen obligatorio, detección de pérdida de foco y bloqueo automático en tiempo real.' },
  { icon: Users,    color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20', title: 'Monitoreo en Vivo',          desc: 'Dashboard del profesor con todos los estudiantes activos, progreso e infracciones.' },
  { icon: Brain,    color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20', title: 'Generación con IA',        desc: 'Crea preguntas automáticamente desde PDFs usando LLaMA 3 vía Groq API.' },
  { icon: Zap,      color: 'text-amber-500',  bg: 'bg-amber-50 dark:bg-amber-900/20', title: 'Acceso Rápido',             desc: 'Los estudiantes entran solo con su nombre y el código del examen. Sin registro.' },
  { icon: BarChart3,color: 'text-cyan-500',   bg: 'bg-cyan-50 dark:bg-cyan-900/20',   title: 'Resultados y Analíticas',   desc: 'Calificación automática, retroalimentación por pregunta y exportación en PDF.' },
  { icon: Lock,     color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20',     title: 'Preguntas Matemáticas',     desc: 'Editor MathQuill integrado para ecuaciones con teclado matemático interactivo.' },
]

export default function HomePage() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 py-12">

      {/* Hero */}
      <section className="flex flex-col-reverse md:flex-row items-center gap-12 py-8 md:py-16">
        <div className="flex-1 animate-slide-up">
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-full px-3 py-1 text-xs font-bold text-blue-700 dark:text-blue-300 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Sistema activo · Monitoreo en tiempo real
          </div>
          <h1 className="text-4xl md:text-5xl font-black leading-tight text-slate-900 dark:text-white mb-4">
            La plataforma de exámenes más{' '}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent bg-[length:200%] animate-[shimmer_3s_linear_infinite]">
              segura
            </span>
          </h1>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed mb-8">
            Control antifraude avanzado, monitoreo en tiempo real e inteligencia artificial para docentes y estudiantes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/invitado">
              <Button variant="gradient" size="lg" className="w-full sm:w-auto">
                <Zap className="w-4 h-4" /> Acceso Rápido — sin cuenta
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">Ingresar</Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">Crear cuenta</Button>
            </Link>
          </div>
        </div>

        {/* Hero SVG illustration */}
        <div className="flex-1 flex justify-center">
          <svg width="340" height="300" viewBox="0 0 320 300" fill="none" className="w-full max-w-sm drop-shadow-2xl">
            <defs>
              <linearGradient id="monGrad" x1="0" y1="0" x2="320" y2="300" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#e0eaff"/><stop offset="100%" stopColor="#c7d7ff"/>
              </linearGradient>
              <linearGradient id="scrGrad" x1="40" y1="40" x2="280" y2="200" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#1e3a5f"/><stop offset="100%" stopColor="#2563eb"/>
              </linearGradient>
              <linearGradient id="shGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#7c3aed"/><stop offset="100%" stopColor="#2563eb"/>
              </linearGradient>
            </defs>
            <rect x="30" y="30" width="260" height="180" rx="16" fill="url(#monGrad)" stroke="#bfdbfe" strokeWidth="2"/>
            <rect x="46" y="46" width="228" height="148" rx="10" fill="url(#scrGrad)"/>
            <rect x="70" y="72" width="12" height="12" rx="3" fill="#22c55e"/>
            <rect x="90" y="74" width="80" height="8" rx="4" fill="rgba(255,255,255,.7)"/>
            <rect x="70" y="94" width="12" height="12" rx="3" fill="#22c55e"/>
            <rect x="90" y="96" width="100" height="8" rx="4" fill="rgba(255,255,255,.7)"/>
            <rect x="70" y="116" width="12" height="12" rx="3" fill="#f59e0b"/>
            <rect x="90" y="118" width="60" height="8" rx="4" fill="rgba(255,255,255,.5)"/>
            <rect x="70" y="182" width="180" height="6" rx="3" fill="rgba(255,255,255,.15)"/>
            <rect x="70" y="182" width="110" height="6" rx="3" fill="#22c55e"/>
            <rect x="140" y="210" width="40" height="22" rx="4" fill="#bfdbfe"/>
            <rect x="110" y="230" width="100" height="10" rx="5" fill="#93c5fd"/>
            <path d="M232 58 L208 68 v16 c0 14 10.5 27 24 30.5 C245.5 111 256 98 256 84 V68 Z" fill="url(#shGrad)" stroke="rgba(255,255,255,.4)" strokeWidth="1.5"/>
            <path d="M222 84 l6 6 12-12" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
        </div>
      </section>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-8">
        {[
          { val: '100%', lbl: 'Antifraude' },
          { val: '∞',    lbl: 'Estudiantes' },
          { val: '4',    lbl: 'Tipos de pregunta' },
          { val: 'IA',   lbl: 'Generación auto' },
        ].map(s => (
          <Card key={s.lbl} className="text-center py-5">
            <p className="text-2xl font-black text-blue-600 dark:text-blue-400 leading-none">{s.val}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">{s.lbl}</p>
          </Card>
        ))}
      </div>

      {/* Features */}
      <h2 className="text-center text-xs font-bold uppercase tracking-widest text-slate-400 my-8">Funcionalidades principales</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-12">
        {features.map(f => (
          <Card key={f.title} hover className="group">
            <div className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:-rotate-3`}>
              <f.icon className={`w-6 h-6 ${f.color}`} />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 p-10 text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-white mb-3">¿Listo para empezar?</h2>
        <p className="text-slate-300 mb-6">Crea tu cuenta gratis y comienza a aplicar exámenes seguros hoy mismo.</p>
        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/register"><Button variant="primary" size="lg" className="bg-white text-slate-900 hover:bg-slate-100">Crear cuenta gratis</Button></Link>
          <Link href="/invitado"><Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10">Acceso rápido</Button></Link>
        </div>
      </div>

      {/* University card */}
      <Card className="flex flex-col md:flex-row overflow-hidden p-0 mb-8">
        <div className="flex-1 min-h-[200px]">
          <iframe
            src="https://maps.google.com/maps?q=Universidad+de+Ibagu%C3%A9,+Carrera+22+Calle+67B,+Ibagu%C3%A9,+Tolima,+Colombia&output=embed&z=15"
            className="w-full h-full min-h-[200px] border-0"
            loading="lazy"
            title="Ubicación Universidad de Ibagué"
          />
        </div>
        <div className="flex-1 p-6 flex flex-col justify-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center shadow-md">
              <span className="text-white text-lg">🎓</span>
            </div>
            <div>
              <p className="font-black text-slate-900 dark:text-white">Universidad de Ibagué</p>
              <p className="text-xs text-slate-500">UNIBAGUÉ · Fundada en 1980</p>
            </div>
          </div>
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <p>📍 Carrera 22 Calle 67B, Ibagué, Tolima, Colombia</p>
            <p>🏛️ Universidad privada sin ánimo de lucro</p>
            <a href="https://www.unibague.edu.co" target="_blank" rel="noopener" className="text-blue-600 font-semibold hover:underline block">🌐 www.unibague.edu.co</a>
            <p>📞 +57 (8) 276 0010</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">
            ℹ️ AulaSegura es un proyecto académico desarrollado por estudiantes de la Universidad de Ibagué.
          </div>
        </div>
      </Card>

      <footer className="text-center text-sm text-slate-400 py-4">
        © {new Date().getFullYear()} Aula Segura — Kevin Martinez y Cristian Reyes
      </footer>
    </div>
  )
}
