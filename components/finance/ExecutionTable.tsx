'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getExecutions, addExecution, deleteExecution } from '@/lib/actions/finance'
import { toast } from '@/lib/hooks/use-toast'

interface ExecRow {
  id: string; executed_at: string; description?: string
  amount: number; receipt_no?: string; note?: string
}

interface Props {
  budgetItemId: string
  itemName: string
  budgetAmount: number
  executedAmount: number
  year: number
  onClose: () => void
  onRefresh: () => void
}

function fmt(n: number) { return n.toLocaleString('ko-KR') }

export function ExecutionTable({ budgetItemId, itemName, budgetAmount, executedAmount, year, onClose, onRefresh }: Props) {
  const [rows, setRows] = useState<ExecRow[]>([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    executed_at: new Date().toISOString().slice(0, 10),
    description: '',
    amount: '',
    receipt_no: '',
    month: String(new Date().getMonth() + 1),
  })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await getExecutions(budgetItemId)
      setRows(data as ExecRow[])
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [budgetItemId])

  async function handleAdd() {
    if (!form.amount || Number(form.amount) <= 0) {
      toast('집행액을 입력해주세요', 'destructive')
      return
    }
    setSaving(true)
    try {
      await addExecution({
        budget_item_id: budgetItemId,
        year,
        month: Number(form.month),
        executed_at: form.executed_at,
        description: form.description,
        amount: Number(form.amount),
        receipt_no: form.receipt_no,
      })
      toast('집행내역이 추가되었습니다')
      setForm((f) => ({ ...f, description: '', amount: '', receipt_no: '' }))
      await load()
      onRefresh()
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    try {
      await deleteExecution(id)
      toast('삭제되었습니다')
      await load()
      onRefresh()
    } catch (err) {
      toast((err as Error).message, 'destructive')
    }
  }

  const remaining = budgetAmount - executedAmount

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-xl bg-white h-full overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h3 className="font-bold">{itemName}</h3>
            <div className="text-xs text-gray-500 mt-0.5">
              예산 {fmt(budgetAmount)}원 · 집행 {fmt(executedAmount)}원 · 잔액 {fmt(remaining)}원
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
        </div>

        {/* 집행내역 추가 */}
        <div className="p-4 border-b bg-gray-50 space-y-2">
          <div className="text-sm font-semibold text-gray-700">집행내역 추가</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-gray-500 mb-1">집행일자</div>
              <Input type="date" value={form.executed_at} onChange={(e) => setForm((f) => ({ ...f, executed_at: e.target.value }))} className="h-8 text-sm" />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">월</div>
              <select
                className="w-full border rounded h-8 text-sm px-2"
                value={form.month}
                onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 mb-1">적요</div>
            <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="h-8 text-sm" placeholder="내용 입력" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-gray-500 mb-1">집행액 (원)</div>
              <Input type="number" value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} className="h-8 text-sm" placeholder="0" />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">증빙번호</div>
              <Input value={form.receipt_no} onChange={(e) => setForm((f) => ({ ...f, receipt_no: e.target.value }))} className="h-8 text-sm" placeholder="선택사항" />
            </div>
          </div>
          <Button size="sm" onClick={handleAdd} disabled={saving} className="w-full">저장</Button>
        </div>

        {/* 집행 목록 */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-400">불러오는 중...</div>
          ) : rows.length === 0 ? (
            <div className="text-center py-8 text-gray-400">집행내역이 없습니다</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-xs">
                  <th className="px-2 py-2 text-left">집행일자</th>
                  <th className="px-2 py-2 text-left">적요</th>
                  <th className="px-2 py-2 text-right">집행액</th>
                  <th className="px-2 py-2 text-center">증빙</th>
                  <th className="px-2 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-gray-50">
                    <td className="px-2 py-2 text-gray-600 text-xs">{r.executed_at}</td>
                    <td className="px-2 py-2">{r.description}</td>
                    <td className="px-2 py-2 text-right font-medium">{fmt(r.amount)}</td>
                    <td className="px-2 py-2 text-center text-xs text-gray-500">{r.receipt_no}</td>
                    <td className="px-2 py-2 text-center">
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-red-500" onClick={() => handleDelete(r.id)}>삭제</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
