import { AlertTriangle } from 'lucide-react'
import { Sheet } from './Sheet'
import { Button } from './Button'

export interface ConfirmOptions {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

interface ConfirmDialogProps extends ConfirmOptions {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Підтвердити', cancelLabel = 'Скасувати', danger, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <Sheet open={open} onClose={onCancel} title={title} alert size="sm" hideTitle>
      <div className="flex flex-col items-center pt-4 text-center">
        <div className={`mb-4 grid size-14 place-items-center rounded-full ${danger ? 'bg-expense-soft text-expense' : 'bg-primary-soft text-primary'}`}>
          <AlertTriangle className="size-6" aria-hidden />
        </div>
        <p className="text-lg font-semibold" aria-hidden>
          {title}
        </p>
        {message && <p className="mt-2 text-sm leading-relaxed text-muted">{message}</p>}
        <div className="mt-6 grid w-full grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onCancel} data-autofocus>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
