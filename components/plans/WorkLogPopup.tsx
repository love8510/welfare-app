'use client'
import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { saveWorkLog, updateWorkLog, deleteWorkLog } from '@/lib/actions/plans'
import { toast } from '@/lib/hooks/use-toast'

const METHODS = ['전화', '방문', '문자', '기타']
const SERVICE_TYPES = ['전화상담', '방문', '교육', '기타']

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  clientId: string
  clientName: string
  gender?: string
  birthDate?: string
  workerName?: string
  planDate: string
  serviceType?: string
  dailyPlanId?: string
  existingLog?: {
    id: string
    content?: string
    duration_minutes?: number
    service_type?: string
    method?: string
    start_time?: string
    end_time?: string
  } | null
}

function calcAge(bd?: string) {
  if (!bd) return ''
  return `${new Date().getFullYear() - new Date(bd).getFullYear()}세`
}

export function WorkLogPopup({
  open, onClose, onSaved, clientId, clientName, gender, birthDate,
  workerName, planDate, serviceType, dailyPlanId, existingLog,
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [content, setContent] = useState(existingLog?.content ?? '')
  const [duration, setDuration] = useState(String(existingLog?.duration_minutes ?? ''))
  const [method, setMethod] = useState(existingLog?.method ?? '전화')
  const [svcType, setSvcType] = useState(existingLog?.service_type ?? serviceType ?? '전화상담')
  const [startTime, setStartTime] = useState(existingLog?.start_time ?? '')
  const [endTime, setEndTime] = useState(existingLog?.end_time ?? '')

  function handleSave() {
    startTransition(async () => {
      try {
        if (existingLog?.id) {
          await updateWorkLog(existingLog.id, {
            serviceType: svcType, method, content,
            durationMinutes: duration ? Number(duration) : undefined,
            startTime: startTime || undefined,
            endTime: endTime || undefined,
          })
        } else {
          await saveWorkLog({
            clientId, serviceType: svcType, method, content,
            durationMinutes: duration ? Number(duration) : undefined,
            planDate, startTime: startTime || undefined,
            endTime: endTime || undefined,
            dailyPlanId,
          })
        }
        toast('업무일지가 저장되었습니다')
        onSaved()
        onClose()
      } catch (err) {
        toast((err as Error).message, 'destructive')
      }
    })
  }

  function handleDelete() {
    if (!existingLog?.id) return
    if (!confirm('업무일지를 삭제하시겠습니까?')) return
    startTransition(async () => {
      try {
        await deleteWorkLog(existingLog.id)
        toast('삭제되었습니다')
        onSaved()
        onClose()
      } catch (err) {
        toast((err as Error).message, 'destructive')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[420px]">
        <DialogHeader>
          <DialogTitle>업무일지</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="bg-gray-50 rounded p-3 text-sm grid grid-cols-2 gap-1">
            <div><span className="text-gray-500">대상자</span> <span className="font-medium">{clientName}</span></div>
            <div><span className="text-gray-500">성별</span> <span>{gender ?? '-'}</span></div>
            <div><span className="text-gray-500">생년월일</span> <span>{birthDate ?? '-'}</span></div>
            <div><span className="text-gray-500">나이</span> <span>{calcAge(birthDate)}</span></div>
            <div><span className="text-gray-500">담당자</span> <span>{workerName ?? '-'}</span></div>
            <div><span className="text-gray-500">날짜</span> <span>{planDate}</span></div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>서비스 종류</Label>
              <Select value={svcType} onValueChange={setSvcType}>
                <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>{SERVICE_TYPES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>접촉방법</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="mt-1 h-8"><SelectValue /></SelectTrigger>
                <SelectContent>{METHODS.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>시작시간</Label>
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1 h-8" />
            </div>
            <div>
              <Label>종료시간</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1 h-8" />
            </div>
            <div className="col-span-2">
              <Label>실적시간 (분)</Label>
              <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} className="mt-1 h-8 w-24" />
            </div>
          </div>

          <div>
            <Label>업무내용</Label>
            <textarea
              rows={6}
              className="w-full border rounded-md px-3 py-2 text-sm mt-1 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="예) 5월 성일자확인 전화안함 (다시예정)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            {existingLog?.id && (
              <Button variant="destructive" onClick={handleDelete} disabled={isPending}>삭제</Button>
            )}
            <Button variant="secondary" onClick={onClose}>닫기</Button>
            <Button onClick={handleSave} disabled={isPending}>{isPending ? '저장중...' : '저장'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
