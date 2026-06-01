# Fluxo Bs

Dashboard financiero dark-first construido con Next.js para controlar gasto mensual en Bs, recalcular allowance diario y semanal, y comparar diferencias de tipo de cambio.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- shadcn/radix-ui
- motion
- next-themes

## Modulos actuales

1. Control de gasto mensual
- presupuesto mensual en Bs
- modo `desde hoy` y `mes completo`
- registro de gasto diario o semanal
- recalculo del saldo restante
- navegacion entre meses

2. Calculadora de cambio
- monto en USDC
- tipo de cambio usado
- tipo de cambio referencia
- diferencia directa en Bs

3. Presupuestos por categoria
- placeholder listo para futura implementacion

## Persistencia

Todo vive en `localStorage` usando la key `finance-app:v1`.

## Scripts

- `pnpm dev`
- `pnpm build`
- `pnpm lint`
- `pnpm typecheck`
