'use client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const COLORS: Record<string, string> = {
  '전화상담': '#2563eb',
  '방문': '#16a34a',
  '교육': '#d97706',
  '프로그램': '#dc2626',
  '사례관리': '#7c3aed',
  '기타': '#94a3b8',
}

const COLOR_LIST = ['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed','#0891b2','#be185d','#65a30d','#94a3b8']

interface Props {
  data: Record<string, unknown>[]
  dataKeys: string[]
  xDataKey?: string
  xFormatter?: (val: unknown) => string
  height?: number
  stacked?: boolean
  horizontal?: boolean
}

export function BarChartWidget({ data, dataKeys, xDataKey = 'month', xFormatter, height = 320, stacked = false, horizontal = false }: Props) {
  if (horizontal) {
    return (
      <ResponsiveContainer width="100%" height={Math.max(height, dataKeys.length * 40 + 60)}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey={xDataKey} width={80} />
          <Tooltip />
          <Legend />
          {dataKeys.map((key, i) => (
            <Bar key={key} dataKey={key} fill={COLORS[key] || COLOR_LIST[i % COLOR_LIST.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xDataKey} tickFormatter={xFormatter ?? ((m) => `${m}월`)} />
        <YAxis />
        <Tooltip />
        <Legend />
        {dataKeys.map((key, i) => (
          <Bar
            key={key}
            dataKey={key}
            stackId={stacked ? 'a' : undefined}
            fill={COLORS[key] || COLOR_LIST[i % COLOR_LIST.length]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
