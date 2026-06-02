'use client'
import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InsuranceRateCard } from './InsuranceRateCard'
import { SalarySlipModal } from './SalarySlipModal'
import { getSalaryList, confirmSalary, unconfirmSalary, getOrgRates, bulkCreateSalary } from '@/lib/actions/salary'
import { getDepartments } from '@/lib/actions/staff'
import { OrgRates, DEFAULT_ORG_RATES } from '@/lib/insurance-rates'
import { toast } from '@/lib/hooks/use-toast'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'

type SalaryRow = Record<string, unknown>

function fmt(n: unknown) { return Number(n ?? 0).toLocaleString('ko-KR') }

interface Props { initialYear?: number; initialMonth?: number }

export function SalaryTable({ initialYear, initialMonth }: Props) {
  const now = new Date()
  const [year, setYear] = useState(initialYear ?? now.getFullYear())
  const [month, setMonth] = useState(initialMonth ?? now.getMonth() + 1)
  const [deptId, setDeptId] = useState('전체')
  const [rows, setRows] = useState<SalaryRow[]>([])
  const [depts, setDepts] = useState<{ id: string; name: string }[]>([])
  const [orgRates, setOrgRates] = useState<OrgRates>(DEFAULT_ORG_RATES)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    getDepartments().then(setDepts).catch(() => {})
    getOrgRates().then(setOrgRates).catch(() => {})
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getSalaryList(year, month, deptId === '전체' ? undefined : deptId)
      setRows(data as SalaryRow[])
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setLoading(false)
    }
  }, [year, month, deptId])

  useEffect(() => { load() }, [load])

  async function handleConfirm(id: string, confirmed: boolean) {
    if (!confirm(confirmed ? '급여를 확정 해제하시겠습니까?' : '급여를 확정하시겠습니까?\n확정 후 수정이 불가합니다.')) return
    try {
      if (confirmed) await unconfirmSalary(id)
      else await confirmSalary(id)
      toast(confirmed ? '급여 확정이 해제되었습니다' : '급여가 확정되었습니다')
      load()
    } catch (err) {
      toast((err as Error).message, 'destructive')
    }
  }

  async function handleBulkCreate() {
    if (!confirm(`${year}년 ${month}월 급여를 전 직원 일괄 생성하시겠습니까?`)) return
    try {
      await bulkCreateSalary(year, month)
      toast('급여가 일괄 생성되었습니다')
      load()
    } catch (err) {
      toast((err as Error).message, 'destructive')
    }
  }

  function downloadExcel() {
    const headers = ['No', '성명', '직책', '기본급', '지급합계', '공제합계', '실수령액', '총인건비', '확정']
    const dataRows = rows.map((r, i) => {
      const u = r.users as Record<string, string>
      return [i + 1, u?.name, u?.job_title, r.base_salary, r.gross_pay, r.total_deduction, r.net_pay, r.total_labor_cost, r.is_confirmed ? '확정' : '미확정']
    })
    const totals = ['합계', '', '',
      rows.reduce((s, r) => s + Number(r.base_salary ?? 0), 0),
      rows.reduce((s, r) => s + Number(r.gross_pay ?? 0), 0),
      rows.reduce((s, r) => s + Number(r.total_deduction ?? 0), 0),
      rows.reduce((s, r) => s + Number(r.net_pay ?? 0), 0),
      rows.reduce((s, r) => s + Number(r.total_labor_cost ?? 0), 0),
      '']
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows, totals])
    ws['!cols'] = [{wch:4},{wch:8},{wch:10},{wch:12},{wch:12},{wch:12},{wch:12},{wch:12},{wch:6}]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '급여목록')
    XLSX.writeFile(wb, `급여목록_${year}년${month}월.xlsx`)
  }

  const totBaseSalary = rows.reduce((s, r) => s + Number(r.base_salary ?? 0), 0)
  const totGross = rows.reduce((s, r) => s + Number(r.gross_pay ?? 0), 0)
  const totDed = rows.reduce((s, r) => s + Number(r.total_deduction ?? 0), 0)
  const totNet = rows.reduce((s, r) => s + Number(r.net_pay ?? 0), 0)
  const totLabor = rows.reduce((s, r) => s + Number(r.total_labor_cost ?? 0), 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold">급여관리</h1>
        <div className="flex items-center gap-2 flex-wrap">
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
          <Select value={deptId} onValueChange={setDeptId}>
            <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="전체">전체</SelectItem>
              {depts.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button size="sm" onClick={load}>조회</Button>
          <Button size="sm" onClick={handleBulkCreate} variant="outline">일괄생성</Button>
          <Button size="sm" onClick={() => router.push('/salary/calculate')} className="bg-blue-600 hover:bg-blue-700">급여계산</Button>
          <Button size="sm" variant="outline" onClick={downloadExcel}>엑셀출력</Button>
        </div>
      </div>

      <InsuranceRateCard orgRates={orgRates} />

      {loading ? (
        <div className="text-center py-10 text-gray-400">불러오는 중...</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                {['No','성명','직책','기본급','지급합계','공제합계','실수령액','총인건비','확정','명세서','수정'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-center font-semibold text-gray-600 whitespace-nowrap border-r last:border-r-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr><td colSpan={11} className="text-center py-8 text-gray-400">데이터가 없습니다. [일괄생성]으로 급여를 생성해주세요.</td></tr>
              ) : (
                <>
                  {rows.map((r, i) => {
                    const u = r.users as Record<string, string>
                    const confirmed = Boolean(r.is_confirmed)
                    return (
                      <tr key={r.id as string} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 text-center border-r">{i + 1}</td>
                        <td className="px-3 py-2 font-medium border-r">{u?.name}</td>
                        <td className="px-3 py-2 text-center border-r text-gray-600">{u?.job_title}</td>
                        <td className="px-3 py-2 text-right border-r">{fmt(r.base_salary)}</td>
                        <td className="px-3 py-2 text-right border-r font-medium">{fmt(r.gross_pay)}</td>
                        <td className="px-3 py-2 text-right border-r text-red-600">{fmt(r.total_deduction)}</td>
                        <td className="px-3 py-2 text-right border-r font-bold text-blue-700">{fmt(r.net_pay)}</td>
                        <td className="px-3 py-2 text-right border-r">{fmt(r.total_labor_cost)}</td>
                        <td className="px-3 py-2 text-center border-r">
                          <button
                            onClick={() => handleConfirm(r.id as string, confirmed)}
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              confirmed ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {confirmed ? '확정' : '미확정'}
                          </button>
                        </td>
                        <td className="px-3 py-2 text-center border-r">
                          <SalarySlipModal salaryId={r.id as string} />
                        </td>
                        <td className="px-3 py-2 text-center">
                          {!confirmed && (
                            <Button size="sm" variant="outline" onClick={() => router.push(`/salary/${r.id}`)}>수정</Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-blue-50 font-bold border-t-2">
                    <td colSpan={3} className="px-3 py-2 text-center border-r">합 계</td>
                    <td className="px-3 py-2 text-right border-r">{fmt(totBaseSalary)}</td>
                    <td className="px-3 py-2 text-right border-r">{fmt(totGross)}</td>
                    <td className="px-3 py-2 text-right border-r">{fmt(totDed)}</td>
                    <td className="px-3 py-2 text-right border-r">{fmt(totNet)}</td>
                    <td className="px-3 py-2 text-right border-r">{fmt(totLabor)}</td>
                    <td colSpan={3}></td>
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
