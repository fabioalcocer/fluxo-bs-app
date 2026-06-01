'use client'

import {
  ArrowArcLeftIcon,
  ArrowFatLineDownIcon,
  ArrowFatLineUpIcon,
  ArrowsLeftRightIcon,
  ChartPieSliceIcon,
  CalendarDotsIcon,
  ChartLineUpIcon,
  CoinIcon,
  GaugeIcon,
  MoonIcon,
  PlusIcon,
  SparkleIcon,
  SunIcon,
  TrendDownIcon,
  TrendUpIcon,
  WalletIcon,
} from '@phosphor-icons/react'
import { motion } from 'motion/react'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useLocalStorageState } from '@/hooks/use-local-storage'
import {
  STORAGE_KEY,
  calculateFxDifference,
  calculateSpendingSummary,
  createInitialFinanceState,
  getMonthState,
  sanitizeMonthState,
} from '@/lib/finance'
import { formatBs, formatCompactBs, formatNumber, formatPercent } from '@/lib/format'
import { buildIsoDate, getMonthLabel, shiftMonthKey } from '@/lib/date'
import type {
  FinanceAppState,
  MonthBudgetState,
  PlanningMode,
  SpendingEntryKind,
} from '@/types/finance'
import { cn } from '@/lib/utils'

function reviveFinanceState(value: unknown, initialMonthKey: string): FinanceAppState {
  const initialState = createInitialFinanceState(initialMonthKey)

  if (!value || typeof value !== 'object') {
    return initialState
  }

  const candidate = value as Partial<FinanceAppState>
  const months = Object.fromEntries(
    Object.entries(candidate.months ?? {}).map(([key, monthState]) => [
      key,
      sanitizeMonthState(monthState as MonthBudgetState),
    ])
  )

  return {
    selectedMonth:
      typeof candidate.selectedMonth === 'string'
        ? candidate.selectedMonth
        : initialState.selectedMonth,
    months,
    fxCalculator: {
      amountUsdc: Number(candidate.fxCalculator?.amountUsdc ?? 100),
      currentRate: Number(candidate.fxCalculator?.currentRate ?? 9.89),
      referenceRate: Number(candidate.fxCalculator?.referenceRate ?? 9.97),
    },
  }
}

function createEntryId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function resolveEntryDate(monthKey: string, date: string, referenceMonthKey: string, referenceDateIso: string) {
  if (date.startsWith(monthKey)) {
    return date
  }

  return monthKey === referenceMonthKey ? referenceDateIso : buildIsoDate(monthKey, 1)
}

function toPositiveNumber(value: string) {
  const normalized = value.replace(',', '.')
  const parsedValue = Number(normalized)
  return Number.isFinite(parsedValue) && parsedValue >= 0 ? parsedValue : 0
}

const heroVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: 'easeOut' },
  },
} as const

