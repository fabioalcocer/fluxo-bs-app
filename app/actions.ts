'use server'

import { db } from '@/lib/db'
import { months, entries } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import type { MonthBudgetState } from '@/types/finance'

export async function saveFinanceState(monthKey: string, monthData: MonthBudgetState) {
  try {
    await db.transaction(async (tx) => {
      // 1. Upsert month record
      await tx
        .insert(months)
        .values({
          monthKey,
          totalBudgetBs: monthData.totalBudgetBs,
          mode: monthData.mode,
          categoryBudgets: JSON.stringify(monthData.categoryBudgets || {}),
        })
        .onConflictDoUpdate({
          target: months.monthKey,
          set: {
            totalBudgetBs: monthData.totalBudgetBs,
            mode: monthData.mode,
            categoryBudgets: JSON.stringify(monthData.categoryBudgets || {}),
          },
        })

      // 2. Delete existing entries for this month
      await tx.delete(entries).where(eq(entries.monthKey, monthKey))

      // 3. Insert new entries
      if (monthData.entries.length > 0) {
        await tx.insert(entries).values(
          monthData.entries.map((e, index) => ({
            id: e.id,
            monthKey,
            kind: e.kind,
            date: e.date,
            amountBs: e.amountBs,
            note: e.note || null,
            category: e.category || null,
            createdAt: Date.now() - index, // preserve order
          }))
        )
      }
    })

    return { success: true }
  } catch (error) {
    console.error('Error saving state to Turso DB:', error)
    return { success: false, error: String(error) }
  }
}
