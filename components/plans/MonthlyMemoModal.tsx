'use client'
import { useState, useTransition } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { upsertWorkerMemo } from '@/lib/actions/plans'
import { toast } from '@/lib/hooks/use-toast'

interface Props {
  open: boolean
  onClose: () => void
  workerName: string
  workerId: string
  year: number
  month: number
  planCount: number
  initialMemo: string
}

export function MonthlyMemoModal({ open, onClose, workerName, workerId, year, month, planCount, initialMemo }: Props) {
  const [memo, setMemo] = useState(initialMemo)
  const [isPending, startTransition] = useTransition()

  function handleSave() {
    startTransition(async () => {
      try {
        await upsertWorkerMemo(workerId, year, month, memo)
        toast('저장되었습니다')
        onClose()
      } catch (err) {
        toast((err as Error).message, 'destructive')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{workerName} · {year}년 {month}월</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-gray-500">계획 건수</span>
            <span className="font-semibold text-blue-600">{planCount}건</span>
            <span className="text-gray-400 text-xs">(자동집계)</span>
          </div>
          <div>
            <label className="text-sm font-medium block mb-1">일정 메모</label>
            <textarea
              rows={4}
              className="w-full border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
              placeholder="일정메모를 등록하시려면 클릭하여 주십시오."
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>닫기</Button>
            <Button onClick={handleSave} disabled={isPending}>{isPending ? '저장중...' : '저장'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
