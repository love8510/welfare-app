'use client'
import '@/lib/pdf-fonts'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import { ApprovalStamp } from './ApprovalStamp'

const styles = StyleSheet.create({
  page: { fontFamily: 'NanumGothic', padding: '40 50', fontSize: 9 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 12, marginTop: 20 },
  section: { fontSize: 10, fontWeight: 'bold', marginTop: 8, marginBottom: 4, backgroundColor: '#f5f5f5', padding: '3 6' },
  table: { borderWidth: 1, borderColor: '#ccc', borderStyle: 'solid', marginBottom: 6 },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc' },
  th: { backgroundColor: '#f5f5f5', padding: '3 6', fontWeight: 'bold', fontSize: 8, borderRightWidth: 1, borderRightColor: '#ccc' },
  td: { padding: '3 6', fontSize: 8, borderRightWidth: 1, borderRightColor: '#ccc', flex: 1 },
  footer: { marginTop: 20, textAlign: 'center', fontSize: 9, color: '#555' },
  checkRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 3 },
})

function CheckItem({ checked, label }: { checked: boolean; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8, marginBottom: 2 }}>
      <Text style={{ fontSize: 9, marginRight: 2 }}>{checked ? '■' : '□'}</Text>
      <Text style={{ fontSize: 8 }}>{label}</Text>
    </View>
  )
}

interface AssessmentData {
  assessed_at?: string
  worker_name?: string
  client_name?: string; gender?: string; age?: string; id_number?: string; education?: string
  address?: string; phone_home?: string; phone_mobile?: string
  economic_status?: string; income_details?: Record<string, number>
  monthly_income?: number
  housing_type?: string; house_form?: string; house_floor?: string
  elevator?: boolean; housing_condition?: string; sanitation?: string
  heating_type?: string; kitchen_type?: string
  health_overall?: string; chronic_diseases?: string[]
  disability?: boolean; disability_type?: string
  assistive_devices?: string[]
  adl_items?: Record<string, string>
  iadl_items?: Record<string, string>
  needs_assessment?: Record<string, { level: string; content: string }>
  strengths?: string; available_resources?: string
  overall_opinion?: string; priority_needs?: string; recommended_services?: string
}

interface OrgData {
  name?: string; stamp_url?: string | null; approval_slots?: number; approver1?: string; approver2?: string; approver3?: string
}

const CHRONIC = ['고혈압','당뇨','골다공증','심장질환','뇌졸중','신장질환','암','백내장','녹내장','치매','디스크','관절염','피부병','대장/항문']
const ASSISTIVE = ['사용안함','휠체어','지팡이','목발','보청기','틀니','돋보기']
const ADL_ITEMS = ['식사하기','옷입기','세면·목욕','화장실이용','이동하기','대소변조절']
const IADL_ITEMS = ['장보기','식사준비','가사일','빨래','교통수단이용','전화사용','약복용관리','금전관리']
const NEEDS_DOMAINS = ['신체건강','정신건강','사회관계','경제','주거','가족관계','법률','기타']

