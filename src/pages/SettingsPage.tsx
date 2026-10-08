import { useRef, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  ChevronRight,
  CreditCard,
  Database,
  Download,
  Info,
  LayoutGrid,
  RotateCcw,
  Trash2,
  Upload,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { CurrencyCode, FinanceData, TextSize, ThemeMode } from '../types'
import { PageHeader } from '../components/common/PageHeader'
import { Card } from '../components/ui/Card'
import { Segmented } from '../components/ui/Tabs'
import { Sheet } from '../components/ui/Sheet'
import { Button } from '../components/ui/Button'
import { SelectField, Switch, TextField } from '../components/ui/Field'
import { useFinance } from '../hooks/useFinance'
import { useConfirm, useToast } from '../hooks/useUI'
import { buildExport, parseImportFile, type ImportSummary } from '../services/storage'
import { CURRENCIES } from '../utils/format'
import { formatFullDate, toDateInput } from '../utils/date'
import { cn } from '../utils/cn'

const APP_VERSION = '1.0.0'

export default function SettingsPage() {
  const { data, updateSettings, replaceAll, resetToDemo, clearAll } = useFinance()
  const confirm = useConfirm()
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)
  const [aboutOpen, setAboutOpen] = useState(false)
  const [importPreview, setImportPreview] = useState<{ data: FinanceData; summary: ImportSummary; fileName: string } | null>(null)
  const { settings } = data

  const exportData = () => {
    try {
      const json = JSON.stringify(buildExport(data), null, 2)
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `finance-tracker-${toDateInput(new Date())}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      toast('Дані експортовано')
    } catch {
      toast('Не вдалося експортувати дані', 'error')
    }
  }

  const onFile = async (file: File | undefined) => {
    if (fileRef.current) fileRef.current.value = ''
    if (!file) return
    if (file.size > 15 * 1024 * 1024) return toast('Файл завеликий', 'error')
    let text: string
    try {
      text = await file.text()
    } catch {
      return toast('Не вдалося прочитати файл', 'error')
    }
    const result = parseImportFile(text)
    if (!result.ok) return toast(result.error, 'error')
    setImportPreview({ data: result.data, summary: result.summary, fileName: file.name })
  }

  const confirmImport = async () => {
    if (!importPreview) return
    const ok = await confirm({ title: 'Імпорт замінить поточні дані. Продовжити?', message: 'Порада: спершу експортуй поточні дані як резервну копію.', confirmLabel: 'Імпортувати', danger: true })
    if (!ok) return
    try {
      await replaceAll(importPreview.data)
      setImportPreview(null)
      toast('Дані імпортовано')
    } catch {
      toast('Не вдалося зберегти імпортовані дані', 'error')
    }
  }

  const onReset = async () => {
    const ok = await confirm({ title: 'Завантажити демо-дані?', message: 'Поточні дані буде замінено прикладом. Цю дію не можна скасувати.', confirmLabel: 'Завантажити', danger: true })
    if (!ok) return
    await resetToDemo()
    toast('Демо-дані завантажено')
  }

  const onClear = async () => {
    const ok = await confirm({
      title: 'Очистити всі дані?',
      message: 'Буде видалено всі операції, бюджети, борги, цілі та власні категорії. Цю дію не можна скасувати.',
      confirmLabel: 'Очистити',
      danger: true,
    })
    if (!ok) return
    await clearAll()
    toast('Дані очищено')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Налаштування" back />
      <div className="space-y-6">
        <Group title="Облік">
          <LinkRow to="/categories" icon={LayoutGrid} label="Категорії" hint={`${data.categories.filter((c) => !c.isArchived).length} активних`} />
          <LinkRow to="/budgets" icon={Wallet} label="Бюджети" hint={`${data.budgets.length} встановлено`} />
          <LinkRow to="/accounts" icon={CreditCard} label="Рахунки" hint={`${data.accounts.filter((a) => !a.isArchived).length} рахунки`} />
        </Group>

        <Group title="Нагадування" icon={Bell}>
          <div className="px-4 py-1">
            <Switch
              checked={settings.reminders.daily}
              onChange={(v) => updateSettings({ reminders: { ...settings.reminders, daily: v } })}
              label="Щоденне нагадування"
              description="Якщо за день не додано жодної операції"
            />
            {settings.reminders.daily && (
              <div className="pb-3">
                <TextField
                  label="Після"
                  type="time"
                  value={settings.reminders.dailyTime}
                  onChange={(e) => e.target.value && updateSettings({ reminders: { ...settings.reminders, dailyTime: e.target.value } })}
                  className="w-36"
                />
              </div>
            )}
          </div>
          <div className="px-4 py-1">
            <Switch
              checked={settings.reminders.debts}
              onChange={(v) => updateSettings({ reminders: { ...settings.reminders, debts: v } })}
              label="Терміни боргів"
              description="Прострочені та ті, що мають повернути за 3 дні"
            />
          </div>
          <div className="px-4 py-1">
            <Switch
              checked={settings.reminders.budgets}
              onChange={(v) => updateSettings({ reminders: { ...settings.reminders, budgets: v } })}
              label="Перевищення бюджету"
              description="Показувати на головній"
            />
          </div>
        </Group>

        <Group title="Вигляд">
          <div className="space-y-4 p-4">
            <div>
              <p className="mb-2 text-sm font-medium text-muted">Тема</p>
              <Segmented<ThemeMode>
                label="Тема"
                value={settings.theme}
                onChange={(theme) => updateSettings({ theme })}
                options={[
                  { value: 'light', label: 'Світла' },
                  { value: 'dark', label: 'Темна' },
                  { value: 'system', label: 'Системна' },
                ]}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-muted">Розмір тексту</p>
              <Segmented<TextSize>
                label="Розмір тексту"
                value={settings.textSize ?? 'md'}
                onChange={(textSize) => updateSettings({ textSize })}
                options={[
                  { value: 'sm', label: 'Аа−' },
                  { value: 'md', label: 'Аа' },
                  { value: 'lg', label: 'Аа+' },
                  { value: 'xl', label: 'Аа++' },
                ]}
              />
              <p className="mt-2 text-[0.8125rem] text-muted" aria-live="polite">
                {{ sm: 'Малий', md: 'Звичайний', lg: 'Великий', xl: 'Дуже великий' }[settings.textSize ?? 'md']} — так виглядатиме текст у всьому застосунку.
              </p>
            </div>
            <SelectField
              label="Валюта"
              value={settings.currency}
              onChange={(e) => {
                updateSettings({ currency: e.target.value as CurrencyCode })
                toast('Валюту змінено')
              }}
              options={(Object.keys(CURRENCIES) as CurrencyCode[]).map((c) => ({ value: c, label: CURRENCIES[c].label }))}
            />
            <p className="text-xs text-subtle">Змінюється лише символ відображення — суми не конвертуються.</p>
          </div>
        </Group>

        <Group title="Дані" icon={Database}>
          <ActionRow icon={Download} label="Експорт даних" hint="Зберегти резервну копію у JSON" onClick={exportData} />
          <ActionRow icon={Upload} label="Імпорт даних" hint="Відновити з JSON-файлу" onClick={() => fileRef.current?.click()} />
          <ActionRow icon={RotateCcw} label="Завантажити демо-дані" hint="Приклад для ознайомлення" onClick={onReset} />
          <ActionRow icon={Trash2} label="Очистити всі дані" hint="Почати з нуля" onClick={onClear} danger />
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} aria-hidden tabIndex={-1} />
        </Group>

        <Group title="Інше">
          <ActionRow icon={Info} label="Про застосунок" hint={`Версія ${APP_VERSION}`} onClick={() => setAboutOpen(true)} />
        </Group>
      </div>

      <Sheet
        open={!!importPreview}
        onClose={() => setImportPreview(null)}
        title="Імпорт даних"
        description={importPreview?.fileName}
        size="sm"
        footer={
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => setImportPreview(null)}>
              Скасувати
            </Button>
            <Button onClick={confirmImport}>Імпортувати</Button>
          </div>
        }
      >
        {importPreview && (
          <div className="space-y-3">
            <p className="text-sm text-muted">
              Файл перевірено ✓{importPreview.summary.exportedAt ? ` Створено ${formatFullDate(importPreview.summary.exportedAt)}.` : ''}
            </p>
            <dl className="grid grid-cols-2 gap-2 text-sm">
              {(
                [
                  ['Операції', importPreview.summary.transactions],
                  ['Категорії', importPreview.summary.categories],
                  ['Рахунки', importPreview.summary.accounts],
                  ['Бюджети', importPreview.summary.budgets],
                  ['Борги', importPreview.summary.debts],
                  ['Цілі', importPreview.summary.goals],
                ] as const
              ).map(([label, n]) => (
                <div key={label} className="rounded-xl bg-surface-2 px-3 py-2">
                  <dt className="text-muted">{label}</dt>
                  <dd className="tabular text-lg font-bold">{n}</dd>
                </div>
              ))}
            </dl>
            <p className="rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning">Імпорт замінить усі поточні дані.</p>
          </div>
        )}
      </Sheet>

      <Sheet open={aboutOpen} onClose={() => setAboutOpen(false)} title="Про застосунок" size="sm">
        <div className="space-y-3 text-sm leading-relaxed text-muted">
          <p>
            <strong className="text-text">Finance Tracker</strong> — персональний облік доходів, витрат, бюджетів, боргів і фінансових цілей.
          </p>
          <p>Усі дані зберігаються лише у твоєму браузері (localStorage) і нікуди не надсилаються. Роби експорт, щоб мати резервну копію або перенести дані на інший пристрій.</p>
          <p>Застосунок можна встановити на головний екран смартфона — він працює і без інтернету.</p>
          <p className="text-subtle">Версія {APP_VERSION}</p>
        </div>
      </Sheet>
    </div>
  )
}

function Group({ title, icon: Icon, children }: { title: string; icon?: LucideIcon; children: ReactNode }) {
  return (
    <section aria-label={title}>
      <h2 className="mb-2 flex items-center gap-1.5 px-1 text-sm font-semibold text-muted">
        {Icon && <Icon className="size-4" aria-hidden />}
        {title}
      </h2>
      <Card className="divide-y divide-border overflow-hidden">{children}</Card>
    </section>
  )
}

function LinkRow({ to, icon: Icon, label, hint }: { to: string; icon: LucideIcon; label: string; hint?: string }) {
  return (
    <Link to={to} className="press flex min-h-14 items-center gap-3 px-4 py-3 hover:bg-surface-2">
      <Icon className="size-5 text-muted" aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem] font-medium">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
      <ChevronRight className="size-5 text-subtle" aria-hidden />
    </Link>
  )
}

function ActionRow({ icon: Icon, label, hint, onClick, danger }: { icon: LucideIcon; label: string; hint?: string; onClick: () => void; danger?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={cn('press flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-2', danger && 'text-expense')}>
      <Icon className={cn('size-5', danger ? 'text-expense' : 'text-muted')} aria-hidden />
      <span className="min-w-0 flex-1">
        <span className="block text-[0.9375rem] font-medium">{label}</span>
        {hint && <span className={cn('block text-sm', danger ? 'text-expense/80' : 'text-muted')}>{hint}</span>}
      </span>
      <ChevronRight className="size-5 text-subtle" aria-hidden />
    </button>
  )
}
