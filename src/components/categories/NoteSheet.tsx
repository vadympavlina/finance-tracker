import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { CategoryNote } from '../../types'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/Button'
import { AutoTextarea } from '../ui/AutoTextarea'
import { DatePicker } from '../common/DatePicker'
import { useFinance } from '../../hooks/useFinance'
import { useConfirm, useToast } from '../../hooks/useUI'
import { fromDateTimeInputs, parseDate, toDateInput, toTimeInput } from '../../utils/date'

/** Edit or delete a category note. */
export function NoteSheet({ note, onClose }: { note: CategoryNote | null; onClose: () => void }) {
  const { updateNote, deleteNote } = useFinance()
  const confirm = useConfirm()
  const toast = useToast()
  const [text, setText] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!note) return
    const d = parseDate(note.date)
    setText(note.text)
    setDate(toDateInput(d))
    setTime(toTimeInput(d))
    setError(null)
  }, [note])

  if (!note) return null

  const save = () => {
    if (!text.trim()) return setError('Напиши коментар')
    updateNote(note.id, { text: text.trim(), date: fromDateTimeInputs(date, time) })
    toast('Нотатку збережено')
    onClose()
  }

  const remove = async () => {
    const ok = await confirm({ title: 'Видалити нотатку?', message: 'Цю дію не можна скасувати.', confirmLabel: 'Видалити', danger: true })
    if (!ok) return
    deleteNote(note.id)
    toast('Нотатку видалено')
    onClose()
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title="Нотатка"
      footer={
        <div className="flex gap-3">
          <Button variant="danger-soft" icon={<Trash2 className="size-[18px]" aria-hidden />} onClick={remove} aria-label="Видалити нотатку" />
          <Button block size="lg" onClick={save}>
            Зберегти
          </Button>
        </div>
      }
    >
      <div className="space-y-4 pt-1">
        <div className="space-y-1.5">
          <label htmlFor="note-text" className="text-sm font-medium text-muted">
            Коментар
          </label>
          <AutoTextarea
            id="note-text"
            data-autofocus
            value={text}
            maxLength={1000}
            aria-invalid={!!error}
            onChange={(e) => {
              setText(e.target.value)
              setError(null)
            }}
          />
          {error && (
            <p role="alert" className="text-sm font-medium text-expense">
              {error}
            </p>
          )}
        </div>
        <DatePicker date={date} onDateChange={setDate} time={time} onTimeChange={setTime} label="День і час" />
      </div>
    </Sheet>
  )
}
