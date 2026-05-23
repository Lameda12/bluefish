import { cn } from '@/lib/utils'
import type { MHWCategory } from '@/lib/types'

const CATEGORY_CONFIG: Record<
  MHWCategory,
  { label: string; bg: string; text: string; ping: string }
> = {
  0: { label: 'No Active MHW', bg: 'bg-[#22c55e]/10', text: 'text-[#22c55e]', ping: 'bg-[#22c55e]' },
  1: { label: 'Category I',    bg: 'bg-[#eab308]/10', text: 'text-[#eab308]', ping: 'bg-[#eab308]' },
  2: { label: 'Category II',   bg: 'bg-[#eab308]/10', text: 'text-[#eab308]', ping: 'bg-[#eab308]' },
  3: { label: 'Category III',  bg: 'bg-[#f97316]/10', text: 'text-[#f97316]', ping: 'bg-[#f97316]' },
  4: { label: 'Category IV',   bg: 'bg-[#ef4444]/10', text: 'text-[#ef4444]', ping: 'bg-[#ef4444]' },
}

interface MHWBadgeProps {
  category: MHWCategory
  className?: string
}

export function MHWBadge({ category, className }: MHWBadgeProps) {
  const cfg = CATEGORY_CONFIG[category]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border border-current/20',
        cfg.bg,
        cfg.text,
        className
      )}
    >
      <span className="relative flex h-2 w-2">
        {category >= 3 && (
          <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-75', cfg.ping)} />
        )}
        <span className={cn('relative inline-flex h-2 w-2 rounded-full', cfg.ping)} />
      </span>
      {cfg.label}
    </span>
  )
}
