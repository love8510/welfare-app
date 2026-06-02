import { getStaffById, getDepartments } from '@/lib/actions/staff'
import { StaffDetailPage } from '@/components/organization/staff/StaffDetailPage'
import { notFound } from 'next/navigation'

export default async function StaffDetailRoute({ params }: { params: { id: string } }) {
  if (params.id === 'new') {
    // 신규 등록은 빈 폼으로
    const departments = await getDepartments()
    return (
      <StaffDetailPage
        staff={{ id: null, name: '', employment_type: '정규직', employment_status: '재직' }}
        departments={departments}
      />
    )
  }

  const [staff, departments] = await Promise.all([
    getStaffById(params.id).catch(() => null),
    getDepartments(),
  ])

  if (!staff) notFound()
  return <StaffDetailPage staff={staff as Record<string, unknown>} departments={departments} />
}
