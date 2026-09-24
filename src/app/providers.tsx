import { ThemeProvider } from 'next-themes'
import type { ReactNode } from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { STORAGE_KEYS } from '@/lib/constants'
import { store } from './store'

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
        storageKey={STORAGE_KEYS.theme}
      >
        <TooltipProvider>
          {children}
          <Toaster position="bottom-right" richColors closeButton />
        </TooltipProvider>
      </ThemeProvider>
    </ReduxProvider>
  )
}
