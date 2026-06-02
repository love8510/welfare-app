'use client'
import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Props {
  slots: number
  approvers: string[]
  onChange: (slots: number, approvers: string[]) => void
}

export function ApprovalSlotSetting({ slots, approvers, onChange }: Props) {
  const [count, setCount] = useState(slots)
  const [names, setNames] = useState<string[]>(approvers)

  useEffect(() => {
    setCount(slots)
    setNames(approvers)
  }, [slots, approvers])

  function handleCountChange(val: string) {
    const n = parseInt(val)
    const updated = Array.from({ length: n }, (_, i) => names[i] ?? '')
    setCount(n)
    setNames(updated)
    onChange(n, updated)
  }

  function handleNameChange(idx: number, val: string) {
    const updated = [...names]
    updated[idx] = val
    setNames(updated)
    onChange(count, updated)
  }

  return (
    <div className="flex items-center gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">결재란 수</span>
        <Select value={String(count)} onValueChange={handleCountChange}>
          <SelectTrigger className="w-20">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5].map((n) => (
              <SelectItem key={n} value={String(n)}>{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">서명란</span>
        {Array.from({ length: count }).map((_, i) => (
          <Input
            key={i}
            className="w-24"
            placeholder={`서명${i + 1}`}
            value={names[i] ?? ''}
            onChange={(e) => handleNameChange(i, e.target.value)}
          />
        ))}
      </div>
    </div>
  )
}
