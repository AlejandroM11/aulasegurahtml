import { cn } from '@/lib/utils'

interface CardProps {
  children:   React.ReactNode
  className?: string
  hover?:     boolean
  padding?:   'none' | 'sm' | 'md' | 'lg'
}

const paddings = { none: '', sm: 'p-4', md: 'p-6', lg: 'p-8' }

export default function Card({ children, className, hover, padding = 'md' }: CardProps) {
  return (
    <div className={cn(
      'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800',
      'rounded-2xl shadow-sm',
      hover && 'transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer',
      paddings[padding],
      className
    )}>
      {children}
    </div>
  )
}
