import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCheck, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Debt } from '../../types'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/Button'
import { ProgressBar } from '../ui/ProgressBar'
import { DebtStatusBadge } from './DebtCard'
import { RepaymentSheet } from './RepaymentSheet'
import { FitText } from '../ui/FitText'
import { useFinance } from '../../hooks/useFinance'
import { useConfirm, useToast } from '../../hooks/useUI'
import { calculateDebtProgress, calculateDebtRemaining, calculateDebtStatus, sortByDateDesc } from '../../services/calculations'
import { formatMoney, formatSignedMoney } from '../../utils/format'
import { formatFullDate } from '../../utils/date'
import { cn } from '../../utils/cn'

export function DebtDetailsSheet({ debt, onClose }: { debt: Debt | null; onClose: () => void }) {
  const { data, deleteDebt, deleteTransaction } = useFinance()
  const confirm = useConfirm()
  const toast = useToast()
  const navigate = useNavigate()
  const [repayment, setRepayment] = useState<'partial' | 'full' | null>(null)

  const repayments = useMemo(
    () => (debt ? sortByDateDesc(data.transactions.filter((t) => t.type === 'debt_repayment' && t.debtId === debt.id)) : []),
    [data.transactions, debt],
  )

  if (!debt) return null
  const status = calculateDebtStatus(debt)
  const remaining = calculateDebtRemaining(debt)
  const theyOwe = debt.direction === 'they_owe_me'

  const onDelete = async () => {
    const ok = await confirm({
      title: `Видалити борг «${debt.person}»?`,
      message: repayments.length
        ? 'Операції повернення залишаться в історії, бо це були реальні рухи коштів.'
        : 'Борг не впливав на баланс, тож баланс не зміниться.',
      confirmLabel: 'Видалити',
      danger: true,
    })
    if (!ok) return
    deleteDebt(debt.id)
    onClose()
    toast('Борг видалено')
  }

  const onDeleteRepayment = async (id: string) => {
    const ok = await confirm({ title: 'Скасувати це повернення?', message: 'Операцію буде видалено, баланс і залишок боргу перерахуються.', confirmLabel: 'Скасувати повернення', danger: true })
    if (!ok) return
    deleteTransaction(id)
    toast('Борг оновлено')
  }

  return (
    <>
      <Sheet
        open={!repayment}
        onClose={onClose}
        title={debt.person}
        description={theyOwe ? 'Мені винні' : 'Я винен'}
        footer={
          status !== 'paid' ? (
            <div className="flex flex-col-reverse gap-2.5 min-[480px]:grid min-[480px]:grid-cols-2 min-[480px]:gap-3">
              <Button variant="secondary" icon={<CheckCheck className="size-[18px]" aria-hidden />} onClick={() => setRepayment('full')}>
                Погасити все
              </Button>
              <Button icon={<Plus className="size-[18px]" aria-hidden />} onClick={() => setRepayment('partial')}>
                Додати повернення
              </Button>
            </div>
          ) : undefined
        }
      >
        <div className="space-y-5">
          <div className="rounded-2xl bg-surface-2 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-muted">{status === 'paid' ? 'Борг закрито' : 'Залишилось'}</p>
              <DebtStatusBadge status={status} />
            </div>
            <FitText as="p" className={cn('tabular mt-1 text-[32px] leading-tight font-bold tracking-tight', theyOwe ? 'text-income' : 'text-expense', status === 'paid' && 'text-income')}>
              {formatMoney(status === 'paid' ? debt.amount : remaining)}
            </FitText>
            <ProgressBar value={calculateDebtProgress(debt)} color={theyOwe ? 'var(--income)' : 'var(--primary)'} className="mt-3" label="Прогрес повернення" />
            <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted">Борг</dt>
                <dd className="tabular font-semibold">{formatMoney(debt.amount)}</dd>
              </div>
              <div>
                <dt className="text-muted">Повернуто</dt>
                <dd className="tabular font-semibold">{formatMoney(debt.repaidAmount)}</dd>
              </div>
              <div>
                <dt className="text-muted">Дата</dt>
                <dd className="font-semibold">{formatFullDate(debt.date)}</dd>
              </div>
              <div>
                <dt className="text-muted">Повернути до</dt>
                <dd className={cn('font-semibold', status === 'overdue' && 'text-expense')}>{debt.dueDate ? formatFullDate(debt.dueDate) : 'Без дати'}</dd>
              </div>
            </dl>
            {debt.comment && <p className="mt-3 border-t border-border pt-3 text-sm text-muted">{debt.comment}</p>}
          </div>

          <section aria-label="Історія повернень">
            <h3 className="mb-2 text-sm font-semibold text-muted">Історія повернень</h3>
            {repayments.length ? (
              <ul className="divide-y divide-border rounded-2xl border border-border">
                {repayments.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className={cn('tabular text-[15px] font-semibold', theyOwe ? 'text-income' : 'text-text')}>{formatSignedMoney(theyOwe ? t.amount : -t.amount)}</p>
                      <p className="min-w-0 break-words text-xs text-muted">
                        {formatFullDate(t.date)}
                        {t.comment ? ` · ${t.comment}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteRepayment(t.id)}
                      aria-label="Скасувати повернення"
                      className="press grid size-10 place-items-center rounded-full text-muted hover:bg-expense-soft hover:text-expense"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-2xl bg-surface-2 px-4 py-3 text-sm text-muted">
                Повернень ще не було. Створення боргу не змінює баланс — він зміниться лише після реального повернення грошей.
              </p>
            )}
          </section>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="ghost"
              icon={<Pencil className="size-4" aria-hidden />}
              onClick={() => {
                onClose()
                navigate(`/debts/${debt.id}/edit`)
              }}
            >
              Редагувати
            </Button>
            <Button variant="danger-soft" icon={<Trash2 className="size-4" aria-hidden />} onClick={onDelete}>
              Видалити
            </Button>
          </div>
        </div>
      </Sheet>
      <RepaymentSheet debt={debt} open={!!repayment} full={repayment === 'full'} onClose={() => setRepayment(null)} />
    </>
  )
}
