'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { getSalarySlipData } from '@/lib/actions/salary'
import { toast } from '@/lib/hooks/use-toast'

interface Props { salaryId: string; label?: string }

export function SalarySlipModal({ salaryId, label = 'PDF' }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    setLoading(true)
    try {
      const result = await getSalarySlipData(salaryId)
      if (!result.slip) throw new Error('급여 데이터 없음')

      const slip = result.slip as Record<string, unknown>
      const user = slip.users as Record<string, string> | null
      const org = result.org as Record<string, string> | null

      const { downloadSalarySlipPDF } = await import('@/components/salary/pdf/SalarySlipPDF')
      await downloadSalarySlipPDF({
        year: slip.year as number,
        month: slip.month as number,
        user_name: user?.name ?? '',
        job_title: user?.job_title ?? '',
        org_name: org?.name ?? '',
        base_salary: slip.base_salary as number ?? 0,
        position_allowance: slip.position_allowance as number ?? 0,
        meal_allowance: slip.meal_allowance as number ?? 0,
        transport_allowance: slip.transport_allowance as number ?? 0,
        overtime_pay: slip.overtime_pay as number ?? 0,
        holiday_pay: slip.holiday_pay as number ?? 0,
        bonus: slip.bonus as number ?? 0,
        other_pay: slip.other_pay as number ?? 0,
        gross_pay: slip.gross_pay as number ?? 0,
        national_pension_ee: slip.national_pension_ee as number ?? 0,
        health_insurance_ee: slip.health_insurance_ee as number ?? 0,
        long_term_care_ee: slip.long_term_care_ee as number ?? 0,
        employment_ins_ee: slip.employment_ins_ee as number ?? 0,
        income_tax: slip.income_tax as number ?? 0,
        local_income_tax: slip.local_income_tax as number ?? 0,
        other_deduction: slip.other_deduction as number ?? 0,
        total_deduction: slip.total_deduction as number ?? 0,
        net_pay: slip.net_pay as number ?? 0,
        national_pension_er: slip.national_pension_er as number ?? 0,
        health_insurance_er: slip.health_insurance_er as number ?? 0,
        long_term_care_er: slip.long_term_care_er as number ?? 0,
        employment_ins_er: slip.employment_ins_er as number ?? 0,
        industrial_ins_er: slip.industrial_ins_er as number ?? 0,
        severance_reserve: slip.severance_reserve as number ?? 0,
        total_labor_cost: slip.total_labor_cost as number ?? 0,
      })
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading}>
      {loading ? '생성중...' : label}
    </Button>
  )
}
