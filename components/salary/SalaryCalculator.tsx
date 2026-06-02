'use client'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { calculateSalary, OrgRates, SalaryInput, SalaryCalcResult } from '@/lib/insurance-rates'
import { upsertSalary } from '@/lib/actions/salary'
import { toast } from '@/lib/hooks/use-toast'

interface Props {
  userId: string
  userName: string
  year: number
  month: number
  orgRates: OrgRates
  initial?: Partial<SalaryInput & { work_days: number; paid_leave_days: number; absent_days: number; overtime_hours: number; note: string }>
  onSaved?: (showPdf?: boolean) => void
  onCancel?: () => void
}

const ZERO_INPUT: SalaryInput = {
  baseSalary: 0, positionAllowance: 0, mealAllowance: 200000,
  transportAllowance: 0, overtimePay: 0, holidayPay: 0,
  bonus: 0, otherPay: 0, otherDeduction: 0,
}

function fmt(n: number) { return n.toLocaleString('ko-KR') }
function num(v: string) { return Number(v.replace(/,/g, '')) || 0 }

function MoneyField({ label, value, onChange, hint }: {
  label: string; value: number; onChange: (v: number) => void; hint?: string
}) {
  const [raw, setRaw] = useState(value === 0 ? '' : String(value))

  useEffect(() => { setRaw(value === 0 ? '' : String(value)) }, [value])

  return (
    <div className="flex items-center gap-2">
      <Label className="w-36 text-sm text-right shrink-0">{label}</Label>
      <Input
        className="w-36 text-right"
        value={raw}
        onChange={(e) => {
          const v = e.target.value.replace(/[^0-9]/g, '')
          setRaw(v)
          onChange(Number(v) || 0)
        }}
        onBlur={() => setRaw(value === 0 ? '' : String(value))}
      />
      <span className="text-sm text-gray-500">원</span>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
  )
}

function ReadonlyRow({ label, value, hint, bold }: {
  label: string; value: number; hint?: string; bold?: boolean
}) {
  return (
    <div className={`flex items-center gap-2 ${bold ? 'font-semibold' : ''}`}>
      <span className="w-36 text-sm text-right shrink-0 text-gray-600">{label}</span>
      <span className="w-36 text-right text-sm border border-gray-200 rounded px-2 py-1 bg-gray-50">{fmt(value)}</span>
      <span className="text-sm text-gray-500">원</span>
      {hint && <span className="text-xs text-gray-400">{hint}</span>}
    </div>
  )
}

