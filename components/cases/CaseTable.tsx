'use client'
import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CaseSearchFilter } from './CaseSearchFilter'
import { getCaseList, deleteCase } from '@/lib/actions/cases'
import { getWorkerListForOrg } from '@/lib/actions/clients'
import { toast } from '@/lib/hooks/use-toast'
import { downloadCaseListExcel } from './pdf/CaseListExcel'
import dynamic from 'next/dynamic'

const CaseListPDF = dynamic(() => import('./pdf/CaseListPDF'), { ssr: false })

interface CaseRow {
  id: string
  case_no: number
  received_at: string
  receive_method: string
  referrer_name: string
  referrer_phone: string
  is_closed: boolean
  clients: { id: string; name: string; birth_date: string; phone_mobile: string; gender: string }
  worker: { id: string; name: string } | null
}

interface Filters {
  name: string
  receivedStart: string
  receivedEnd: string
  isClosed: string
  workerId: string
}

export function CaseTable() {
  const [cases, setCases] = useState<CaseRow[]>([])
  const [workers, setWorkers] = useState<{ id: string; name: string }[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<Filters>({
    name: '', receivedStart: '', receivedEnd: '', isClosed: 'false', workerId: '전체'
  })
  const [showPDF, setShowPDF] = useState(false)
  const pageSize = 20
  const totalPages = Math.ceil(total / pageSize)

  const load = useCallback(async (f: Filters, p: number) => {
    setLoading(true)
    try {
      const [result, w] = await Promise.all([
        getCaseList({ ...f, page: p, pageSize }),
        getWorkerListForOrg(),
      ])
      setCases(result.data as unknown as CaseRow[])
      setTotal(result.count)
      setWorkers(w)
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

  async function handleDelete(id: string) {
    if (!confirm('삭제하시겠습니까?')) return
    try {
      await deleteCase(id)
      toast('삭제되었습니다')
      load(filters, page)
    } catch (err) {
      toast((err as Error).message, 'destructive')
    }
  }

  return (
    <div>
      <CaseSearchFilter workers={workers} onSearch={handleSearch} />

      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold">사례대상자 조회</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPDF(true)}>초기면접기록지(빈양식)</Button>
          <Button variant="outline" size="sm">사정기록지(빈양식)</Button>
          <Button variant="outline" size="sm">PDF</Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => downloadCaseListExcel(cases)}
          >
            엑셀
          </Button>
          <Link href="/cases/new">
            <Button size="sm">신규</Button>
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              {['No','성명','생년월일','연락처','차수','접수방법','접수일자','의뢰인','의뢰인연락처','접수자','종결여부','수정','삭제'].map((h) => (
                <th key={h} className="px-3 py-2.5 text-center font-semibold text-gray-600 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={13} className="text-center py-8 text-gray-400">불러오는 중...</td></tr>
            ) : cases.length === 0 ? (
              <tr><td colSpan={13} className="text-center py-8 text-gray-400">데이터가 없습니다</td></tr>
            ) : cases.map((c, i) => (
              <tr key={c.id} className="border-b hover:bg-blue-50">
                <td className="px-3 py-2 text-center">{(page - 1) * pageSize + i + 1}</td>
                <td className="px-3 py-2">
                  <Link href={`/cases/${c.id}`} className="text-blue-600 hover:underline font-medium">
                    {c.clients?.name ?? '-'}
                  </Link>
                </td>
                <td className="px-3 py-2 text-center">{c.clients?.birth_date ?? '-'}</td>
                <td className="px-3 py-2 text-center">{c.clients?.phone_mobile ?? '-'}</td>
                <td className="px-3 py-2 text-center">{c.case_no}차</td>
                <td className="px-3 py-2 text-center">{c.receive_method ?? '-'}</td>
                <td className="px-3 py-2 text-center">{c.received_at}</td>
                <td className="px-3 py-2 text-center">{c.referrer_name ?? '-'}</td>
                <td className="px-3 py-2 text-center">{c.referrer_phone ?? '-'}</td>
                <td className="px-3 py-2 text-center">{c.worker?.name ?? '-'}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${c.is_closed ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'}`}>
                    {c.is_closed ? '종결' : '미결'}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  <Link href={`/cases/${c.id}`}>
                    <Button variant="outline" size="sm" className="h-7 text-xs">수정</Button>
                  </Link>
                </td>
                <td className="px-3 py-2 text-center">
                  <Button variant="outline" size="sm" className="h-7 text-xs text-red-500" onClick={() => handleDelete(c.id)}>삭제</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-1 mt-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>이전</Button>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={page === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPage(p)}
            >{p}</Button>
          ))}
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>다음</Button>
        </div>
      )}
    </div>
  )
}
