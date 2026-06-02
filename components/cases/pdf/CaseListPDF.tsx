'use client'
import '@/lib/pdf-fonts'
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer'
import { format } from 'date-fns'

const styles = StyleSheet.create({
  page: { fontFamily: 'NanumGothic', padding: '30 40', fontSize: 9 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  title: { fontSize: 14, fontWeight: 'bold' },
  table: { width: '100%', borderStyle: 'solid', borderWidth: 1, borderColor: '#ccc' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc' },
  headerRow: { flexDirection: 'row', backgroundColor: '#f5f5f5', borderBottomWidth: 1, borderBottomColor: '#ccc' },
  cell: { padding: '3 4', borderRightWidth: 1, borderRightColor: '#ccc', fontSize: 8 },
})

interface CaseRow {
  id: string; case_no: number; received_at: string; receive_method: string
  referrer_name: string; referrer_phone: string; is_closed: boolean
  clients: { name: string; birth_date: string; phone_mobile: string }
  worker: { name: string } | null
}

function CaseListDocument({ cases, orgName }: { cases: CaseRow[]; orgName: string }) {
  const cols = [
    { label: 'No', width: '5%' }, { label: '성명', width: '8%' },
    { label: '생년월일', width: '10%' }, { label: '연락처', width: '12%' },
    { label: '차수', width: '5%' }, { label: '접수방법', width: '8%' },
    { label: '접수일자', width: '10%' }, { label: '의뢰인', width: '8%' },
    { label: '의뢰인연락처', width: '12%' }, { label: '접수자', width: '8%' },
    { label: '종결여부', width: '8%' },
  ]

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>{orgName} 사례대상자목록</Text>
          <Text>출력일: {format(new Date(), 'yyyy-MM-dd')}</Text>
        </View>
        <View style={styles.table}>
          <View style={styles.headerRow}>
            {cols.map((c) => (
              <Text key={c.label} style={[styles.cell, { width: c.width, fontWeight: 'bold' }]}>{c.label}</Text>
            ))}
          </View>
          {cases.map((c, i) => (
            <View key={c.id} style={styles.row}>
              <Text style={[styles.cell, { width: '5%' }]}>{i + 1}</Text>
              <Text style={[styles.cell, { width: '8%' }]}>{c.clients?.name}</Text>
              <Text style={[styles.cell, { width: '10%' }]}>{c.clients?.birth_date}</Text>
              <Text style={[styles.cell, { width: '12%' }]}>{c.clients?.phone_mobile}</Text>
              <Text style={[styles.cell, { width: '5%' }]}>{c.case_no}차</Text>
              <Text style={[styles.cell, { width: '8%' }]}>{c.receive_method}</Text>
              <Text style={[styles.cell, { width: '10%' }]}>{c.received_at}</Text>
              <Text style={[styles.cell, { width: '8%' }]}>{c.referrer_name}</Text>
              <Text style={[styles.cell, { width: '12%' }]}>{c.referrer_phone}</Text>
              <Text style={[styles.cell, { width: '8%' }]}>{c.worker?.name}</Text>
              <Text style={[styles.cell, { width: '8%' }]}>{c.is_closed ? '종결' : '미결'}</Text>
            </View>
          ))}
        </View>
      </Page>
    </Document>
  )
}

export default function CaseListPDF({ cases, orgName }: { cases: CaseRow[]; orgName: string }) {
  return (
    <PDFDownloadLink
      document={<CaseListDocument cases={cases} orgName={orgName} />}
      fileName={`사례대상자목록_${format(new Date(), 'yyyy-MM-dd')}.pdf`}
    >
      {({ loading }) => loading ? 'PDF 생성 중...' : 'PDF 다운로드'}
    </PDFDownloadLink>
  )
}
