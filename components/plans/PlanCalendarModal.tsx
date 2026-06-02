'use client'
import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { WorkLogPopup } from './WorkLogPopup'
import { getDailyPlans, importWeeklyPlanToCalendar } from '@/lib/actions/plans'
import { toast } from '@/lib/hooks/use-toast'

interface Holiday { date: string; name: string }
interface DailyPlan { id: string; plan_date: string; service_type?: string; resource?: string; provider?: string; is_completed: boolean }
interface ContactLog { id: string; contacted_at: string; service_type?: string; content?: string; duration_minutes?: number; method?: string }

interface Client {
  id: string; name: string; gender?: string; birth_date?: string
  address?: string; client_type?: string
  users?: { name: string } | null
}

interface Props {
  open: boolean
  onClose: () => void
  client: Client
  year: number
  month: number
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토']

function buildCalendar(year: number, month: number) {
  const first = new Date(year, month - 1, 1)
  const last = new Date(year, month, 0)
  const startDow = first.getDay()
  const days: (number | null)[] = Array(startDow).fill(null)
  for (let d = 1; d <= last.getDate(); d++) days.push(d)
  while (days.length % 7 !== 0) days.push(null)
  const weeks: (number | null)[][] = []
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7))
  return weeks
}

function fmtDate(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function PlanCalendarModal({ open, onClose, client, year, month }: Props) {
  const [plans, setPlans] = useState<DailyPlan[]>([])
  const [logs, setLogs] = useState<ContactLog[]>([])
  const [holidays, setHolidays] = useState<Holiday[]>([])
  const [workLogTarget, setWorkLogTarget] = useState<{ date: string; plan?: DailyPlan; log?: ContactLog } | null>(null)
  const [importing, setImporting] = useState(false)

  const load = useCallback(async () => {
    try {
      const res = await getDailyPlans(client.id, year, month)
      setPlans(res.plans as DailyPlan[])
      setLogs(res.logs as ContactLog[])
      setHolidays(res.holidays as Holiday[])
    } catch (err) {
      toast((err as Error).message, 'destructive')
    }
  }, [client.id, year, month])

  useEffect(() => { if (open) load() }, [open, load])

  async function handleImportWeekly() {
    setImporting(true)
    try {
      const n = await importWeeklyPlanToCalendar(client.id, year, month)
      toast(`주간계획 ${n}건 배치되었습니다`)
      load()
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setImporting(false)
    }
  }

  const weeks = buildCalendar(year, month)
  const today = new Date().toISOString().split('T')[0]

  function getHolidayName(day: number) {
    return holidays.find((h) => h.date === fmtDate(year, month, day))?.name
  }

  function getPlansForDay(day: number) {
    const date = fmtDate(year, month, day)
    return plans.filter((p) => p.plan_date === date)
  }

  function getLogsForDay(day: number) {
    const date = fmtDate(year, month, day)
    return logs.filter((l) => l.contacted_at?.startsWith(date))
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {year}년 {month}월 · {client.name} ({client.gender ?? '-'}) · {client.users?.name ?? '-'} 담당
          </DialogTitle>
        </DialogHeader>

        <div className="flex justify-between items-center mb-3">
          <Button variant="outline" size="sm" onClick={handleImportWeekly} disabled={importing}>
            {importing ? '배치중...' : '주간계획 가져오기'}
          </Button>
          <span className="text-sm text-gray-500">{client.address}</span>
        </div>

        {/* 달력 */}
        <div className="border rounded-lg overflow-hidden">
          <div className="grid grid-cols-7 bg-gray-50">
            {WEEKDAYS.map((d, i) => (
              <div key={d} className={`py-2 text-center text-xs font-semibold ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-gray-600'}`}>{d}</div>
            ))}
          </div>
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-t">
              {week.map((day, di) => {
                if (!day) return <div key={di} className="min-h-[80px] bg-gray-50 border-r last:border-r-0" />
                const dateStr = fmtDate(year, month, day)
                const isToday = dateStr === today
                const holidayName = getHolidayName(day)
                const isHoliday = !!holidayName || di === 0
                const isSat = di === 6
                const dayPlans = getPlansForDay(day)
                const dayLogs = getLogsForDay(day)
                return (
                  <div
                    key={di}
                    className="min-h-[80px] border-r last:border-r-0 p-1 cursor-pointer hover:bg-blue-50 transition-colors"
                    onClick={() => setWorkLogTarget({ date: dateStr })}
                  >
                    <div className={`text-xs font-medium mb-1 ${isHoliday ? 'text-red-500' : isSat ? 'text-blue-500' : ''} ${isToday ? 'font-bold underline' : ''}`}>
                      {day}
                      {holidayName && <span className="ml-1 text-[10px]">{holidayName}</span>}
                    </div>
                    {dayPlans.map((p) => (
                      <div
                        key={p.id}
                        className={`text-[10px] rounded px-1 py-0.5 mb-0.5 flex items-center justify-between gap-1 ${p.is_completed ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}
                        onClick={(e) => { e.stopPropagation(); setWorkLogTarget({ date: dateStr, plan: p }) }}
                      >
                        <span className="truncate">{p.service_type || '서비스'}</span>
                      </div>
                    ))}
                    {dayLogs.map((l) => (
                      <div
                        key={l.id}
                        className="text-[10px] rounded px-1 py-0.5 mb-0.5 bg-gray-100 text-gray-600 flex items-center justify-between"
                        onClick={(e) => { e.stopPropagation(); setWorkLogTarget({ date: dateStr, log: l }) }}
                      >
                        <span className="truncate">✓ {l.service_type || '일지'}</span>
                      </div>
                    ))}
                  </div>
                )
              })}
            </div>
          ))}
        </div>

        <div className="flex justify-end mt-3">
          <Button variant="secondary" onClick={onClose}>닫기</Button>
        </div>
      </DialogContent>

      {workLogTarget && (
        <WorkLogPopup
          open={!!workLogTarget}
          onClose={() => setWorkLogTarget(null)}
          onSaved={load}
          clientId={client.id}
          clientName={client.name}
          gender={client.gender}
          birthDate={client.birth_date}
          workerName={client.users?.name}
          planDate={workLogTarget.date}
          serviceType={workLogTarget.plan?.service_type}
          dailyPlanId={workLogTarget.plan?.id}
          existingLog={workLogTarget.log ? {
            id: workLogTarget.log.id,
            content: workLogTarget.log.content,
            duration_minutes: workLogTarget.log.duration_minutes,
            service_type: workLogTarget.log.service_type,
            method: workLogTarget.log.method,
          } : null}
        />
      )}
    </Dialog>
  )
}
