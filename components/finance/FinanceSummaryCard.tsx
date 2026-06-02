'use client'

interface Props {
  label: string
  value: string
  color?: 'blue' | 'green' | 'red' | 'yellow'
}

const colorMap = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  green: 'bg-green-50 border-green-200 text-green-700',
  red: 'bg-red-50 border-red-200 text-red-700',
  yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
}

export function FinanceSummaryCard({ label, value, color = 'blue' }: Props) {
  return (
    <div className={`rounded-lg border p-4 flex flex-col gap-1 flex-1 min-w-0 ${colorMap[color]}`}>
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</div>
      <div className="text-xl font-bold truncate">{value}</div>
    </div>
  )
}
