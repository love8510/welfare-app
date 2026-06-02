'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getMonitoringLogs, addMonitoringLog, updateMonitoringLog, deleteMonitoringLog } from '@/lib/actions/cases'
import { toast } from '@/lib/hooks/use-toast'

interface MonitoringLog {
  id: string
  monitored_at: string
  method: string
  content: string
  result: string
  next_plan: string
  worker: { name: string } | null
}

interface Client { id: string; name: string }

interface Props {
  caseId: string
  client: Client
  workerName?: string
}

export function MonitoringForm({ caseId, client, workerName }: Props) {
  const [logs, setLogs] = useState<MonitoringLog[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState({ monitored_at: new Date().toISOString().split('T')[0], method: '방문', content: '', result: '', next_plan: '' })
  const [saving, setSaving] = useState(false)

  async function load() {
    setLoading(true)
    try {
      const data = await getMonitoringLogs(caseId)
      setLogs(data as MonitoringLog[])
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [caseId])

  async function handleSave() {
    setSaving(true)
    try {
      if (editId) {
        await updateMonitoringLog(editId, form)
      } else {
        await addMonitoringLog(caseId, client.id, form)
      }
      toast('저장되었습니다')
      setForm({ monitored_at: new Date().toISOString().split('T')[0], method: '방문', content: '', result: '', next_plan: '' })
      setEditId(null)
      load()
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    try {
      await deleteMonitoringLog(id)
      toast('삭제되었습니다')
      load()
    } catch (err) {
      toast((err as Error).message, 'destructive')
    }
  }

  function startEdit(log: MonitoringLog) {
    setEditId(log.id)
    setForm({ monitored_at: log.monitored_at, method: log.method, content: log.content, result: log.result, next_plan: log.next_plan })
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold">모니터링 기록</h2>

      <div className="p-4 border rounded space-y-3">
        <h3 className="text-sm font-semibold">{editId ? '수정' : '신규 입력'}</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="text-xs text-gray-600 mb-1">모니터링 일자</div>
            <Input type="date" className="h-8" value={form.monitored_at} onChange={(e) => setForm((p) => ({ ...p, monitored_at: e.target.value }))} />
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">방법</div>
            <select className="w-full h-8 border rounded px-2 text-sm" value={form.method} onChange={(e) => setForm((p) => ({ ...p, method: e.target.value }))}>
              {['방문','전화','내방','기타'].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">내용</div>
          <textarea className="w-full border rounded p-2 text-sm" rows={3} value={form.content} onChange={(e) => setForm((p) => ({ ...p, content: e.target.value }))} />
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">결과</div>
          <textarea className="w-full border rounded p-2 text-sm" rows={2} value={form.result} onChange={(e) => setForm((p) => ({ ...p, result: e.target.value }))} />
        </div>
        <div>
          <div className="text-xs text-gray-600 mb-1">향후 계획</div>
          <textarea className="w-full border rounded p-2 text-sm" rows={2} value={form.next_plan} onChange={(e) => setForm((p) => ({ ...p, next_plan: e.target.value }))} />
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : editId ? '수정 완료' : '저장'}</Button>
          {editId && <Button variant="outline" onClick={() => { setEditId(null); setForm({ monitored_at: new Date().toISOString().split('T')[0], method: '방문', content: '', result: '', next_plan: '' }) }}>취소</Button>}
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              {['No','일자','방법','내용','결과','향후계획','담당자','수정','삭제'].map((h) => (
                <th key={h} className="px-3 py-2 text-center text-xs font-semibold border-r">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-400">불러오는 중...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-400">기록이 없습니다</td></tr>
            ) : logs.map((log, i) => (
              <tr key={log.id} className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 text-center border-r">{i + 1}</td>
                <td className="px-3 py-2 border-r">{log.monitored_at}</td>
                <td className="px-3 py-2 border-r">{log.method}</td>
                <td className="px-3 py-2 border-r max-w-[200px] truncate">{log.content}</td>
                <td className="px-3 py-2 border-r max-w-[150px] truncate">{log.result}</td>
                <td className="px-3 py-2 border-r max-w-[150px] truncate">{log.next_plan}</td>
                <td className="px-3 py-2 border-r">{log.worker?.name ?? workerName ?? '-'}</td>
                <td className="px-3 py-2 border-r text-center">
                  <button className="text-blue-500 hover:underline text-xs" onClick={() => startEdit(log)}>수정</button>
                </td>
                <td className="px-3 py-2 text-center">
                  <button className="text-red-500 hover:underline text-xs" onClick={() => handleDelete(log.id)}>삭제</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
