'use client'
import '@/lib/pdf-fonts'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'

const S = StyleSheet.create({
  page: { fontFamily: 'NanumGothic', padding: '30 40', fontSize: 9 },
  title: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  infoRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ccc' },
  infoLabel: { width: 80, backgroundColor: '#f5f5f5', padding: '4 6', fontWeight: 'bold', borderRightWidth: 1, borderColor: '#ccc' },
  infoVal: { flex: 1, padding: '4 6' },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', backgroundColor: '#dbeafe', padding: '4 6', marginTop: 8, marginBottom: 0, borderWidth: 1, borderColor: '#93c5fd' },
  table: { borderWidth: 1, borderColor: '#ccc', borderTopWidth: 0 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ccc' },
  rowLast: { flexDirection: 'row' },
  col1: { flex: 2, padding: '3 6', borderRightWidth: 1, borderColor: '#ccc' },
  col2: { flex: 1, padding: '3 6', textAlign: 'right', borderRightWidth: 1, borderColor: '#ccc' },
  col3: { flex: 1, padding: '3 6' },
  totalRow: { flexDirection: 'row', backgroundColor: '#f0fdf4', borderBottomWidth: 1, borderColor: '#ccc' },
  footer: { marginTop: 20, textAlign: 'center', fontSize: 9, color: '#333', lineHeight: 1.6 },
  bold: { fontWeight: 'bold' },
})

function fmt(n: number) { return (n ?? 0).toLocaleString('ko-KR') }

interface SlipData {
  year: number; month: number
  user_name: string; job_title: string
  org_name: string
  base_salary: number; position_allowance: number; meal_allowance: number
  transport_allowance: number; overtime_pay: number; holiday_pay: number
  bonus: number; other_pay: number; gross_pay: number
  national_pension_ee: number; health_insurance_ee: number
  long_term_care_ee: number; employment_ins_ee: number
  income_tax: number; local_income_tax: number
  other_deduction: number; total_deduction: number; net_pay: number
  national_pension_er: number; health_insurance_er: number
  long_term_care_er: number; employment_ins_er: number
  industrial_ins_er: number; severance_reserve: number; total_labor_cost: number
}

function PayRow({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <View style={S.row}>
      <Text style={S.col1}>{label}</Text>
      <Text style={S.col2}>{fmt(value)}</Text>
      <Text style={S.col3}>{note ?? ''}</Text>
    </View>
  )
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={S.totalRow}>
      <Text style={{ ...S.col1, ...S.bold }}>{label}</Text>
      <Text style={{ ...S.col2, ...S.bold }}>{fmt(value)}</Text>
      <Text style={S.col3}></Text>
    </View>
  )
}

export function SalarySlipDocument({ data }: { data: SlipData }) {
  const today = new Date()
  const issued = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`
  return (
    <Document>
      <Page size="A4" style={S.page}>
        <Text style={S.title}>급  여  명  세  서</Text>

        {/* 기본 정보 */}
        <View style={{ borderWidth: 1, borderColor: '#ccc', marginBottom: 4 }}>
          <View style={S.infoRow}>
            <Text style={S.infoLabel}>기관명</Text>
            <Text style={S.infoVal}>{data.org_name}</Text>
            <Text style={S.infoLabel}>성명</Text>
            <Text style={S.infoVal}>{data.user_name}</Text>
          </View>
          <View style={{ ...S.infoRow, borderBottomWidth: 0 }}>
            <Text style={S.infoLabel}>직책</Text>
            <Text style={S.infoVal}>{data.job_title}</Text>
            <Text style={S.infoLabel}>지급월</Text>
            <Text style={S.infoVal}>{data.year}년 {data.month}월</Text>
          </View>
        </View>

        {/* 지급 내역 */}
        <Text style={S.sectionTitle}>지급 내역</Text>
        <View style={S.table}>
          <PayRow label="기본급" value={data.base_salary} />
          <PayRow label="직책수당" value={data.position_allowance} />
          <PayRow label="식대" value={data.meal_allowance} note="(비과세)" />
          <PayRow label="교통비" value={data.transport_allowance} />
          <PayRow label="초과근무수당" value={data.overtime_pay} />
          <PayRow label="휴일근무수당" value={data.holiday_pay} />
          <PayRow label="상여금" value={data.bonus} />
          <PayRow label="기타수당" value={data.other_pay} />
          <TotalRow label="지급합계" value={data.gross_pay} />
        </View>

        {/* 공제 내역 */}
        <Text style={S.sectionTitle}>공제 내역</Text>
        <View style={S.table}>
          <PayRow label="국민연금" value={data.national_pension_ee} />
          <PayRow label="건강보험" value={data.health_insurance_ee} />
          <PayRow label="장기요양보험" value={data.long_term_care_ee} />
          <PayRow label="고용보험" value={data.employment_ins_ee} />
          <PayRow label="소득세" value={data.income_tax} />
          <PayRow label="지방소득세" value={data.local_income_tax} />
          {data.other_deduction > 0 && <PayRow label="기타공제" value={data.other_deduction} />}
          <TotalRow label="공제합계" value={data.total_deduction} />
          <TotalRow label="실수령액" value={data.net_pay} />
        </View>

        {/* 사업주 부담 */}
        <Text style={S.sectionTitle}>사업주 부담 내역 (참고)</Text>
        <View style={S.table}>
          <PayRow label="국민연금(사업주)" value={data.national_pension_er} />
          <PayRow label="건강보험(사업주)" value={data.health_insurance_er} />
          <PayRow label="장기요양(사업주)" value={data.long_term_care_er} />
          <PayRow label="고용보험(사업주)" value={data.employment_ins_er} />
          <PayRow label="산재보험(사업주)" value={data.industrial_ins_er} />
          <PayRow label="퇴직적립금" value={data.severance_reserve} />
          <TotalRow label="총 인건비" value={data.total_labor_cost} />
        </View>

        <Text style={S.footer}>
          {`위와 같이 ${data.year}년 ${data.month}월 급여를 지급합니다.\n${issued}\n${data.org_name}`}
        </Text>
      </Page>
    </Document>
  )
}

export async function downloadSalarySlipPDF(data: SlipData) {
  const blob = await pdf(<SalarySlipDocument data={data} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `급여명세서_${data.user_name}_${data.year}년${data.month}월.pdf`
  a.click()
  URL.revokeObjectURL(url)
}
