'use client'
import { useState } from 'react'
import { createContract, deleteContract } from '@/lib/actions/staff'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'

const DAYS = ['월', '화', '수', '목', '금', '토', '일']
type Contract = Record<string, unknown>

export function ContractTab({ userId, contracts: initialContracts }: {
  userId: string
  contracts: Contract[]
}) {
  const [contracts, setContracts] = useState(initialContracts)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    contract_start: '', contract_end: '', contract_type: '정규직',
    work_start: '09:00', work_end: '18:00',
    work_days: ['월', '화', '수', '목', '금'],
    wage_type: '월급제', wage_amount: 0,
    work_location: '', duties: '',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  function toggleDay(d: string) {
    setForm(f => ({
      ...f,
      work_days: f.work_days.includes(d) ? f.work_days.filter(x => x !== d) : [...f.work_days, d]
    }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await createContract(userId, form)
      setShowForm(false)
      setMsg('계약서가 등록됐습니다')
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : '저장 실패')
    }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await deleteContract(id)
    setContracts(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">근로계약서 이력</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">+ 계약서 추가</Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Label className="w-20 shrink-0 text-sm">계약시작</Label>
              <Input type="date" value={form.contract_start} onChange={e => setForm(f => ({ ...f, contract_start: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-20 shrink-0 text-sm">계약종료</Label>
              <Input type="date" value={form.contract_end} onChange={e => setForm(f => ({ ...f, contract_end: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-20 shrink-0 text-sm">계약유형</Label>
              <select value={form.contract_type} onChange={e => setForm(f => ({ ...f, contract_type: e.target.value }))} className="border rounded px-2 py-1.5 text-sm flex-1">
                {['정규직', '계약직', '기간제'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-20 shrink-0 text-sm">임금형태</Label>
              <select value={form.wage_type} onChange={e => setForm(f => ({ ...f, wage_type: e.target.value }))} className="border rounded px-2 py-1.5 text-sm flex-1">
                {['월급제', '시급제'].map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-20 shrink-0 text-sm">근무시간</Label>
              <Input type="time" value={form.work_start} onChange={e => setForm(f => ({ ...f, work_start: e.target.value }))} className="w-28" />
              <span className="text-gray-400">~</span>
              <Input type="time" value={form.work_end} onChange={e => setForm(f => ({ ...f, work_end: e.target.value }))} className="w-28" />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-20 shrink-0 text-sm">임금</Label>
              <Input type="number" value={form.wage_amount} onChange={e => setForm(f => ({ ...f, wage_amount: Number(e.target.value) }))} className="flex-1" />
              <span className="text-sm text-gray-400">원</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-20 shrink-0 text-sm">근무요일</Label>
            <div className="flex gap-1">
              {DAYS.map(d => (
                <button key={d} type="button" onClick={() => toggleDay(d)}
                  className={`w-8 h-8 rounded-full text-xs font-medium border transition-colors ${form.work_days.includes(d) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300'}`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-20 shrink-0 text-sm">근무장소</Label>
            <Input value={form.work_location} onChange={e => setForm(f => ({ ...f, work_location: e.target.value }))} className="flex-1" />
          </div>
          <div className="flex items-start gap-2">
            <Label className="w-20 shrink-0 text-sm pt-1">담당업무</Label>
            <textarea value={form.duties} onChange={e => setForm(f => ({ ...f, duties: e.target.value }))} rows={3}
              className="flex-1 border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          {msg && <p className={`text-sm ${msg.includes('실패') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowForm(false)}>취소</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-[#2d7a2d] hover:bg-[#256325]">
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['No', '계약기간', '계약유형', '임금', '근무요일', '등록일', '삭제'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {contracts.length === 0 && (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">계약서가 없습니다</td></tr>
            )}
            {contracts.map((c, i) => (
              <tr key={c.id as string} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                <td className="px-3 py-2">{c.contract_start as string ?? '-'} ~ {c.contract_end as string ?? '계속'}</td>
                <td className="px-3 py-2">{c.contract_type as string ?? '-'}</td>
                <td className="px-3 py-2">{c.wage_amount ? Number(c.wage_amount).toLocaleString() + '원' : '-'}</td>
                <td className="px-3 py-2">{Array.isArray(c.work_days) ? (c.work_days as string[]).join(',') : '-'}</td>
                <td className="px-3 py-2 text-gray-400">{(c.created_at as string)?.slice(0, 10)}</td>
                <td className="px-3 py-2">
                  <button onClick={() => handleDelete(c.id as string)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
