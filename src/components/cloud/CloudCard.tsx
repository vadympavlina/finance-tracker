import { Cloud, CloudOff, LogOut, RefreshCw, TriangleAlert, Smartphone } from 'lucide-react'
import { Card } from '../ui/Card'
import { Button } from '../ui/Button'
import { useCloud } from '../../hooks/useCloud'
import { useConfirm, useToast } from '../../hooks/useUI'
import { cloudSync, type SyncState } from '../../services/cloud'
import { formatTime } from '../../utils/date'
import { cn } from '../../utils/cn'

const STATUS: Record<string, { text: string; tone: string }> = {
  connecting: { text: 'Підключення…', tone: 'text-muted' },
  synced: { text: 'Синхронізовано', tone: 'text-income' },
  saving: { text: 'Зберігаємо…', tone: 'text-muted' },
  offline: { text: 'Немає інтернету — зміни відправляться пізніше', tone: 'text-warning' },
  error: { text: 'Помилка синхронізації', tone: 'text-expense' },
  starting: { text: 'Підключення…', tone: 'text-muted' },
}

function statusLine(s: SyncState) {
  const base = STATUS[s.status] ?? STATUS.connecting
  const when = s.status === 'synced' && s.lastSyncedAt ? ` · ${formatTime(s.lastSyncedAt)}` : ''
  return { ...base, text: base.text + when }
}

/** Account + sync status on the Profile screen. */
export function CloudCard() {
  const cloud = useCloud()
  const confirm = useConfirm()
  const toast = useToast()

  if (!cloud.user) {
    return (
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-surface-3 text-muted">
            <Smartphone className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.9375rem] font-semibold">Дані лише на цьому пристрої</p>
            <p className="mt-0.5 text-sm leading-snug text-muted">Увійди, щоб зберігати їх у хмарі й бачити на всіх пристроях.</p>
          </div>
        </div>
        <Button block className="mt-4" icon={<Cloud className="size-5" aria-hidden />} onClick={() => cloudSync.requestLogin()}>
          Увійти або зареєструватися
        </Button>
      </Card>
    )
  }

  const line = statusLine(cloud)
  const Icon = cloud.status === 'error' ? TriangleAlert : cloud.status === 'offline' ? CloudOff : Cloud
  const signOut = async () => {
    const ok = await confirm({
      title: 'Вийти з облікового запису?',
      message:
        cloud.status === 'offline' || cloud.status === 'saving' || cloud.status === 'error'
          ? 'Частину змін ще не відправлено в хмару — після виходу вони зникнуть. Краще дочекатися інтернету.'
          : 'Дані залишаться в хмарі. З цього пристрою їх буде прибрано — після входу вони повернуться. Так на одному пристрої можуть по черзі працювати різні люди.',
      confirmLabel: 'Вийти',
      danger: true,
    })
    if (!ok) return
    await cloudSync.signOut()
    toast('Вихід виконано')
  }

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            'grid size-10 shrink-0 place-items-center rounded-full',
            cloud.status === 'error' ? 'bg-expense-soft text-expense' : cloud.status === 'offline' ? 'bg-warning-soft text-warning' : 'bg-primary-soft text-primary',
          )}
        >
          <Icon className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[0.9375rem] font-semibold break-words">{cloud.user.email ?? cloud.user.displayName ?? 'Обліковий запис'}</p>
          <p className={cn('mt-0.5 text-sm leading-snug', line.tone)} role="status" aria-live="polite">
            {line.text}
          </p>
          {cloud.status === 'error' && cloud.error && <p className="mt-1 text-sm leading-snug text-muted break-words">{cloud.error}</p>}
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {cloud.status === 'error' && (
          <Button size="sm" variant="soft" icon={<RefreshCw className="size-4" aria-hidden />} onClick={() => cloudSync.retry()}>
            Спробувати ще
          </Button>
        )}
        <Button size="sm" variant="secondary" icon={<LogOut className="size-4" aria-hidden />} onClick={() => void signOut()}>
          Вийти
        </Button>
      </div>
    </Card>
  )
}