export function FinanceDashboard({
  initialMonthKey,
  referenceDateIso,
}: {
  initialMonthKey: string
  referenceDateIso: string
}) {
  const referenceDate = useMemo(() => new Date(`${referenceDateIso}T12:00:00`), [referenceDateIso])
  const [state, setState, hydrated] = useLocalStorageState(
    STORAGE_KEY,
    createInitialFinanceState(initialMonthKey),
    (value) => reviveFinanceState(value, initialMonthKey)
  )
  const [entryDraft, setEntryDraft] = useState({
    amountBs: '',
    date: referenceDateIso,
    note: '',
  })
  const [themeMounted, setThemeMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    setThemeMounted(true)
  }, [])

  const selectedMonthState = getMonthState(state.months, state.selectedMonth)
  const spendingSummary = useMemo(
    () => calculateSpendingSummary(state.selectedMonth, selectedMonthState, referenceDate),
    [referenceDate, selectedMonthState, state.selectedMonth]
  )
  const fxSummary = useMemo(
    () => calculateFxDifference(state.fxCalculator),
    [state.fxCalculator]
  )
  const entryDateValue = resolveEntryDate(
    state.selectedMonth,
    entryDraft.date,
    initialMonthKey,
    referenceDateIso
  )

  const latestEntries = [...selectedMonthState.entries]
    .sort((left, right) => right.date.localeCompare(left.date))
    .slice(0, 6)

  function updateMonthState(updater: (month: MonthBudgetState) => MonthBudgetState) {
    setState((currentState) => {
      const monthState = getMonthState(currentState.months, currentState.selectedMonth)

      return {
        ...currentState,
        months: {
          ...currentState.months,
          [currentState.selectedMonth]: updater(monthState),
        },
      }
    })
  }

  function updatePlanningMode(mode: PlanningMode) {
    updateMonthState((monthState) => ({
      ...monthState,
      mode,
    }))
  }

  function addEntry(kind: SpendingEntryKind) {
    if (!entryDraft.amountBs) {
      return
    }

    const amountBs = toPositiveNumber(entryDraft.amountBs)

    if (amountBs <= 0) {
      return
    }

    updateMonthState((monthState) => ({
      ...monthState,
      entries: [
        {
          id: createEntryId(),
          kind,
          date: entryDateValue,
          amountBs,
          note: entryDraft.note.trim() || undefined,
        },
        ...monthState.entries,
      ],
    }))

    setEntryDraft((currentDraft) => ({
      ...currentDraft,
      amountBs: '',
      note: '',
    }))
  }

  return (
    <div className="relative min-h-svh overflow-x-hidden px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:gap-5">
        <motion.section
          animate="visible"
          className="glass-panel surface-outline relative overflow-hidden rounded-2xl border border-white/10 px-4 py-4 sm:px-6 sm:py-5"
          initial={false}
          variants={heroVariants}
        >
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top,#77b8ff24,transparent_50%)] blur-2xl" />
          <div className="relative grid gap-4 lg:grid-cols-[1.4fr_0.9fr] lg:items-start">
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-primary/80">
                <span className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/8 px-2.5 py-1 text-[0.68rem] font-semibold text-primary">
                  <SparkleIcon size={14} weight="fill" />
                  Fluxo Bs
                </span>
                <span className="text-muted-foreground">Dashboard financiero local</span>
              </div>
              <div className="grid gap-2">
                <h1>Tu mes, en numeros claros.</h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Presupuesto, ritmo diario, semanas y tipo de cambio en una sola vista. Registra gastos y el resto se recalcula al instante.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <MetricHighlight
                  icon={WalletIcon}
                  label="Disponible actual"
                  tone="primary"
                  value={formatCompactBs(spendingSummary.remainingBudget)}
                />
                <MetricHighlight
                  icon={CalendarDotsIcon}
                  label="Ritmo diario"
                  tone="neutral"
                  value={formatCompactBs(spendingSummary.dailyAllowance)}
                />
                <MetricHighlight
                  icon={ChartLineUpIcon}
                  label="Ritmo semanal"
                  tone="neutral"
                  value={formatCompactBs(spendingSummary.weeklyAllowance)}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <MonthNavigator
                hydrated={hydrated}
                monthLabel={getMonthLabel(state.selectedMonth)}
                onNext={() =>
                  setState((currentState) => ({
                    ...currentState,
                    selectedMonth: shiftMonthKey(currentState.selectedMonth, 1),
                  }))
                }
                onPrevious={() =>
                  setState((currentState) => ({
                    ...currentState,
                    selectedMonth: shiftMonthKey(currentState.selectedMonth, -1),
                  }))
                }
              />
              <QuickSettings
                mode={selectedMonthState.mode}
                onBudgetChange={(value) =>
                  updateMonthState((monthState) => ({
                    ...monthState,
                    totalBudgetBs: toPositiveNumber(value),
                  }))
                }
                onModeChange={updatePlanningMode}
                selectedBudget={selectedMonthState.totalBudgetBs}
                theme={themeMounted ? resolvedTheme : undefined}
                toggleTheme={() =>
                  setTheme(resolvedTheme === 'light' ? 'dark' : 'light')
                }
              />
            </div>
          </div>
        </motion.section>

        <section className="group/tabs grid gap-4">
          <input
            className="sr-only"
            defaultChecked
            id="tab-spending"
            name="dashboard-tab"
            type="radio"
          />
          <input
            className="sr-only"
            id="tab-exchange"
            name="dashboard-tab"
            type="radio"
          />
          <input
            className="sr-only"
            id="tab-categories"
            name="dashboard-tab"
            type="radio"
          />
          <div className="glass-panel surface-outline rounded-2xl border border-white/10 bg-card/80 p-2">
            <div className="grid gap-2 sm:grid-cols-3">
              <TabLabel
                activeClassName="group-has-[#tab-spending:checked]/tabs:border-primary/30 group-has-[#tab-spending:checked]/tabs:bg-primary group-has-[#tab-spending:checked]/tabs:text-primary-foreground group-has-[#tab-spending:checked]/tabs:shadow-xs"
                htmlFor="tab-spending"
                icon={<GaugeIcon />}
                label="Gastos"
              />
              <TabLabel
                activeClassName="group-has-[#tab-exchange:checked]/tabs:border-primary/30 group-has-[#tab-exchange:checked]/tabs:bg-primary group-has-[#tab-exchange:checked]/tabs:text-primary-foreground group-has-[#tab-exchange:checked]/tabs:shadow-xs"
                htmlFor="tab-exchange"
                icon={<ArrowsLeftRightIcon />}
                label="Cambio"
              />
              <TabLabel
                activeClassName="group-has-[#tab-categories:checked]/tabs:border-primary/30 group-has-[#tab-categories:checked]/tabs:bg-primary group-has-[#tab-categories:checked]/tabs:text-primary-foreground group-has-[#tab-categories:checked]/tabs:shadow-xs"
                htmlFor="tab-categories"
                icon={<ChartPieSliceIcon />}
                label="Categorias"
              />
            </div>
          </div>

          <div className="hidden group-has-[#tab-spending:checked]/tabs:block">
            <Card className="glass-panel surface-outline rounded-2xl border-white/10 bg-card/80">
              <CardHeader className="gap-2 px-4 pt-4 sm:px-5 sm:pt-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-lg">Control mensual</CardTitle>
                    <CardDescription className="max-w-2xl leading-5">
                      Usa modo {spendingSummary.effectiveMode === 'remaining-month' ? 'desde hoy hasta fin de mes' : 'mes completo'} para decidir el ritmo.
                    </CardDescription>
                  </div>
                  {spendingSummary.usesModeFallback && (
                    <div className="rounded-md border border-chart-4/30 bg-chart-4/10 px-2.5 py-1 text-xs text-chart-4">
                      Modo mes completo aplicado
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="grid gap-4 px-4 pb-4 sm:px-5 sm:pb-5">
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    label="Te queda"
                    value={formatBs(spendingSummary.remainingBudget)}
                    hint={`Gastaste ${formatBs(spendingSummary.totalSpent)}`}
                    tone={spendingSummary.remainingBudget >= 0 ? 'primary' : 'danger'}
                  />
                  <StatCard
                    label="Por dia"
                    value={formatBs(spendingSummary.dailyAllowance)}
                    hint={`${spendingSummary.activeDaysCount} dias activos`}
                  />
                  <StatCard
                    label="Por semana"
                    value={formatBs(spendingSummary.weeklyAllowance)}
                    hint={`${spendingSummary.activeWeeksCount} semanas activas`}
                  />
                  <StatCard
                    label="Presupuesto"
                    value={formatBs(spendingSummary.totalBudgetBs)}
                    hint={`${spendingSummary.totalWeeksInMonth} semanas en el mes`}
                  />
                </div>

                <div className="grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
                  <div className="rounded-2xl border border-white/8 bg-background/35 p-3.5 sm:p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base">Pulso semanal</h3>
                        <p className="text-sm leading-5 text-muted-foreground">
                          Cada barra compara gasto real vs plan base del mes.
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
                            : Math.min((week.spent / week.planned) * 100, 100)
                        const isOver = week.deviation > 0

                        return (
                          <div
                            className="rounded-xl border border-white/7 bg-white/3 p-3"
                            key={week.range.label}
                          >
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <div>
                                <p className="font-medium text-sm text-foreground">
                                  {week.range.label}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Dias {week.range.startDay} - {week.range.endDay}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-sm">{formatBs(week.spent)}</p>
                                <p
                                  className={cn(
                                    'text-xs',
                                    isOver ? 'text-destructive' : 'text-primary'
                                  )}
                                >
                                  {isOver ? '+' : ''}
                                  {formatBs(week.deviation)}
                                </p>
                              </div>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/8">
                              <div
                                className={cn(
                                  'h-full rounded-full transition-all',
                                  isOver ? 'bg-destructive' : 'bg-primary'
                                )}
                                style={{ width: `${ratio}%` }}
                              />
                            </div>
                            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>Plan {formatBs(week.planned)}</span>
                              <span>{week.isActive ? 'Activo' : 'Cerrado'}</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  <div className="grid gap-4 rounded-2xl border border-white/8 bg-background/35 p-3.5 sm:p-4">
                    <div>
                      <h3 className="text-base">Registrar gasto</h3>
                      <p className="text-sm leading-5 text-muted-foreground">
                        Carga un gasto y actualiza el ritmo del mes.
                      </p>
                    </div>
                    <div className="grid gap-3">
                      <div className="grid gap-2">
                        <Label htmlFor="entry-amount">Monto en Bs</Label>
                        <Input
                          id="entry-amount"
                          inputMode="decimal"
                          onChange={(event) =>
                            setEntryDraft((currentDraft) => ({
                              ...currentDraft,
                              amountBs: event.target.value,
                            }))
                          }
                          placeholder="550"
                          value={entryDraft.amountBs}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="entry-date">Fecha de referencia</Label>
                        <Input
                          id="entry-date"
                          max={buildIsoDate(state.selectedMonth, spendingSummary.totalDaysInMonth)}
                          min={buildIsoDate(state.selectedMonth, 1)}
                          onChange={(event) =>
                            setEntryDraft((currentDraft) => ({
                              ...currentDraft,
                              date: event.target.value,
                            }))
                          }
                          type="date"
                          value={entryDateValue}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="entry-note">Nota opcional</Label>
                        <Input
                          id="entry-note"
                          onChange={(event) =>
                            setEntryDraft((currentDraft) => ({
                              ...currentDraft,
                              note: event.target.value,
                            }))
                          }
                          placeholder="Mercado, delivery, etc."
                          value={entryDraft.note}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2 min-[420px]:grid-cols-2">
                      <Button className="min-w-0" onClick={() => addEntry('daily')} variant="apb-soft">
                        <PlusIcon />
                        Diario
                      </Button>
                      <Button className="min-w-0" onClick={() => addEntry('weekly')} variant="apb-primary">
                        <ArrowFatLineUpIcon />
                        Semanal
                      </Button>
                    </div>
                    <Separator className="bg-white/8" />
                    <div className="grid gap-3">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">Ultimos registros</p>
                        <span className="text-xs text-muted-foreground">
                          {selectedMonthState.entries.length} en este mes
                        </span>
                      </div>
                      <div className="grid gap-2">
                        {latestEntries.length > 0 ? (
                          latestEntries.map((entry) => (
                            <div
                              className="flex items-center justify-between gap-3 rounded-xl border border-white/7 bg-white/3 px-3 py-2"
                              key={entry.id}
                            >
                              <div>
                                <p className="font-medium text-sm">
                                  {entry.kind === 'daily' ? 'Gasto diario' : 'Gasto semanal'}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {entry.date} {entry.note ? `- ${entry.note}` : ''}
                                </p>
                              </div>
                              <span className="font-mono text-sm text-foreground">
                                {formatBs(entry.amountBs)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-xl border border-dashed border-white/10 px-3 py-4 text-sm leading-5 text-muted-foreground">
                            Aun no registraste gastos para este mes.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="hidden group-has-[#tab-exchange:checked]/tabs:block">
            <Card className="glass-panel surface-outline rounded-2xl border-white/10 bg-card/80">
              <CardHeader className="px-4 pt-4 sm:px-5 sm:pt-5">
                <CardTitle className="text-lg">Calculadora de cambio</CardTitle>
                <CardDescription className="leading-5">
                  Compara cuanto ganas o pierdes en Bs segun el tipo de cambio usado.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 px-4 pb-4 sm:px-5 sm:pb-5">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="grid gap-2">
                    <Label htmlFor="fx-amount">Monto en USDC</Label>
                    <Input
                      id="fx-amount"
                      inputMode="decimal"
                      onChange={(event) =>
                        setState((currentState) => ({
                          ...currentState,
                          fxCalculator: {
                            ...currentState.fxCalculator,
                            amountUsdc: toPositiveNumber(event.target.value),
                          },
                        }))
                      }
                      value={state.fxCalculator.amountUsdc || ''}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fx-current">Cambio usado</Label>
                    <Input
                      id="fx-current"
                      inputMode="decimal"
                      onChange={(event) =>
                        setState((currentState) => ({
                          ...currentState,
                          fxCalculator: {
                            ...currentState.fxCalculator,
                            currentRate: toPositiveNumber(event.target.value),
                          },
                        }))
                      }
                      value={state.fxCalculator.currentRate || ''}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="fx-reference">Cambio referencia</Label>
                    <Input
                      id="fx-reference"
                      inputMode="decimal"
                      onChange={(event) =>
                        setState((currentState) => ({
                          ...currentState,
                          fxCalculator: {
                            ...currentState.fxCalculator,
                            referenceRate: toPositiveNumber(event.target.value),
                          },
                        }))
                      }
                      value={state.fxCalculator.referenceRate || ''}
                    />
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <StatCard
                    icon={<CoinIcon size={18} />}
                    label="Recibes al cambio usado"
                    value={formatBs(fxSummary.usedBs)}
                    hint={`a ${formatNumber(state.fxCalculator.currentRate, 2)} Bs`}
                  />
                  <StatCard
                    icon={<ArrowsLeftRightIcon size={18} />}
                    label="Recibes al cambio referencia"
                    value={formatBs(fxSummary.referenceBs)}
                    hint={`a ${formatNumber(state.fxCalculator.referenceRate, 2)} Bs`}
                  />
                  <StatCard
                    icon={
                      fxSummary.differenceBs >= 0 ? (
                        <TrendDownIcon size={18} />
                      ) : (
                        <TrendUpIcon size={18} />
                      )
                    }
                    label={fxSummary.differenceBs >= 0 ? 'Diferencia que dejas pasar' : 'Mejora vs referencia'}
                    tone={fxSummary.differenceBs >= 0 ? 'danger' : 'primary'}
                    value={formatBs(Math.abs(fxSummary.differenceBs))}
                    hint={`${formatPercent(Math.abs(fxSummary.differenceRatio))} del valor referencia`}
                  />
                  <div className="rounded-2xl border border-white/8 bg-background/35 p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                      Lectura rapida
                    </p>
                    <p className="mt-3 font-heading text-xl leading-tight sm:text-2xl">
                      {fxSummary.differenceBs >= 0
                        ? `Si cambias hoy, estas dejando ${formatCompactBs(fxSummary.differenceBs)} sobre la mesa.`
                        : `El cambio actual te favorece por ${formatCompactBs(Math.abs(fxSummary.differenceBs))}.`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="hidden group-has-[#tab-categories:checked]/tabs:block">
          <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
            <Card className="glass-panel surface-outline rounded-2xl border-white/10 bg-card/80">
              <CardHeader className="px-4 pt-4 sm:px-5 sm:pt-5">
                <CardTitle className="text-lg">Presupuestos por categoria</CardTitle>
                <CardDescription className="leading-5">
                  Pendiente para la siguiente fase. La estructura de la app ya esta lista para escalarlo.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 px-4 pb-4 sm:px-5 sm:pb-5">
                <div className="rounded-2xl border border-dashed border-primary/25 bg-primary/8 p-4">
                  <p className="text-xs uppercase tracking-[0.14em] text-primary">Proxima fase</p>
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">
                    Luego podras definir topes por categoria y comparar gasto real vs objetivo mensual.
                  </p>
                </div>
                <div className="grid gap-2">
                  {['Comida', 'Transporte', 'Hogar', 'Salud', 'Ahorro'].map((category) => (
                    <div
                      className="flex items-center justify-between rounded-xl border border-white/7 bg-white/3 px-3 py-2.5"
                      key={category}
                    >
                      <span className="font-medium text-sm">{category}</span>
                      <span className="text-xs text-muted-foreground">Proximamente</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="glass-panel surface-outline rounded-2xl border-white/10 bg-card/80">
              <CardHeader className="px-4 pt-4 sm:px-5 sm:pt-5">
                <CardTitle className="text-lg">Resumen activo</CardTitle>
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
                  value={getMonthLabel(state.selectedMonth)}
                />
                <InsightRow
                  icon={<WalletIcon size={18} />}
                  label="Registros cargados"
                  value={String(selectedMonthState.entries.length)}
                />
              </CardContent>
            </Card>
          </div>
          </div>
        </section>
      </div>
    </div>
  )
}

function TabLabel({
  activeClassName,
  htmlFor,
  icon,
  label,
}: {
  activeClassName: string
  htmlFor: string
  icon: ReactNode
  label: string
}) {
  return (
    <label
      className={cn(
        'flex h-11 items-center justify-center gap-2 rounded-xl border border-transparent px-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground',
        activeClassName
      )}
      htmlFor={htmlFor}
    >
      <span className="text-base leading-none">{icon}</span>
      {label}
    </label>
  )
}

function MonthNavigator({
  monthLabel,
  onNext,
  onPrevious,
  hydrated,
}: {
  monthLabel: string
  onNext: () => void
  onPrevious: () => void
  hydrated: boolean
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-background/35 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Mes activo</p>
          <p className="mt-1 font-heading text-xl capitalize">{hydrated ? monthLabel : 'Cargando...'}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={onPrevious} size="icon-sm" variant="apb-soft">
            <ArrowArcLeftIcon />
          </Button>
          <Button onClick={onNext} size="icon-sm" variant="apb-soft">
            <ArrowArcLeftIcon className="rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function QuickSettings({
  selectedBudget,
  onBudgetChange,
  mode,
  onModeChange,
  theme,
  toggleTheme,
}: {
  selectedBudget: number
  onBudgetChange: (value: string) => void
  mode: PlanningMode
  onModeChange: (mode: PlanningMode) => void
  theme?: string
  toggleTheme: () => void
}) {
  return (
    <div className="rounded-2xl border border-white/8 bg-background/35 p-4">
      <div className="grid gap-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">Tema</p>
            <p className="text-sm font-medium text-foreground">Modo {theme === 'light' ? 'claro' : 'oscuro'}</p>
          </div>
          <Button onClick={toggleTheme} size="icon-sm" variant="apb-soft">
            {theme === 'light' ? <MoonIcon /> : <SunIcon />}
          </Button>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="budget-month">Presupuesto del mes en Bs</Label>
          <Input
            id="budget-month"
            inputMode="decimal"
            onChange={(event) => onBudgetChange(event.target.value)}
            placeholder="1600"
            value={selectedBudget || ''}
          />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5">
          <div>
            <p className="font-medium text-sm">Desde hoy hasta fin de mes</p>
            <p className="text-xs leading-4 text-muted-foreground">
              Aplica solo para el mes actual.
            </p>
          </div>
          <Switch
            checked={mode === 'remaining-month'}
            onCheckedChange={(checked) =>
              onModeChange(checked ? 'remaining-month' : 'full-month')
            }
          />
        </div>
      </div>
    </div>
  )
}

function MetricHighlight({
  icon: Icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon: typeof WalletIcon
  label: string
  value: string
  tone?: 'primary' | 'neutral'
}) {
  return (
    <div
      className={cn(
        'rounded-xl border px-3.5 py-3',
        tone === 'primary'
          ? 'border-primary/20 bg-primary/8'
          : 'border-white/8 bg-white/4'
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
        <Icon className={cn(tone === 'primary' ? 'text-primary' : 'text-muted-foreground')} size={16} />
      </div>
      <p className="metric-glow font-heading text-xl sm:text-2xl">{value}</p>
    </div>
  )
}

function StatCard({
  label,
  value,
  hint,
  tone = 'neutral',
  icon,
}: {
  label: string
  value: string
  hint: string
  tone?: 'neutral' | 'primary' | 'danger'
  icon?: ReactNode
}) {
  return (
    <div
      className={cn(
        'rounded-xl border p-3.5',
        tone === 'primary' && 'border-primary/20 bg-primary/8',
        tone === 'danger' && 'border-destructive/20 bg-destructive/8',
        tone === 'neutral' && 'border-white/8 bg-background/40'
      )}
    >
      <div className="mb-3 flex items-center justify-between gap-2 text-muted-foreground">
        <span className="text-xs uppercase tracking-[0.12em]">{label}</span>
        {icon}
      </div>
      <p className="font-heading text-xl leading-tight sm:text-2xl">{value}</p>
      <p className="mt-1.5 text-sm leading-5 text-muted-foreground">{hint}</p>
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
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-background/35 px-3 py-2.5">
      <div className="flex items-center gap-3">
        <div className="rounded-lg border border-white/8 bg-white/5 p-2 text-primary">{icon}</div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <span className="font-medium text-sm text-foreground">{value}</span>
    </div>
  )
}
