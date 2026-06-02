interface Props { planned: number; actual: number }

export function PlanVsActualBadge({ planned, actual }: Props) {
  if (!planned) return <span className="text-gray-300">-</span>
  const rate = Math.round((actual / planned) * 100)
  const color =
    rate >= 100 ? 'bg-green-100 text-green-700' :
    rate >= 80  ? 'bg-blue-100 text-blue-700' :
    rate >= 50  ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold ${color}`}>
      {rate}%
    </span>
  )
}
