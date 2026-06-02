'use client'
import { useRef, useState } from 'react'
import { Input } from '@/components/ui/input'

interface Props {
  value?: string
  onChange: (raw: string, gender: '남' | '여' | '') => void
  masked?: boolean
}

export function IdNumberInput({ value = '', onChange, masked = false }: Props) {
  const backRef = useRef<HTMLInputElement>(null)
  const [front, setFront] = useState(value.split('-')[0] ?? '')
  const [back, setBack] = useState(value.split('-')[1] ?? '')

  function detectGender(code: string): '남' | '여' | '' {
    const c = parseInt(code[0])
    if (c === 1 || c === 3) return '남'
    if (c === 2 || c === 4) return '여'
    return ''
  }

  function handleFront(v: string) {
    const clean = v.replace(/\D/g, '').slice(0, 6)
    setFront(clean)
    const raw = clean + '-' + back
    onChange(raw, detectGender(back))
    if (clean.length === 6) backRef.current?.focus()
  }

  function handleBack(v: string) {
    const clean = v.replace(/\D/g, '').slice(0, 7)
    setBack(clean)
    onChange(front + '-' + clean, detectGender(clean))
  }

  const displayBack = masked && back.length >= 7
    ? back[0] + '******'
    : back

  return (
    <div className="flex items-center gap-1">
      <Input
        value={front}
        onChange={(e) => handleFront(e.target.value)}
        placeholder="앞 6자리"
        className="w-28"
        maxLength={6}
        inputMode="numeric"
      />
      <span>-</span>
      <Input
        ref={backRef}
        value={displayBack}
        onChange={(e) => handleBack(e.target.value)}
        placeholder="뒤 7자리"
        className="w-28"
        maxLength={masked ? 7 : 7}
        inputMode="numeric"
        type={masked ? 'text' : 'text'}
      />
    </div>
  )
}
