'use client'

import { useState, useEffect } from 'react'
import { ArrowsLeftRightIcon, CoinIcon, TrendDownIcon, TrendUpIcon } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatCard } from './stat-card'
import { formatBs, formatCompactBs, formatNumber, formatPercent } from '@/lib/format'
import type { FxCalculatorState } from '@/types/finance'

interface ExchangeTabProps {
  fxCalculator: FxCalculatorState
  fxSummary: {
    usedBs: number
    referenceBs: number
    differenceBs: number
    differenceRatio: number
  }
  onFxChange: (updater: (prev: FxCalculatorState) => FxCalculatorState) => void
}

export function ExchangeTab({ fxCalculator, fxSummary, onFxChange }: ExchangeTabProps) {
  const [amountUsdcStr, setAmountUsdcStr] = useState(() =>
    fxCalculator.amountUsdc ? String(fxCalculator.amountUsdc) : ''
  )
  const [currentRateStr, setCurrentRateStr] = useState(() =>
    fxCalculator.currentRate ? String(fxCalculator.currentRate) : ''
  )
  const [referenceRateStr, setReferenceRateStr] = useState(() =>
    fxCalculator.referenceRate ? String(fxCalculator.referenceRate) : ''
  )

  const parseNumeric = (str: string): number => {
    const normalized = str.replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
  }

  // Sync draft states with external changes (e.g. storage hydration)
  useEffect(() => {
    const parsedDraft = parseNumeric(amountUsdcStr)
    if (parsedDraft !== fxCalculator.amountUsdc) {
      setAmountUsdcStr(fxCalculator.amountUsdc ? String(fxCalculator.amountUsdc) : '')
    }
  }, [fxCalculator.amountUsdc])

  useEffect(() => {
    const parsedDraft = parseNumeric(currentRateStr)
    if (parsedDraft !== fxCalculator.currentRate) {
      setCurrentRateStr(fxCalculator.currentRate ? String(fxCalculator.currentRate) : '')
    }
  }, [fxCalculator.currentRate])

  useEffect(() => {
    const parsedDraft = parseNumeric(referenceRateStr)
    if (parsedDraft !== fxCalculator.referenceRate) {
      setReferenceRateStr(fxCalculator.referenceRate ? String(fxCalculator.referenceRate) : '')
    }
  }, [fxCalculator.referenceRate])

  const handleInputChange = (
    field: keyof FxCalculatorState,
    setDraft: (val: string) => void,
    valStr: string
  ) => {
    if (valStr === '' || /^[0-9]*[.,]?[0-9]*$/.test(valStr)) {
      setDraft(valStr)
      const parsed = parseNumeric(valStr)
      onFxChange((prev) => ({
        ...prev,
        [field]: parsed,
      }))
    }
  }

  return (
    <Card className="glass-panel surface-outline rounded-2xl border-white/10 bg-card/80 transition-all duration-300 hover:border-white/15">
      <CardHeader className="px-4 sm:px-5">
        <CardTitle className="text-lg font-bold text-foreground">Calculadora de cambio</CardTitle>
        <p className="text-sm leading-5 text-muted-foreground">
          Compara cuánto ganas o pierdes en Bs según el tipo de cambio usado.
        </p>
      </CardHeader>
      
      <CardContent className="grid gap-4 px-4 pb-4 sm:px-5 sm:pb-5">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="grid gap-2">
            <Label htmlFor="fx-amount" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">
              Monto en USDC
            </Label>
            <Input
              id="fx-amount"
              inputMode="decimal"
              onChange={(e) => handleInputChange('amountUsdc', setAmountUsdcStr, e.target.value)}
              value={amountUsdcStr}
              className="bg-white/3 border-white/8 focus:border-primary/40 focus:ring-primary/20 transition-all duration-300 font-mono"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fx-current" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">
              Cambio usado
            </Label>
            <Input
              id="fx-current"
              inputMode="decimal"
              onChange={(e) => handleInputChange('currentRate', setCurrentRateStr, e.target.value)}
              value={currentRateStr}
              className="bg-white/3 border-white/8 focus:border-primary/40 focus:ring-primary/20 transition-all duration-300 font-mono"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fx-reference" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">
              Cambio referencia
            </Label>
            <Input
              id="fx-reference"
              inputMode="decimal"
              onChange={(e) => handleInputChange('referenceRate', setReferenceRateStr, e.target.value)}
              value={referenceRateStr}
              className="bg-white/3 border-white/8 focus:border-primary/40 focus:ring-primary/20 transition-all duration-300 font-mono"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<CoinIcon size={18} />}
            label="Recibes al cambio usado"
            value={formatBs(fxSummary.usedBs)}
            hint={`a ${formatNumber(fxCalculator.currentRate, 2)} Bs`}
          />
          <StatCard
            icon={<ArrowsLeftRightIcon size={18} />}
            label="Recibes al cambio referencia"
            value={formatBs(fxSummary.referenceBs)}
            hint={`a ${formatNumber(fxCalculator.referenceRate, 2)} Bs`}
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
          <div className="rounded-xl border border-white/8 bg-background/35 p-4 transition-all duration-300 hover:border-white/15 flex flex-col justify-center">
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.14em] text-muted-foreground font-semibold font-sans">
              Lectura rápida
            </p>
            <p className="mt-2 font-heading text-lg leading-tight sm:text-xl font-bold tracking-tight text-foreground">
              {fxSummary.differenceBs >= 0
                ? `Si cambias hoy, estás dejando ${formatCompactBs(fxSummary.differenceBs)} sobre la mesa.`
                : `El cambio actual te favorece por ${formatCompactBs(Math.abs(fxSummary.differenceBs))}.`}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
