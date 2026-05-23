import { cn } from '@/lib/utils'

type BadgeVariant = 'green' | 'red' | 'blue' | 'gray' | 'yellow' | 'purple'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
}

const variants: Record<BadgeVariant, string> = {
  green:  'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
  red:    'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  blue:   'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400',
  gray:   'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
  purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400',
}

export default function Badge({ variant = 'gray', children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold',
      variants[variant], className
    )}>
      {children}
    </span>
  )
}
