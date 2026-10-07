import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { IconButton } from '../ui/Button'

interface PageHeaderProps {
  title: string
  subtitle?: string
  back?: boolean | string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, back, actions }: PageHeaderProps) {
  const navigate = useNavigate()
  const goBack = () => {
    if (typeof back === 'string') navigate(back)
    else if (window.history.state?.idx > 0) navigate(-1)
    else navigate('/')
  }
  return (
    <header className="flex min-h-14 items-center gap-3 pt-2 pb-4 lg:pt-0">
      {back && (
        <IconButton label="Назад" onClick={goBack} className="-ml-1">
          <ChevronLeft className="size-5" aria-hidden />
        </IconButton>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-[26px] leading-tight font-bold tracking-tight lg:text-3xl">{title}</h1>
        {subtitle && <p className="mt-0.5 truncate text-sm text-muted">{subtitle}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  )
}