function AssessmentDocument({ data, org }: { data: AssessmentData; org: OrgData }) {
  const cd = data.chronic_diseases ?? []
  const ad = data.assistive_devices ?? []
  const adl = data.adl_items ?? {}
  const iadl = data.iadl_items ?? {}
  const needs = data.needs_assessment ?? {}

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <ApprovalStamp approvalSlots={org.approval_slots} approver1={org.approver1} approver2={org.approver2} approver3={org.approver3} stampUrl={org.stamp_url} />
        <Text style={styles.title}>사  정  기  록  지</Text>
        <Text style={{ fontSize: 8, marginBottom: 8 }}>상담일시: {data.assessed_at ?? ''}  담당자: {data.worker_name ?? ''}</Text>

        <Text style={styles.section}>1. 대상자 기본정보</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            <Text style={[styles.th, { width: '15%' }]}>성명</Text>
            <Text style={[styles.td, { width: '20%' }]}>{data.client_name ?? ''}</Text>
            <Text style={[styles.th, { width: '10%' }]}>성별</Text>
            <Text style={[styles.td, { width: '10%' }]}>{data.gender ?? ''}</Text>
            <Text style={[styles.th, { width: '10%' }]}>연령</Text>
            <Text style={[styles.td]}>{data.age ?? ''}</Text>
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <Text style={[styles.th, { width: '15%' }]}>현주소</Text>
            <Text style={styles.td}>{data.address ?? ''}</Text>
          </View>
        </View>

        <Text style={styles.section}>2. 경제상황</Text>
        <Text style={{ fontSize: 8, marginBottom: 4 }}>
          보호형태: {data.economic_status ?? ''}  월총수입: {data.monthly_income ?? 0}원
        </Text>

        <Text style={styles.section}>3. 주거상황</Text>
        <Text style={{ fontSize: 8, marginBottom: 4 }}>
          주택소유: {data.housing_type ?? ''}  주택형태: {data.house_form ?? ''}  층수: {data.house_floor ?? ''}
          승강기: {data.elevator ? '유' : '무'}  주택상태: {data.housing_condition ?? ''}  위생: {data.sanitation ?? ''}
          난방: {data.heating_type ?? ''}  화장실: {data.kitchen_type ?? ''}
        </Text>
      </Page>

      <Page size="A4" style={styles.page}>
        <Text style={styles.section}>4. 건강상황</Text>
        <Text style={{ fontSize: 8, marginBottom: 2 }}>전체적 건강상태: {data.health_overall ?? ''}</Text>
        <Text style={{ fontSize: 8, marginBottom: 2 }}>만성질환</Text>
        <View style={styles.checkRow}>
          {CHRONIC.map((d) => <CheckItem key={d} checked={cd.includes(d)} label={d} />)}
        </View>
        <Text style={{ fontSize: 8, marginBottom: 2 }}>장애여부: {data.disability ? `유 (${data.disability_type ?? ''})` : '무'}</Text>
        <Text style={{ fontSize: 8, marginBottom: 2 }}>보장구</Text>
        <View style={styles.checkRow}>
          {ASSISTIVE.map((d) => <CheckItem key={d} checked={ad.includes(d)} label={d} />)}
        </View>

        <Text style={styles.section}>5. 일상생활능력 (ADL)</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            {['항목','독립','부분도움','완전도움'].map((h) => (
              <Text key={h} style={[styles.th, { flex: 1 }]}>{h}</Text>
            ))}
          </View>
          {ADL_ITEMS.map((item) => (
            <View key={item} style={styles.row}>
              <Text style={[styles.td]}>{item}</Text>
              {['독립','부분도움','완전도움'].map((v) => (
                <Text key={v} style={styles.td}>{adl[item] === v ? '●' : ''}</Text>
              ))}
            </View>
          ))}
        </View>

        <Text style={styles.section}>6. 수단적 일상생활능력 (IADL)</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            {['항목','독립','부분도움','완전도움'].map((h) => (
              <Text key={h} style={[styles.th, { flex: 1 }]}>{h}</Text>
            ))}
          </View>
          {IADL_ITEMS.map((item) => (
            <View key={item} style={styles.row}>
              <Text style={[styles.td]}>{item}</Text>
              {['독립','부분도움','완전도움'].map((v) => (
                <Text key={v} style={styles.td}>{iadl[item] === v ? '●' : ''}</Text>
              ))}
            </View>
          ))}
        </View>

        <Text style={styles.section}>7. 욕구 및 문제 영역 사정</Text>
        <View style={styles.table}>
          <View style={styles.row}>
            {['영역','욕구수준','세부내용'].map((h) => (
              <Text key={h} style={[styles.th, { flex: h === '세부내용' ? 3 : 1 }]}>{h}</Text>
            ))}
          </View>
          {NEEDS_DOMAINS.map((domain) => (
            <View key={domain} style={styles.row}>
              <Text style={[styles.td, { flex: 1 }]}>{domain}</Text>
              <Text style={[styles.td, { flex: 1 }]}>{needs[domain]?.level ?? ''}</Text>
              <Text style={[styles.td, { flex: 3 }]}>{needs[domain]?.content ?? ''}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.section}>8. 강점 및 자원</Text>
        <Text style={{ fontSize: 8, marginBottom: 2 }}>강점: {data.strengths ?? ''}</Text>
        <Text style={{ fontSize: 8, marginBottom: 4 }}>이용가능자원: {data.available_resources ?? ''}</Text>

        <Text style={styles.section}>9. 종합의견</Text>
        <Text style={{ fontSize: 8, marginBottom: 2 }}>종합의견: {data.overall_opinion ?? ''}</Text>
        <Text style={{ fontSize: 8, marginBottom: 2 }}>우선순위욕구: {data.priority_needs ?? ''}</Text>
        <Text style={{ fontSize: 8, marginBottom: 8 }}>권고서비스: {data.recommended_services ?? ''}</Text>

        <Text style={{ fontSize: 8, textAlign: 'right', marginBottom: 4 }}>상담일시: {data.assessed_at ?? ''}  상담자: {data.worker_name ?? ''}</Text>
        <Text style={styles.footer}>{org.name ?? ''}</Text>
      </Page>
    </Document>
  )
}

interface Props {
  data: AssessmentData
  org: OrgData
  clientName?: string
}

export default function AssessmentPDF({ data, org, clientName }: Props) {
  const handleDownload = async () => {
    const blob = await pdf(<AssessmentDocument data={data} org={org} />).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `사정기록지_${clientName ?? '빈양식'}.pdf`
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
