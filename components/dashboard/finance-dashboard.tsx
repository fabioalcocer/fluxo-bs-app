'use client'

import {
  ArrowsLeftRightIcon,
  CalendarDotsIcon,
  ChartLineUpIcon,
  ChartPieSliceIcon,
  GaugeIcon,
  SparkleIcon,
  WalletIcon,
  ArrowClockwiseIcon,
  CloudArrowUpIcon,
  DatabaseIcon,
  WarningCircleIcon,
} from '@phosphor-icons/react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { motion } from 'motion/react'
import { useTheme } from 'next-themes'
import { useEffect, useMemo, useState } from 'react'

import { saveFinanceState } from '@/app/actions'
import {
  STORAGE_KEY,
  calculateFxDifference,
  calculateSpendingSummary,
  createInitialFinanceState,
  getMonthState,
  sanitizeMonthState,
  DEFAULT_CATEGORIES,
} from '@/lib/finance'
import { formatCompactBs } from '@/lib/format'
import { getMonthLabel } from '@/lib/date'
import type {
  FinanceAppState,
  MonthBudgetState,
  PlanningMode,
  SpendingEntryKind,
} from '@/types/finance'
import { cn } from '@/lib/utils'

// Subcomponents
import { MetricHighlight } from './metric-highlight'
import { ActiveMonthCard } from './active-month-card'
import { QuickSettingsCard } from './quick-settings-card'
import { SpendingTab } from './spending-tab'
import { ExchangeTab } from './exchange-tab'
import { CategoriesTab } from './categories-tab'

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
    selectedMonth: initialMonthKey, // Enforce activeMonthKey is always initialMonthKey
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

import { DatabaseSyncCard } from './database-sync-card'

