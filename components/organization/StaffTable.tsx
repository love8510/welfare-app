'use client'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StaffFormModal } from './StaffFormModal'
import { getStaffList, deleteStaff, getDepartments, getRoles } from '@/lib/actions/staff'
import { toast } from '@/lib/hooks/use-toast'

const ROLE_COLORS: Record<string, string> = {
  관리자: 'bg-blue-100 text-blue-700',
  사회복지사: 'bg-green-100 text-green-700',
  요양보호사: 'bg-gray-100 text-gray-700',
}

const PAGE_SIZE = 20

interface StaffRow {
  id: string
  name: string
  job_title?: string
  employee_no?: string
  phone?: string
  mobile?: string
  hire_date?: string
  resign_date?: string
  is_active: boolean
  base_salary?: number
  department_id?: string
  role_id?: string
  roles?: { id: string; name: string; is_admin: boolean }
  departments?: { id: string; name: string }
}

export function StaffTable() {
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [roles, setRoles] = useState<{ id: string; name: string }[]>([])
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('active')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, r, d] = await Promise.all([
        getStaffList({ search, employment_status: statusFilter === "active" ? "재직" : statusFilter === "resigned" ? "퇴사" : undefined }),
        getRoles(),
        getDepartments(),
      ])
      setStaff(data as StaffRow[])
      setRoles(r)
      setDepartments(d)
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => { load() }, [load])

  const filtered = staff.filter((s) =>
    roleFilter === 'all' ? true : s.roles?.name === roleFilter
  )
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  async function handleDelete(id: string, name: string) {
    if (!confirm(`${name} 직원을 삭제하시겠습니까?`)) return
    try {
      await deleteStaff(id)
      toast('삭제되었습니다')
      load()
    } catch (err) {
      toast((err as Error).message, 'destructive')
    }
  }

  return (
    <div>
      {/* 필터/검색 영역 */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <Input
          placeholder="이름/직책 검색"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-48"
        />
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 권한</SelectItem>
            {roles.map((r) => <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">재직중</SelectItem>
            <SelectItem value="resigned">퇴직</SelectItem>
            <SelectItem value="">전체</SelectItem>
          </SelectContent>
        </Select>
        <div className="ml-auto">
          <StaffFormModal
            mode="create"
            roles={roles}
            departments={departments}
            onSuccess={load}
            trigger={<Button>직원등록</Button>}
          />
        </div>
      </div>

      {/* 테이블 */}
      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              {['No', '성명', '직책', '부서', '권한', '전화번호', '입사일', '재직상태', '수정', '삭제'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-8 text-gray-400">불러오는 중...</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-8 text-gray-400">직원이 없습니다</td></tr>
            ) : paged.map((s, i) => (
              <tr key={s.id} className="border-b hover:bg-blue-50 transition-colors">
                <td className="px-3 py-2">{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td className="px-3 py-2 font-medium">{s.name}</td>
                <td className="px-3 py-2">{s.job_title ?? '-'}</td>
                <td className="px-3 py-2">{s.departments?.name ?? '-'}</td>
                <td className="px-3 py-2">
                  {s.roles?.name ? (
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${ROLE_COLORS[s.roles.name] ?? 'bg-gray-100 text-gray-700'}`}>
                      {s.roles.name}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-3 py-2">{s.phone ?? s.mobile ?? '-'}</td>
                <td className="px-3 py-2">{s.hire_date ?? '-'}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {s.is_active ? '재직중' : '퇴직'}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <StaffFormModal
                    mode="edit"
                    staff={s}
                    roles={roles}
                    departments={departments}
                    onSuccess={load}
                    trigger={<Button variant="outline" size="sm">수정</Button>}
                  />
                </td>
                <td className="px-3 py-2">
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(s.id, s.name)}>삭제</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>이전</Button>
          <span className="px-3 py-1.5 text-sm">{page} / {totalPages}</span>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>다음</Button>
        </div>
      )}
    </div>
  )
}
