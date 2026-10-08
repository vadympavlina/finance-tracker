import { useNavigate } from 'react-router-dom'
import { Pencil, Trash2 } from 'lucide-react'
import type { Transaction } from '../../types'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/Button'
import { CategoryIcon } from '../common/CategoryIcon'
import { FitText } from '../ui/FitText'
import { useFinance, useLookups } from '../../hooks/useFinance'
import { useConfirm, useToast } from '../../hooks/useUI'
import { describeTransaction, TRANSACTION_TYPE_LABELS } from './transactionMeta'
import { formatMoney, formatSignedMoney } from '../../utils/format'
import { formatFullDate, formatTime } from '../../utils/date'
import { cn } from '../../utils/cn'

interface Props {
  tx: Transaction | null
  onClose: () => void
}

export function TransactionDetailsSheet({ tx, onClose }: Props) {
  const { deleteTransaction } = useFinance()
  const { categoryById, accountById } = useLookups()
  const confirm = useConfirm()
  const toast = useToast()
  const navigate = useNavigate()

  if (!tx) return null

  const view = describeTransaction(tx, categoryById, accountById)
  const account = accountById.get(tx.accountId)
  const toAccount = tx.toAccountId ? accountById.get(tx.toAccountId) : undefined

  const onDelete = async () => {
    const ok = await confirm({
      title: 'Видалити операцію?',
      message:
        tx.type === 'debt_repayment'
          ? 'Сума повернення буде знята з боргу, баланс перерахується.'
          : 'Баланс, статистика і бюджети будуть перераховані. Цю дію не можна скасувати.',
      confirmLabel: 'Видалити',
      danger: true,
    })
    if (!ok) return
    deleteTransaction(tx.id)
    onClose()
    toast('Операцію видалено')
  }

  const rows: Array<[string, string | undefined]> = [
    ['Тип', TRANSACTION_TYPE_LABELS[tx.type]],
    [tx.type === 'transfer' ? 'Звідки' : tx.type === 'debt_repayment' ? 'Рахунок' : 'Метод оплати', account ? `${account.name}${account.isArchived ? ' (архівований)' : ''}` : '—'],
    ...(tx.type === 'transfer' ? ([['Куди', toAccount?.name ?? '—']] as Array<[string, string]>) : []),
    ...(tx.type === 'income' || tx.type === 'expense' ? ([['Категорія', view.categoryName]] as Array<[string, string]>) : []),
    ...(tx.type === 'debt_repayment' ? ([['Контакт', tx.debtPerson ?? '—']] as Array<[string, string]>) : []),
    [tx.type === 'income' ? 'Джерело' : 'Магазин', tx.merchant],
    ['Коментар', tx.comment],
  ]

  return (
    <Sheet
      open
      onClose={onClose}
      title="Деталі операції"
      footer={
        <div className="grid grid-cols-2 gap-3">
          <Button variant="danger-soft" icon={<Trash2 className="size-[18px]" aria-hidden />} onClick={onDelete}>
            Видалити
          </Button>
          <Button
            icon={<Pencil className="size-[18px]" aria-hidden />}
            onClick={() => {
              onClose()
              navigate(`/transactions/${tx.id}/edit`)
            }}
          >
            Редагувати
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center pt-2 pb-5 text-center">
        <CategoryIcon icon={view.icon} color={view.color} size="lg" />
        <p className="mt-3 max-w-full text-base font-semibold break-words">{view.title}</p>
        <FitText
          as="p"
          className={cn(
            'tabular mt-1 w-full text-center text-[34px] leading-tight font-bold tracking-tight',
            view.tone === 'income' && 'text-income',
            view.tone === 'neutral' && 'text-info',
          )}
        >
          {view.tone === 'neutral' ? formatMoney(view.signed) : formatSignedMoney(view.signed)}
        </FitText>
        <p className="mt-1.5 text-sm text-muted">
          {formatFullDate(tx.date)} · {formatTime(tx.date)}
        </p>
      </div>
      <dl className="divide-y divide-border rounded-2xl border border-border">
        {rows
          .filter(([, v]) => v)
          .map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-4 px-4 py-3">
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="text-right text-[15px] font-medium break-words">{value}</dd>
            </div>
          ))}
      </dl>
    </Sheet>
  )
}
