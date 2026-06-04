'use client'

import { useState } from 'react'
import { PlusIcon, TrashIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { buildIsoDate } from '@/lib/date'
import { DEFAULT_CATEGORIES } from '@/lib/finance'
import { formatBs } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { MonthBudgetState, SpendingEntry, SpendingEntryKind, SpendingSummary } from '@/types/finance'

interface SpendingTabProps {
  spendingSummary: SpendingSummary
  selectedMonthState: MonthBudgetState
  latestEntries: SpendingEntry[]
  selectedMonth: string
  referenceDateIso: string
  onAddEntry: (kind: SpendingEntryKind, amountBs: number, date: string, category?: string, note?: string) => void
  onDeleteEntry: (id: string) => void
  onViewAll?: () => void
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

export function SpendingTab({
  spendingSummary,
  selectedMonthState,
  latestEntries,
  selectedMonth,
  referenceDateIso,
  onAddEntry,
  onDeleteEntry,
  onViewAll,
}: SpendingTabProps) {
  const [amountBs, setAmountBs] = useState('')
  const [date, setDate] = useState(referenceDateIso)
  const [category, setCategory] = useState('sin-categoria')
  const [note, setNote] = useState('')
  const [previewEntry, setPreviewEntry] = useState<SpendingEntry | null>(null)

  const totalSpent = spendingSummary.weekBreakdown.reduce((sum, w) => sum + w.spent, 0)
  const totalPlanned = spendingSummary.weekBreakdown.reduce((sum, w) => sum + w.planned, 0)
  const totalDeviation = totalSpent - totalPlanned
  const totalRatio = totalPlanned <= 0 ? 0 : (totalSpent / totalPlanned) * 100
  const totalColors = getProgressColors(totalRatio)

  const handleAddEntry = (kind: SpendingEntryKind) => {
    if (!amountBs) return
    const parsedAmount = Number(amountBs.replace(',', '.'))
    if (isNaN(parsedAmount) || parsedAmount <= 0) return

    let resolvedDate = date
    if (!date.startsWith(selectedMonth)) {
      resolvedDate = referenceDateIso
    }

    const resolvedCategory = category === 'sin-categoria' ? undefined : category

    onAddEntry(kind, parsedAmount, resolvedDate, resolvedCategory, note.trim() || undefined)
    setAmountBs('')
    setNote('')
    setCategory('sin-categoria')
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
      {/* Pulso Semanal */}
      <div className="rounded-2xl border border-white/8 bg-background/35 p-3.5 sm:p-4 transition-all duration-300 hover:border-white/15">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">Pulso semanal</h3>
            <p className="text-sm leading-5 text-muted-foreground">
              Cada barra compara gasto real vs presupuesto planeado de la semana.
            </p>
          </div>
          <span className="rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground">
            {spendingSummary.weekBreakdown.length} bloques
          </span>
        </div>
        <div className="grid gap-2.5">
          {spendingSummary.weekBreakdown.map((week) => {
            const ratio =
              week.planned <= 0
                ? 0
                : (week.spent / week.planned) * 100
            const colors = getProgressColors(ratio)
            const isOver = week.deviation > 0

            return (
              <div
                className="rounded-xl border border-white/7 bg-white/3 p-3 transition-colors hover:bg-white/5"
                key={week.range.label}
              >
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-foreground">
                      {week.range.label}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono">
                      Días {week.range.startDay} - {week.range.endDay}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-foreground">{formatBs(week.spent)}</p>
                    <p className={cn('text-xs font-semibold font-mono', colors.text)}>
                      {isOver ? '+' : ''}
                      {formatBs(week.deviation)}
                    </p>
                  </div>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                  <div
                    className={cn('h-full rounded-full transition-all duration-500', colors.bg)}
                    style={{ width: `${Math.min(ratio, 100)}%` }}
                  />
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <span className="font-mono">Planeado {formatBs(week.planned)}</span>
                  <span className="font-semibold">{week.isActive ? 'Activo' : 'Cerrado'}</span>
                </div>
              </div>
            )
          })}
        </div>
        {spendingSummary.weekBreakdown.length > 0 && (
          <>
            <Separator className="my-2 bg-white/8" />
            <div className="rounded-xl border border-white/7 bg-white/3 p-3 transition-colors hover:bg-white/5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Total Gastado ({spendingSummary.weekBreakdown.length} semanas)
                  </p>
                  <p className="text-xl font-extrabold text-foreground mt-0.5">
                    {formatBs(totalSpent)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                    Presupuesto Total
                  </p>
                  <div className="flex items-center justify-end gap-1.5 mt-0.5">
                    <span className="text-xs font-semibold text-foreground">
                      {formatBs(totalPlanned)}
                    </span>
                    <span className={cn("text-xs font-semibold font-mono", totalColors.text)}>
                      ({totalDeviation > 0 ? '+' : ''}{formatBs(totalDeviation)})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Registrar Gasto y Últimos Registros */}
      <div className="grid gap-4 rounded-2xl border border-white/8 bg-background/35 p-3.5 sm:p-4 transition-all duration-300 hover:border-white/15">
        <div>
          <h3 className="text-base font-semibold text-foreground">Registrar gasto</h3>
          <p className="text-sm leading-5 text-muted-foreground">
            Carga un gasto y actualiza el ritmo del mes.
          </p>
        </div>
        <div className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="entry-amount" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">
              Monto en Bs
            </Label>
            <Input
              id="entry-amount"
              inputMode="decimal"
              onChange={(e) => setAmountBs(e.target.value)}
              placeholder="550"
              value={amountBs}
              className="bg-white/3 border-white/8 focus:border-primary/40 focus:ring-primary/20 transition-all duration-300 font-mono"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="entry-date" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">
              Fecha de referencia
            </Label>
            <Input
              id="entry-date"
              max={buildIsoDate(selectedMonth, spendingSummary.totalDaysInMonth)}
              min={buildIsoDate(selectedMonth, 1)}
              onChange={(e) => setDate(e.target.value)}
              type="date"
              value={date}
              className="bg-white/3 border-white/8 focus:border-primary/40 focus:ring-primary/20 transition-all duration-300"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="entry-category" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">
              Categoría
            </Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="entry-category" className="w-full bg-white/3 border-white/8 focus:border-primary/40 focus:ring-primary/20 transition-all duration-300">
                <SelectValue placeholder="Selecciona una categoría" />
              </SelectTrigger>
              <SelectContent className="border border-white/10 bg-popover/90 backdrop-blur-md">
                <SelectItem value="sin-categoria">Sin categoría</SelectItem>
                {DEFAULT_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="entry-note" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">
              Nota opcional
            </Label>
            <Input
              id="entry-note"
              onChange={(e) => setNote(e.target.value)}
              placeholder="Mercado, delivery, etc."
              value={note}
              className="bg-white/3 border-white/8 focus:border-primary/40 focus:ring-primary/20 transition-all duration-300"
            />
          </div>
        </div>
        <Button
          className="w-full hover:scale-[1.02] active:scale-[0.98] transition-transform"
          onClick={() => handleAddEntry('daily')}
          variant="apb-primary"
        >
          <PlusIcon size={16} />
          Registrar Gasto
        </Button>


        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-sm text-foreground">Últimos registros</p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-mono">
                {selectedMonthState.entries.length} en este mes
              </span>
              {selectedMonthState.entries.length > 0 && onViewAll && (
                <>
                  <span className="text-muted-foreground/30">•</span>
                  <button
                    onClick={onViewAll}
                    className="text-xs text-primary hover:text-primary/80 transition-colors font-semibold cursor-pointer outline-none"
                  >
                    Ver todos
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="grid gap-2 max-h-[220px] overflow-y-auto pr-1">
            {latestEntries.length > 0 ? (
              latestEntries.map((entry) => (
                <div
                  className="flex items-center justify-between gap-3 rounded-xl border border-white/7 bg-white/3 px-3 py-2 transition-colors hover:bg-white/5 cursor-pointer group min-w-0"
                  key={entry.id}
                  onClick={() => setPreviewEntry(entry)}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-foreground flex flex-wrap items-center gap-2">
                      <span>Gasto</span>
                      {entry.category && (
                        <span className="inline-flex items-center rounded-md bg-primary/10 border border-primary/20 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                          {entry.category}
                        </span>
                      )}
                    </p>
                    <p 
                      className="text-xs text-muted-foreground font-mono truncate max-w-[170px] sm:max-w-[280px] md:max-w-[340px] lg:max-w-[180px] xl:max-w-[280px] group-hover:text-foreground/90 transition-colors"
                      title={entry.note ? `${entry.date} - ${entry.note}` : entry.date}
                    >
                      {entry.date} {entry.note ? `- ${entry.note}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-sm font-semibold text-foreground">
                      {formatBs(entry.amountBs)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteEntry(entry.id)
                      }}
                      className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
                      title="Eliminar gasto"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-sm leading-5 text-muted-foreground text-center">
                Aún no registraste gastos para este mes.
              </div>
            )}
          </div>
        </div>
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
