'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { UserCircle } from 'lucide-react'
import { StaffInfoTab } from './tabs/StaffInfoTab'
import { SalaryBaseTab } from './tabs/SalaryBaseTab'
import { ContractTab } from './tabs/ContractTab'
import { InitialCounselTab } from './tabs/InitialCounselTab'
import { uploadStaffPhoto } from '@/lib/actions/staff'

const TABS = ['직원정보', '급여기초등록', '근로계약서', '초기상담기록지'] as const

type StaffData = Record<string, unknown>

export function StaffDetailPage({ staff, departments }: {
  staff: StaffData
  departments: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [tab, setTab] = useState<typeof TABS[number]>('직원정보')
  const [photoUrl, setPhotoUrl] = useState((staff.photo_url as string) ?? '')
  const [uploading, setUploading] = useState(false)

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !staff.id) return
    setUploading(true)
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1]
      try {
        const url = await uploadStaffPhoto(staff.id as string, base64, file.type)
        setPhotoUrl(url)
      } catch {}
      setUploading(false)
    }
    reader.readAsDataURL(file)
  }

  const salaryBase = (staff.salary_base as Record<string,unknown>[])?.[0] ?? null
  const contracts = (staff.employment_contracts as Record<string,unknown>[]) ?? []
  const counselLogs = (staff.staff_counsel_logs as Record<string,unknown>[]) ?? []

  return (
    <div className="space-y-4">
      {/* 상단 공통 영역 */}
      <div className="bg-white border rounded-lg p-6 flex gap-6">
        {/* 증명사진 */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-28 h-36 border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-50 overflow-hidden">
            {photoUrl
              ? <Image src={photoUrl} alt="증명사진" width={112} height={144} className="object-cover w-full h-full" />
              : <UserCircle size={60} className="text-gray-300" />
            }
          </div>
          <label className="cursor-pointer">
            <span className="text-xs px-3 py-1 border rounded bg-gray-100 hover:bg-gray-200">
              {uploading ? '업로드 중...' : '찾아보기'}
            </span>
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
        </div>

        {/* 기본 개인정보 */}
        <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
          <div className="flex gap-2 items-center">
            <span className="text-gray-500 w-20">성명</span>
            <span className="font-semibold text-base">{staff.name as string ?? '-'}</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-gray-500 w-20">성별</span>
            <span>{staff.gender as string ?? '-'}</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-gray-500 w-20">이메일</span>
            <span>{staff.email as string ?? '-'}</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-gray-500 w-20">연락처</span>
            <span>{staff.mobile as string ?? staff.phone as string ?? '-'}</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-gray-500 w-20">직무</span>
            <span>{staff.job_title as string ?? '-'}</span>
          </div>
          <div className="flex gap-2 items-center">
            <span className="text-gray-500 w-20">고용상태</span>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              staff.employment_status === '재직' ? 'bg-green-100 text-green-700'
              : staff.employment_status === '휴직' ? 'bg-yellow-100 text-yellow-700'
              : 'bg-red-100 text-red-700'
            }`}>{staff.employment_status as string ?? '재직'}</span>
          </div>
        </div>

        {/* 우측 버튼 */}
        <div className="flex flex-col gap-2 justify-start">
          <button onClick={() => router.push('/organization/staff')} className="text-sm px-4 py-1.5 border rounded hover:bg-gray-50">리스트</button>
        </div>
      </div>

      {/* 탭 */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="flex border-b">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${tab === t ? 'border-b-2 border-[#2d7a2d] text-[#2d7a2d]' : 'text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="p-6">
          {tab === '직원정보' && <StaffInfoTab staff={staff} departments={departments} salaryBase={salaryBase} />}
          {tab === '급여기초등록' && <SalaryBaseTab userId={staff.id as string} salaryBase={salaryBase} />}
          {tab === '근로계약서' && <ContractTab userId={staff.id as string} contracts={contracts} />}
          {tab === '초기상담기록지' && <InitialCounselTab userId={staff.id as string} logs={counselLogs} />}
        </div>
      </div>
    </div>
  )
}
