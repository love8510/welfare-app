'use client'
import { useState } from 'react'
import { createCounselLog, deleteCounselLog } from '@/lib/actions/staff'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Trash2 } from 'lucide-react'

type Log = Record<string, unknown>

export function InitialCounselTab({ userId, logs: initialLogs }: { userId: string; logs: Log[] }) {
  const [logs, setLogs] = useState(initialLogs)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ counsel_date: '', counselor: '', content: '', note: '' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function handleSave() {
    setSaving(true)
    try {
      await createCounselLog(userId, form)
      setMsg('등록됐습니다')
      setShowForm(false)
      setForm({ counsel_date: '', counselor: '', content: '', note: '' })
    } catch (e: unknown) { setMsg(e instanceof Error ? e.message : '저장 실패') }
    setSaving(false)
  }

  async function handleDelete(id: string) {
    await deleteCounselLog(id)
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">초기상담 기록</h3>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700">+ 기록 추가</Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 space-y-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Label className="w-16 shrink-0 text-sm">상담일</Label>
              <Input type="date" value={form.counsel_date} onChange={e => setForm(f => ({ ...f, counsel_date: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <Label className="w-16 shrink-0 text-sm">상담자</Label>
              <Input value={form.counselor} onChange={e => setForm(f => ({ ...f, counselor: e.target.value }))} />
            </div>
          </div>
          <div>
            <Label className="text-sm mb-1 block">상담내용</Label>
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} rows={6}
              className="w-full border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
          <div>
            <Label className="text-sm mb-1 block">특이사항</Label>
            <textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={3}
              className="w-full border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
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
              {['No', '상담일', '상담자', '상담내용', '삭제'].map(h => (
                <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {logs.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">상담 기록이 없습니다</td></tr>
            )}
            {logs.map((l, i) => (
              <tr key={l.id as string} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                <td className="px-3 py-2">{l.counsel_date as string ?? '-'}</td>
                <td className="px-3 py-2">{l.counselor as string ?? '-'}</td>
                <td className="px-3 py-2 max-w-xs truncate">{l.content as string ?? '-'}</td>
                <td className="px-3 py-2">
                  <button onClick={() => handleDelete(l.id as string)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
