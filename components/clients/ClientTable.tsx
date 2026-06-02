'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ClientSearchFilter, type Filters } from './ClientSearchFilter'
import { getClientList } from '@/lib/actions/clients'
import { toast } from '@/lib/hooks/use-toast'

const STATUS_COLORS: Record<string, string> = {
  이용: 'bg-green-100 text-green-700',
  중지: 'bg-yellow-100 text-yellow-700',
  종결: 'bg-red-100 text-red-700',
  예비: 'bg-gray-100 text-gray-600',
}

interface ClientRow {
  id: string
  name: string
  birth_date?: string
  address?: string
  phone_mobile?: string
  phone_home?: string
  client_type?: string
  living_alone?: boolean
  status?: string
  memo?: string
  users?: { name: string } | null
}

const PAGE_SIZE = 20

export function ClientTable() {
  const router = useRouter()
  const [data, setData] = useState<ClientRow[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<Filters>({
    name: '', contractStart: '', contractEnd: '', phone: '',
    address: '', clientType: '전체', workerId: '전체',
    status: '이용', livingAlone: '전체',
  })
  const [loading, setLoading] = useState(true)

  const load = useCallback(async (f: Filters, p: number) => {
    setLoading(true)
    try {
      const result = await getClientList({ ...f, page: p, pageSize: PAGE_SIZE })
      setData(result.data as ClientRow[])
      setTotal(result.total)
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load(filters, page) }, [load, filters, page])

  function handleSearch(f: Filters) {
    setFilters(f)
    setPage(1)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div>
      <ClientSearchFilter onSearch={handleSearch} />

      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-600">검색된 전체 갯수 : <strong>{total}건</strong></span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">출력</Button>
          <Button size="sm" onClick={() => router.push('/clients/new')}>등록</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="px-3 py-2.5 text-left font-semibold text-gray-600">No</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-600">대상자명</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-600">생년월일</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-600">
                실거주지 주소
                <span
                  className="ml-1 text-red-500 text-xs cursor-pointer hover:underline"
                  onClick={() => router.push('/clients/empty-address')}
                >
                  ←클릭하시면 빈주소를 찾을 수 있음
                </span>
              </th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-600">연락처</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-600">관리구분</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-600">독거</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-600">담당자</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-600">이용상태</th>
              <th className="px-3 py-2.5 text-left font-semibold text-gray-600">비고</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} className="text-center py-10 text-gray-400">불러오는 중...</td></tr>
            ) : data.length === 0 ? (
              <tr><td colSpan={10} className="text-center py-10 text-gray-400">검색 결과가 없습니다</td></tr>
            ) : data.map((c, i) => (
              <tr key={c.id} className="border-b hover:bg-blue-50 transition-colors">
                <td className="px-3 py-2">{(page - 1) * PAGE_SIZE + i + 1}</td>
                <td className="px-3 py-2">
                  <button
                    className="text-blue-600 hover:underline font-medium"
                    onClick={() => router.push(`/clients/${c.id}`)}
                  >
                    {c.name}
                  </button>
                </td>
                <td className="px-3 py-2">{c.birth_date ?? '-'}</td>
                <td className="px-3 py-2 max-w-[200px] truncate">{c.address ?? '-'}</td>
                <td className="px-3 py-2">{c.phone_mobile ?? c.phone_home ?? '-'}</td>
                <td className="px-3 py-2">{c.client_type ?? '-'}</td>
                <td className="px-3 py-2">{c.living_alone ? '예' : '아니오'}</td>
                <td className="px-3 py-2">{c.users?.name ?? '-'}</td>
                <td className="px-3 py-2">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[c.status ?? ''] ?? 'bg-gray-100 text-gray-600'}`}>
                    {c.status ?? '-'}
                  </span>
                </td>
                <td className="px-3 py-2 max-w-[100px] truncate text-gray-500">{c.memo ?? ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-4">
          <Button variant="outline" size="sm" onClick={() => setPage(1)} disabled={page === 1}>처음</Button>
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>이전</Button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
            return (
              <Button key={p} variant={p === page ? 'default' : 'outline'} size="sm" onClick={() => setPage(p)}>{p}</Button>
            )
          })}
          <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>다음</Button>
          <Button variant="outline" size="sm" onClick={() => setPage(totalPages)} disabled={page === totalPages}>끝</Button>
        </div>
      )}
    </div>
  )
}
