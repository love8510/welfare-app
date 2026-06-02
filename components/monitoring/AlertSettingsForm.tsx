'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getAlertSettings, upsertAlertSettings } from '@/lib/actions/monitoring'
import { toast } from '@/lib/hooks/use-toast'

const DAYS = ['월', '화', '수', '목', '금', '토', '일']

export function AlertSettingsForm() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [warningThreshold, setWarningThreshold] = useState(3)
  const [dangerThreshold, setDangerThreshold] = useState(7)
  const [alertTime, setAlertTime] = useState('09:00')
  const [alertDays, setAlertDays] = useState(['월', '화', '수', '목', '금'])
  const [isActive, setIsActive] = useState(true)
  const [senderKey, setSenderKey] = useState('')
  const [templateWarning, setTemplateWarning] = useState('')
  const [templateDanger, setTemplateDanger] = useState('')

  useEffect(() => {
    getAlertSettings().then((s) => {
      if (s) {
        const d = s as Record<string, unknown>
        setWarningThreshold(Number(d.warning_threshold) || 3)
        setDangerThreshold(Number(d.danger_threshold) || 7)
        setAlertTime((d.alert_time as string) || '09:00')
        setAlertDays((d.alert_days as string[]) || ['월', '화', '수', '목', '금'])
        setIsActive(d.is_active !== false)
        setSenderKey((d.kakao_sender_key as string) || '')
        setTemplateWarning((d.kakao_template_code_warning as string) || '')
        setTemplateDanger((d.kakao_template_code_danger as string) || '')
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  function toggleDay(day: string) {
    setAlertDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  async function handleSave() {
    setSaving(true)
    try {
      await upsertAlertSettings({
        warning_threshold: warningThreshold,
        danger_threshold: dangerThreshold,
        alert_time: alertTime,
        alert_days: alertDays,
        kakao_sender_key: senderKey || undefined,
        kakao_template_code_warning: templateWarning || undefined,
        kakao_template_code_danger: templateDanger || undefined,
        is_active: isActive,
      })
      toast('설정이 저장되었습니다')
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-10 text-gray-400">불러오는 중...</div>

  return (
    <div className="space-y-6 max-w-xl">
      <h1 className="text-xl font-bold">알림 설정</h1>

      {/* 미접촉 기준일 */}
      <div className="bg-white border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">미접촉 기준일 설정</h2>
        <div className="flex items-center gap-3">
          <Label className="w-28 shrink-0 text-sm">주의 알림 기준</Label>
          <Input type="number" min={1} max={30} value={warningThreshold} onChange={(e) => setWarningThreshold(Number(e.target.value))} className="w-20 text-center" />
          <span className="text-sm text-gray-600">일 이상 미접촉 시</span>
        </div>
        <div className="flex items-center gap-3">
          <Label className="w-28 shrink-0 text-sm">위험 알림 기준</Label>
          <Input type="number" min={1} max={30} value={dangerThreshold} onChange={(e) => setDangerThreshold(Number(e.target.value))} className="w-20 text-center" />
          <span className="text-sm text-gray-600">일 이상 미접촉 시</span>
        </div>
      </div>

      {/* 발송 설정 */}
      <div className="bg-white border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">발송 설정</h2>
        <div className="flex items-center gap-3">
          <Label className="w-28 shrink-0 text-sm">알림 발송 시각</Label>
          <Input type="time" value={alertTime} onChange={(e) => setAlertTime(e.target.value)} className="w-32" />
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Label className="w-28 shrink-0 text-sm">발송 요일</Label>
          <div className="flex gap-2">
            {DAYS.map((d) => (
              <label key={d} className={`w-9 h-9 flex items-center justify-center rounded-full border text-sm cursor-pointer font-medium transition-colors ${alertDays.includes(d) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                <input type="checkbox" className="sr-only" checked={alertDays.includes(d)} onChange={() => toggleDay(d)} />
                {d}
              </label>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Label className="w-28 shrink-0 text-sm">알림 활성화</Label>
          <div className="flex gap-4">
            {[true, false].map((v) => (
              <label key={String(v)} className="flex items-center gap-1.5 cursor-pointer text-sm">
                <input type="radio" checked={isActive === v} onChange={() => setIsActive(v)} className="accent-blue-600" />
                {v ? '활성' : '비활성'}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 카카오 설정 */}
      <div className="bg-white border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">카카오 알림톡 설정</h2>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-xs text-yellow-800">
          ⚠️ 카카오 알림톡 사용을 위해서는 카카오 비즈니스 채널 등록이 필요합니다.
          미등록 시 이메일 알림으로 대체됩니다.
        </div>
        <div className="space-y-3">
          <div>
            <Label className="text-sm">발신 프로필 키</Label>
            <Input className="mt-1" value={senderKey} onChange={(e) => setSenderKey(e.target.value)} placeholder="카카오 비즈니스 채널에서 발급" />
          </div>
          <div>
            <Label className="text-sm">주의 알림 템플릿 코드</Label>
            <Input className="mt-1" value={templateWarning} onChange={(e) => setTemplateWarning(e.target.value)} placeholder="카카오 채널 관리자에서 등록" />
          </div>
          <div>
            <Label className="text-sm">위험 알림 템플릿 코드</Label>
            <Input className="mt-1" value={templateDanger} onChange={(e) => setTemplateDanger(e.target.value)} placeholder="카카오 채널 관리자에서 등록" />
          </div>
        </div>
      </div>

      {/* Edge Function 안내 */}
      <div className="bg-gray-50 border rounded-xl p-5 space-y-2">
        <h2 className="font-semibold text-gray-700 text-sm">자동 알림 배포 안내</h2>
        <div className="text-xs text-gray-500 space-y-1 font-mono bg-gray-100 rounded p-3">
          <div># Edge Function 배포</div>
          <div>npx supabase functions deploy daily-contact-alert --no-verify-jwt</div>
          <div className="mt-2"># Cron Job 등록 (Supabase SQL Editor)</div>
          <div>SELECT cron.schedule(&apos;daily-contact-alert&apos;, &apos;0 0 * * *&apos;, ...);</div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? '저장중...' : '설정 저장'}
      </Button>
    </div>
  )
}
