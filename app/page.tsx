import { AnimatedPage } from '@/components/motion/animated-page'
import { FinanceDashboard } from '@/components/dashboard/finance-dashboard'
import { getMonthKey } from '@/lib/date'
import { db } from '@/lib/db'
import { months as monthsTable, entries as entriesTable } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { createEmptyMonthState } from '@/lib/finance'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const referenceDate = new Date()
  const monthKey = getMonthKey(referenceDate)

  let initialMonthState = createEmptyMonthState()

  try {
    const [monthResult] = await db
      .select()
      .from(monthsTable)
      .where(eq(monthsTable.monthKey, monthKey))
      .limit(1)

    if (monthResult) {
      const entriesResult = await db
        .select()
        .from(entriesTable)
        .where(eq(entriesTable.monthKey, monthKey))
        .orderBy(desc(entriesTable.createdAt))

      let categoryBudgets = createEmptyMonthState().categoryBudgets
      if (monthResult.categoryBudgets) {
        try {
          const parsed = JSON.parse(monthResult.categoryBudgets)
          categoryBudgets = { ...categoryBudgets, ...parsed }
        } catch (e) {
          console.error('Error parsing category budgets:', e)
        }
      }

      initialMonthState = {
        totalBudgetBs: monthResult.totalBudgetBs,
        mode: monthResult.mode as 'remaining-month' | 'full-month',
        entries: entriesResult.map((e) => ({
          id: e.id,
          kind: e.kind as 'daily' | 'weekly',
          date: e.date,
          amountBs: e.amountBs,
          note: e.note ?? undefined,
          category: e.category ?? undefined,
        })),
        categoryBudgets,
      }
    }
  } catch (error) {
    console.error('Error loading initial data from Turso DB:', error)
  }

  const initialDbState = {
    selectedMonth: monthKey,
    months: {
      [monthKey]: initialMonthState,
    },
    fxCalculator: {
      amountUsdc: 100,
      currentRate: 9.89,
      referenceRate: 9.97,
    },
  }

  return (
    <AnimatedPage className="min-h-svh overflow-hidden bg-background">
      <FinanceDashboard
        initialMonthKey={monthKey}
        referenceDateIso={referenceDate.toISOString().slice(0, 10)}
        initialDbState={initialDbState}
      />
    </AnimatedPage>
  )
}
