import { lazy } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { UIProvider } from './store/UIContext'
import { FinanceProvider } from './store/FinanceContext'
import { AppLayout } from './layouts/AppLayout'
import { useFinance } from './hooks/useFinance'
import { useAccent, useTextSize, useTheme } from './hooks/useTheme'
import DashboardPage from './pages/DashboardPage'

// Secondary screens are code-split to keep the first load small.
const TransactionFormPage = lazy(() => import('./pages/TransactionFormPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'))
const CategoryDetailPage = lazy(() => import('./pages/CategoryDetailPage'))
const MonthPage = lazy(() => import('./pages/MonthPage'))
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'))
const BudgetsPage = lazy(() => import('./pages/BudgetsPage'))
const DebtsPage = lazy(() => import('./pages/DebtsPage'))
const DebtFormPage = lazy(() => import('./pages/DebtFormPage'))
const GoalsPage = lazy(() => import('./pages/GoalsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const AccountsPage = lazy(() => import('./pages/AccountsPage'))

function ThemedRoutes() {
  const { data } = useFinance()
  useTheme(data.settings.theme)
  useTextSize(data.settings.textSize)
  useAccent(data.settings.accent)
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="add/:type" element={<TransactionFormPage />} />
        <Route path="transactions/:id/edit" element={<TransactionFormPage />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="categories/:id" element={<CategoryDetailPage />} />
        <Route path="month" element={<MonthPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="budgets" element={<BudgetsPage />} />
        <Route path="debts" element={<DebtsPage />} />
        <Route path="debts/new" element={<DebtFormPage />} />
        <Route path="debts/:id/edit" element={<DebtFormPage />} />
        <Route path="goals" element={<GoalsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="accounts" element={<AccountsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    // HashRouter: GitHub Pages has no SPA fallback, hash URLs survive page refreshes.
    <HashRouter>
      <UIProvider>
        <FinanceProvider>
          <ThemedRoutes />
        </FinanceProvider>
      </UIProvider>
    </HashRouter>
  )
}
