'use client'

import { CalendarDotsIcon } from '@phosphor-icons/react'

interface ActiveMonthCardProps {
  monthLabel: string
  hydrated: boolean
}

export function ActiveMonthCard({ monthLabel, hydrated }: ActiveMonthCardProps) {
  return (
    <div className="rounded-2xl border border-white/8 bg-background/35 p-4 transition-all duration-300 hover:border-white/15">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-semibold font-sans">Mes activo</p>
          <p className="mt-1 font-heading text-xl font-bold capitalize tracking-tight">
            {hydrated ? monthLabel : 'Cargando...'}
          </p>
        </div>
        <div className="rounded-xl border border-white/8 bg-white/4 p-2.5 text-primary shadow-[0_0_10px_-2px_rgba(138,247,211,0.1)]">
          <CalendarDotsIcon size={20} weight="duotone" />
        </div>
      </div>
    </div>
  )
}
