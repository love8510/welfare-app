'use client'
import { OrgRates } from '@/lib/insurance-rates'

interface Props { orgRates: OrgRates }

const cards = [
  {
    title: '국민연금',
    rows: [
      { label: '근로자', value: '4.5%' },
      { label: '사업주', value: '4.5%' },
    ],
  },
  {
    title: '건강보험',
    rows: [
      { label: '근로자', value: '3.545%' },
      { label: '사업주', value: '3.545%' },
      { label: '장기요양', value: '건강×12.95%' },
    ],
  },
  {
    title: '고용보험',
    rows: [
      { label: '근로자', value: '0.9%' },
    ],
    dynamic: (r: OrgRates) => [{ label: '사업주', value: `${r.employmentDevRate}%` }],
  },
  {
    title: '산재보험',
    dynamic: (r: OrgRates) => [
      { label: '사업주', value: `${r.industrialInsRate}%` },
      { label: '퇴직적립', value: `${r.severanceRate}%` },
    ],
  },
]

export function InsuranceRateCard({ orgRates }: Props) {
  return (
    <div className="grid grid-cols-4 gap-3 mb-4">
      {cards.map((card) => {
        const rows = [...(card.rows ?? []), ...(card.dynamic?.(orgRates) ?? [])]
        return (
          <div key={card.title} className="bg-white border rounded-lg p-3">
            <div className="text-xs font-bold text-gray-700 mb-2 border-b pb-1">{card.title}</div>
            {rows.map((r) => (
              <div key={r.label} className="flex justify-between text-xs text-gray-600 py-0.5">
                <span>{r.label}</span>
                <span className="font-medium text-blue-700">{r.value}</span>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
