'use client'
import '@/lib/pdf-fonts'
import {
  Document, Page, Text, View, StyleSheet, PDFDownloadLink, pdf
} from '@react-pdf/renderer'
import { ApprovalStamp } from './ApprovalStamp'

const styles = StyleSheet.create({
  page: { fontFamily: 'NanumGothic', padding: '40 50', fontSize: 9 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 16, marginTop: 20 },
  sectionTitle: { fontSize: 10, fontWeight: 'bold', marginTop: 8, marginBottom: 4, backgroundColor: '#f5f5f5', padding: '3 6' },
  table: { borderWidth: 1, borderColor: '#ccc', borderStyle: 'solid' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc' },
  th: { backgroundColor: '#f5f5f5', padding: '3 6', fontWeight: 'bold', fontSize: 8, borderRightWidth: 1, borderRightColor: '#ccc' },
  td: { padding: '3 6', fontSize: 8, borderRightWidth: 1, borderRightColor: '#ccc' },
  label: { fontSize: 8, color: '#555' },
  value: { fontSize: 8 },
  checkRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 4 },
  checkItem: { flexDirection: 'row', alignItems: 'center', marginRight: 8 },
  footer: { marginTop: 20, textAlign: 'center', fontSize: 9, color: '#555' },
  signRow: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16, gap: 16 },
})

function CheckItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <View style={styles.checkItem}>
      <Text style={{ fontSize: 9, marginRight: 2 }}>{checked ? '■' : '□'}</Text>
      <Text style={{ fontSize: 8 }}>{label}</Text>
    </View>
  )
}

interface InterviewData {
  client_name?: string; gender?: string; age?: string; id_number?: string
  education?: string; religion?: string; address?: string
  phone_home?: string; phone_mobile?: string
  family_members?: { relation?: string; name?: string; address?: string; age?: string; job?: string; cohabit?: boolean; monthly_income?: string; note?: string }[]
  economic_status?: string; household_type?: string
  housing_type?: string; housing_deposit?: string; housing_rent?: string
  health_overall?: string; chronic_diseases?: string[]
  disability?: boolean; disability_type?: string; disability_grade?: string
  assistive_devices?: string[]
  care_grade?: string
  other_services?: string; applied_services?: string
  service_eligible?: boolean; service_ineligible_reason?: string; service_reason?: string
  service_content?: string
  referrer_name?: string; referrer_relation?: string; referrer_phone?: string; referral_route?: string
  note?: string; interview_date?: string; interviewer?: string
}

interface OrgData {
  name?: string; stamp_url?: string | null; approval_slots?: number; approver1?: string; approver2?: string; approver3?: string
}

