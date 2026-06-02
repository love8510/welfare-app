'use client'
import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getInsuranceSummary } from '@/lib/actions/salary'
import { toast } from '@/lib/hooks/use-toast'
import * as XLSX from 'xlsx'

type Row = Record<string, unknown>
function fmt(n: unknown) { return Number(n ?? 0).toLocaleString('ko-KR') }

export default function InsurancePage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getInsuranceSummary(year, month)
      setRows(data as Row[])
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setLoading(false)
    }
  }, [year, month])

  useEffect(() => { load() }, [load])

  function sum(field: string) { return rows.reduce((s, r) => s + Number(r[field] ?? 0), 0) }

  function downloadExcel() {
    const headers = ['No','성명','직책','기본급','국민연금(근)','국민연금(사)','건강보험(근)','건강보험(사)','장기요양(근)','장기요양(사)','고용보험(근)','고용보험(사)','산재보험(사)','퇴직적립금']
    const dataRows = rows.map((r, i) => {
      const u = r.users as Record<string, string>
      return [i+1, u?.name, u?.job_title,
        r.base_salary, r.national_pension_ee, r.national_pension_er,
        r.health_insurance_ee, r.health_insurance_er,
        r.long_term_care_ee, r.long_term_care_er,
        r.employment_ins_ee, r.employment_ins_er,
        r.industrial_ins_er, r.severance_reserve]
    })
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows])
    ws['!cols'] = Array(14).fill({wch:12})
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '4대보험가입내역')
    XLSX.writeFile(wb, `4대보험가입내역_${year}년${month}월.xlsx`)
  }

  const COL_DEFS = [
    { label: '국민연금(근)', key: 'national_pension_ee' },
    { label: '국민연금(사)', key: 'national_pension_er' },
    { label: '건강보험(근)', key: 'health_insurance_ee' },
    { label: '건강보험(사)', key: 'health_insurance_er' },
    { label: '장기요양(근)', key: 'long_term_care_ee' },
    { label: '장기요양(사)', key: 'long_term_care_er' },
    { label: '고용보험(근)', key: 'employment_ins_ee' },
    { label: '고용보험(사)', key: 'employment_ins_er' },
    { label: '산재보험(사)', key: 'industrial_ins_er' },
    { label: '퇴직적립금', key: 'severance_reserve' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold">4대보험 가입내역</h1>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setYear((y) => y - 1)}>{'<'}</Button>
            <span className="w-14 text-center font-semibold">{year}</span>
            <Button variant="outline" size="sm" onClick={() => setYear((y) => y + 1)}>{'>'}</Button>
          </div>
          <Select value={String(month)} onValueChange={(v) => setMonth(Number(v))}>
            <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <SelectItem key={m} value={String(m)}>{m}월</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={load}>조회</Button>
          <Button variant="outline" size="sm" onClick={downloadExcel}>엑셀출력</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">불러오는 중...</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-2 py-2.5 text-center font-semibold border-r">No</th>
                <th className="px-2 py-2.5 text-center font-semibold border-r">성명</th>
                <th className="px-2 py-2.5 text-center font-semibold border-r">직책</th>
                <th className="px-2 py-2.5 text-center font-semibold border-r">기본급</th>
                {COL_DEFS.map((c) => (
                  <th key={c.key} className="px-2 py-2.5 text-center font-semibold border-r whitespace-nowrap">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={14} className="text-center py-8 text-gray-400">데이터가 없습니다</td></tr>
              ) : (
                <>
                  {rows.map((r, i) => {
                    const u = r.users as Record<string, string>
                    return (
                      <tr key={r.id as string} className="border-b hover:bg-gray-50">
                        <td className="px-2 py-2 text-center border-r">{i + 1}</td>
                        <td className="px-2 py-2 font-medium border-r">{u?.name}</td>
                        <td className="px-2 py-2 text-center border-r text-gray-600">{u?.job_title}</td>
                        <td className="px-2 py-2 text-right border-r">{fmt(r.base_salary)}</td>
                        {COL_DEFS.map((c) => (
                          <td key={c.key} className="px-2 py-2 text-right border-r">{fmt(r[c.key])}</td>
                        ))}
                      </tr>
                    )
                  })}
                  <tr className="bg-gray-50 font-bold border-t-2 text-xs">
                    <td colSpan={3} className="px-2 py-2 text-center border-r">합 계</td>
                    <td className="px-2 py-2 text-right border-r">{fmt(sum('base_salary'))}</td>
                    {COL_DEFS.map((c) => (
                      <td key={c.key} className="px-2 py-2 text-right border-r">{fmt(sum(c.key))}</td>
                    ))}
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
