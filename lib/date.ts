import type { WeekRange } from '@/types/finance'

function padMonth(value: number) {
  return String(value).padStart(2, '0')
}

export function getMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${padMonth(date.getMonth() + 1)}`
}

export function parseMonthKey(monthKey: string) {
  const [yearPart, monthPart] = monthKey.split('-')
  const year = Number(yearPart)
  const month = Number(monthPart)

  return {
    year,
    month,
  }
}

export function shiftMonthKey(monthKey: string, offset: number) {
  const { year, month } = parseMonthKey(monthKey)
  const nextDate = new Date(year, month - 1 + offset, 1)
  return getMonthKey(nextDate)
}

export function getMonthLabel(monthKey: string, locale = 'es-BO') {
  const { year, month } = parseMonthKey(monthKey)
  const date = new Date(year, month - 1, 1)

  return new Intl.DateTimeFormat(locale, {
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function getDaysInMonth(monthKey: string) {
  const { year, month } = parseMonthKey(monthKey)
  return new Date(year, month, 0).getDate()
}

export function isCurrentMonth(monthKey: string, today = new Date()) {
  return monthKey === getMonthKey(today)
}

export function isFutureMonth(monthKey: string, today = new Date()) {
  return monthKey > getMonthKey(today)
}

export function getCurrentDayOfMonth(today = new Date()) {
  return today.getDate()
}

export function getMonthWeekRanges(monthKey: string): WeekRange[] {
  const totalDays = getDaysInMonth(monthKey)
  const ranges: WeekRange[] = []
  let currentStart = 1

  while (currentStart <= totalDays) {
    const currentEnd = currentStart + 6

    if (totalDays - currentEnd < 7) {
      ranges.push({
        index: ranges.length,
        startDay: currentStart,
        endDay: totalDays,
        label: `Semana ${ranges.length + 1}`,
      })
      break
    } else {
      ranges.push({
        index: ranges.length,
        startDay: currentStart,
        endDay: currentEnd,
        label: `Semana ${ranges.length + 1}`,
      })
      currentStart = currentEnd + 1
    }
  }

  return ranges
}

export function getDayInMonthFromIso(date: string) {
  return new Date(`${date}T12:00:00`).getDate()
}

export function buildIsoDate(monthKey: string, day: number) {
  const { year, month } = parseMonthKey(monthKey)
  return `${year}-${padMonth(month)}-${String(day).padStart(2, '0')}`
}

export function clampDayToMonth(monthKey: string, day: number) {
  return Math.min(Math.max(day, 1), getDaysInMonth(monthKey))
}
