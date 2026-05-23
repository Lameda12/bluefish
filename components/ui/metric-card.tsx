import * as React from 'react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  label: string
  value: string
  sublabel?: string
  className?: string
}

export const MetricCard = React.forwardRef<HTMLDivElement, MetricCardProps>(
  ({ label, value, sublabel, className }, ref) => (
    <div
      ref={ref}
      className={cn('bg-[#0f2040] border border-[#1e3a5f] rounded-xl p-3 flex-1', className)}
    >
      <p className="text-xs uppercase tracking-wide text-[#7fb3d3]">{label}</p>
      <p className="text-2xl font-bold text-[#0ea5e9] mt-1">{value}</p>
      {sublabel && <p className="text-xs text-[#7fb3d3] mt-1">{sublabel}</p>}
    </div>
  )
)
MetricCard.displayName = 'MetricCard'
