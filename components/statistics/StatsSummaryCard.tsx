'use client'
import { useRouter } from 'next/navigation'

interface Props {
  label: string
  value: string | number
  subLabel?: string
  color?: 'blue' | 'green' | 'yellow' | 'red'
  href?: string
}

const colorMap = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  green: 'bg-green-50 border-green-200 text-green-700',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
  red: 'bg-red-50 border-red-200 text-red-700',
}

export function StatsSummaryCard({ label, value, subLabel, color = 'blue', href }: Props) {
  const router = useRouter()
  return (
    <div
      className={`rounded-lg border p-4 flex flex-col gap-1 flex-1 min-w-0 ${colorMap[color]} ${href ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
      onClick={() => href && router.push(href)}
    >
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      {subLabel && <div className="text-xs text-gray-500">{subLabel}</div>}
    </div>
  )
}
