import { ClientTable } from '@/components/clients/ClientTable'

export default function ClientsPage() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">대상자조회</h1>
      <ClientTable />
    </div>
  )
}
