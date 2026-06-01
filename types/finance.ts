export type PlanningMode = 'remaining-month' | 'full-month'

export type SpendingEntryKind = 'daily' | 'weekly'

export interface SpendingEntry {
  id: string
  kind: SpendingEntryKind
  date: string
  amountBs: number
  note?: string
}

export interface MonthBudgetState {
  totalBudgetBs: number
  mode: PlanningMode
  entries: SpendingEntry[]
}

export interface FxCalculatorState {
  amountUsdc: number
  currentRate: number
  referenceRate: number
}

export interface FinanceAppState {
  selectedMonth: string
  months: Record<string, MonthBudgetState>
  fxCalculator: FxCalculatorState
}

export interface WeekRange {
  index: number
  startDay: number
  endDay: number
  label: string
}

export interface SpendingSummary {
  totalSpent: number
  remainingBudget: number
  dailyAllowance: number
  weeklyAllowance: number
  effectiveMode: PlanningMode
  usesModeFallback: boolean
  totalDaysInMonth: number
  activeDaysCount: number
  totalWeeksInMonth: number
  activeWeeksCount: number
  projectedMonthEnd: number
  totalBudgetBs: number
  weekBreakdown: Array<{
    range: WeekRange
    spent: number
    planned: number
    deviation: number
    isActive: boolean
  }>
}
