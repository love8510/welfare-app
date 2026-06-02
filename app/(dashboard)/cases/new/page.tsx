'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createCase } from '@/lib/actions/cases'
import { getWorkerListForOrg, getClientList } from '@/lib/actions/clients'
import { toast } from '@/lib/hooks/use-toast'

export default function NewCasePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])
  const [workers, setWorkers] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({
    client_id: '',
    worker_id: '',
    received_at: new Date().toISOString().split('T')[0],
    receive_method: '방문',
    referrer_name: '',
    referrer_relation: '사회복지사',
    referrer_phone: '',
    referral_route: '복지기관',
  })

  useEffect(() => {
    async function load() {
      try {
        const [c, w] = await Promise.all([getClientList({ page: 1, pageSize: 200 }), getWorkerListForOrg()])
        setClients((c.data as { id: string; name: string }[]))
        setWorkers(w)
      } catch {}
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.client_id) { toast('대상자를 선택해주세요', 'destructive'); return }
    setSaving(true)
    try {
      const result = await createCase({
        client_id: form.client_id,
        worker_id: form.worker_id || undefined,
        received_at: form.received_at,
        receive_method: form.receive_method,
        referrer_name: form.referrer_name,
        referrer_relation: form.referrer_relation,
        referrer_phone: form.referrer_phone,
        referral_route: form.referral_route,
      })
      toast('사례가 등록되었습니다')
      router.push(`/cases/${result.id}`)
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-6">신규 사례 등록</h1>
      <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-lg border p-6">
        <div>
          <label className="block text-sm font-medium mb-1">대상자 <span className="text-red-500">*</span></label>
          <select
            className="w-full h-9 border rounded px-2 text-sm"
            value={form.client_id}
            onChange={(e) => setForm((p) => ({ ...p, client_id: e.target.value }))}
          >
            <option value="">대상자 선택</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">담당자</label>
          <select
            className="w-full h-9 border rounded px-2 text-sm"
            value={form.worker_id}
            onChange={(e) => setForm((p) => ({ ...p, worker_id: e.target.value }))}
          >
            <option value="">담당자 선택</option>
            {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">접수일자</label>
          <Input type="date" className="h-9" value={form.received_at} onChange={(e) => setForm((p) => ({ ...p, received_at: e.target.value }))} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">접수방법</label>
          <select
            className="w-full h-9 border rounded px-2 text-sm"
            value={form.receive_method}
            onChange={(e) => setForm((p) => ({ ...p, receive_method: e.target.value }))}
          >
            {['방문','전화','내방','기타'].map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">의뢰인 성명</label>
            <Input className="h-9" value={form.referrer_name} onChange={(e) => setForm((p) => ({ ...p, referrer_name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">의뢰인과의 관계</label>
            <select
              className="w-full h-9 border rounded px-2 text-sm"
              value={form.referrer_relation}
              onChange={(e) => setForm((p) => ({ ...p, referrer_relation: e.target.value }))}
            >
              {['사회복지사','가족','본인','이웃','기타'].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">의뢰인 전화번호</label>
            <Input className="h-9" value={form.referrer_phone} onChange={(e) => setForm((p) => ({ ...p, referrer_phone: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">의뢰경로</label>
            <select
              className="w-full h-9 border rounded px-2 text-sm"
              value={form.referral_route}
              onChange={(e) => setForm((p) => ({ ...p, referral_route: e.target.value }))}
            >
              {['복지기관','본인','가족','기타'].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={saving}>{saving ? '등록 중...' : '등록'}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>취소</Button>
        </div>
      </form>
    </div>
  )
}