export function FinanceDashboard({
  initialMonthKey,
  referenceDateIso,
  initialDbState,
}: {
  initialMonthKey: string
  referenceDateIso: string
  initialDbState: FinanceAppState
}) {
  const referenceDate = useMemo(() => new Date(`${referenceDateIso}T12:00:00`), [referenceDateIso])
  
  // Month is pinned to the current reference month key
  const activeMonthKey = initialMonthKey

  const [state, setState] = useState<FinanceAppState>(initialDbState)
  const [isDirty, setIsDirty] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [hasLocalData, setHasLocalData] = useState(false)

  const [activeTab, setActiveTab] = useState<'spending' | 'exchange' | 'categories'>('spending')
  const [themeMounted, setThemeMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    setThemeMounted(true)

    // Check if there is data in localStorage to migrate
    try {
      const localData = window.localStorage.getItem(STORAGE_KEY)
      if (localData) {
        setHasLocalData(true)
      }
    } catch (e) {
      console.error('Error checking localStorage:', e)
    }
  }, [])

  // Warn on page close if dirty
  useEffect(() => {
    if (!isDirty) return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const selectedMonthState = getMonthState(state.months, activeMonthKey)

  const handleSave = async () => {
    setSaveStatus('saving')
    try {
      const res = await saveFinanceState(activeMonthKey, selectedMonthState)
      if (res.success) {
        setSaveStatus('saved')
        setIsDirty(false)
        setLastSaved(new Date())

        // Clear local storage after successful migration/save
        try {
          window.localStorage.removeItem(STORAGE_KEY)
          setHasLocalData(false)
        } catch (e) {
          console.error('Error clearing localStorage:', e)
        }
      } else {
        setSaveStatus('error')
      }
    } catch (error) {
      console.error('Error saving state:', error)
      setSaveStatus('error')
    }
  }

  const handleDiscard = () => {
    // Reset to server/initial DB state
    setState(initialDbState)
    setIsDirty(false)
    setSaveStatus('idle')
  }

  const handleMigrate = () => {
    try {
      const localData = window.localStorage.getItem(STORAGE_KEY)
      if (localData) {
        const parsed = JSON.parse(localData)
        const revived = reviveFinanceState(parsed, activeMonthKey)

        setState((currentState) => ({
          ...currentState,
          months: {
            ...currentState.months,
            ...revived.months,
          },
        }))
        setIsDirty(true)
        setSaveStatus('idle')
      }
    } catch (e) {
      console.error('Error migrating localStorage data:', e)
    }
  }
  
  const spendingSummary = useMemo(
    () => calculateSpendingSummary(activeMonthKey, selectedMonthState, referenceDate),
    [referenceDate, selectedMonthState, activeMonthKey]
  )
  
  const fxSummary = useMemo(
    () => calculateFxDifference(state.fxCalculator),
    [state.fxCalculator]
  )

  const latestEntries = useMemo(() => {
    return [...selectedMonthState.entries]
      .sort((left, right) => right.date.localeCompare(left.date))
      .slice(0, 2)
  }, [selectedMonthState.entries])

  function updateMonthState(updater: (month: MonthBudgetState) => MonthBudgetState) {
    setState((currentState) => {
      const monthState = getMonthState(currentState.months, activeMonthKey)

      return {
        ...currentState,
        months: {
          ...currentState.months,
          [activeMonthKey]: updater(monthState),
        },
      }
    })
    setIsDirty(true)
    setSaveStatus('idle')
  }

  function updatePlanningMode(mode: PlanningMode) {
    updateMonthState((monthState) => ({
      ...monthState,
      mode,
    }))
  }

  function addEntry(kind: SpendingEntryKind, amountBs: number, date: string, category?: string, note?: string) {
    updateMonthState((monthState) => ({
      ...monthState,
      entries: [
        {
          id: createEntryId(),
          kind,
          date,
          amountBs,
          category,
          note,
        },
        ...monthState.entries,
      ],
    }))
  }

  function deleteEntry(id: string) {
    updateMonthState((monthState) => ({
      ...monthState,
      entries: monthState.entries.filter((entry) => entry.id !== id),
    }))
  }

  function updateCategoryBudget(category: string, amount: number) {
    updateMonthState((monthState) => {
      const categoryBudgets = { ...(monthState.categoryBudgets || {}) }
      categoryBudgets[category] = amount
      return {
        ...monthState,
        categoryBudgets,
      }
    })
  }

  function distributeEquitably() {
    updateMonthState((monthState) => {
      const equalShare = Number((monthState.totalBudgetBs / DEFAULT_CATEGORIES.length).toFixed(2))
      const categoryBudgets: Record<string, number> = {}
      for (const cat of DEFAULT_CATEGORIES) {
        categoryBudgets[cat] = equalShare
      }
      return {
        ...monthState,
        categoryBudgets,
      }
    })
  }

  return (
    <div className="relative min-h-svh overflow-x-hidden px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 lg:gap-5">
        
        {/* Hero Section */}
        <motion.section
          animate="visible"
          className="glass-panel surface-outline relative overflow-hidden rounded-2xl border border-white/10 px-4 py-4 sm:px-6 sm:py-5"
          initial={false}
          variants={heroVariants}
        >
          <div className="absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top,#77b8ff24,transparent_50%)] blur-2xl pointer-events-none" />
          <div className="relative grid gap-4 lg:grid-cols-[1.4fr_0.9fr] lg:items-start">
            <div className="grid gap-4">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em] text-primary/80">
                <span className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/8 px-2.5 py-1 text-[0.68rem] font-semibold text-primary">
                  <SparkleIcon size={14} weight="fill" />
                  Fluxo Bs
                </span>
                <span className="text-muted-foreground font-mono">Dashboard financiero local</span>
              </div>
              <div className="grid gap-2">
                <h1 className="tracking-tight text-foreground font-extrabold">Tu mes, en números claros.</h1>
                <p className="max-w-2xl text-sm leading-6 mb-5 md:mb-10 text-muted-foreground sm:text-base">
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

            {/* Sidebar Controls */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <ActiveMonthCard
                hydrated={true}
                monthLabel={getMonthLabel(activeMonthKey)}
              />
              <QuickSettingsCard
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

        {/* Tab Selection Section */}
        <section className="grid gap-4">
          <div className="glass-panel surface-outline rounded-2xl border border-white/10 bg-card/80 p-2">
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                { id: 'spending', label: 'Gastos', icon: <GaugeIcon size={18} /> },
                { id: 'categories', label: 'Categorías', icon: <ChartPieSliceIcon size={18} /> },
                { id: 'exchange', label: 'Cambio', icon: <ArrowsLeftRightIcon size={18} /> },
              ].map((tab) => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={cn(
                      'relative flex h-11 items-center justify-center gap-2.5 rounded-xl px-3 text-sm font-semibold transition-colors duration-200 outline-none select-none cursor-pointer',
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
                    )}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="active-tab-indicator"
                        className="absolute inset-0 rounded-xl bg-primary border border-primary/30 shadow-xs"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10 text-base leading-none">{tab.icon}</span>
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Tab Content Area */}
          <div className="relative">
            {activeTab === 'spending' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <SpendingTab
                  spendingSummary={spendingSummary}
                  selectedMonthState={selectedMonthState}
                  latestEntries={latestEntries}
                  selectedMonth={activeMonthKey}
                  referenceDateIso={referenceDateIso}
                  onAddEntry={addEntry}
                  onDeleteEntry={deleteEntry}
                  onViewAll={() => setActiveTab('categories')}
                />
              </motion.div>
            )}

            {activeTab === 'categories' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <CategoriesTab
                  spendingSummary={spendingSummary}
                  selectedMonthState={selectedMonthState}
                  monthLabel={getMonthLabel(activeMonthKey)}
                  onBudgetChange={updateCategoryBudget}
                  onDistributeEquitably={distributeEquitably}
                  onDeleteEntry={deleteEntry}
                />
              </motion.div>
            )}

            {activeTab === 'exchange' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <ExchangeTab
                  fxCalculator={state.fxCalculator}
                  fxSummary={fxSummary}
                  onFxChange={(updater) =>
                    setState((currentState) => ({
                      ...currentState,
                      fxCalculator: updater(currentState.fxCalculator),
                    }))
                  }
                />
              </motion.div>
            )}
          </div>
        </section>
      </div>

      {/* Floating Database Sync Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <button
            className={cn(
              "fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full border shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer outline-none",
              isDirty && saveStatus !== 'saving'
                ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/40 shadow-amber-500/10"
                : saveStatus === 'saving'
                ? "border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 hover:border-sky-500/40 shadow-sky-500/10"
                : saveStatus === 'error'
                ? "border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:border-rose-500/40 shadow-rose-500/10"
                : "border-white/10 bg-white/5 text-muted-foreground hover:text-white hover:border-white/20"
            )}
          >
            {/* Glowing effect for unsaved changes */}
            {isDirty && saveStatus !== 'saving' && (
              <span className="absolute inset-0 rounded-full animate-ping bg-amber-500/20 pointer-events-none" />
            )}
            
            {/* Action/Indicator Icon */}
            {saveStatus === 'saving' ? (
              <ArrowClockwiseIcon size={24} className="animate-spin" />
            ) : saveStatus === 'error' ? (
              <WarningCircleIcon size={24} className="animate-bounce" />
            ) : isDirty ? (
              <CloudArrowUpIcon size={24} className="animate-pulse" />
            ) : (
              <DatabaseIcon size={24} weight="duotone" />
            )}

            {/* Notification Badge Dot */}
            {isDirty && (
              <span className="absolute top-1 right-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-amber-500" />
            )}
          </button>
        </DialogTrigger>
        <DialogContent className="max-w-[360px] p-5 sm:max-w-[400px] border border-white/10 bg-card/95 backdrop-blur-lg rounded-2xl">
          <DialogHeader className="hidden">
            <DialogTitle>Base de Datos</DialogTitle>
            <DialogDescription>Sincronización en la nube</DialogDescription>
          </DialogHeader>
          <DatabaseSyncCard
            saveStatus={saveStatus}
            isDirty={isDirty}
            onSave={handleSave}
            onDiscard={handleDiscard}
            lastSaved={lastSaved}
            hasLocalData={hasLocalData}
            onMigrate={handleMigrate}
            flat={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
