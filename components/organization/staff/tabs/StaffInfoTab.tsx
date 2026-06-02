'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateStaff, resetPassword, upsertSalaryBase } from '@/lib/actions/staff'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { calculateSalary } from '@/lib/insurance-rates'

const JOB_TITLES = ['사회복지사', '요양보호사', '간호조무사', '사무원', '기타']
const POSITIONS = ['센터장', '팀장', '과장', '사원', '기타']

type StaffData = Record<string, unknown>
type SalaryBase = Record<string, unknown>

export function StaffInfoTab({ staff, departments, salaryBase }: {
  staff: StaffData
  departments: { id: string; name: string }[]
  salaryBase: SalaryBase | null
}) {
  const router = useRouter()
  const isNew = !staff.id
  const [form, setForm] = useState({
    name: (staff.name as string) ?? '',
    gender: (staff.gender as string) ?? '',
    birth_date: (staff.birth_date as string) ?? '',
    id_number: (staff.id_number as string) ?? '',
    phone: (staff.phone as string) ?? '',
    mobile: (staff.mobile as string) ?? '',
    email: (staff.email as string) ?? '',
    zipcode: (staff.zipcode as string) ?? '',
    address: (staff.address as string) ?? '',
    address_detail: (staff.address_detail as string) ?? '',
    hire_date: (staff.hire_date as string) ?? '',
    work_start_date: (staff.work_start_date as string) ?? '',
    employee_no: (staff.employee_no as string) ?? '',
    user_id_login: (staff.user_id_login as string) ?? '',
    job_title: (staff.job_title as string) ?? '',
    department_id: (staff.department_id as string) ?? '',
    position: (staff.position as string) ?? '',
    employment_type: (staff.employment_type as string) ?? '정규직',
    employment_status: (staff.employment_status as string) ?? '재직',
    resign_date: (staff.resign_date as string) ?? '',
    main_duties: (staff.main_duties as string) ?? '',
  })

  const [salaryForm, setSalaryForm] = useState({
    national_pension: Number(salaryBase?.national_pension ?? 0),
    health_insurance: Number(salaryBase?.health_insurance ?? 0),
    employment_insurance: Number(salaryBase?.employment_insurance ?? 0),
    industrial_insurance: Number(salaryBase?.industrial_insurance ?? 0),
    applied_from: (salaryBase?.applied_from as string) ?? '',
    applied_to: (salaryBase?.applied_to as string) ?? '',
    pension_base_amount: Number(salaryBase?.pension_base_amount ?? 0),
    pension_base_month: (salaryBase?.pension_base_month as string) ?? '',
    pension_auto_calc: salaryBase?.pension_auto_calc !== false,
    bank_name: (salaryBase?.bank_name as string) ?? '',
    account_holder: (salaryBase?.account_holder as string) ?? '',
    account_no: (salaryBase?.account_no as string) ?? '',
    note: (salaryBase?.note as string) ?? '',
  })

  const [idFront, setIdFront] = useState((staff.id_number as string)?.split('-')[0] ?? '')
  const [idBack, setIdBack] = useState('')
  const [showPwChange, setShowPwChange] = useState(false)
  const [newPw, setNewPw] = useState('')
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  function handleIdFront(v: string) {
    setIdFront(v)
    if (v.length === 6) document.getElementById('id-back')?.focus()
  }

  function handleIdBack(v: string) {
    setIdBack(v)
    if (v.length >= 1) {
      const d = parseInt(v[0])
      setForm(f => ({ ...f, gender: [1, 3].includes(d) ? '남' : '여' }))
    }
    const masked = v.length > 1 ? v[0] + '******' : v
    setForm(f => ({ ...f, id_number: `${idFront}-${masked}` }))
  }

  function calcInsurance() {
    const baseSalary = Number(staff.base_salary ?? 0)
    if (!baseSalary) return
    const result = calculateSalary({ baseSalary, positionAllowance: 0, mealAllowance: 0, transportAllowance: 0, overtimePay: 0, holidayPay: 0, bonus: 0, otherPay: 0, otherDeduction: 0 }, { industrialInsRate: 0.793, employmentDevRate: 0.250, severanceRate: 8.3333 })
    setSalaryForm(f => ({
      ...f,
      national_pension: result.npEe,
      health_insurance: result.hiEe,
      employment_insurance: result.eiEe,
      industrial_insurance: result.iiEr,
    }))
  }

  async function handleSave() {
    setSaving(true)
    setMsg('')
    try {
      if (staff.id) {
        await updateStaff(staff.id as string, form)
        await upsertSalaryBase(staff.id as string, salaryForm)
        if (showPwChange && newPw) await resetPassword(staff.id as string, newPw)
      }
      setMsg('저장되었습니다')
      router.refresh()
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : '저장 실패')
    }
    setSaving(false)
  }

  const field = (label: string, key: keyof typeof form, type = 'text', extra?: React.ReactNode) => (
    <div className="flex items-center gap-2">
      <Label className="w-24 shrink-0 text-sm font-medium text-gray-600">{label}</Label>
      <Input type={type} value={form[key] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="flex-1" />
      {extra}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* 기본정보 */}
      <section className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 border-b px-4 py-2 text-sm font-semibold text-center">기 본 정 보</div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {field('입사일자', 'hire_date', 'date')}
          {field('근무시작일', 'work_start_date', 'date')}
          {field('사번', 'employee_no')}
          {field('사용자ID', 'user_id_login')}
          {!isNew && (
            <div className="col-span-2 flex items-center gap-2">
              <Label className="w-24 shrink-0 text-sm font-medium text-gray-600">비밀번호</Label>
              {showPwChange ? (
                <Input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="새 비밀번호 입력" className="flex-1" />
              ) : (
                <Button size="sm" variant="outline" onClick={() => setShowPwChange(true)}>비밀번호 변경</Button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* 급여지급은행정보 */}
      <section className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 border-b px-4 py-2 text-sm font-semibold text-center">급여지급은행정보</div>
        <div className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Label className="w-24 shrink-0 text-sm text-gray-600">급여지급은행</Label>
            <Input value={salaryForm.bank_name} onChange={e => setSalaryForm(f => ({ ...f, bank_name: e.target.value }))} className="flex-1" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-24 shrink-0 text-sm text-gray-600">예금주</Label>
            <Input value={salaryForm.account_holder} onChange={e => setSalaryForm(f => ({ ...f, account_holder: e.target.value }))} className="flex-1" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-24 shrink-0 text-sm text-gray-600">계좌번호</Label>
            <Input value={salaryForm.account_no} onChange={e => setSalaryForm(f => ({ ...f, account_no: e.target.value }))} className="flex-1" />
          </div>
        </div>
      </section>

      {/* 소속 */}
      <section className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 border-b px-4 py-2 text-sm font-semibold text-center">소  속</div>
        <div className="p-4 space-y-2">
          {[
            { label: '직무', key: 'job_title', options: JOB_TITLES },
            { label: '직위', key: 'position', options: POSITIONS },
          ].map(({ label, key, options }) => (
            <div key={key} className="flex items-center gap-2">
              <Label className="w-24 shrink-0 text-sm text-gray-600">{label}</Label>
              <select value={form[key as keyof typeof form] as string} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} className="border rounded px-2 py-1.5 text-sm flex-1">
                <option value="">선택</option>
                {options.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Label className="w-24 shrink-0 text-sm text-gray-600">부서</Label>
            <select value={form.department_id} onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))} className="border rounded px-2 py-1.5 text-sm flex-1">
              <option value="">미지정</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* 고용정보 */}
      <section className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 border-b px-4 py-2 text-sm font-semibold text-center">고 용 정 보</div>
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-4">
            <Label className="w-24 shrink-0 text-sm text-gray-600">고용형태</Label>
            {['정규직', '계약직'].map(t => (
              <label key={t} className="flex items-center gap-1 cursor-pointer text-sm">
                <input type="radio" name="emp_type" checked={form.employment_type === t} onChange={() => setForm(f => ({ ...f, employment_type: t }))} />
                {t}
              </label>
            ))}
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <Label className="w-24 shrink-0 text-sm text-gray-600">고용상태</Label>
            {['재직', '휴직', '퇴사'].map(t => (
              <label key={t} className="flex items-center gap-1 cursor-pointer text-sm">
                <input type="radio" name="emp_status" checked={form.employment_status === t} onChange={() => setForm(f => ({ ...f, employment_status: t }))} />
                {t}
              </label>
            ))}
            {form.employment_status === '퇴사' && (
              <div className="flex items-center gap-2">
                <Label className="text-sm text-gray-600">퇴사일자</Label>
                <Input type="date" value={form.resign_date} onChange={e => setForm(f => ({ ...f, resign_date: e.target.value }))} className="w-36" />
              </div>
            )}
          </div>
          <div className="flex items-start gap-2">
            <Label className="w-24 shrink-0 text-sm text-gray-600 pt-1">주요업무</Label>
            <textarea value={form.main_duties} onChange={e => setForm(f => ({ ...f, main_duties: e.target.value }))} rows={2} className="flex-1 border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
          </div>
        </div>
      </section>

      {/* 급여공통항목 */}
      <section className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 border-b px-4 py-2 text-sm font-semibold flex items-center justify-between">
          <span>급여공통항목</span>
          <Button size="sm" variant="outline" onClick={calcInsurance}>자동계산</Button>
        </div>
        <div className="p-4 grid grid-cols-2 gap-3">
          {[
            { label: '국민연금', key: 'national_pension' },
            { label: '건강보험', key: 'health_insurance' },
            { label: '고용보험', key: 'employment_insurance' },
            { label: '산재보험', key: 'industrial_insurance' },
          ].map(({ label, key }) => (
            <div key={key} className="flex items-center gap-2">
              <Label className="w-20 shrink-0 text-sm text-gray-600">{label}</Label>
              <Input type="number" value={salaryForm[key as keyof typeof salaryForm] as number}
                onChange={e => setSalaryForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                className="flex-1 text-right" />
              <span className="text-sm text-gray-400">원</span>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Label className="w-20 shrink-0 text-sm text-gray-600">적용일</Label>
            <Input type="date" value={salaryForm.applied_from} onChange={e => setSalaryForm(f => ({ ...f, applied_from: e.target.value }))} className="flex-1" />
          </div>
          <div className="flex items-center gap-2">
            <Label className="w-20 shrink-0 text-sm text-gray-600">종료일</Label>
            <Input type="date" value={salaryForm.applied_to} onChange={e => setSalaryForm(f => ({ ...f, applied_to: e.target.value }))} className="flex-1" />
          </div>
        </div>
      </section>

      {/* 특이사항 */}
      <section className="border rounded-lg overflow-hidden">
        <div className="bg-gray-100 border-b px-4 py-2 text-sm font-semibold text-center">특이사항</div>
        <div className="p-4">
          <textarea value={salaryForm.note} onChange={e => setSalaryForm(f => ({ ...f, note: e.target.value }))} rows={4}
            className="w-full border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring" />
        </div>
      </section>

      {msg && <p className={`text-sm ${msg.includes('실패') ? 'text-red-500' : 'text-green-600'}`}>{msg}</p>}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => router.push('/organization/staff')}>리스트</Button>
        <Button onClick={handleSave} disabled={saving} className="bg-[#2d7a2d] hover:bg-[#256325]">
          {saving ? '저장 중...' : '저장'}
        </Button>
      </div>
    </div>
  )
}