function InitialInterviewDocument({ data, org }: { data: InterviewData; org: OrgData }) {
  const cd = data.chronic_diseases ?? []
  const ad = data.assistive_devices ?? []

  const CHRONIC = ['고혈압','당뇨','골다공증','심장질환','뇌졸중','신장질환','암','백내장','녹내장','치매','디스크','관절염','피부병','대장/항문']
  const ASSISTIVE = ['사용안함','휠체어','지팡이','목발','보청기','틀니','돋보기']
  const CARE_GRADES = ['1등급','2등급','3등급','4등급','5등급','인지지원등급','등급외A,B','없음']

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ApprovalStamp
          approvalSlots={org.approval_slots}
          approver1={org.approver1}
          approver2={org.approver2}
          approver3={org.approver3}
          stampUrl={org.stamp_url}
        />
        <Text style={styles.title}>초 기  면  접  지</Text>

        <Text style={styles.sectionTitle}>1. 기본사항</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.th, { width: '15%' }]}>성명</Text>
            <Text style={[styles.td, { width: '20%' }]}>{data.client_name ?? ''}</Text>
            <Text style={[styles.th, { width: '10%' }]}>성별</Text>
            <Text style={[styles.td, { width: '10%' }]}>{data.gender ?? ''}</Text>
            <Text style={[styles.th, { width: '10%' }]}>연령</Text>
            <Text style={[styles.td, { flex: 1 }]}>{data.age ?? ''}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.th, { width: '15%' }]}>주민번호</Text>
            <Text style={[styles.td, { width: '20%' }]}>{data.id_number ? `${data.id_number.substring(0,6)}-*******` : ''}</Text>
            <Text style={[styles.th, { width: '10%' }]}>학력</Text>
            <Text style={[styles.td, { width: '10%' }]}>{data.education ?? ''}</Text>
            <Text style={[styles.th, { width: '10%' }]}>종교</Text>
            <Text style={[styles.td, { flex: 1 }]}>{data.religion ?? ''}</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.th, { width: '15%' }]}>현주소</Text>
            <Text style={[styles.td, { flex: 1 }]}>{data.address ?? ''}</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={[styles.th, { width: '15%' }]}>연락처</Text>
            <Text style={[styles.td, { flex: 1 }]}>자택: {data.phone_home ?? ''}  핸드폰: {data.phone_mobile ?? ''}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>2. 가족사항</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            {['관계','성명','주소','연령','직업','동거','월소득','비고'].map((h) => (
              <Text key={h} style={[styles.th, { flex: 1 }]}>{h}</Text>
            ))}
          </View>
          {(data.family_members ?? []).map((fm, i) => (
            <View key={i} style={[styles.row, i === (data.family_members?.length ?? 0) - 1 ? { borderBottomWidth: 0 } : {}]}>
              <Text style={[styles.td, { flex: 1 }]}>{fm.relation ?? ''}</Text>
              <Text style={[styles.td, { flex: 1 }]}>{fm.name ?? ''}</Text>
              <Text style={[styles.td, { flex: 1 }]}>{fm.address ?? ''}</Text>
              <Text style={[styles.td, { flex: 1 }]}>{fm.age ?? ''}</Text>
              <Text style={[styles.td, { flex: 1 }]}>{fm.job ?? ''}</Text>
              <Text style={[styles.td, { flex: 1 }]}>{fm.cohabit ? '예' : '아니오'}</Text>
              <Text style={[styles.td, { flex: 1 }]}>{fm.monthly_income ?? ''}</Text>
              <Text style={[styles.td, { flex: 1, borderRightWidth: 0 }]}>{fm.note ?? ''}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>3. 생활상태</Text>
        <View style={{ marginBottom: 4 }}>
          <Text style={styles.label}>경제상황</Text>
          <Text style={{ fontSize: 8 }}>{data.economic_status ?? ''}</Text>
        </View>
        <View style={{ marginBottom: 4 }}>
          <Text style={styles.label}>세대유형</Text>
          <Text style={{ fontSize: 8 }}>{data.household_type ?? ''}</Text>
        </View>
        <View style={{ marginBottom: 4 }}>
          <Text style={styles.label}>주거형태</Text>
          <Text style={{ fontSize: 8 }}>{data.housing_type ?? ''}</Text>
        </View>

        <Text style={styles.sectionTitle}>4. 신체상태</Text>
        <View style={{ marginBottom: 4 }}>
          <Text style={styles.label}>건강상태</Text>
          <Text style={{ fontSize: 8 }}>{data.health_overall ?? ''}</Text>
        </View>
        <View style={{ marginBottom: 4 }}>
          <Text style={styles.label}>만성질환</Text>
          <View style={[styles.checkRow, { flexDirection: 'row', flexWrap: 'wrap' }]}>
            {CHRONIC.map((d) => <CheckItem key={d} checked={cd.includes(d)} label={d} />)}
          </View>
        </View>
        <View style={{ marginBottom: 4 }}>
          <Text style={styles.label}>장애여부: {data.disability ? `유 (${data.disability_type ?? ''} ${data.disability_grade ?? ''}급)` : '무'}</Text>
        </View>
        <View style={{ marginBottom: 4 }}>
          <Text style={styles.label}>보장구</Text>
          <View style={[styles.checkRow, { flexDirection: 'row', flexWrap: 'wrap' }]}>
            {ASSISTIVE.map((d) => <CheckItem key={d} checked={ad.includes(d)} label={d} />)}
          </View>
        </View>
        <View style={{ marginBottom: 4 }}>
          <Text style={styles.label}>장기요양등급</Text>
          <View style={[styles.checkRow, { flexDirection: 'row', flexWrap: 'wrap' }]}>
            {CARE_GRADES.map((d) => <CheckItem key={d} checked={data.care_grade === d} label={d} />)}
          </View>
        </View>

        <Text style={styles.sectionTitle}>5. 타 서비스 이용 현황</Text>
        <Text style={{ fontSize: 8, marginBottom: 4 }}>{data.other_services ?? ''}</Text>

        <Text style={styles.sectionTitle}>6. 신청서비스</Text>
        <Text style={{ fontSize: 8, marginBottom: 4 }}>{data.applied_services ?? ''}</Text>

        <Text style={styles.sectionTitle}>7. 서비스 제공여부</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
          <CheckItem checked={data.service_eligible === true} label="적격" />
          <CheckItem checked={data.service_eligible === false} label="부적격" />
        </View>
        <Text style={{ fontSize: 8, marginBottom: 4 }}>부적격사유: {data.service_ineligible_reason ?? ''}</Text>
        <Text style={{ fontSize: 8, marginBottom: 4 }}>서비스사유: {data.service_reason ?? ''}</Text>
        <Text style={{ fontSize: 8, marginBottom: 4 }}>제공서비스내용: {data.service_content ?? ''}</Text>

        <Text style={styles.sectionTitle}>8. 의뢰인</Text>
        <Text style={{ fontSize: 8, marginBottom: 4 }}>
          성명: {data.referrer_name ?? ''}  관계: {data.referrer_relation ?? ''}  전화번호: {data.referrer_phone ?? ''}  의뢰경로: {data.referral_route ?? ''}
        </Text>

        <Text style={styles.sectionTitle}>9. 비고</Text>
        <Text style={{ fontSize: 8, marginBottom: 12 }}>{data.note ?? ''}</Text>

        <View style={styles.signRow}>
          <Text style={{ fontSize: 8 }}>면접일: {data.interview_date ?? '____년 __월 __일'}</Text>
          <Text style={{ fontSize: 8 }}>면접자: {data.interviewer ?? ''}</Text>
        </View>
        <Text style={styles.footer}>{org.name ?? ''}</Text>
      </Page>
    </Document>
  )
}

interface Props {
  data: InterviewData
  org: OrgData
  clientName?: string
}

export default function InitialInterviewPDF({ data, org, clientName }: Props) {
  const handleDownload = async () => {
    const blob = await pdf(<InitialInterviewDocument data={data} org={org} />).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `초기면접기록지_${clientName ?? '빈양식'}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center px-3 py-1.5 text-sm border rounded hover:bg-gray-50"
    >
      PDF출력
    </button>
  )
}
