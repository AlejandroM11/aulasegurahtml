# AulaSegura — Next.js + TypeScript + Tailwind

Migración progresiva del proyecto vanilla JS a Next.js 15 + TypeScript + Tailwind CSS.

## Stack

- **Next.js 15** (App Router)
- **TypeScript** strict
- **Tailwind CSS** v3
- **Framer Motion** para animaciones
- **Firebase** v11 (Auth + Realtime Database)
- **Zustand** para estado global (próximamente)
- **React Hot Toast** para notificaciones
- **Lucide React** para iconos

## Estructura

```
src/
├── app/
│   ├── (public)/          # Rutas públicas (home, login, register, invitado)
│   └── (protected)/       # Rutas protegidas (docente, monitor, resultados, estudiante)
├── components/
│   ├── ui/                # Button, Input, Card, Badge
│   └── layout/            # Navbar
├── context/               # AuthContext
├── hooks/                 # useExams
├── lib/                   # firebase, api, monitor, utils
└── types/                 # TypeScript types
```

## Instalación

```bash
cd aulasegura-next
npm install
npm run dev
```

Abre http://localhost:3000

## Estado de la migración

| Módulo              | Estado        |
|---------------------|---------------|
| Home                | ✅ Completo   |
| Login               | ✅ Completo   |
| Register            | ✅ Completo   |
| Acceso invitado     | ✅ Completo   |
| Panel docente       | 🔄 Parcial    |
| Monitor             | ✅ Completo   |
| Resultados          | 🔄 Pendiente  |
| Estudiante/Examen   | 🔄 Pendiente  |
| Perfil              | 🔄 Pendiente  |
| Chat ARDI           | 🔄 Pendiente  |
| Generación IA       | 🔄 Pendiente  |
| MathQuill           | 🔄 Pendiente  |
| Anti-fraude         | 🔄 Pendiente  |

## Notas importantes

- El sistema anti-fraude (fullscreen, blur detection) se implementará como un hook `useFraudGuard`
- MathQuill requiere un wrapper custom para React — se usará `react-mathquill` o wrapper manual
- El backend Node.js/Express existente se reutiliza sin cambios
