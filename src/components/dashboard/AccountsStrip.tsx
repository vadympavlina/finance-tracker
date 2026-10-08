import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import type { Account } from '../../types'
import { ACCOUNT_TYPE_COLORS, ACCOUNT_TYPE_ICONS } from '../../data/defaults'
import { CategoryIcon } from '../common/CategoryIcon'
import { formatMoney } from '../../utils/format'

interface Props {
  items: Array<{ account: Account; balance: number }>
  hidden: boolean
}

export function AccountsStrip({ items, hidden }: Props) {
  return (
    <ul className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0">
      {items.map(({ account, balance }) => (
        <li key={account.id} className="min-w-[172px] snap-start">
          <Link to="/accounts" className="press flex items-center gap-3 rounded-3xl border border-border bg-surface p-3.5 shadow-card hover:border-border-strong">
            <CategoryIcon icon={ACCOUNT_TYPE_ICONS[account.type]} color={ACCOUNT_TYPE_COLORS[account.type]} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-[13px] text-muted">{account.name}</span>
              <span className={`tabular block text-[15px] font-semibold ${balance < 0 ? 'text-expense' : ''}`}>{hidden ? '•••• ₴' : formatMoney(balance)}</span>
            </span>
          </Link>
        </li>
      ))}
      <li className="snap-start sm:hidden">
        <Link to="/accounts" aria-label="Керувати рахунками" className="press grid h-full min-h-[68px] w-14 place-items-center rounded-3xl border border-dashed border-border-strong text-muted">
          <Plus className="size-5" aria-hidden />
        </Link>
      </li>
    </ul>
  )
}
