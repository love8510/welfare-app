'use client'
import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { getMidCategoryReport, updateTargetCount, seedDefaultCategories } from '@/lib/actions/reports'
import { toast } from '@/lib/hooks/use-toast'
import * as XLSX from 'xlsx'

interface ReportItem {
  id: string; category: string; item_no: number; item_name: string
  target_count: number; q1_count: number; q2_count: number
  q3_count: number; q4_count: number; total_count: number; achievement_rate: number
}

interface CategoryData {
  subTotal: { target: number; q1: number; q2: number; q3: number; q4: number; sum: number; rate: number }
  items: ReportItem[]
}

interface ReportData {
  totalTarget: number; totalQ1: number; totalQ2: number; totalQ3: number; totalQ4: number
  totalSum: number; totalRate: number
  categories: Record<string, CategoryData>
  items: ReportItem[]
}

export function MidCategoryReport() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ReportData | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingVal, setEditingVal] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      await seedDefaultCategories(year)
      const result = await getMidCategoryReport(year)
      setData(result as ReportData)
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setLoading(false)
    }
  }, [year])

  useEffect(() => { load() }, [load])

  async function handleTargetSave(id: string, val: string) {
    const num = Number(val)
    if (isNaN(num)) { setEditingId(null); return }
    try {
      await updateTargetCount(id, num)
      toast('목표가 수정되었습니다')
      load()
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setEditingId(null)
    }
  }

  function rateColor(rate: number) {
    if (rate >= 100) return 'text-green-600 font-bold'
    if (rate < 50) return 'text-red-500'
    return ''
  }

  function downloadExcel() {
    if (!data) return
    const rows: unknown[][] = [
      ['관', '번호', '항', '목표', '1/4분기', '2/4분기', '3/4분기', '4/4분기', '합계', '달성률(%)', '비고'],
      ['총 계', '', '', data.totalTarget, data.totalQ1, data.totalQ2, data.totalQ3, data.totalQ4, data.totalSum, `${data.totalRate}%`, ''],
    ]
    for (const [catName, cat] of Object.entries(data.categories)) {
      rows.push([catName, '', '소 계', cat.subTotal.target, cat.subTotal.q1, cat.subTotal.q2, cat.subTotal.q3, cat.subTotal.q4, cat.subTotal.sum, `${cat.subTotal.rate}%`, ''])
      let firstInCat = true
      for (const item of cat.items) {
        rows.push([
          firstInCat ? catName : '',
          item.item_no, item.item_name,
          item.target_count, item.q1_count, item.q2_count,
          item.q3_count, item.q4_count, item.total_count,
          item.target_count === 0 && item.total_count > 0 ? 'INF' : `${item.achievement_rate}%`,
          '',
        ])
        firstInCat = false
      }
    }
    const ws = XLSX.utils.aoa_to_sheet(rows)
    ws['!cols'] = [{wch:18},{wch:6},{wch:24},{wch:8},{wch:10},{wch:10},{wch:10},{wch:10},{wch:8},{wch:10},{wch:10}]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '중분류보고서')
    XLSX.writeFile(wb, `중분류보고서_${year}년.xlsx`)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">중분류보고서</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setYear((y) => y - 1)}>{'<'}</Button>
          <span className="w-14 text-center font-semibold">{year}</span>
          <Button variant="outline" size="sm" onClick={() => setYear((y) => y + 1)}>{'>'}</Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={downloadExcel}>보고서출력(EXCEL)</Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-10 text-gray-400">불러오는 중...</div>
      ) : (
        <div className="bg-white rounded-lg border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                {['관', '번호', '항', '목표', '1/4분기', '2/4분기', '3/4분기', '4/4분기', '합계', '달성률(%)', '비고'].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-center font-semibold text-gray-600 whitespace-nowrap border-r last:border-r-0">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* 총계 */}
              <tr className="bg-blue-50 border-b font-semibold">
                <td className="px-3 py-2 border-r"></td>
                <td className="px-3 py-2 border-r"></td>
                <td className="px-3 py-2 border-r text-center">총  계</td>
                <td className="px-3 py-2 text-center border-r">{data?.totalTarget.toLocaleString()}</td>
                <td className="px-3 py-2 text-center border-r">{data?.totalQ1.toLocaleString()}</td>
                <td className="px-3 py-2 text-center border-r">{data?.totalQ2.toLocaleString()}</td>
                <td className="px-3 py-2 text-center border-r">{data?.totalQ3.toLocaleString()}</td>
                <td className="px-3 py-2 text-center border-r">{data?.totalQ4.toLocaleString()}</td>
                <td className="px-3 py-2 text-center border-r font-bold">{data?.totalSum.toLocaleString()}</td>
                <td className={`px-3 py-2 text-center border-r ${rateColor(data?.totalRate ?? 0)}`}>{data?.totalRate}%</td>
                <td className="px-3 py-2"></td>
              </tr>

              {/* 카테고리별 */}
              {Object.entries(data?.categories ?? {}).map(([catName, cat]) => {
                const catItemCount = cat.items.length
                return (
                  <>
                    {/* 소계 */}
                    <tr key={`${catName}_subtotal`} className="bg-yellow-50 border-b font-semibold">
                      <td className="px-3 py-2 border-r" rowSpan={catItemCount + 1}>
                        <div className="text-xs font-bold text-gray-700 text-center">{catName}</div>
                      </td>
                      <td className="px-3 py-2 border-r"></td>
                      <td className="px-3 py-2 border-r text-center">소  계</td>
                      <td className="px-3 py-2 text-center border-r">{cat.subTotal.target.toLocaleString()}</td>
                      <td className="px-3 py-2 text-center border-r">{cat.subTotal.q1.toLocaleString()}</td>
                      <td className="px-3 py-2 text-center border-r">{cat.subTotal.q2.toLocaleString()}</td>
                      <td className="px-3 py-2 text-center border-r">{cat.subTotal.q3.toLocaleString()}</td>
                      <td className="px-3 py-2 text-center border-r">{cat.subTotal.q4.toLocaleString()}</td>
                      <td className="px-3 py-2 text-center border-r font-bold">{cat.subTotal.sum.toLocaleString()}</td>
                      <td className={`px-3 py-2 text-center border-r ${rateColor(cat.subTotal.rate)}`}>{cat.subTotal.rate}%</td>
                      <td className="px-3 py-2"></td>
                    </tr>

                    {/* 항목들 */}
                    {cat.items.map((item, idx) => {
                      const isINF = item.target_count === 0 && item.total_count > 0
                      return (
                        <tr key={item.id} className={`border-b hover:bg-gray-50 ${idx % 2 === 0 ? '' : 'bg-gray-50/50'}`}>
                          <td className="px-3 py-2 text-center border-r">{item.item_no}</td>
                          <td className="px-3 py-2 border-r">{item.item_name}</td>
                          <td
                            className="px-3 py-2 text-center border-r cursor-pointer hover:bg-yellow-50"
                            onDoubleClick={() => { setEditingId(item.id); setEditingVal(String(item.target_count)) }}
                          >
                            {editingId === item.id ? (
                              <input
                                type="number"
                                className="w-16 text-center border rounded text-sm p-0.5"
                                value={editingVal}
                                autoFocus
                                onChange={(e) => setEditingVal(e.target.value)}
                                onBlur={() => handleTargetSave(item.id, editingVal)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleTargetSave(item.id, editingVal) }}
                              />
                            ) : item.target_count.toLocaleString()}
                          </td>
                          <td className="px-3 py-2 text-center border-r">{item.q1_count.toLocaleString()}</td>
                          <td className="px-3 py-2 text-center border-r">{item.q2_count.toLocaleString()}</td>
                          <td className="px-3 py-2 text-center border-r">{item.q3_count.toLocaleString()}</td>
                          <td className="px-3 py-2 text-center border-r">{item.q4_count.toLocaleString()}</td>
                          <td className="px-3 py-2 text-center border-r font-bold">{item.total_count.toLocaleString()}</td>
                          <td className={`px-3 py-2 text-center border-r ${isINF ? 'text-orange-500 font-bold' : rateColor(item.achievement_rate)}`}>
                            {isINF ? 'INF' : `${item.achievement_rate}%`}
                          </td>
                          <td className="px-3 py-2"></td>
                        </tr>
                      )
                    })}
                  </>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-gray-400">목표 셀을 더블클릭하면 수정할 수 있습니다.</p>
    </div>
  )
}
