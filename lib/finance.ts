import {
  getCurrentDayOfMonth,
  getDayInMonthFromIso,
  getDaysInMonth,
  getMonthWeekRanges,
  isCurrentMonth,
} from '@/lib/date'
import type {
  FxCalculatorState,
  MonthBudgetState,
  PlanningMode,
  SpendingEntry,
  SpendingSummary,
} from '@/types/finance'

export const STORAGE_KEY = 'finance-app:v1'

export const DEFAULT_CATEGORIES = [
  'Ayudas',
  'Almuerzos',
  'Comida rapida',
  'Cafeterias',
  'Despensa',
  'Fiestas',
  'Transporte',
  'Lujos y extras'
]

export function createEmptyMonthState(): MonthBudgetState {
  const categoryBudgets: Record<string, number> = {}
  for (const cat of DEFAULT_CATEGORIES) {
    categoryBudgets[cat] = 0
  }
  return {
    totalBudgetBs: 0,
    mode: 'remaining-month',
    entries: [],
    categoryBudgets,
  }
}

export function createInitialFinanceState(selectedMonth: string) {
  return {
    selectedMonth,
    months: {},
    fxCalculator: {
      amountUsdc: 100,
      currentRate: 9.89,
      referenceRate: 9.97,
    },
  }
}

export function getMonthState(
  months: Record<string, MonthBudgetState>,
  monthKey: string
) {
  return months[monthKey] ?? createEmptyMonthState()
}

function clampToNonNegative(value: number) {
  return value < 0 ? 0 : value
}

function getEffectiveMode(mode: PlanningMode, monthKey: string, today = new Date()) {
  if (mode === 'remaining-month' && !isCurrentMonth(monthKey, today)) {
    return {
      mode: 'full-month' as const,
      usesModeFallback: true,
    }
  }

  return {
    mode,
    usesModeFallback: false,
  }
}

export function calculateSpendingSummary(
  monthKey: string,
  monthState: MonthBudgetState,
  today = new Date()
): SpendingSummary {
  const totalDaysInMonth = getDaysInMonth(monthKey)
  const weekRanges = getMonthWeekRanges(monthKey)
  const totalWeeksInMonth = weekRanges.length
  const { mode: effectiveMode, usesModeFallback } = getEffectiveMode(
    monthState.mode,
    monthKey,
    today
  )
  const currentDay = isCurrentMonth(monthKey, today)
    ? getCurrentDayOfMonth(today)
    : 1
  const activeDaysCount =
    effectiveMode === 'remaining-month'
      ? clampToNonNegative(totalDaysInMonth - currentDay + 1)
      : totalDaysInMonth
  const activeWeeksCount =
    effectiveMode === 'remaining-month'
      ? weekRanges.filter((week) => week.endDay >= currentDay).length
      : totalWeeksInMonth

  const totalSpent = monthState.entries.reduce((sum, entry) => sum + entry.amountBs, 0)
  const remainingBudget = monthState.totalBudgetBs - totalSpent
  const dailyAllowance = remainingBudget / Math.max(activeDaysCount, 1)
  const weeklyAllowance = remainingBudget / Math.max(activeWeeksCount, 1)
  const projectedMonthEnd = monthState.totalBudgetBs === 0 ? 0 : remainingBudget

  let runningBudget = monthState.totalBudgetBs
  const weekBreakdown = weekRanges.map((range, index) => {
    const spent = monthState.entries
      .filter((entry) => {
        const day = getDayInMonthFromIso(entry.date)
        return day >= range.startDay && day <= range.endDay
      })
      .reduce((sum, entry) => sum + entry.amountBs, 0)

    const weeksRemaining = weekRanges.length - index
    const planned = runningBudget / Math.max(weeksRemaining, 1)

    const isPast = currentDay > range.endDay
    const hasOverspent = spent > planned

    if (isPast || hasOverspent) {
      runningBudget = Math.max(0, runningBudget - spent)
    } else {
      runningBudget = Math.max(0, runningBudget - planned)
    }

    return {
      range,
      spent,
      planned,
      deviation: spent - planned,
      isActive:
        effectiveMode === 'full-month' ? true : range.endDay >= currentDay,
    }
  })

  return {
    totalSpent,
    remainingBudget,
    dailyAllowance,
    weeklyAllowance,
    effectiveMode,
    usesModeFallback,
    totalDaysInMonth,
    activeDaysCount,
    totalWeeksInMonth,
    activeWeeksCount,
    projectedMonthEnd,
    totalBudgetBs: monthState.totalBudgetBs,
    weekBreakdown,
  }
}

export function calculateFxDifference(values: FxCalculatorState) {
  const usedBs = values.amountUsdc * values.currentRate
  const referenceBs = values.amountUsdc * values.referenceRate
  const differenceBs = referenceBs - usedBs
  const differenceRatio = referenceBs === 0 ? 0 : differenceBs / referenceBs

  return {
    usedBs,
    referenceBs,
    differenceBs,
    differenceRatio,
  }
}

export function sanitizeMonthState(state: MonthBudgetState): MonthBudgetState {
  const categoryBudgets: Record<string, number> = {}
  const rawBudgets = state.categoryBudgets || {}
  for (const cat of DEFAULT_CATEGORIES) {
    const val = rawBudgets[cat]
    categoryBudgets[cat] = typeof val === 'number' && Number.isFinite(val) ? val : 0
  }

  return {
    totalBudgetBs: Number.isFinite(state.totalBudgetBs) ? state.totalBudgetBs : 0,
    mode: state.mode === 'full-month' ? 'full-month' : 'remaining-month',
    entries: Array.isArray(state.entries)
      ? state.entries
          .filter(
            (entry): entry is SpendingEntry =>
              typeof entry?.id === 'string' &&
              typeof entry?.date === 'string' &&
              (entry?.kind === 'daily' || entry?.kind === 'weekly') &&
              Number.isFinite(entry?.amountBs)
          )
          .map((entry) => ({
            ...entry,
            amountBs: Number(entry.amountBs),
            note: entry.note?.trim() || undefined,
            category: typeof entry.category === 'string' ? entry.category.trim() : undefined,
          }))
      : [],
    categoryBudgets,
  }
}
