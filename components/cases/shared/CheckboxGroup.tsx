'use client'

interface CheckboxGroupProps {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  columns?: number
  otherKey?: string
  otherValue?: string
  onOtherChange?: (val: string) => void
}

export function CheckboxGroup({
  options, value, onChange, columns = 4, otherKey, otherValue = '', onOtherChange
}: CheckboxGroupProps) {
  const toggle = (opt: string) => {
    if (value.includes(opt)) {
      onChange(value.filter((v) => v !== opt))
    } else {
      onChange([...value, opt])
    }
  }

  return (
    <div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-1 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={value.includes(opt)}
            onChange={() => toggle(opt)}
            className="rounded"
          />
          {opt}
        </label>
      ))}
      {otherKey && (
        <label className="flex items-center gap-1 text-sm cursor-pointer col-span-1">
          <input
            type="checkbox"
            checked={value.includes(otherKey)}
            onChange={() => toggle(otherKey)}
            className="rounded"
          />
          기타
          <input
            type="text"
            value={otherValue}
            onChange={(e) => onOtherChange?.(e.target.value)}
            className="border-b border-gray-400 w-16 text-xs outline-none"
            placeholder="입력"
          />
        </label>
      )}
    </div>
  )
}
