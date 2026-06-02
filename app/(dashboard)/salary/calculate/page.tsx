'use client'
import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SalaryCalculator } from '@/components/salary/SalaryCalculator'
import { getStaffForSalary, getOrgRates } from '@/lib/actions/salary'
import { OrgRates, DEFAULT_ORG_RATES } from '@/lib/insurance-rates'
import { useRouter } from 'next/navigation'

type StaffItem = { id: string; name: string; job_title?: string; base_salary?: number }

export default function SalaryCalculatePage() {
  const now = new Date()
  const [year] = useState(now.getFullYear())
  const [month] = useState(now.getMonth() + 1)
  const [staff, setStaff] = useState<StaffItem[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [orgRates, setOrgRates] = useState<OrgRates>(DEFAULT_ORG_RATES)
  const router = useRouter()

  useEffect(() => {
    getStaffForSalary().then((data) => {
      setStaff(data as StaffItem[])
      if (data.length) setSelectedId((data[0] as StaffItem).id)
    })
    getOrgRates().then(setOrgRates)
  }, [])

  const selected = staff.find((s) => s.id === selectedId)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold">급여 계산</h1>
        <span className="text-gray-500">{year}년 {month}월</span>
        <Select value={selectedId} onValueChange={setSelectedId}>
          <SelectTrigger className="w-36 h-8"><SelectValue placeholder="직원 선택" /></SelectTrigger>
          <SelectContent>
            {staff.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selected ? (
        <SalaryCalculator
          userId={selected.id}
          userName={selected.name}
          year={year}
          month={month}
          orgRates={orgRates}
          initial={{ baseSalary: selected.base_salary ?? 0 }}
          onSaved={() => router.push('/salary')}
          onCancel={() => router.push('/salary')}
        />
      ) : (
        <div className="text-center py-10 text-gray-400">직원을 선택해주세요</div>
      )}
    </div>
  )
}
