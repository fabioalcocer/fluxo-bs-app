export function formatBs(value: number) {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}

export function formatCompactBs(value: number) {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    notation: Math.abs(value) >= 10000 ? 'compact' : 'standard',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}

export function formatNumber(value: number, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('es-BO', {
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(Number.isFinite(value) ? value : 0)
}

export function formatPercent(value: number) {
  return new Intl.NumberFormat('es-BO', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0)
}
