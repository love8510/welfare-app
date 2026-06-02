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
})

interface PlanItem {
  domain?: string; problem?: string; goal?: string; service?: string
  provider?: string; frequency?: string; period?: string; method?: string; evaluator?: string
}

interface ServicePlanData {
  client_name?: string; worker_name?: string
  plan_period_start?: string; plan_period_end?: string
  goal_long?: string; goal_short?: string
  plan_items?: PlanItem[]
}

interface OrgData {
  name?: string; stamp_url?: string | null; approval_slots?: number; approver1?: string; approver2?: string; approver3?: string
}

function ServicePlanDocument({ data, org }: { data: ServicePlanData; org: OrgData }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <ApprovalStamp approvalSlots={org.approval_slots} approver1={org.approver1} approver2={org.approver2} approver3={org.approver3} stampUrl={org.stamp_url} />
        <Text style={styles.title}>서  비  스  계  획</Text>
        <Text style={{ fontSize: 8, marginBottom: 6 }}>
          대상자: {data.client_name ?? ''}  담당자: {data.worker_name ?? ''}
          계획기간: {data.plan_period_start ?? ''} ~ {data.plan_period_end ?? ''}
        </Text>
        <Text style={{ fontSize: 8, marginBottom: 2 }}>장기목표: {data.goal_long ?? ''}</Text>
        <Text style={{ fontSize: 8, marginBottom: 6 }}>단기목표: {data.goal_short ?? ''}</Text>

        <View style={styles.table}>
          <View style={styles.row}>
            {['영역','문제','목표','서비스내용','제공기관','빈도','기간','방법','평가자'].map((h) => (
              <Text key={h} style={[styles.th, { flex: 1 }]}>{h}</Text>
            ))}
          </View>
          {(data.plan_items ?? []).map((item, i) => (
            <View key={i} style={[styles.row, i === (data.plan_items?.length ?? 0) - 1 ? { borderBottomWidth: 0 } : {}]}>
              <Text style={styles.td}>{item.domain ?? ''}</Text>
              <Text style={styles.td}>{item.problem ?? ''}</Text>
              <Text style={styles.td}>{item.goal ?? ''}</Text>
              <Text style={styles.td}>{item.service ?? ''}</Text>
              <Text style={styles.td}>{item.provider ?? ''}</Text>
              <Text style={styles.td}>{item.frequency ?? ''}</Text>
              <Text style={styles.td}>{item.period ?? ''}</Text>
              <Text style={styles.td}>{item.method ?? ''}</Text>
              <Text style={[styles.td, { borderRightWidth: 0 }]}>{item.evaluator ?? ''}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.footer}>{org.name ?? ''}</Text>
      </Page>
    </Document>
  )
}

interface Props {
  data: ServicePlanData
  org: OrgData
  clientName?: string
}

export default function ServicePlanPDF({ data, org, clientName }: Props) {
  const handleDownload = async () => {
    const blob = await pdf(<ServicePlanDocument data={data} org={org} />).toBlob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `서비스계획_${clientName ?? '빈양식'}.pdf`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <button onClick={handleDownload} className="inline-flex items-center px-3 py-1.5 text-sm border rounded hover:bg-gray-50">
      PDF출력
    </button>
  )
}
