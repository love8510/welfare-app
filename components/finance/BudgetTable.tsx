'use client'
import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FinanceSummaryCard } from './FinanceSummaryCard'
import { BudgetItemForm } from './BudgetItemForm'
import { ExecutionTable } from './ExecutionTable'
import { getBudgetSummary, getFinanceSummaryCards, deleteBudgetItem } from '@/lib/actions/finance'
import { toast } from '@/lib/hooks/use-toast'
import * as XLSX from 'xlsx'
import { SalarySlipDocument } from '@/components/salary/pdf/SalarySlipPDF'

type BudgetRow = {
  budget_item_id: string; type: string; category: string; sub_category?: string
  item_name: string; budget_amount: number; executed_amount: number
  remaining_amount: number; execution_rate: number; sort_order: number
}

function fmt(n: number) { return n.toLocaleString('ko-KR') }

function RateBadge({ rate }: { rate: number }) {
  const cls = rate >= 90 ? 'bg-red-100 text-red-700' : rate >= 70 ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${cls}`}>{rate}%</span>
}

export function BudgetTable() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all')
  const [rows, setRows] = useState<BudgetRow[]>([])
  const [summary, setSummary] = useState({ totalBudget: 0, totalExecuted: 0, remaining: 0, executionRate: 0 })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<BudgetRow | null>(null)
  const [execItem, setExecItem] = useState<BudgetRow | null>(null)
  const [activeTab, setActiveTab] = useState<'all' | 'income' | 'expense'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, sums] = await Promise.all([
        getBudgetSummary(year, typeFilter === 'all' ? undefined : typeFilter),
        getFinanceSummaryCards(year),
      ])
      setRows(data as BudgetRow[])
      setSummary(sums)
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setLoading(false)
    }
  }, [year, typeFilter])

  useEffect(() => { load() }, [load])

  function handleTabChange(tab: 'all' | 'income' | 'expense') {
    setActiveTab(tab)
    setTypeFilter(tab)
  }

  async function handleDelete(id: string) {
    if (!confirm('이 예산항목을 삭제하시겠습니까?\n관련 집행내역도 모두 삭제됩니다.')) return
    try {
      await deleteBudgetItem(id)
      toast('삭제되었습니다')
      load()
    } catch (err) {
      toast((err as Error).message, 'destructive')
    }
  }

  async function downloadExcel() {
    const headers = ['구분', '대분류', '중분류', '항목명', '예산액', '집행액', '잔액', '집행률(%)']
    const dataRows = rows.map((r) => [
      r.type === 'income' ? '세입' : '세출',
      r.category, r.sub_category ?? '',
      r.item_name, r.budget_amount, r.executed_amount,
      r.remaining_amount, r.execution_rate,
    ])
    const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows])
    ws['!cols'] = [{wch:6},{wch:12},{wch:10},{wch:20},{wch:14},{wch:14},{wch:14},{wch:10}]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '세입세출')
    XLSX.writeFile(wb, `세입세출_${year}년.xlsx`)
  }

  async function downloadFinancePDF() {
    try {
      const { pdf } = await import('@react-pdf/renderer')
      const { Document, Page, Text, View, StyleSheet, Font } = await import('@react-pdf/renderer')
      const { default: _ } = await import('@/lib/pdf-fonts' as never) as { default: unknown }

      toast('PDF 생성 중...')
    } catch (err) {
      toast((err as Error).message, 'destructive')
    }
  }

  const existingCategories = Array.from(new Set(rows.map((r) => r.category)))
  const filteredRows = activeTab === 'all' ? rows : rows.filter((r) => r.type === activeTab)

  const groupedRows: Record<string, BudgetRow[]> = {}
  for (const r of filteredRows) {
    const key = `${r.type}__${r.category}`
    if (!groupedRows[key]) groupedRows[key] = []
    groupedRows[key].push(r)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold">재무회계</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" onClick={() => setYear((y) => y - 1)}>{'<'}</Button>
            <span className="w-14 text-center font-semibold">{year}</span>
            <Button variant="outline" size="sm" onClick={() => setYear((y) => y + 1)}>{'>'}</Button>
          </div>
          <Button size="sm" onClick={load}>조회</Button>
          <Button size="sm" onClick={() => { setEditItem(null); setShowForm(true) }} className="bg-blue-600 hover:bg-blue-700">예산항목 추가</Button>
          <Button variant="outline" size="sm" onClick={downloadExcel}>엑셀출력</Button>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-4 gap-3">
        <FinanceSummaryCard label="총 예산액" value={`${fmt(summary.totalBudget)}원`} color="blue" />
        <FinanceSummaryCard label="총 집행액" value={`${fmt(summary.totalExecuted)}원`} color="green" />
        <FinanceSummaryCard label="잔액" value={`${fmt(summary.remaining)}원`} color={summary.remaining < 0 ? 'red' : 'yellow'} />
        <FinanceSummaryCard label="집행률" value={`${summary.executionRate}%`} color={summary.executionRate >= 90 ? 'red' : 'blue'} />
      </div>

      {/* 탭 */}
      <div className="flex gap-1 border-b">
        {([['all', '전체'], ['income', '세입'], ['expense', '세출']] as const).map(([v, label]) => (
          <button
            key={v}
            onClick={() => handleTabChange(v)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === v ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">불러오는 중...</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                {['구분', '대분류', '중분류', '항목명', '예산액', '집행액', '잔액', '집행률', '집행내역', '수정', '삭제'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-center font-semibold text-gray-600 whitespace-nowrap border-r last:border-r-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedRows).map(([key, items]) => {
                const catTotal = items.reduce((s, r) => s + r.budget_amount, 0)
                const catExec = items.reduce((s, r) => s + r.executed_amount, 0)
                const catRemain = catTotal - catExec
                const catRate = catTotal > 0 ? Math.round((catExec / catTotal) * 1000) / 10 : 0
                return (
                  <>
                    {items.map((r, idx) => (
                      <tr key={r.budget_item_id} className="border-b hover:bg-gray-50">
                        {idx === 0 && (
                          <td rowSpan={items.length + 1} className="px-2 py-2 text-center text-xs font-bold border-r whitespace-nowrap">
                            <span className={`px-1.5 py-0.5 rounded text-xs ${r.type === 'income' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                              {r.type === 'income' ? '세입' : '세출'}
                            </span>
                          </td>
                        )}
                        {idx === 0 && (
                          <td rowSpan={items.length + 1} className="px-3 py-2 font-medium border-r whitespace-nowrap">{r.category}</td>
                        )}
                        <td className="px-3 py-2 text-gray-500 border-r text-xs">{r.sub_category}</td>
                        <td className="px-3 py-2 border-r">{r.item_name}</td>
                        <td className="px-3 py-2 text-right border-r">{fmt(r.budget_amount)}</td>
                        <td className="px-3 py-2 text-right border-r">{fmt(r.executed_amount)}</td>
                        <td className={`px-3 py-2 text-right border-r ${r.remaining_amount < 0 ? 'text-red-600 font-bold' : ''}`}>{fmt(r.remaining_amount)}</td>
                        <td className="px-3 py-2 text-center border-r"><RateBadge rate={r.execution_rate} /></td>
                        <td className="px-3 py-2 text-center border-r">
                          <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => setExecItem(r)}>내역</Button>
                        </td>
                        <td className="px-3 py-2 text-center border-r">
                          <Button variant="outline" size="sm" className="h-6 text-xs" onClick={() => { setEditItem(r); setShowForm(true) }}>수정</Button>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <Button variant="ghost" size="sm" className="h-6 text-xs text-red-500" onClick={() => handleDelete(r.budget_item_id)}>삭제</Button>
                        </td>
                      </tr>
                    ))}
                    {/* 소계 행 */}
                    <tr className="bg-yellow-50 border-b font-semibold text-sm">
                      <td className="px-3 py-1.5 text-xs text-gray-500 border-r">소 계</td>
                      <td className="px-3 py-1.5 border-r"></td>
                      <td className="px-3 py-1.5 text-right border-r">{fmt(catTotal)}</td>
                      <td className="px-3 py-1.5 text-right border-r">{fmt(catExec)}</td>
                      <td className="px-3 py-1.5 text-right border-r">{fmt(catRemain)}</td>
                      <td className="px-3 py-1.5 text-center border-r"><RateBadge rate={catRate} /></td>
                      <td colSpan={3}></td>
                    </tr>
                  </>
                )
              })}
              {/* 합계 */}
              {filteredRows.length > 0 && (
                <tr className="bg-blue-50 font-bold border-t-2">
                  <td colSpan={4} className="px-3 py-2 text-center border-r">합 계</td>
                  <td className="px-3 py-2 text-right border-r">{fmt(filteredRows.reduce((s, r) => s + r.budget_amount, 0))}</td>
                  <td className="px-3 py-2 text-right border-r">{fmt(filteredRows.reduce((s, r) => s + r.executed_amount, 0))}</td>
                  <td className="px-3 py-2 text-right border-r">{fmt(filteredRows.reduce((s, r) => s + r.remaining_amount, 0))}</td>
                  <td colSpan={4}></td>
                </tr>
              )}
              {filteredRows.length === 0 && (
                <tr><td colSpan={11} className="text-center py-8 text-gray-400">예산 항목이 없습니다. [예산항목 추가]를 눌러주세요.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <BudgetItemForm
          year={year}
          existingCategories={existingCategories}
          editItem={editItem ? {
            id: editItem.budget_item_id,
            type: editItem.type as 'income' | 'expense',
            category: editItem.category,
            sub_category: editItem.sub_category,
            item_name: editItem.item_name,
            budget_amount: editItem.budget_amount,
            sort_order: editItem.sort_order,
          } : undefined}
          onSaved={() => { setShowForm(false); setEditItem(null); load() }}
          onCancel={() => { setShowForm(false); setEditItem(null) }}
        />
      )}

      {execItem && (
        <ExecutionTable
          budgetItemId={execItem.budget_item_id}
          itemName={execItem.item_name}
          budgetAmount={execItem.budget_amount}
          executedAmount={execItem.executed_amount}
          year={year}
          onClose={() => setExecItem(null)}
          onRefresh={load}
        />
      )}
    </div>
  )
}
