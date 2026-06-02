'use client'
import { useState, useEffect } from 'react'
import { use } from 'react'
import { SalaryCalculator } from '@/components/salary/SalaryCalculator'
import { getSalaryById, getOrgRates } from '@/lib/actions/salary'
import { OrgRates, DEFAULT_ORG_RATES } from '@/lib/insurance-rates'
import { useRouter } from 'next/navigation'

type SlipRow = Record<string, unknown>

export default function SalaryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [slip, setSlip] = useState<SlipRow | null>(null)
  const [orgRates, setOrgRates] = useState<OrgRates>(DEFAULT_ORG_RATES)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    Promise.all([getSalaryById(id), getOrgRates()]).then(([s, r]) => {
      setSlip(s as SlipRow)
      setOrgRates(r)
    }).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="text-center py-10 text-gray-400">불러오는 중...</div>
  if (!slip) return <div className="text-center py-10 text-gray-400">급여 데이터를 찾을 수 없습니다</div>

  const user = slip.users as Record<string, string>

  return (
    <SalaryCalculator
      userId={user?.id ?? ''}
      userName={user?.name ?? ''}
      year={slip.year as number}
      month={slip.month as number}
      orgRates={orgRates}
      initial={{
        baseSalary: slip.base_salary as number ?? 0,
        positionAllowance: slip.position_allowance as number ?? 0,
        mealAllowance: slip.meal_allowance as number ?? 0,
        transportAllowance: slip.transport_allowance as number ?? 0,
        overtimePay: slip.overtime_pay as number ?? 0,
        holidayPay: slip.holiday_pay as number ?? 0,
        bonus: slip.bonus as number ?? 0,
        otherPay: slip.other_pay as number ?? 0,
        otherDeduction: slip.other_deduction as number ?? 0,
        work_days: slip.work_days as number ?? 22,
        paid_leave_days: slip.paid_leave_days as number ?? 0,
        absent_days: slip.absent_days as number ?? 0,
        overtime_hours: slip.overtime_hours as number ?? 0,
        note: slip.note as string ?? '',
      }}
      onSaved={() => router.push('/salary')}
      onCancel={() => router.push('/salary')}
    />
  )
}