export function SalaryCalculator({ userId, userName, year, month, orgRates, initial, onSaved, onCancel }: Props) {
  const [input, setInput] = useState<SalaryInput>({
    ...ZERO_INPUT,
    baseSalary: initial?.baseSalary ?? 0,
    positionAllowance: initial?.positionAllowance ?? 0,
    mealAllowance: initial?.mealAllowance ?? 200000,
    transportAllowance: initial?.transportAllowance ?? 0,
    overtimePay: initial?.overtimePay ?? 0,
    holidayPay: initial?.holidayPay ?? 0,
    bonus: initial?.bonus ?? 0,
    otherPay: initial?.otherPay ?? 0,
    otherDeduction: initial?.otherDeduction ?? 0,
  })
  const [workDays, setWorkDays] = useState(initial?.work_days ?? 22)
  const [paidLeave, setPaidLeave] = useState(initial?.paid_leave_days ?? 0)
  const [absentDays, setAbsentDays] = useState(initial?.absent_days ?? 0)
  const [otHours, setOtHours] = useState(initial?.overtime_hours ?? 0)
  const [note, setNote] = useState(initial?.note ?? '')
  const [saving, setSaving] = useState(false)

  const calc: SalaryCalcResult = calculateSalary(input, orgRates)

  const setF = useCallback(<K extends keyof SalaryInput>(k: K) => (v: number) => {
    setInput((prev) => ({ ...prev, [k]: v }))
  }, [])

  async function save(showPdf = false) {
    setSaving(true)
    try {
      await upsertSalary({
        user_id: userId, year, month,
        base_salary: input.baseSalary,
        position_allowance: input.positionAllowance,
        meal_allowance: input.mealAllowance,
        transport_allowance: input.transportAllowance,
        overtime_pay: input.overtimePay,
        holiday_pay: input.holidayPay,
        bonus: input.bonus,
        other_pay: input.otherPay,
        other_deduction: input.otherDeduction,
        work_days: workDays,
        paid_leave_days: paidLeave,
        absent_days: absentDays,
        overtime_hours: otHours,
        note,
      })
      toast('급여가 저장되었습니다')
      onSaved?.(showPdf)
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-lg font-bold">{userName} · {year}년 {month}월 급여</h2>

      {/* 지급 항목 */}
      <div className="bg-white border rounded-lg p-4 space-y-2">
        <div className="text-sm font-bold text-gray-700 border-b pb-2 mb-3">지급 항목</div>
        <MoneyField label="기본급" value={input.baseSalary} onChange={setF('baseSalary')} />
        <MoneyField label="직책수당" value={input.positionAllowance} onChange={setF('positionAllowance')} />
        <MoneyField label="식대" value={input.mealAllowance} onChange={setF('mealAllowance')} hint="(20만원 비과세)" />
        <MoneyField label="교통비" value={input.transportAllowance} onChange={setF('transportAllowance')} />
        <MoneyField label="초과근무수당" value={input.overtimePay} onChange={setF('overtimePay')} />
        <MoneyField label="휴일근무수당" value={input.holidayPay} onChange={setF('holidayPay')} />
        <MoneyField label="상여금" value={input.bonus} onChange={setF('bonus')} />
        <MoneyField label="기타수당" value={input.otherPay} onChange={setF('otherPay')} />
        <div className="border-t pt-2">
          <ReadonlyRow label="지급합계" value={calc.gross} bold />
        </div>
      </div>

      {/* 근로자 공제 */}
      <div className="bg-white border rounded-lg p-4 space-y-2">
        <div className="text-sm font-bold text-gray-700 border-b pb-2 mb-3">근로자 공제 (자동계산)</div>
        <ReadonlyRow label="국민연금" value={calc.npEe} hint="(4.5%)" />
        <ReadonlyRow label="건강보험" value={calc.hiEe} hint="(3.545%)" />
        <ReadonlyRow label="장기요양보험" value={calc.ltEe} hint="(건강보험×12.95%)" />
        <ReadonlyRow label="고용보험" value={calc.eiEe} hint="(0.9%)" />
        <ReadonlyRow label="소득세" value={calc.it} hint="(간이세액)" />
        <ReadonlyRow label="지방소득세" value={calc.lit} hint="(소득세×10%)" />
        <MoneyField label="기타공제" value={input.otherDeduction} onChange={setF('otherDeduction')} />
        <div className="border-t pt-2 space-y-1">
          <ReadonlyRow label="공제합계" value={calc.totalDed} bold />
          <ReadonlyRow label="실수령액" value={calc.netPay} bold />
        </div>
      </div>

      {/* 사업주 부담 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
        <div className="text-sm font-bold text-blue-800 border-b border-blue-200 pb-2 mb-3">사업주 부담 (참고)</div>
        <ReadonlyRow label="국민연금(사업주)" value={calc.npEr} hint="(4.5%)" />
        <ReadonlyRow label="건강보험(사업주)" value={calc.hiEr} hint="(3.545%)" />
        <ReadonlyRow label="장기요양(사업주)" value={calc.ltEr} />
        <ReadonlyRow label="고용보험(사업주)" value={calc.eiEr} hint={`(${orgRates.employmentDevRate}%)`} />
        <ReadonlyRow label="산재보험(사업주)" value={calc.iiEr} hint={`(${orgRates.industrialInsRate}%)`} />
        <ReadonlyRow label="퇴직적립금" value={calc.sev} hint={`(${orgRates.severanceRate}%)`} />
        <div className="border-t border-blue-200 pt-2">
          <ReadonlyRow label="총 인건비" value={calc.totalLaborCost} bold />
        </div>
      </div>

      {/* 근태 */}
      <div className="bg-white border rounded-lg p-4">
        <div className="text-sm font-bold text-gray-700 border-b pb-2 mb-3">근태</div>
        <div className="flex flex-wrap gap-4 text-sm">
          {[
            { label: '실근무일수', value: workDays, set: setWorkDays, unit: '일' },
            { label: '유급휴가', value: paidLeave, set: setPaidLeave, unit: '일' },
            { label: '결근', value: absentDays, set: setAbsentDays, unit: '일' },
            { label: '초과근무', value: otHours, set: setOtHours, unit: '시간' },
          ].map(({ label, value, set, unit }) => (
            <div key={label} className="flex items-center gap-1">
              <span className="text-gray-600">{label}</span>
              <input
                type="number"
                className="w-14 border rounded px-1 py-0.5 text-center text-sm"
                value={value}
                onChange={(e) => set(Number(e.target.value) || 0)}
              />
              <span className="text-gray-500">{unit}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 메모 */}
      <div className="bg-white border rounded-lg p-4">
        <Label className="text-sm font-bold">메모</Label>
        <textarea
          className="w-full mt-2 border rounded p-2 text-sm resize-none"
          rows={2}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={() => save(false)} disabled={saving}>저장</Button>
        <Button variant="outline" onClick={() => save(true)} disabled={saving}>저장 후 명세서 출력</Button>
        {onCancel && <Button variant="ghost" onClick={onCancel}>취소</Button>}
      </div>
    </div>
  )
}
