'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  hint: string
  tone?: 'neutral' | 'primary' | 'danger'
  icon?: ReactNode
}

export function StatCard({
  label,
  value,
  hint,
  tone = 'neutral',
  icon,
}: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3.5 transition-all duration-300 hover:shadow-xs',
        tone === 'primary' && 'border-primary/25 bg-primary/8 shadow-[0_0_10px_-3px_rgba(138,247,211,0.06)] hover:border-primary/35',
        tone === 'danger' && 'border-destructive/25 bg-destructive/8 shadow-[0_0_10px_-3px_rgba(255,107,143,0.06)] hover:border-destructive/35',
        tone === 'neutral' && 'border-white/8 bg-background/40 hover:border-white/15'
      )}
    >
      <div className="mb-2.5 flex items-center justify-between gap-2 text-muted-foreground">
        <span className="text-[10px] sm:text-xs uppercase tracking-[0.12em] font-semibold font-sans">{label}</span>
        {icon}
      </div>
      <p className="font-heading text-xl leading-tight sm:text-2xl font-bold tracking-tight">{value}</p>
      <p className="mt-1.5 text-xs sm:text-sm leading-5 text-muted-foreground">{hint}</p>
    </div>
  )
}
