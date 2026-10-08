import { CloudUpload, Cloud, Sparkles } from 'lucide-react'
import { Sheet } from '../ui/Sheet'
import { ActionRow } from '../ui/ActionRow'
import { useCloud } from '../../hooks/useCloud'
import { cloudSync } from '../../services/cloud'
import { pluralUk } from '../../utils/format'

const ops = (n: number) => `${n} ${pluralUk(n, ['операція', 'операції', 'операцій'])}`

/** First sign-in on a device that already has data: what to keep. */
export function SyncDecisionSheet() {
  const { decision } = useCloud()
  if (!decision) return null
  const both = decision.kind === 'both'
  return (
    <Sheet
      open
      onClose={() => cloudSync.resolveDecision(both ? 'cloud' : 'upload')}
      title={both ? 'У хмарі вже є дані' : 'Перенести дані в обліковий запис?'}
      description={
        both
          ? `В обліковому записі — ${ops(decision.cloudTransactions)}, на цьому пристрої — ${ops(decision.localTransactions)}. Обери, що залишити.`
          : `На цьому пристрої вже є ${ops(decision.localTransactions)}. Їх можна зберегти в хмарі або почати з чистого аркуша.`
      }
    >
      <div className="space-y-2 pb-1">
        {both ? (
          <>
            <ActionRow icon={Cloud} label="Використати дані з хмари" hint="Рекомендовано. Дані цього пристрою буде замінено." onClick={() => cloudSync.resolveDecision('cloud')} />
            <ActionRow icon={CloudUpload} label="Замінити хмару даними з пристрою" hint="Дані в обліковому записі буде перезаписано." danger onClick={() => cloudSync.resolveDecision('upload')} />
          </>
        ) : (
          <>
            <ActionRow icon={CloudUpload} label="Перенести в обліковий запис" hint="Усе, що є зараз, синхронізується." onClick={() => cloudSync.resolveDecision('upload')} />
            <ActionRow icon={Sparkles} label="Почати з чистого" hint="Порожній облік зі стандартними категоріями." onClick={() => cloudSync.resolveDecision('fresh')} />
          </>
        )}
      </div>
    </Sheet>
  )
}
