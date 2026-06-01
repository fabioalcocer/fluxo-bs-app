'use client'

import { motion } from 'motion/react'

import { cn } from '@/lib/utils'

import { pageReveal } from './variants'

interface AnimatedPageProps {
  children: React.ReactNode
  className?: string
}

export function AnimatedPage({ children, className }: AnimatedPageProps) {
  return (
    <motion.main
      animate="visible"
      className={cn(className)}
      initial={false}
      variants={pageReveal}
    >
      {children}
    </motion.main>
  )
}
