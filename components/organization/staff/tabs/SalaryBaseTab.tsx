'use client'
import { useState } from 'react'
import { upsertSalaryBase } from '@/lib/actions/staff'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { INSURANCE_RATES } from '@/lib/insurance-rates'

type SalaryBase = Record<string, unknown>

function fmt(n: number) { return n.toLocaleString() }

export function SalaryBaseTab({ userId, salaryBase }: { userId: string; salaryBase: SalaryBase | null }) {
  const [pay, setPay] = useState({
    base_salary: Number(salaryBase?.base_salary ?? 0),
    position_allowance: Number(salaryBase?.position_allowance ?? 0),
    meal_allowance: Number(salaryBase?.meal_allowance ?? 0),
    transport_allowance: Number(salaryBase?.transport_allowance ?? 0),
    other_allowance: Number(salaryBase?.other_allowance ?? 0),
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  const gross = Object.values(pay).reduce((a, b) => a + b, 0)
  const np = Math.round(gross * INSURANCE_RATES.nationalPension.employee)
  const hi = Math.round(gross * INSURANCE_RATES.healthInsurance.employee)
  const ltc = Math.round(hi * INSURANCE_RATES.longTermCare.rate)
  const ei = Math.round(gross * INSURANCE_RATES.employmentInsEmployee)
  const incomeTax = Math.round(gross * 0.006)
  const localTax = Math.round(incomeTax * 0.1)
  const totalDeduct = np + hi + ltc + ei + incomeTax + localTax
  const netPay = gross - totalDeduct

  async function handleSave() {
    setSaving(true)
    try {
      await upsertSalaryBase(userId, {
        ...pay,
        national_pension: np, health_insurance: hi,
        employment_insurance: ei, industrial_insurance: 0,
      })
      setMsg('저장되었습니다')
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : '저장 실패')
    }
    setSaving(false)
  }

  const payRow = (label: string, key: keyof typeof pay, note?: string) => (
    <tr className="border-b">
      <td className="px-4 py-2 text-sm text-gray-600 bg-gray-50 w-36">{label}{note && <span className="text-xs text-green-600 ml-1">{note}</span>}</td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <Input type="number" value={pay[key]} onChange={e => setPay(p => ({ ...p, [key]: Number(e.target.value) }))}
            className="w-40 text-right" />
          <span className="text-sm text-gray-400">원</span>
        </div>
      </td>
    </tr>
  )

  const readRow = (label: string, value: number, note?: string) => (
    <tr className="border-b">
      <td className="px-4 py-2 text-sm text-gray-600 bg-gray-50 w-36">{label}{note && <span className="text-xs text-gray-400 ml-1">{note}</span>}</td>
      <td className="px-4 py-2 text-right font-medium text-sm">{fmt(value)} 원</td>
    </tr>
  )

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* 지급항목 */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 border-b px-4 py-2 text-sm font-semibold text-center">지급항목</div>
          <table className="w-full">
            <tbody>
              {payRow('기본급', 'base_salary')}
              {payRow('직책수당', 'position_allowance')}
              {payRow('식대', 'meal_allowance', '비과세')}
              {payRow('교통비', 'transport_allowance')}
              {payRow('기타수당', 'other_allowance')}
              <tr className="bg-blue-50 font-semibold">
                <td className="px-4 py-2 text-sm">지급합계</td>
                <td className="px-4 py-2 text-right text-blue-700">{fmt(gross)} 원</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 공제항목 미리보기 */}
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-gray-100 border-b px-4 py-2 text-sm font-semibold text-center">공제 미리보기 (자동계산)</div>
          <table className="w-full">
            <tbody>
              {readRow('국민연금', np, '4.5%')}
              {readRow('건강보험', hi, '3.545%')}
              {readRow('장기요양', ltc)}
              {readRow('고용보험', ei, '0.9%')}
              {readRow('소득세', incomeTax, '간이세액')}
              {readRow('지방소득세', localTax)}
              <tr className="bg-red-50 font-semibold border-b">
                <td className="px-4 py-2 text-sm">공제합계</td>
                <td className="px-4 py-2 text-right text-red-600">{fmt(totalDeduct)} 원</td>
              </tr>
              <tr className="bg-green-50 font-semibold">
                <td className="px-4 py-2 text-sm">실수령액</td>
                <td className="px-4 py-2 text-right text-green-700">{fmt(netPay)} 원</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {msg && <p className={`text-sm ${msg.includes('실패') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} className="bg-[#2d7a2d] hover:bg-[#256325]">
          {saving ? '저장 중...' : '급여기초 저장'}
        </Button>
      </div>
    </div>
  )
}
