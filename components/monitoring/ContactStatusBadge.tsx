import { ContactStatus } from '@/lib/actions/monitoring'

interface Props {
  status: ContactStatus
  days?: number
  size?: 'sm' | 'md'
}

const CONFIG = {
  normal:  { label: '정상',    icon: '🟢', cls: 'bg-green-100 text-green-800 border-green-300' },
  warning: { label: '주의',    icon: '🟡', cls: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  danger:  { label: '위험',    icon: '🔴', cls: 'bg-red-100 text-red-800 border-red-300' },
  never:   { label: '접촉없음', icon: '⚪', cls: 'bg-gray-100 text-gray-700 border-gray-300' },
}

export function ContactStatusBadge({ status, days, size = 'md' }: Props) {
  const cfg = CONFIG[status] ?? CONFIG.never
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm'
  const daysText = status === 'never' ? '' : days !== undefined && days < 9999 ? ` ${days}일 미접촉` : ''
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border font-semibold ${textSize} ${cfg.cls}`}>
      <span>{cfg.icon}</span>
      <span>{cfg.label}{daysText}</span>
    </span>
  )
}
