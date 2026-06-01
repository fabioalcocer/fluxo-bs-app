import { AnimatedPage } from '@/components/motion/animated-page'
import { FinanceDashboard } from '@/components/dashboard/finance-dashboard'
import { getMonthKey } from '@/lib/date'

export default function Page() {
  const referenceDate = new Date()

  return (
    <AnimatedPage className="min-h-svh overflow-hidden bg-background">
      <FinanceDashboard
        initialMonthKey={getMonthKey(referenceDate)}
        referenceDateIso={referenceDate.toISOString().slice(0, 10)}
      />
    </AnimatedPage>
  )
}
