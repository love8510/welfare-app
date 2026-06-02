'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { getStaffList, deleteStaff } from '@/lib/actions/staff'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Image from 'next/image'
import { UserCircle, Pencil, Trash2 } from 'lucide-react'

const JOB_TITLES = ['전체', '사회복지사', '요양보호사', '간호조무사', '사무원', '기타']
const STATUS_OPTIONS = ['재직', '휴직', '퇴사']

type Staff = Awaited<ReturnType<typeof getStaffList>>[number]

export function StaffListTable({ initialData, departments }: {
  initialData: Staff[]
  departments: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [data, setData] = useState(initialData)
  const [search, setSearch] = useState('')
  const [jobTitle, setJobTitle] = useState('')
  const [deptId, setDeptId] = useState('')
  const [status, setStatus] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSearch() {
    setLoading(true)
    const result = await getStaffList({
      search: search || undefined,
      job_title: jobTitle || undefined,
      department_id: deptId || undefined,
      employment_status: status || undefined,
    })
    setData(result)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    await deleteStaff(id)
    setData(prev => prev.filter(s => s.id !== id))
    setDeleteId(null)
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { 재직: 'bg-green-100 text-green-700', 휴직: 'bg-yellow-100 text-yellow-700', 퇴사: 'bg-red-100 text-red-700' }
    return <span className={`px-2 py-0.5 rounded text-xs font-medium ${map[s] ?? 'bg-gray-100 text-gray-600'}`}>{s}</span>
  }
  const typeBadge = (t: string) => (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${t === '정규직' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{t}</span>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">직원조회</h1>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => router.push('/organization/staff/new')}>+ 등록</Button>
      </div>

      {/* 검색 필터 */}
      <div className="bg-white border rounded-lg p-4 flex flex-wrap gap-3 items-end">
        <div>
          <p className="text-xs text-gray-500 mb-1">성명</p>
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="성명 검색" className="w-36" onKeyDown={e => e.key === 'Enter' && handleSearch()} />
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">직무</p>
          <select value={jobTitle} onChange={e => setJobTitle(e.target.value === '전체' ? '' : e.target.value)} className="border rounded px-2 py-1.5 text-sm">
            {JOB_TITLES.map(j => <option key={j}>{j}</option>)}
          </select>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">부서</p>
          <select value={deptId} onChange={e => setDeptId(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
            <option value="">전체</option>
            {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">고용상태</p>
          <select value={status} onChange={e => setStatus(e.target.value)} className="border rounded px-2 py-1.5 text-sm">
            <option value="">재직(기본)</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <Button onClick={handleSearch} disabled={loading} className="bg-[#2d7a2d] hover:bg-[#256325]">조회</Button>
      </div>

      {/* 테이블 */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['No', '사진', '성명', '사번', '직무', '부서', '직위', '고용형태', '고용상태', '입사일', '연락처', '수정', '삭제'].map(h => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.length === 0 && (
              <tr><td colSpan={13} className="text-center py-10 text-gray-400">직원이 없습니다</td></tr>
            )}
            {data.map((s, i) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                <td className="px-3 py-2">
                  {s.photo_url
                    ? <Image src={s.photo_url} alt={s.name} width={40} height={40} className="rounded-full object-cover" />
                    : <UserCircle size={36} className="text-gray-300" />
                  }
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => router.push(`/organization/staff/${s.id}`)} className="font-medium text-blue-600 hover:underline">{s.name}</button>
                </td>
                <td className="px-3 py-2 text-gray-500">{s.employee_no ?? '-'}</td>
                <td className="px-3 py-2">{s.job_title ?? '-'}</td>
                <td className="px-3 py-2">{(s.departments as {name:string}|null)?.name ?? '-'}</td>
                <td className="px-3 py-2">{(s as Record<string,unknown>).position as string ?? '-'}</td>
                <td className="px-3 py-2">{typeBadge((s as Record<string,unknown>).employment_type as string ?? '정규직')}</td>
                <td className="px-3 py-2">{statusBadge((s as Record<string,unknown>).employment_status as string ?? '재직')}</td>
                <td className="px-3 py-2 text-gray-500">{s.hire_date ? s.hire_date.toString().slice(0, 10) : '-'}</td>
                <td className="px-3 py-2 text-gray-500">{s.mobile ?? s.phone ?? '-'}</td>
                <td className="px-3 py-2">
                  <button onClick={() => router.push(`/organization/staff/${s.id}`)} className="text-gray-400 hover:text-blue-600"><Pencil size={15} /></button>
                </td>
                <td className="px-3 py-2">
                  <button onClick={() => setDeleteId(s.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={15} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 삭제 확인 다이얼로그 */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
            <p className="font-semibold mb-2">직원을 퇴사 처리하시겠습니까?</p>
            <p className="text-sm text-gray-500 mb-4">고용상태가 &quot;퇴사&quot;로 변경되고 목록에서 숨겨집니다.</p>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteId(null)}>취소</Button>
              <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={() => handleDelete(deleteId)}>퇴사 처리</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
