import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { BottomNavigation } from '../components/layout/BottomNavigation'
import { Sidebar } from '../components/layout/Sidebar'
import { QuickAddSheet } from '../components/layout/QuickAddSheet'
import { QuickAddContext } from './QuickAddContext'
import { cn } from '../utils/cn'

/** Full-screen form routes hide the bottom navigation and the FAB on mobile. */
const isFormRoute = (path: string) => path.startsWith('/add') || path.endsWith('/edit') || path === '/debts/new'

export function AppLayout() {
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const { pathname } = useLocation()
  const formRoute = isFormRoute(pathname)
  const showFab = !formRoute && pathname !== '/'

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
            'pt-safe min-w-0 flex-1 px-4 sm:px-6 lg:px-10 lg:pt-8 lg:pb-12',
            formRoute ? 'pb-6' : 'pb-[calc(100px+env(safe-area-inset-bottom))]',
          )}
        >
          <div key={pathname} className="animate-page mx-auto w-full max-w-[1320px]">
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
      {!formRoute && <BottomNavigation />}
      {showFab && (
        <button
          type="button"
          onClick={open}
          aria-label="Додати операцію"
          className="press fixed right-4 bottom-[calc(80px+env(safe-area-inset-bottom))] z-30 grid size-14 place-items-center rounded-2xl bg-primary text-on-primary shadow-primary hover:bg-primary-strong lg:hidden"
        >
          <Plus className="size-6" strokeWidth={2.5} aria-hidden />
        </button>
      )}
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
