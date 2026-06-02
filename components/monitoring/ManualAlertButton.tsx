'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { sendManualAlert } from '@/lib/actions/monitoring'
import { toast } from '@/lib/hooks/use-toast'

interface Props {
  clientId: string
  clientName: string
  workerName: string
  onSent?: () => void
}

export function ManualAlertButton({ clientId, clientName, workerName, onSent }: Props) {
  const [loading, setLoading] = useState(false)

  async function handle() {
    if (!confirm(`${clientName} 어르신의 담당자 ${workerName}에게 알림을 발송하시겠습니까?`)) return
    setLoading(true)
    try {
      await sendManualAlert(clientId)
      toast(`${workerName} 담당자에게 알림이 발송되었습니다`)
      onSent?.()
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handle} disabled={loading} className="text-xs h-7">
      {loading ? '발송중...' : '수동 알림 발송'}
    </Button>
  )
}
