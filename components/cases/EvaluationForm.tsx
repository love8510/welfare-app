'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { RadioGroup } from './shared/RadioGroup'
import { upsertCaseEvaluation, getCaseEvaluation, closeCase } from '@/lib/actions/cases'
import { toast } from '@/lib/hooks/use-toast'
import { useRouter } from 'next/navigation'

interface Client { id: string; name: string }

interface Props {
  caseId: string
  client: Client
  workerName?: string
  isClosed?: boolean
}

export function EvaluationForm({ caseId, client, workerName, isClosed }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [evaluatedAt, setEvaluatedAt] = useState(new Date().toISOString().split('T')[0])
  const [goalAchievement, setGoalAchievement] = useState('')
  const [serviceEffect, setServiceEffect] = useState('')
  const [clientSatisfaction, setClientSatisfaction] = useState('')
  const [continueOrClose, setContinueOrClose] = useState('계속')
  const [closeReason, setCloseReason] = useState('')
  const [opinion, setOpinion] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const existing = await getCaseEvaluation(caseId)
        if (existing) {
          const d = existing as Record<string, unknown>
          setEvaluatedAt((d.evaluated_at as string) ?? new Date().toISOString().split('T')[0])
          setGoalAchievement((d.goal_achievement as string) ?? '')
          setServiceEffect((d.service_effect as string) ?? '')
          setClientSatisfaction((d.client_satisfaction as string) ?? '')
          setContinueOrClose((d.continue_or_close as string) ?? '계속')
          setCloseReason((d.close_reason as string) ?? '')
          setOpinion((d.opinion as string) ?? '')
        }
      } catch {}
    }
    load()
  }, [caseId])

  async function handleSave() {
    setSaving(true)
    try {
      await upsertCaseEvaluation(caseId, client.id, {
        evaluated_at: evaluatedAt,
        goal_achievement: goalAchievement,
        service_effect: serviceEffect,
        client_satisfaction: clientSatisfaction,
        continue_or_close: continueOrClose,
        close_reason: closeReason,
        opinion,
      })
      toast('저장되었습니다')
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setSaving(false)
    }
  }

  async function handleClose() {
    if (!closeReason) { toast('종결 사유를 입력해주세요', 'destructive'); return }
    if (!confirm('사례를 종결하시겠습니까?')) return
    try {
      await closeCase(caseId, closeReason)
      toast('사례가 종결되었습니다')
      router.push('/cases')
    } catch (err) {
      toast((err as Error).message, 'destructive')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">사례평가서</h2>
        <Button onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : '저장'}</Button>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span>평가일:</span>
          <input type="date" className="border rounded h-8 px-2 text-sm" value={evaluatedAt} onChange={(e) => setEvaluatedAt(e.target.value)} />
        </div>
        <div><span>담당자: </span><span className="font-medium">{workerName ?? ''}</span></div>
      </div>

      <div className="space-y-4 p-4 border rounded">
        <div>
          <div className="text-sm font-semibold mb-1">목표달성도</div>
          <RadioGroup options={['매우 달성','달성','부분달성','미달성']} value={goalAchievement} onChange={setGoalAchievement} name="goalAchievement" />
        </div>
        <div>
          <div className="text-sm font-semibold mb-1">서비스 효과성</div>
          <RadioGroup options={['매우 효과적','효과적','보통','효과 없음']} value={serviceEffect} onChange={setServiceEffect} name="serviceEffect" />
        </div>
        <div>
          <div className="text-sm font-semibold mb-1">이용자 만족도</div>
          <RadioGroup options={['매우 만족','만족','보통','불만족']} value={clientSatisfaction} onChange={setClientSatisfaction} name="clientSatisfaction" />
        </div>
        <div>
          <div className="text-sm font-semibold mb-1">계속/종결 의견</div>
          <RadioGroup options={['계속','종결']} value={continueOrClose} onChange={setContinueOrClose} name="continueOrClose" />
        </div>
        {continueOrClose === '종결' && (
          <div>
            <div className="text-sm font-semibold mb-1">종결 사유</div>
            <textarea
              className="w-full border rounded p-2 text-sm"
              rows={2}
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
              placeholder="종결 사유를 입력하세요"
            />
          </div>
        )}
        <div>
          <div className="text-sm font-semibold mb-1">종합 의견</div>
          <textarea
            className="w-full border rounded p-2 text-sm"
            rows={4}
            value={opinion}
            onChange={(e) => setOpinion(e.target.value)}
          />
        </div>
      </div>

      {continueOrClose === '종결' && !isClosed && (
        <div className="p-3 bg-red-50 border border-red-200 rounded">
          <p className="text-sm text-red-700 mb-2">저장 후 아래 버튼을 눌러 사례를 종결하세요.</p>
          <Button variant="destructive" onClick={handleClose}>사례 종결 처리</Button>
        </div>
      )}
      {isClosed && (
        <div className="p-3 bg-gray-50 border rounded text-sm text-gray-600">이 사례는 이미 종결되었습니다.</div>
      )}
    </div>
  )
}
