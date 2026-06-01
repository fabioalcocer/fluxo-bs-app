import type { Metadata } from 'next'
import { Inter, JetBrains_Mono, Manrope } from 'next/font/google'

import { MotionProvider } from '@/components/motion/motion-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { cn } from '@/lib/utils'

import './globals.css'

const interInter = Inter({
  subsets: [
    'cyrillic',
    'cyrillic-ext',
    'greek',
    'greek-ext',
    'latin',
    'latin-ext',
    'vietnamese',
  ],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
})

const manropeManrope = Manrope({
  subsets: [
    'cyrillic',
    'cyrillic-ext',
    'greek',
    'latin',
    'latin-ext',
    'vietnamese',
  ],
  weight: ['200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-manrope',
})

const jetbrainsMonoJetbrainsMono = JetBrains_Mono({
  subsets: [
    'cyrillic',
    'cyrillic-ext',
    'greek',
    'latin',
    'latin-ext',
    'vietnamese',
  ],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800'],
  variable: '--font-jetbrains-mono',
})

export const metadata: Metadata = {
  title: 'Fluxo Bs | Control de gastos mensual',
  description:
    'Dashboard financiero dark-first para controlar gasto mensual, calcular margen diario y semanal, y comparar diferencias de tipo de cambio en Bs.',
  authors: [{ name: 'Fluxo Bs' }],
  creator: 'Fluxo Bs',
  publisher: 'Fluxo Bs',
  metadataBase: new URL('https://fluxobs.local'),
  openGraph: {
    type: 'website',
    locale: 'es_BO',
    url: 'https://fluxobs.local',
    siteName: 'Fluxo Bs',
    title: 'Fluxo Bs | Control de gastos mensual',
    description:
      'Controla tu gasto del mes, recalcula lo que puedes gastar por dia y semana, y compara tipos de cambio en Bs.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Fluxo Bs dashboard financiero',
      },
    ],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      className={cn(
        'antialiased',
        manropeManrope.variable,
        interInter.variable,
        jetbrainsMonoJetbrainsMono.variable,
      )}
      lang="es-BO"
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider>
          <MotionProvider>{children}</MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
