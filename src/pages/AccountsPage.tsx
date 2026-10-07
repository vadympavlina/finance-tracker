import { useState } from 'react'
import { Plus, Star, Trash2 } from 'lucide-react'
import type { Account, AccountType } from '../types'
import { PageHeader } from '../components/common/PageHeader'
import { CategoryIcon } from '../components/common/CategoryIcon'
import { Button, IconButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Sheet } from '../components/ui/Sheet'
import { SelectField, Switch, TextField } from '../components/ui/Field'
import { useFinance } from '../hooks/useFinance'
import { useFinanceStats } from '../hooks/useFinanceStats'
import { useConfirm, useToast } from '../hooks/useUI'
import { ACCOUNT_TYPE_COLORS, ACCOUNT_TYPE_ICONS, ACCOUNT_TYPE_LABELS } from '../data/defaults'
import { amountToInput, formatMoney, parseAmount } from '../utils/format'

export default function AccountsPage() {
  const { data, addAccount, updateAccount, deleteAccount, updateSettings } = useFinance()
  const stats = useFinanceStats()
  const confirm = useConfirm()
  const toast = useToast()
  const [editing, setEditing] = useState<Account | null>(null)
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<AccountType>('card')
  const [opening, setOpening] = useState('')
  const [isDefault, setIsDefault] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openForm = (a: Account | null) => {
    setEditing(a)
    setName(a?.name ?? '')
    setType(a?.type ?? 'card')
    setOpening(a ? (a.balance < 0 ? '-' : '') + (amountToInput(Math.abs(a.balance)) || '0') : '')
    setIsDefault(a ? data.settings.defaultAccountId === a.id : false)
    setError(null)
    setOpen(true)
  }

  const save = () => {
    if (!name.trim()) return setError('Вкажи назву рахунку')
    const negative = opening.trim().startsWith('-')
    const parsed = opening ? parseAmount(opening.replace('-', '')) : 0
    const balance = negative ? -parsed : parsed
    if (Number.isNaN(balance)) return setError('Некоректний початковий баланс')
    let id: string
    if (editing) {
      updateAccount(editing.id, { name: name.trim(), type, balance })
      id = editing.id
    } else {
      id = addAccount({ name: name.trim(), type, balance }).id
    }
    if (isDefault && data.settings.defaultAccountId !== id) updateSettings({ defaultAccountId: id })
    toast(editing ? 'Рахунок оновлено' : 'Рахунок додано')
    setOpen(false)
  }

  const remove = async () => {
    if (!editing) return
    if (stats.accountBalances.length <= 1) return toast('Має залишитися хоча б один рахунок', 'error')
    const used = data.transactions.some((t) => t.accountId === editing.id || t.toAccountId === editing.id)
    const ok = await confirm({
      title: `Видалити «${editing.name}»?`,
      message: used ? 'Рахунок має операції — він буде архівований, а історія та баланс залишаться коректними.' : 'Рахунок буде видалено.',
      confirmLabel: 'Видалити',
      danger: true,
    })
    if (!ok) return
    const result = deleteAccount(editing.id)
    toast(result === 'archived' ? 'Рахунок архівовано' : 'Рахунок видалено')
    setOpen(false)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Рахунки"
        back
        actions={
          <IconButton label="Додати рахунок" variant="primary" onClick={() => openForm(null)}>
            <Plus className="size-5" aria-hidden />
          </IconButton>
        }
      />
      <div className="space-y-4">
        <Card className="p-5">
          <p className="text-sm text-muted">Разом на всіх рахунках</p>
          <p className="tabular mt-1 text-[30px] leading-tight font-bold tracking-tight">{formatMoney(stats.balance)}</p>
        </Card>
        <Card className="divide-y divide-border overflow-hidden">
          {stats.accountBalances.map(({ account, balance }) => (
            <button key={account.id} type="button" onClick={() => openForm(account)} className="press flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-2">
              <CategoryIcon icon={ACCOUNT_TYPE_ICONS[account.type]} color={ACCOUNT_TYPE_COLORS[account.type]} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5">
                  <span className="truncate text-[15px] font-semibold">{account.name}</span>
                  {data.settings.defaultAccountId === account.id && <Star className="size-3.5 shrink-0 fill-warning text-warning" aria-label="Основний рахунок" />}
                </span>
                <span className="block text-sm text-muted">{ACCOUNT_TYPE_LABELS[account.type]}</span>
              </span>
              <span className={`tabular text-[15px] font-semibold ${balance < 0 ? 'text-expense' : ''}`}>{formatMoney(balance)}</span>
            </button>
          ))}
        </Card>
        <p className="px-1 text-sm text-muted">Баланс рахунку = початковий баланс + доходи − витрати ± перекази та повернення боргів.</p>
      </div>

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Редагувати рахунок' : 'Новий рахунок'}
        size="sm"
        footer={
          <div className="flex gap-3">
            {editing && (
              <Button variant="secondary" className="text-expense" icon={<Trash2 className="size-4" aria-hidden />} onClick={remove} aria-label="Видалити рахунок" />
            )}
            <Button block size="lg" onClick={save}>
              Зберегти
            </Button>
          </div>
        }
      >
        <form
          noValidate
          className="space-y-4 pt-1"
          onSubmit={(e) => {
            e.preventDefault()
            save()
          }}
        >
          <TextField label="Назва" value={name} maxLength={30} error={error} data-autofocus onChange={(e) => { setName(e.target.value); setError(null) }} />
          <SelectField
            label="Тип"
            value={type}
            onChange={(e) => setType(e.target.value as AccountType)}
            options={(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((t) => ({ value: t, label: ACCOUNT_TYPE_LABELS[t] }))}
          />
          <TextField
            label="Початковий баланс, ₴"
            inputMode="decimal"
            value={opening}
            placeholder="0"
            hint="Скільки грошей було на рахунку до початку обліку (для кредитки — з мінусом)"
            onChange={(e) => setOpening(e.target.value.replace(/[^\d.,-]/g, '').replace(/(?!^)-/g, ''))}
          />
          <Switch checked={isDefault} onChange={setIsDefault} label="Основний рахунок" description="Обирається автоматично для нових операцій" />
          <button type="submit" hidden />
        </form>
      </Sheet>
    </div>
  )
}
