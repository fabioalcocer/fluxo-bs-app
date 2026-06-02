'use client'

import { useMemo, useState, useEffect, type ReactNode } from 'react'
import { ArrowArcLeftIcon, ArrowFatLineDownIcon, CalendarDotsIcon, WalletIcon, TrashIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { DEFAULT_CATEGORIES } from '@/lib/finance'
import { formatBs } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { MonthBudgetState, SpendingEntry, SpendingSummary } from '@/types/finance'

interface CategoriesTabProps {
  spendingSummary: SpendingSummary
  selectedMonthState: MonthBudgetState
  monthLabel: string
  onBudgetChange: (category: string, amount: number) => void
  onDistributeEquitably: () => void
  onDeleteEntry?: (id: string) => void
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
  onDeleteEntry,
}: CategoriesTabProps) {
  const [previewEntry, setPreviewEntry] = useState<SpendingEntry | null>(null)
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
            const remaining = limit - spent
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
                  <span className="text-muted-foreground font-semibold flex flex-wrap items-center gap-x-2">
                    <span>
                      Gastado: <span className="font-bold text-foreground font-mono">{formatBs(spent)}</span>
                    </span>
                    {limit > 0 && (
                      <>
                        <span className="text-white/10">•</span>
                        <span>
                          Disponible:{' '}
                          <span className={cn('font-bold font-mono', remaining >= 0 ? 'text-primary' : 'text-destructive')}>
                            {formatBs(remaining)}
                          </span>
                        </span>
                      </>
                    )}
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

      {/* Resumen Activo y Tabla de Registros */}
      <div className="flex flex-col gap-4">
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

        {/* Historial de Registros */}
        <Card className="glass-panel surface-outline rounded-2xl border-white/10 bg-card/80 transition-all duration-300 hover:border-white/15">
          <CardHeader className="px-4 sm:px-5 pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-foreground">Todos los registros</CardTitle>
              <span className="text-xs text-muted-foreground font-mono">
                {selectedMonthState.entries.length} registros
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4 sm:px-5 sm:pb-5">
            <div className="max-h-[300px] overflow-y-auto pr-1">
              {selectedMonthState.entries.length > 0 ? (
                <div className="w-full overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-white/10 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <th className="pb-2.5 font-sans">Tipo/Categoría</th>
                        <th className="pb-2.5 font-sans">Detalle</th>
                        <th className="pb-2.5 text-right font-sans">Monto</th>
                        <th className="pb-2.5 text-right font-sans w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {[...selectedMonthState.entries]
                        .sort((left, right) => right.date.localeCompare(left.date))
                        .map((entry) => (
                          <tr
                            key={entry.id}
                            className="hover:bg-white/5 transition-colors cursor-pointer group"
                            onClick={() => setPreviewEntry(entry)}
                          >
                            <td className="py-2.5 pr-2">
                              <div className="flex flex-col gap-1">
                                <span className="text-xs font-semibold text-foreground">Gasto</span>
                                {entry.category ? (
                                  <span className="w-fit inline-flex items-center rounded-md bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[9px] font-semibold text-primary">
                                    {entry.category}
                                  </span>
                                ) : (
                                  <span className="w-fit inline-flex items-center rounded-md bg-white/5 border border-white/10 px-1.5 py-0.5 text-[9px] font-semibold text-muted-foreground">
                                    Sin categoría
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 pr-2 min-w-0">
                              <div className="flex flex-col">
                                <span className="text-xs font-semibold font-mono text-foreground">{entry.date}</span>
                                {entry.note && (
                                  <span className="text-[11px] text-muted-foreground truncate max-w-[120px] sm:max-w-[160px] group-hover:text-foreground/90 transition-colors" title={entry.note}>
                                    {entry.note}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 text-right font-semibold font-mono text-xs text-foreground">
                              {formatBs(entry.amountBs)}
                            </td>
                            <td className="py-2.5 text-right">
                              {onDeleteEntry && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    onDeleteEntry(entry.id)
                                  }}
                                  className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
                                  title="Eliminar gasto"
                                >
                                  <TrashIcon size={14} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-sm leading-5 text-muted-foreground text-center">
                  Aún no registraste gastos para este mes.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialogo de Vista Previa */}
      <Dialog open={!!previewEntry} onOpenChange={(open) => !open && setPreviewEntry(null)}>
        <DialogContent className="max-w-[360px] p-5 sm:max-w-[400px] border border-white/10 bg-card/95 backdrop-blur-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Detalle del Registro</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Información completa de la transacción cargada.
            </DialogDescription>
          </DialogHeader>
          
          {previewEntry && (
            <div className="grid gap-4 mt-3">
              <div className="grid grid-cols-2 gap-3 text-sm rounded-xl border border-white/8 bg-background/35 p-3.5">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Tipo</span>
                  <span className="font-semibold text-foreground">Gasto</span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Categoría</span>
                  <span className="font-semibold text-foreground">
                    {previewEntry.category || 'Sin categoría'}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5 mt-1">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Fecha</span>
                  <span className="font-semibold font-mono text-foreground">{previewEntry.date}</span>
                </div>
                <div className="flex flex-col gap-0.5 mt-1">
                  <span className="text-xs text-muted-foreground uppercase font-semibold">Monto</span>
                  <span className="font-bold font-mono text-primary">{formatBs(previewEntry.amountBs)}</span>
                </div>
              </div>
              
              <div className="flex flex-col gap-1 rounded-xl border border-white/8 bg-background/35 p-3.5">
                <span className="text-xs text-muted-foreground uppercase font-semibold">Nota / Descripción</span>
                <p className="text-sm text-foreground break-words leading-relaxed whitespace-pre-wrap">
                  {previewEntry.note || <span className="text-xs text-muted-foreground italic">Sin nota o descripción detallada</span>}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
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
