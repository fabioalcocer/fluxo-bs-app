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

export function createEmptyMonthState(): MonthBudgetState {
  return {
    totalBudgetBs: 0,
    mode: 'remaining-month',
    entries: [],
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
  const baselineWeekPlan = monthState.totalBudgetBs / Math.max(totalWeeksInMonth, 1)
  const projectedMonthEnd = monthState.totalBudgetBs === 0 ? 0 : remainingBudget

  const weekBreakdown = weekRanges.map((range) => {
    const spent = monthState.entries
      .filter((entry) => {
        const day = getDayInMonthFromIso(entry.date)
        return day >= range.startDay && day <= range.endDay
      })
      .reduce((sum, entry) => sum + entry.amountBs, 0)

    return {
      range,
      spent,
      planned: baselineWeekPlan,
      deviation: spent - baselineWeekPlan,
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
          }))
      : [],
  }
}
