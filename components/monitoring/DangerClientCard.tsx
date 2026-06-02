'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ContactStatusBadge } from './ContactStatusBadge'
import { ManualAlertButton } from './ManualAlertButton'
import { ContactStatusRow, quickContactLog } from '@/lib/actions/monitoring'
import { toast } from '@/lib/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface Props {
  client: ContactStatusRow
  onRefresh: () => void
}

const SERVICE_TYPES = ['전화상담', '방문', '문자', '기타']

const BORDER_COLOR = {
  danger:  'border-red-400 bg-red-50',
  warning: 'border-yellow-400 bg-yellow-50',
  never:   'border-gray-400 bg-gray-50',
  normal:  'border-green-300 bg-white',
}

export function DangerClientCard({ client, onRefresh }: Props) {
  const [showModal, setShowModal] = useState(false)
  const [serviceType, setServiceType] = useState('전화상담')
  const [content, setContent] = useState('')
  const [contactedAt, setContactedAt] = useState(() => {
    const now = new Date()
    return now.toISOString().slice(0, 16)
  })
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const borderCls = BORDER_COLOR[client.contact_status] ?? BORDER_COLOR.normal
  const lastContact = client.last_contact_at
    ? new Date(client.last_contact_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    : '없음'

  async function handleQuickLog() {
    if (!content.trim()) { toast('내용을 입력해주세요', 'destructive'); return }
    setSaving(true)
    try {
      await quickContactLog({
        clientId: client.id,
        serviceType,
        content,
        contactedAt: new Date(contactedAt).toISOString(),
      })
      toast('접촉이 기록되었습니다. 상태가 정상으로 변경됩니다.')
      setShowModal(false)
      setContent('')
      onRefresh()
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className={`rounded-xl border-2 p-4 space-y-3 ${borderCls}`}>
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <ContactStatusBadge status={client.contact_status} days={client.days_no_contact < 9999 ? client.days_no_contact : undefined} />
            <span className="text-xs text-gray-500">담당자: {client.worker_name}</span>
          </div>
        </div>

        {/* 대상자 정보 */}
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold">{client.name}</span>
            <span className="text-sm text-gray-600">({client.gender === 'F' ? '여' : '남'}, {client.age}세)</span>
            {client.living_alone && (
              <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded">독거</span>
            )}
          </div>
          {client.phone_mobile && (
            <div className="text-sm text-gray-600 mt-1">📞 {client.phone_mobile}</div>
          )}
          {client.address && (
            <div className="text-xs text-gray-500 mt-0.5 truncate">📍 {client.address}</div>
          )}
          <div className="text-xs text-gray-500 mt-1">
            마지막 접촉: {lastContact}
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-2 flex-wrap pt-1">
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7"
            onClick={() => router.push(`/plans/performance?clientId=${client.id}`)}
          >
            업무일지 작성
          </Button>
          <ManualAlertButton
            clientId={client.id}
            clientName={client.name}
            workerName={client.worker_name}
            onSent={onRefresh}
          />
          <Button
            size="sm"
            className="text-xs h-7 bg-blue-600 hover:bg-blue-700"
            onClick={() => setShowModal(true)}
          >
            접촉 완료
          </Button>
        </div>
      </div>

      {/* 빠른 접촉 완료 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl w-full max-w-sm p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg">{client.name} 접촉 완료 기록</h3>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-2">서비스 종류</div>
              <div className="flex flex-wrap gap-3">
                {SERVICE_TYPES.map((st) => (
                  <label key={st} className="flex items-center gap-1.5 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="serviceType"
                      value={st}
                      checked={serviceType === st}
                      onChange={() => setServiceType(st)}
                      className="accent-blue-600"
                    />
                    {st}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">접촉 일시</div>
              <input
                type="datetime-local"
                className="w-full border rounded px-3 py-1.5 text-sm"
                value={contactedAt}
                onChange={(e) => setContactedAt(e.target.value)}
              />
            </div>

            <div>
              <div className="text-sm font-medium text-gray-700 mb-1">메모</div>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm resize-none"
                rows={3}
                placeholder="간단히 접촉 내용을 입력해주세요"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleQuickLog} disabled={saving} className="flex-1">
                {saving ? '저장중...' : '저장'}
              </Button>
              <Button variant="outline" onClick={() => setShowModal(false)}>취소</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
