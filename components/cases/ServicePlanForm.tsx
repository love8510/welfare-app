'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { upsertServicePlan, getServicePlan, getBlankFormData } from '@/lib/actions/cases'
import { toast } from '@/lib/hooks/use-toast'
import dynamic from 'next/dynamic'

const ServicePlanPDF = dynamic(() => import('./pdf/ServicePlanPDF'), { ssr: false })

interface PlanItem {
  domain: string; problem: string; goal: string; service: string
  provider: string; frequency: string; period: string; method: string; evaluator: string
}

interface Client { id: string; name: string }

interface Props {
  caseId: string
  client: Client
  workerName?: string
}

export function ServicePlanForm({ caseId, client, workerName }: Props) {
  const [saving, setSaving] = useState(false)
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [goalLong, setGoalLong] = useState('')
  const [goalShort, setGoalShort] = useState('')
  const [planItems, setPlanItems] = useState<PlanItem[]>([])
  const [orgData, setOrgData] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [existing, org] = await Promise.all([getServicePlan(caseId), getBlankFormData()])
        setOrgData(org as Record<string, unknown> | null)
        if (existing) {
          const d = existing as Record<string, unknown>
          setPeriodStart((d.plan_period_start as string) ?? '')
          setPeriodEnd((d.plan_period_end as string) ?? '')
          setGoalLong((d.goal_long as string) ?? '')
          setGoalShort((d.goal_short as string) ?? '')
          setPlanItems((d.plan_items as PlanItem[]) ?? [])
        }
      } catch {}
    }
    load()
  }, [caseId])

  const addItem = () => setPlanItems((p) => [...p, { domain:'',problem:'',goal:'',service:'',provider:'',frequency:'',period:'',method:'',evaluator:'' }])
  const removeItem = (i: number) => setPlanItems((p) => p.filter((_, idx) => idx !== i))
  const updateItem = (i: number, key: keyof PlanItem, value: string) => {
    setPlanItems((p) => p.map((item, idx) => idx === i ? { ...item, [key]: value } : item))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await upsertServicePlan(caseId, client.id, {
        plan_period_start: periodStart,
        plan_period_end: periodEnd,
        goal_long: goalLong,
        goal_short: goalShort,
        plan_items: planItems,
      })
      toast('저장되었습니다')
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setSaving(false)
    }
  }

  const COLS: { key: keyof PlanItem; label: string }[] = [
    { key: 'domain', label: '영역' }, { key: 'problem', label: '문제' },
    { key: 'goal', label: '목표' }, { key: 'service', label: '서비스내용' },
    { key: 'provider', label: '제공기관' }, { key: 'frequency', label: '빈도' },
    { key: 'period', label: '기간' }, { key: 'method', label: '방법' },
    { key: 'evaluator', label: '평가자' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">서 비 스 계 획</h2>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : '저장'}</Button>
          <ServicePlanPDF
            data={{ client_name: client.name, worker_name: workerName, plan_period_start: periodStart, plan_period_end: periodEnd, goal_long: goalLong, goal_short: goalShort, plan_items: planItems }}
            org={orgData ?? {}}
            clientName={client.name}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 p-3 border rounded">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600 whitespace-nowrap">계획기간:</span>
          <Input type="date" className="h-8" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          <span className="text-gray-400">~</span>
          <Input type="date" className="h-8" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
        </div>
        <div className="text-sm"><span className="text-gray-600">담당자: </span><span className="font-medium">{workerName ?? ''}</span></div>
      </div>

      <div className="space-y-2 p-3 border rounded">
        <div>
          <div className="text-xs font-semibold mb-1">장기목표</div>
          <textarea className="w-full border rounded p-2 text-sm" rows={2} value={goalLong} onChange={(e) => setGoalLong(e.target.value)} />
        </div>
        <div>
          <div className="text-xs font-semibold mb-1">단기목표</div>
          <textarea className="w-full border rounded p-2 text-sm" rows={2} value={goalShort} onChange={(e) => setGoalShort(e.target.value)} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold">서비스 계획 항목</h3>
          <Button variant="outline" size="sm" onClick={addItem}>+ 항목 추가</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-50">
                {COLS.map((c) => (
                  <th key={c.key} className="px-2 py-1.5 text-xs font-semibold border-b border-r whitespace-nowrap">{c.label}</th>
                ))}
                <th className="px-2 py-1.5 text-xs font-semibold border-b">삭제</th>
              </tr>
            </thead>
            <tbody>
              {planItems.map((item, i) => (
                <tr key={i} className="border-b">
                  {COLS.map((c) => (
                    <td key={c.key} className="border-r p-1">
                      <Input className="h-7 text-xs" value={item[c.key]} onChange={(e) => updateItem(i, c.key, e.target.value)} />
                    </td>
                  ))}
                  <td className="p-1 text-center">
                    <button className="text-red-500 text-xs" onClick={() => removeItem(i)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
