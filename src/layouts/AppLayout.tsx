import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BottomNavigation } from '../components/layout/BottomNavigation'
import { Sidebar } from '../components/layout/Sidebar'
import { QuickAddSheet } from '../components/layout/QuickAddSheet'
import { QuickAddContext } from './QuickAddContext'
import { cn } from '../utils/cn'

/** Full-screen form routes hide the tab bar on mobile (pushed screens, like iOS). */
const isFormRoute = (path: string) => path.startsWith('/add') || path.endsWith('/edit') || path === '/debts/new'

export function AppLayout() {
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const { pathname } = useLocation()
  const formRoute = isFormRoute(pathname)
  const showAdd = !['/settings', '/accounts', '/profile'].includes(pathname)

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [pathname])

  const open = useCallback(() => setQuickAddOpen(true), [])
  const ctx = useMemo(() => ({ open }), [open])

  return (
    <QuickAddContext.Provider value={ctx}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[70] focus:rounded-xl focus:bg-surface focus:px-4 focus:py-2 focus:shadow-float">
        Перейти до змісту
      </a>
      <div className="flex min-h-dvh">
        <Sidebar onQuickAdd={open} />
        <main
          id="main"
          className={cn(
            'min-w-0 flex-1 px-4 pt-[env(safe-area-inset-top)] sm:px-6 lg:px-10 lg:pt-10 lg:pb-12',
            formRoute ? 'pb-6' : 'pb-[calc(112px+env(safe-area-inset-bottom))]',
          )}
        >
          <div key={pathname} className="animate-page mx-auto w-full max-w-[1320px]">
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
      {!formRoute && <BottomNavigation onQuickAdd={open} showAdd={showAdd} />}
      <QuickAddSheet open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </QuickAddContext.Provider>
  )
}

function PageSkeleton() {
  return (
    <div className="space-y-4 pt-4" aria-busy="true" aria-label="Завантаження">
      <div className="h-8 w-40 animate-pulse rounded-xl bg-surface-3" />
      <div className="h-40 animate-pulse rounded-3xl bg-surface-3" />
      <div className="h-24 animate-pulse rounded-3xl bg-surface-3" />
    </div>
  )
}
