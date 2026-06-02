'use client'
import { View, Text, Image, StyleSheet } from '@react-pdf/renderer'

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 30, right: 40 },
  stampImg: { width: 40, height: 40, marginBottom: 2 },
  table: { borderStyle: 'solid', borderWidth: 1, borderColor: '#333', flexDirection: 'row' },
  cell: {
    width: 50, borderRightWidth: 1, borderRightColor: '#333', padding: 2,
    alignItems: 'center',
  },
  lastCell: { width: 50, padding: 2, alignItems: 'center' },
  label: { fontSize: 7, fontWeight: 'bold', textAlign: 'center' },
  signSpace: { height: 30 },
})

interface ApprovalStampProps {
  approvalSlots?: number
  approver1?: string
  approver2?: string
  approver3?: string
  stampUrl?: string | null
}

export function ApprovalStamp({
  approvalSlots = 2,
  approver1 = '센터장',
  approver2 = '담당',
  approver3,
  stampUrl,
}: ApprovalStampProps) {
  const slots = approvalSlots >= 3
    ? [approver1, approver3 ?? '팀장', approver2]
    : [approver1, approver2]

  return (
    <View style={styles.container}>
      {stampUrl && <Image style={styles.stampImg} src={stampUrl} />}
      <View style={styles.table}>
        {slots.map((label, i) => (
          <View key={i} style={i < slots.length - 1 ? styles.cell : styles.lastCell}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.signSpace} />
          </View>
        ))}
      </View>
    </View>
  )
}
