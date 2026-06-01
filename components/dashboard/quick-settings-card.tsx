'use client'

import { useState, useEffect } from 'react'
import { MoonIcon, SunIcon } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import type { PlanningMode } from '@/types/finance'

interface QuickSettingsCardProps {
  selectedBudget: number
  onBudgetChange: (value: string) => void
  mode: PlanningMode
  onModeChange: (mode: PlanningMode) => void
  theme?: string
  toggleTheme: () => void
}

export function QuickSettingsCard({
  selectedBudget,
  onBudgetChange,
  mode,
  onModeChange,
  theme,
  toggleTheme,
}: QuickSettingsCardProps) {
  const [budgetStr, setBudgetStr] = useState(() =>
    selectedBudget ? String(selectedBudget) : ''
  )

  const parseNumeric = (str: string): number => {
    const normalized = str.replace(',', '.')
    const parsed = Number(normalized)
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
  }

  useEffect(() => {
    const parsedDraft = parseNumeric(budgetStr)
    if (parsedDraft !== selectedBudget) {
      setBudgetStr(selectedBudget ? String(selectedBudget) : '')
    }
  }, [selectedBudget])

  const handleInputChange = (valStr: string) => {
    if (valStr === '' || /^[0-9]*[.,]?[0-9]*$/.test(valStr)) {
      setBudgetStr(valStr)
      onBudgetChange(valStr)
    }
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-background/35 p-4 transition-all duration-300 hover:border-white/15">
      <div className="grid gap-3.5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-semibold font-sans">Tema</p>
            <p className="text-sm font-medium text-foreground">
              Modo {theme === 'light' ? 'claro' : 'oscuro'}
            </p>
          </div>
          <Button onClick={toggleTheme} size="icon-sm" variant="apb-soft" className="hover:scale-105 active:scale-95 transition-transform">
            {theme === 'light' ? <MoonIcon size={16} /> : <SunIcon size={16} />}
          </Button>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="budget-month" className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase tracking-wider font-sans">
            Presupuesto del mes (Bs)
          </Label>
          <Input
            id="budget-month"
            inputMode="decimal"
            onChange={(event) => handleInputChange(event.target.value)}
            placeholder="1600"
            value={budgetStr}
            className="bg-white/3 border-white/8 focus:border-primary/40 focus:ring-primary/20 transition-all duration-300 font-mono"
          />
        </div>
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/8 bg-white/3 px-3 py-2.5 transition-colors hover:bg-white/5">
          <div>
            <p className="font-semibold text-sm text-foreground">Desde hoy hasta fin de mes</p>
            <p className="text-[11px] leading-4 text-muted-foreground">
              Ajusta el ritmo según los días restantes.
            </p>
          </div>
          <Switch
            checked={mode === 'remaining-month'}
            onCheckedChange={(checked) =>
              onModeChange(checked ? 'remaining-month' : 'full-month')
            }
          />
        </div>
      </div>
    </div>
  )
}
