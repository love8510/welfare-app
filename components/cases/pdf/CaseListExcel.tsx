import * as XLSX from 'xlsx'
import { format } from 'date-fns'

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

export function downloadCaseListExcel(cases: CaseRow[]) {
  const ws = XLSX.utils.json_to_sheet(
    cases.map((c, i) => ({
      '번호': i + 1,
      '성명': c.clients?.name ?? '',
      '생년월일': c.clients?.birth_date ?? '',
      '연락처': c.clients?.phone_mobile ?? '',
      '차수': `${c.case_no}차`,
      '접수방법': c.receive_method ?? '',
      '접수일자': c.received_at ?? '',
      '의뢰인': c.referrer_name ?? '',
      '의뢰인연락처': c.referrer_phone ?? '',
      '접수자': c.worker?.name ?? '',
      '종결여부': c.is_closed ? '종결' : '미결',
    }))
  )

  ws['!cols'] = [
    { wch: 6 }, { wch: 10 }, { wch: 12 }, { wch: 14 },
    { wch: 6 }, { wch: 8 }, { wch: 12 }, { wch: 10 },
    { wch: 14 }, { wch: 10 }, { wch: 8 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '사례대상자목록')
  XLSX.writeFile(wb, `사례대상자목록_${format(new Date(), 'yyyy-MM-dd')}.xlsx`)
}
