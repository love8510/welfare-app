'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const DAYS = ['주', '일', '월', '화', '수', '목', '금', '토'] as const
const SERVICE_TYPES = ['전화상담', '방문', '교육', '기타']
const RESOURCES = ['재가복지', '외부기관', '자원봉사', '기타']

export interface PlanRow {
  id?: string
  day_of_week: string
  service_name: string
  resource: string
  provider: string
  start_time: string
  duration_min: number | ''
  end_time: string
  note: string
}

interface Props {
  value: PlanRow[]
  onChange: (rows: PlanRow[]) => void
}

function calcEndTime(start: string, mins: number): string {
  if (!start || !mins) return ''
  const [h, m] = start.split(':').map(Number)
  const total = h * 60 + m + mins
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

export function WeeklyServicePlan({ value, onChange }: Props) {
  function addRow(day: string) {
    onChange([...value, { day_of_week: day, service_name: '', resource: '', provider: '', start_time: '', duration_min: '', end_time: '', note: '' }])
  }

  function updateRow(idx: number, field: keyof PlanRow, val: string | number) {
    const rows = [...value]
    const row = { ...rows[idx], [field]: val }
    if (field === 'start_time' || field === 'duration_min') {
      row.end_time = calcEndTime(
        field === 'start_time' ? (val as string) : row.start_time,
        field === 'duration_min' ? (Number(val)) : Number(row.duration_min)
      )
    }
    rows[idx] = row
    onChange(rows)
  }

  function removeRow(idx: number) {
    onChange(value.filter((_, i) => i !== idx))
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-gray-50">
            {['요일', '', '서비스명', '자원', '담당자', '서비스종류', '시작시간', '소요(분)', '종료시간', '비고', '삭제'].map((h) => (
              <th key={h} className="border px-2 py-1.5 text-center font-semibold text-gray-600 whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DAYS.map((day) => {
            const rows = value.filter((r) => r.day_of_week === day)
            const allRows = rows.length > 0 ? rows : [null]
            return allRows.map((row, ri) => {
              const globalIdx = row ? value.indexOf(row) : -1
              return (
                <tr key={`${day}-${ri}`} className="hover:bg-blue-50">
                  {ri === 0 && (
                    <td className="border px-2 py-1 text-center font-medium bg-gray-50" rowSpan={rows.length || 1}>
                      {day}
                    </td>
                  )}
                  <td className="border px-1 py-1">
                    <Button type="button" variant="outline" size="sm" className="h-6 text-xs px-2" onClick={() => addRow(day)}>
                      +추가
                    </Button>
                  </td>
                  {row ? (
                    <>
                      <td className="border px-1"><Input className="h-6 text-xs w-24" value={row.service_name} onChange={(e) => updateRow(globalIdx, 'service_name', e.target.value)} /></td>
                      <td className="border px-1">
                        <Select value={row.resource} onValueChange={(v) => updateRow(globalIdx, 'resource', v)}>
                          <SelectTrigger className="h-6 text-xs w-20"><SelectValue placeholder="-" /></SelectTrigger>
                          <SelectContent>{RESOURCES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <td className="border px-1"><Input className="h-6 text-xs w-20" value={row.provider} onChange={(e) => updateRow(globalIdx, 'provider', e.target.value)} /></td>
                      <td className="border px-1">
                        <Select value={row.service_name} onValueChange={(v) => updateRow(globalIdx, 'service_name', v)}>
                          <SelectTrigger className="h-6 text-xs w-20"><SelectValue placeholder="-" /></SelectTrigger>
                          <SelectContent>{SERVICE_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </td>
                      <td className="border px-1"><Input type="time" className="h-6 text-xs w-24" value={row.start_time} onChange={(e) => updateRow(globalIdx, 'start_time', e.target.value)} /></td>
                      <td className="border px-1"><Input type="number" className="h-6 text-xs w-16" value={row.duration_min} onChange={(e) => updateRow(globalIdx, 'duration_min', e.target.value)} /></td>
                      <td className="border px-2 text-center text-gray-600">{row.end_time || '-'}</td>
                      <td className="border px-1"><Input className="h-6 text-xs w-20" value={row.note} onChange={(e) => updateRow(globalIdx, 'note', e.target.value)} /></td>
                      <td className="border px-1"><Button type="button" variant="destructive" size="sm" className="h-6 text-xs px-2" onClick={() => removeRow(globalIdx)}>삭제</Button></td>
                    </>
                  ) : (
                    <td colSpan={9} className="border" />
                  )}
                </tr>
              )
            })
          })}
        </tbody>
      </table>
    </div>
  )
}
