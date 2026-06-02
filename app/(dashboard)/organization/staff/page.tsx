import { getStaffList, getDepartments } from '@/lib/actions/staff'
import { StaffListTable } from '@/components/organization/staff/StaffListTable'

export default async function StaffPage() {
  const [staffList, departments] = await Promise.all([
    getStaffList(),
    getDepartments(),
  ])
  return <StaffListTable initialData={staffList} departments={departments} />
}
