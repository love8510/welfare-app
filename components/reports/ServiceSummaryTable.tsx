'use client'
import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getServiceSummary } from '@/lib/actions/reports'
import { getWorkerListForOrg } from '@/lib/actions/clients'
import { toast } from '@/lib/hooks/use-toast'
import * as XLSX from 'xlsx'

interface SummaryRow { month: number; service_type: string; total_count: number }

export function ServiceSummaryTable() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState<string>('전체')
  const [workerId, setWorkerId] = useState('전체')
  const [workers, setWorkers] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [rows, setRows] = useState<SummaryRow[]>([])

  useEffect(() => { getWorkerListForOrg().then(setWorkers).catch(() => {}) }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getServiceSummary(year, month === '전체' ? undefined : Number(month), workerId === '전체' ? undefined : workerId)
      setRows(data as SummaryRow[])
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setLoading(false)
    }
  }, [year, month, workerId])

  useEffect(() => { load() }, [load])

  const serviceTypes = Array.from(new Set(rows.map((r) => r.service_type).filter(Boolean)))
  const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

  function getCount(st: string, m: number) {
    return rows.filter((r) => r.service_type === st && r.month === m).reduce((s, r) => s + r.total_count, 0)
  }
  function getTotal(st: string) {
    return MONTHS.reduce((s, m) => s + getCount(st, m), 0)
  }
  function getMonthTotal(m: number) {
    return serviceTypes.reduce((s, st) => s + getCount(st, m), 0)
  }
  const grandTotal = serviceTypes.reduce((s, st) => s + getTotal(st), 0)

  function downloadExcel() {
    const header = ['서비스종류', ...MONTHS.map((m) => `${m}월`), '합계']
    const dataRows = serviceTypes.map((st) => [st, ...MONTHS.map((m) => getCount(st, m) || ''), getTotal(st)])
    const totalRow = ['합 계', ...MONTHS.map((m) => getMonthTotal(m) || ''), grandTotal]
    const ws = XLSX.utils.aoa_to_sheet([header, ...dataRows, totalRow])
    ws['!cols'] = [{wch:16}, ...Array(13).fill({wch:8})]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '서비스제공집계표')
    XLSX.writeFile(wb, `서비스제공집계표_${year}년.xlsx`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-xl font-bold">서비스제공집계표</h1>
        <div className="flex items-center gap-1 ml-4">
          <Button variant="outline" size="sm" onClick={() => setYear((y) => y - 1)}>{'<'}</Button>
          <span className="w-14 text-center font-semibold">{year}</span>
          <Button variant="outline" size="sm" onClick={() => setYear((y) => y + 1)}>{'>'}</Button>
        </div>
        <Select value={month} onValueChange={setMonth}>
          <SelectTrigger className="w-20 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="전체">전체</SelectItem>
            {MONTHS.map((m) => <SelectItem key={m} value={String(m)}>{m}월</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={workerId} onValueChange={setWorkerId}>
          <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="전체">전체</SelectItem>
            {workers.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={load}>조회</Button>
        <Button variant="outline" size="sm" onClick={downloadExcel}>엑셀출력</Button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">불러오는 중...</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="px-3 py-2 text-left font-semibold border-r">서비스종류</th>
                {MONTHS.map((m) => <th key={m} className="px-2 py-2 text-center font-semibold text-xs border-r">{m}월</th>)}
                <th className="px-3 py-2 text-center font-bold">합계</th>
              </tr>
            </thead>
            <tbody>
              {serviceTypes.length === 0 ? (
                <tr><td colSpan={14} className="text-center py-8 text-gray-400">데이터가 없습니다</td></tr>
              ) : (
                <>
                  {serviceTypes.map((st) => (
                    <tr key={st} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium border-r">{st}</td>
                      {MONTHS.map((m) => <td key={m} className="px-2 py-2 text-center border-r">{getCount(st, m) || ''}</td>)}
                      <td className="px-3 py-2 text-center font-bold">{getTotal(st)}</td>
                    </tr>
                  ))}
                  <tr className="bg-blue-50 font-bold border-b">
                    <td className="px-3 py-2 border-r">합  계</td>
                    {MONTHS.map((m) => <td key={m} className="px-2 py-2 text-center border-r">{getMonthTotal(m) || ''}</td>)}
                    <td className="px-3 py-2 text-center">{grandTotal}</td>
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
