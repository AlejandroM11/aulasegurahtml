import { Question } from '@/types'
import { Trash2, Pen } from 'lucide-react'
import { cn } from '@/lib/utils'

const TYPE_META = {
  mc:    { label: 'MÚLTIPLE',        bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' },
  multi: { label: 'VARIAS CORRECTAS',bg: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300' },
  open:  { label: 'ABIERTA',         bg: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' },
  eq:    { label: 'ECUACIÓN',        bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' },
}

interface Props {
  q:        Question
  idx:      number
  onDelete: (id: string) => void
}

export default function QuestionChip({ q, idx, onDelete }: Props) {
  const meta = TYPE_META[q.type] ?? { label: '?', bg: 'bg-slate-100 text-slate-600' }

  return (
    <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl p-3 flex flex-col gap-2 min-w-0">
      {/* Header row */}
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn('text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0', meta.bg)}>
          {meta.label}
        </span>
        <span className="text-xs text-slate-400 flex-shrink-0">#{idx + 1}</span>
        <span className="flex-1" />
        <button
          onClick={() => onDelete(q.id)}
          className="w-6 h-6 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors flex-shrink-0"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>

      {/* Question text */}
      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed break-words overflow-wrap-anywhere">
        {q.text}
      </p>

      {/* Options preview */}
      {(q.type === 'mc' || q.type === 'multi') && q.options && (
        <div className="flex flex-wrap gap-1">
          {q.options.map((o, i) => {
            const isCorrect = q.type === 'mc'
              ? i === q.correctIndex
              : (q.correctIndexes ?? []).includes(i)
            return (
              <span key={i} className={cn(
                'text-[10px] px-2 py-0.5 rounded-full font-medium break-all',
                isCorrect
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 font-bold'
                  : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              )}>
                {isCorrect && '✓ '}{o}
              </span>
            )
          })}
        </div>
      )}

      {q.type === 'eq' && q.referenceLatex && (
        <p className="text-[10px] text-purple-600 dark:text-purple-400 font-mono break-all">
          Ref: {q.referenceLatex}
        </p>
      )}

      {q.type === 'open' && (
        <p className="text-[10px] text-slate-400 italic">Respuesta abierta</p>
      )}
    </div>
  )
}
