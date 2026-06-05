'use client'

import type { Icon } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface MetricHighlightProps {
  icon: Icon
  label: string
  value: string
  tone?: 'primary' | 'neutral'
  description?: string
}

export function MetricHighlight({
  icon: Icon,
  label,
  value,
  tone = 'neutral',
  description,
}: MetricHighlightProps) {
  return (
    <div
      className={cn(
        'rounded-xl border px-3.5 py-3 transition-all duration-300 hover:shadow-md flex flex-col justify-between',
        tone === 'primary'
          ? 'border-primary/25 bg-primary/8 shadow-[0_0_15px_-3px_rgba(138,247,211,0.12)] hover:border-primary/40'
          : 'border-white/8 bg-white/4 hover:border-white/15'
      )}
    >
      <div>
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <span className="text-[10px] sm:text-xs uppercase tracking-[0.12em] text-muted-foreground font-semibold font-sans">{label}</span>
          <Icon className={cn(tone === 'primary' ? 'text-primary' : 'text-muted-foreground')} size={16} />
        </div>
        <p className="metric-glow font-heading text-xl sm:text-2xl font-bold tracking-tight">{value}</p>
      </div>
      {description && (
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground/85 font-sans">
          {description}
        </p>
      )}
    </div>
  )
}
