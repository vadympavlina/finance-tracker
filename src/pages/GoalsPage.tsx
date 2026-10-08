import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Flag, Plus } from 'lucide-react'
import type { Goal } from '../types'
import { PageHeader } from '../components/common/PageHeader'
import { GoalCard } from '../components/goals/GoalCard'
import { GoalFormSheet } from '../components/goals/GoalFormSheet'
import { GoalDetailsSheet } from '../components/goals/GoalDetailsSheet'
import { Button, IconButton } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { ProgressBar } from '../components/ui/ProgressBar'
import { EmptyState } from '../components/ui/EmptyState'
import { useFinance } from '../hooks/useFinance'
import { calculateGoalProgress, calculateGoalsSummary } from '../services/calculations'
import { formatMoney, formatPercent } from '../utils/format'
import { FitText } from '../components/ui/FitText'

export default function GoalsPage() {
  const { data } = useFinance()
  const [params, setParams] = useSearchParams()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Goal | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = selectedId ? (data.goals.find((g) => g.id === selectedId) ?? null) : null

  useEffect(() => {
    if (params.get('new')) {
      setEditing(null)
      setFormOpen(true)
      setParams({}, { replace: true })
    } else if (params.get('goal')) {
      setSelectedId(params.get('goal'))
      setParams({}, { replace: true })
    }
  }, [params, setParams])

  const summary = useMemo(() => calculateGoalsSummary(data.goals), [data.goals])
  const progress = useMemo(
    () => data.goals.map((g) => calculateGoalProgress(g)).sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted)),
    [data.goals],
  )

  const create = () => {
    setEditing(null)
    setFormOpen(true)
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Цілі"
        back
        actions={
          <IconButton label="Нова ціль" variant="primary" onClick={create}>
            <Plus className="size-5" aria-hidden />
          </IconButton>
        }
      />
      {progress.length === 0 ? (
        <Card>
          <EmptyState
            icon={Flag}
            title="Ще немає фінансових цілей"
            description={'Відпустка, новий ноутбук чи подушка безпеки —\nпостав ціль і відстежуй прогрес.'}
            action={
              <Button icon={<Plus className="size-5" aria-hidden />} onClick={create}>
                Нова ціль
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-sm text-muted">Накопичено на цілі</p>
                <FitText as="p" className="tabular mt-1 text-[28px] leading-tight font-bold tracking-tight">{formatMoney(summary.saved)}</FitText>
                <p className="tabular text-sm text-muted">з {formatMoney(summary.target)}</p>
              </div>
              <span className="tabular rounded-full bg-primary-soft px-3 py-1 text-lg font-bold text-primary">{formatPercent(summary.percent)}</span>
            </div>
            <ProgressBar value={summary.percent} size="lg" className="mt-4" label="Загальний прогрес цілей" />
          </Card>
          <ul className="grid gap-3 sm:grid-cols-2">
            {progress.map((p) => (
              <li key={p.goal.id}>
                <GoalCard progress={p} onClick={() => setSelectedId(p.goal.id)} />
              </li>
            ))}
          </ul>
          <Button block size="lg" variant="soft" icon={<Plus className="size-5" aria-hidden />} onClick={create}>
            Нова ціль
          </Button>
        </div>
      )}

      {!formOpen && (
        <GoalDetailsSheet
          goal={selected}
          onClose={() => setSelectedId(null)}
          onEdit={(g) => {
            setEditing(g)
            setFormOpen(true)
          }}
        />
      )}
      <GoalFormSheet open={formOpen} onClose={() => setFormOpen(false)} goal={editing} />
    </div>
  )
}
