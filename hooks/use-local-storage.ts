'use client'

import { startTransition, useEffect, useRef, useState } from 'react'

export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
  revive?: (value: unknown) => T
) {
  const [state, setState] = useState(initialValue)
  const [hydrated, setHydrated] = useState(false)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (hasLoadedRef.current) {
      return
    }

    hasLoadedRef.current = true

    try {
      const storedValue = window.localStorage.getItem(key)

      if (storedValue) {
        const parsedValue = JSON.parse(storedValue)
        startTransition(() => {
          setState(revive ? revive(parsedValue) : (parsedValue as T))
        })
      }
    } catch {
      window.localStorage.removeItem(key)
    } finally {
      setHydrated(true)
    }
  }, [key, revive])

  useEffect(() => {
    if (!hydrated) {
      return
    }

    window.localStorage.setItem(key, JSON.stringify(state))
  }, [hydrated, key, state])

  return [state, setState, hydrated] as const
}
