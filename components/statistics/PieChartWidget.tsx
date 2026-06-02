'use client'
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'

const PIE_COLORS = ['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed','#0891b2','#be185d','#65a30d','#94a3b8']

interface PieEntry {
  name: string
  value: number
}

interface Props {
  data: PieEntry[]
  width?: number
  height?: number
  onSelect?: (name: string) => void
}

export function PieChartWidget({ data, width = 320, height = 320, onSelect }: Props) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <PieChart width={width} height={height}>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={110}
        dataKey="value"
        nameKey="name"
        label={({ name, percent }: { name?: string; percent?: number }) => `${name ?? ''} ${((percent ?? 0) * 100).toFixed(1)}%`}
        labelLine={false}
        onClick={(entry) => entry.name && onSelect?.(entry.name as string)}
      >
        {data.map((_, i) => (
          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
        ))}
      </Pie>
      <Tooltip />
      <Legend />
    </PieChart>
  )
}
