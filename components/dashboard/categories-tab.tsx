'use client'

import { useMemo, useState, useEffect, type ReactNode } from 'react'
import { ArrowArcLeftIcon, ArrowFatLineDownIcon, CalendarDotsIcon, WalletIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DEFAULT_CATEGORIES } from '@/lib/finance'
import { formatBs } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { MonthBudgetState, SpendingSummary } from '@/types/finance'

interface CategoriesTabProps {
  spendingSummary: SpendingSummary
  selectedMonthState: MonthBudgetState
  monthLabel: string
  onBudgetChange: (category: string, amount: number) => void
  onDistributeEquitably: () => void
}

function getProgressColors(ratio: number) {
  if (ratio >= 100) {
    return {
      text: 'text-destructive',
      bg: 'bg-destructive',
    }
  } else if (ratio >= 75) {
    return {
      text: 'text-chart-4',
      bg: 'bg-chart-4',
    }
  } else {
    return {
      text: 'text-primary',
      bg: 'bg-primary',
    }
  }
}

export function CategoriesTab({
  spendingSummary,
  selectedMonthState,
  monthLabel,
  onBudgetChange,
  onDistributeEquitably,
}: CategoriesTabProps) {
  const [drafts, setDrafts] = useState<Record<string, string>>(() => {
    const initialDrafts: Record<string, string> = {}
    for (const cat of DEFAULT_CATEGORIES) {
      const val = selectedMonthState.categoryBudgets?.[cat] ?? 0
      initialDrafts[cat] = val ? String(val) : ''
    }
    return initialDrafts
  })

  // Sync draft states with external changes
  useEffect(() => {
    setDrafts((prev) => {
      const nextDrafts = { ...prev }
      let changed = false
      for (const cat of DEFAULT_CATEGORIES) {
        const val = selectedMonthState.categoryBudgets?.[cat] ?? 0
        const normalized = (prev[cat] ?? '').replace(',', '.')
        const parsed = Number(normalized)
        const currentDraftVal = Number.isFinite(parsed) ? parsed : 0
        if (currentDraftVal !== val) {
          nextDrafts[cat] = val ? String(val) : ''
          changed = true
        }
      }
      return changed ? nextDrafts : prev
    })
  }, [selectedMonthState.categoryBudgets])
  
  // Calculate consumption spent per category in this month
  const categorySpentMap = useMemo(() => {
    const spentMap: Record<string, number> = {}
    for (const cat of DEFAULT_CATEGORIES) {
      spentMap[cat] = 0
    }
    for (const entry of selectedMonthState.entries) {
      if (entry.category && DEFAULT_CATEGORIES.includes(entry.category)) {
        spentMap[entry.category] = (spentMap[entry.category] || 0) + entry.amountBs
      }
    }
    return spentMap
  }, [selectedMonthState.entries])

  // Calculate sum of currently assigned budgets
  const assignedSum = useMemo(() => {
    return DEFAULT_CATEGORIES.reduce((sum, c) => sum + (selectedMonthState.categoryBudgets?.[c] || 0), 0)
  }, [selectedMonthState.categoryBudgets])

  // Calculate remaining budget available to assign
  const unassignedBudget = useMemo(() => {
    return Math.max(0, spendingSummary.totalBudgetBs - assignedSum)
  }, [spendingSummary.totalBudgetBs, assignedSum])

  const handleBudgetChange = (cat: string, newLimit: number) => {
    const totalBudget = spendingSummary.totalBudgetBs
    const otherSum = DEFAULT_CATEGORIES
      .filter((c) => c !== cat)
      .reduce((sum, c) => sum + (selectedMonthState.categoryBudgets?.[c] || 0), 0)
      
    const maxAllowed = Math.max(0, totalBudget - otherSum)
    const cappedLimit = Number(Math.min(newLimit, maxAllowed).toFixed(2))
    
    onBudgetChange(cat, cappedLimit)
  }

  const handleInputChange = (cat: string, valStr: string) => {
    if (valStr === '' || /^[0-9]*[.,]?[0-9]*$/.test(valStr)) {
      setDrafts((prev) => ({ ...prev, [cat]: valStr }))
      const normalized = valStr.replace(',', '.')
      const parsed = Number(normalized)
      const newLimit = Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
      handleBudgetChange(cat, newLimit)
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[1.08fr_0.92fr]">
      {/* Presupuesto de Categorías */}
      <Card className="glass-panel surface-outline rounded-2xl border-white/10 bg-card/80 transition-all duration-300 hover:border-white/15">
        <CardHeader className="px-4 sm:px-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="text-lg font-bold text-foreground">Presupuestos por categoría</CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Define límites de gasto mensuales. El total no puede superar el presupuesto mensual.
              </p>
            </div>
            
            {spendingSummary.totalBudgetBs > 0 && (
              <Button
                variant="apb-soft"
                size="sm"
                onClick={onDistributeEquitably}
                className="hover:scale-[1.02] active:scale-[0.98] transition-transform w-fit self-start sm:self-center"
              >
                Distribuir equitativamente
              </Button>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-white/8 bg-white/3 px-3 py-2 text-xs">
            <div>
              <span className="text-muted-foreground font-semibold">Total mensual:</span>{' '}
              <span className="font-bold text-foreground font-mono">{formatBs(spendingSummary.totalBudgetBs)}</span>
            </div>
            <div className="h-3 w-px bg-white/10 hidden sm:block" />
            <div>
              <span className="text-muted-foreground font-semibold">Asignado:</span>{' '}
              <span className="font-bold text-foreground font-mono">{formatBs(assignedSum)}</span>
            </div>
            <div className="h-3 w-px bg-white/10 hidden sm:block" />
            <div>
              <span className="text-muted-foreground font-semibold">Disponible para asignar:</span>{' '}
              <span className={cn("font-bold font-mono", unassignedBudget > 0 ? "text-primary" : "text-muted-foreground")}>
                {formatBs(unassignedBudget)}
              </span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="grid gap-2.5 px-4 pb-4 sm:px-5 sm:pb-5">
          {DEFAULT_CATEGORIES.map((cat) => {
            const limit = selectedMonthState.categoryBudgets?.[cat] ?? 0
            const spent = categorySpentMap[cat] ?? 0
            const ratio = limit <= 0 ? 0 : (spent / limit) * 100
            const colors = getProgressColors(ratio)

            return (
              <div
                key={cat}
                className="rounded-xl border border-white/7 bg-white/3 p-3 transition-colors hover:bg-white/5 flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-sm text-foreground">{cat}</span>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-semibold">Límite:</span>
                    <div className="relative flex items-center">
                      <span className="absolute left-2.5 text-[10px] text-muted-foreground font-mono">Bs</span>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="w-24 bg-background/50 border border-white/8 rounded-md py-1 pl-7 pr-2 text-xs text-foreground text-right font-mono focus:outline-none focus:border-primary/45 focus:ring-1 focus:ring-primary/20 transition-all"
                        value={drafts[cat] ?? ''}
                        onChange={(e) => handleInputChange(cat, e.target.value)}
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs mt-0.5">
                  <span className="text-muted-foreground font-semibold">
                    Gastado: <span className="font-bold text-foreground font-mono">{formatBs(spent)}</span>
                  </span>
                  <span className={cn('font-bold font-mono', colors.text)}>
                    {limit > 0 ? `${ratio.toFixed(0)}%` : 'Sin límite'}
                  </span>
                </div>

                {limit > 0 && (
                  <div className="h-1.5 overflow-hidden rounded-full bg-black/10 dark:bg-white/10 mt-0.5">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', colors.bg)}
                      style={{ width: `${Math.min(ratio, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Resumen Activo */}
      <Card className="glass-panel surface-outline rounded-2xl border-white/10 bg-card/80 transition-all duration-300 hover:border-white/15">
        <CardHeader className="px-4 sm:px-5">
          <CardTitle className="text-lg font-bold text-foreground">Resumen activo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 px-4 pb-4 sm:px-5 sm:pb-5">
          <InsightRow
            icon={<ArrowFatLineDownIcon size={18} />}
            label="Saldo proyectado"
            value={formatBs(spendingSummary.projectedMonthEnd)}
          />
          <InsightRow
            icon={<ArrowArcLeftIcon size={18} />}
            label="Modo efectivo"
            value={
              spendingSummary.effectiveMode === 'remaining-month'
                ? 'Desde hoy'
                : 'Mes completo'
            }
          />
          <InsightRow
            icon={<CalendarDotsIcon size={18} />}
            label="Mes abierto"
            value={monthLabel}
          />
          <InsightRow
            icon={<WalletIcon size={18} />}
            label="Registros cargados"
            value={String(selectedMonthState.entries.length)}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function InsightRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-background/35 px-3 py-2.5 transition-all duration-300 hover:bg-white/3">
      <div className="flex items-center gap-3">
        <div className="rounded-lg border border-white/8 bg-white/5 p-2 text-primary">{icon}</div>
        <span className="text-sm text-muted-foreground font-semibold font-sans">{label}</span>
      </div>
      <span className="font-bold text-sm text-foreground font-mono">{value}</span>
    </div>
  )
}
