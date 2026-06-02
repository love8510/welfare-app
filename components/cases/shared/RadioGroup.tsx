'use client'

interface RadioGroupProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  name: string
  otherKey?: string
  otherValue?: string
  onOtherChange?: (val: string) => void
  inline?: boolean
}

export function RadioGroup({
  options, value, onChange, name, otherKey, otherValue = '', onOtherChange, inline = true
}: RadioGroupProps) {
  return (
    <div className={`flex flex-wrap gap-3`}>
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-1 text-sm cursor-pointer">
          <input
            type="radio"
            name={name}
            checked={value === opt}
            onChange={() => onChange(opt)}
          />
          {opt}
        </label>
      ))}
      {otherKey && (
        <label className="flex items-center gap-1 text-sm cursor-pointer">
          <input
            type="radio"
            name={name}
            checked={value === otherKey}
            onChange={() => onChange(otherKey)}
          />
          기타
          <input
            type="text"
            value={otherValue}
            onChange={(e) => onOtherChange?.(e.target.value)}
            className="border-b border-gray-400 w-20 text-xs outline-none"
            placeholder="입력"
          />
        </label>
      )}
    </div>
  )
}
