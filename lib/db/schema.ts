import { sqliteTable, text, real, integer } from 'drizzle-orm/sqlite-core'

export const months = sqliteTable('months', {
  monthKey: text('month_key').primaryKey(), // e.g. "2026-06"
  totalBudgetBs: real('total_budget_bs').notNull().default(0),
  mode: text('mode').notNull().default('remaining-month'), // "remaining-month" | "full-month"
  categoryBudgets: text('category_budgets'), // JSON string representing Record<string, number>
})

export const entries = sqliteTable('entries', {
  id: text('id').primaryKey(), // generated on client (e.g. shortid / Date.now()-rand)
  monthKey: text('month_key')
    .notNull()
    .references(() => months.monthKey, { onDelete: 'cascade' }),
  kind: text('kind').notNull(), // "daily" | "weekly"
  date: text('date').notNull(), // YYYY-MM-DD
  amountBs: real('amount_bs').notNull(),
  note: text('note'),
  category: text('category'),
  createdAt: integer('created_at'), // unix timestamp for secondary sorting/ordering
})
