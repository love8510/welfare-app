'use client'
import dynamic from 'next/dynamic'

// react-pdf/renderer는 서버 사이드에서 렌더링되지 않으므로 dynamic import 사용
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then((mod) => mod.PDFDownloadLink),
  { ssr: false, loading: () => <span>PDF 준비중...</span> }
)

import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 10, fontFamily: 'Helvetica' },
  title: { fontSize: 18, textAlign: 'center', marginBottom: 16, fontWeight: 'bold' },
  approvalBox: { position: 'absolute', top: 30, right: 30, flexDirection: 'row', border: '1pt solid #000' },
  approvalCell: { width: 50, height: 40, borderLeft: '1pt solid #000', padding: 4, textAlign: 'center', fontSize: 9 },
  section: { marginBottom: 10 },
  sectionTitle: { fontSize: 11, fontWeight: 'bold', marginBottom: 4, borderBottom: '1pt solid #ccc', paddingBottom: 2 },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 80, color: '#666' },
  value: { flex: 1 },
  table: { border: '1pt solid #ccc', marginBottom: 8 },
  th: { backgroundColor: '#f5f5f5', padding: 3, fontSize: 9, fontWeight: 'bold', borderBottom: '1pt solid #ccc', flex: 1, textAlign: 'center' },
  td: { padding: 3, fontSize: 9, flex: 1, textAlign: 'center' },
  footer: { position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', fontSize: 10, color: '#555' },
  chip: { borderRadius: 2, backgroundColor: '#e5e7eb', padding: '1 4', marginRight: 3, fontSize: 8 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
})

interface PDFProps {
  client: { name: string; gender?: string; birth_date?: string; address?: string; phone_mobile?: string }
  interview: Record<string, unknown>
  orgName: string
  approver1: string
  approver2: string
}

function InterviewDocument({ client, interview, orgName, approver1, approver2 }: PDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* 결재란 */}
        <View style={styles.approvalBox}>
          <View style={[styles.approvalCell, { borderLeft: 0 }]}>
            <Text>{approver1}</Text>
          </View>
          <View style={styles.approvalCell}>
            <Text>{approver2}</Text>
          </View>
        </View>

        <Text style={styles.title}>초 기 면 접 지</Text>

        {/* 기본사항 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 기본사항</Text>
          <View style={styles.row}>
            <Text style={styles.label}>성명</Text><Text style={styles.value}>{client.name}</Text>
            <Text style={styles.label}>성별</Text><Text style={styles.value}>{client.gender ?? '-'}</Text>
            <Text style={styles.label}>주소</Text><Text style={styles.value}>{client.address ?? '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>연락처</Text><Text style={styles.value}>{client.phone_mobile ?? '-'}</Text>
          </View>
        </View>

        {/* 생활상태 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. 생활상태</Text>
          <View style={styles.row}>
            <Text style={styles.label}>경제상황</Text><Text style={styles.value}>{(interview.economic_status as string) ?? '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>주거형태</Text><Text style={styles.value}>{(interview.housing_type as string) ?? '-'}</Text>
          </View>
        </View>

        {/* 신체상태 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 신체상태</Text>
          <View style={styles.row}>
            <Text style={styles.label}>만성질환</Text>
            <View style={styles.chipsRow}>
              {((interview.chronic_diseases as string[]) ?? []).map((d) => (
                <Text key={d} style={styles.chip}>{d}</Text>
              ))}
            </View>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>장기요양등급</Text><Text style={styles.value}>{(interview.care_grade as string) ?? '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>보장구</Text>
            <View style={styles.chipsRow}>
              {((interview.assistive_devices as string[]) ?? []).map((d) => (
                <Text key={d} style={styles.chip}>{d}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* 서비스 제공여부 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. 서비스 제공여부</Text>
          <View style={styles.row}>
            <Text style={styles.label}>판정</Text>
            <Text style={styles.value}>{(interview.service_eligible as boolean) ? '적격' : '부적격'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>서비스 사유</Text><Text style={styles.value}>{(interview.service_reason as string) ?? '-'}</Text>
          </View>
        </View>

        {/* 의뢰인 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. 의뢰인</Text>
          <View style={styles.row}>
            <Text style={styles.label}>성명</Text><Text style={styles.value}>{(interview.referrer_name as string) ?? '-'}</Text>
            <Text style={styles.label}>관계</Text><Text style={styles.value}>{(interview.referrer_relation as string) ?? '-'}</Text>
          </View>
        </View>

        {/* 비고 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. 비고</Text>
          <Text>{(interview.note as string) ?? ''}</Text>
          <View style={[styles.row, { marginTop: 6 }]}>
            <Text style={styles.label}>면접일</Text><Text style={styles.value}>{(interview.interviewed_at as string) ?? '-'}</Text>
          </View>
        </View>

        <Text style={styles.footer}>{orgName}</Text>
      </Page>
    </Document>
  )
}

interface Props {
  client: { name: string; gender?: string; birth_date?: string; address?: string; phone_mobile?: string }
  interview: Record<string, unknown>
  orgName: string
  approver1?: string
  approver2?: string
}

export function InitialInterviewPDFButton({ client, interview, orgName, approver1 = '센터장', approver2 = '담당' }: Props) {
  return (
    <PDFDownloadLink
      document={<InterviewDocument client={client} interview={interview} orgName={orgName} approver1={approver1} approver2={approver2} />}
      fileName={`초기상담기록지_${client.name}.pdf`}
    >
      {({ loading }) => (
        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-4 py-2 border border-input bg-background hover:bg-accent transition-colors">
          {loading ? '생성중...' : '출력(PDF)'}
        </button>
      )}
    </PDFDownloadLink>
  )
}
