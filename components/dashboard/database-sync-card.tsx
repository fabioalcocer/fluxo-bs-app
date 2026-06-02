'use client'

import { useState } from 'react'
import {
  DatabaseIcon,
  CloudArrowUpIcon,
  ArrowCounterClockwiseIcon,
  ArrowClockwiseIcon,
  CheckCircleIcon,
  WarningCircleIcon,
  XCircleIcon,
  UploadSimpleIcon,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface DatabaseSyncCardProps {
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  isDirty: boolean
  onSave: () => void
  onDiscard: () => void
  lastSaved: Date | null
  hasLocalData: boolean
  onMigrate: () => void
}

export function DatabaseSyncCard({
  saveStatus,
  isDirty,
  onSave,
  onDiscard,
  lastSaved,
  hasLocalData,
  onMigrate,
}: DatabaseSyncCardProps) {
  const [isMigratedLocally, setIsMigratedLocally] = useState(false)

  // Status mapping
  let statusColor = 'bg-emerald-500 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.4)]'
  let statusText = 'Sincronizado'
  let statusDesc = 'Los datos coinciden con la nube'
  let StatusIcon = CheckCircleIcon
  let statusContainerClass = 'border-emerald-500/10 bg-emerald-500/5 text-emerald-400'

  if (saveStatus === 'saving') {
    statusColor = 'bg-sky-500 border-sky-400 shadow-[0_0_12px_rgba(14,165,233,0.4)]'
    statusText = 'Guardando...'
    statusDesc = 'Sincronizando con Turso DB...'
    StatusIcon = ArrowClockwiseIcon
    statusContainerClass = 'border-sky-500/10 bg-sky-500/5 text-sky-400'
  } else if (saveStatus === 'error') {
    statusColor = 'bg-rose-500 border-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.4)]'
    statusText = 'Error de conexión'
    statusDesc = 'Error al sincronizar datos'
    StatusIcon = XCircleIcon
    statusContainerClass = 'border-rose-500/10 bg-rose-500/5 text-rose-400'
  } else if (isDirty) {
    statusColor = 'bg-amber-500 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.4)] animate-pulse'
    statusText = 'Cambios locales'
    statusDesc = 'Tienes modificaciones sin guardar'
    StatusIcon = WarningCircleIcon
    statusContainerClass = 'border-amber-500/10 bg-amber-500/5 text-amber-400'
  }

  const formatLastSaved = (date: Date | null) => {
    if (!date) return 'Sin guardar en esta sesión'
    return `Guardado: ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`
  }

  const handleMigration = () => {
    onMigrate()
    setIsMigratedLocally(true)
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-background/35 p-4 transition-all duration-300 hover:border-white/15">
      <div className="grid gap-3.5">
        {/* Card Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground font-semibold font-sans">
              Base de Datos
            </p>
            <p className="mt-0.5 font-heading text-base font-bold tracking-tight">
              Turso Cloud
            </p>
          </div>
          <div className="rounded-xl border border-white/8 bg-white/4 p-2.5 text-primary shadow-[0_0_10px_-2px_rgba(138,247,211,0.1)]">
            <DatabaseIcon size={20} weight="duotone" />
          </div>
        </div>

        {/* Status Indicator Bar */}
        <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-colors ${statusContainerClass}`}>
          <div className="relative flex h-3 w-3 shrink-0 items-center justify-center">
            {isDirty && saveStatus !== 'saving' && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
            )}
            <span className={`inline-block h-2 w-2 rounded-full border border-white/30 ${statusColor}`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 font-semibold text-sm leading-none">
              {saveStatus === 'saving' && <StatusIcon size={14} className="animate-spin" />}
              {saveStatus !== 'saving' && <StatusIcon size={14} />}
              {statusText}
            </div>
            <p className="text-[10px] sm:text-[11px] leading-relaxed opacity-80 truncate mt-0.5">
              {statusDesc}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid gap-2">
          {isDirty || saveStatus === 'saving' || saveStatus === 'error' ? (
            <div className="flex gap-2">
              <Button
                onClick={onSave}
                disabled={saveStatus === 'saving'}
                className="flex-1 hover:scale-[1.02] active:scale-[0.98] transition-all bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-9 rounded-xl shadow-md border border-primary/20"
              >
                {saveStatus === 'saving' ? (
                  <>
                    <ArrowClockwiseIcon size={16} className="animate-spin mr-1" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon size={16} className="mr-1" />
                    Guardar
                  </>
                )}
              </Button>
              <Button
                onClick={onDiscard}
                disabled={saveStatus === 'saving'}
                variant="outline"
                className="hover:scale-[1.02] active:scale-[0.98] transition-all font-semibold h-9 rounded-xl text-xs hover:bg-white/5 hover:text-white"
              >
                <ArrowCounterClockwiseIcon size={16} className="mr-1" />
                Descartar
              </Button>
            </div>
          ) : (
            <Button
              disabled
              className="w-full bg-emerald-500/10 text-emerald-400/70 border border-emerald-500/20 font-semibold h-9 rounded-xl pointer-events-none"
            >
              <CheckCircleIcon size={16} className="mr-1 text-emerald-400" />
              Sincronizado
            </Button>
          )}

          <p className="text-[10px] text-center text-muted-foreground font-mono leading-none mt-1">
            {formatLastSaved(lastSaved)}
          </p>
        </div>

        {/* LocalStorage Migration Banner */}
        {hasLocalData && !isMigratedLocally && (
          <div className="mt-1 rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200/90 leading-relaxed shadow-xs">
            <div className="flex items-start gap-2.5">
              <WarningCircleIcon size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div className="grid gap-2">
                <div>
                  <p className="font-bold text-amber-300">¡Datos locales detectados!</p>
                  <p className="text-[11px] text-amber-200/70 mt-0.5">
                    Tienes registros guardados en la memoria de este navegador. Súbelos a tu nube de Turso para no perderlos.
                  </p>
                </div>
                <Button
                  onClick={handleMigration}
                  size="xs"
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg px-2.5 py-1 w-max self-start text-[10px]"
                >
                  <UploadSimpleIcon size={12} className="mr-1" />
                  Migrar a Turso
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
