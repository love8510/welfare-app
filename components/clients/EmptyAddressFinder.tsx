'use client'
import { useState, useEffect, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getEmptyAddressClients, updateClientAction } from '@/lib/actions/clients'
import { toast } from '@/lib/hooks/use-toast'

interface ClientRow {
  id: string
  name: string
  phone_mobile?: string
  phone_home?: string
  address?: string
  users?: { name: string } | null
}

export function EmptyAddressFinder() {
  const [clients, setClients] = useState<ClientRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [newAddress, setNewAddress] = useState('')
  const [isPending, startTransition] = useTransition()

  async function load() {
    setLoading(true)
    try {
      const data = await getEmptyAddressClients()
      setClients(data as ClientRow[])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  function handleSave(id: string) {
    startTransition(async () => {
      try {
        await updateClientAction(id, { address: newAddress })
        toast('주소가 저장되었습니다')
        setEditing(null)
        setNewAddress('')
        load()
      } catch (err) {
        toast((err as Error).message, 'destructive')
      }
    })
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">빈주소 찾기</h1>
        <span className="text-sm text-gray-500">주소가 없는 대상자: <strong>{clients.length}건</strong></span>
      </div>

      {loading ? (
        <p className="text-center py-10 text-gray-400">불러오는 중...</p>
      ) : clients.length === 0 ? (
        <div className="bg-white rounded-lg border p-10 text-center text-gray-400">
          주소가 없는 대상자가 없습니다
        </div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-red-50 border-b">
                {['No', '대상자명', '연락처', '담당자', '현재 주소', '주소 입력'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clients.map((c, i) => (
                <tr key={c.id} className="border-b hover:bg-red-50 transition-colors">
                  <td className="px-4 py-2">{i + 1}</td>
                  <td className="px-4 py-2 font-medium text-red-600">{c.name}</td>
                  <td className="px-4 py-2">{c.phone_mobile ?? c.phone_home ?? '-'}</td>
                  <td className="px-4 py-2">{c.users?.name ?? '-'}</td>
                  <td className="px-4 py-2 text-gray-400 italic">주소 없음</td>
                  <td className="px-4 py-2">
                    {editing === c.id ? (
                      <div className="flex gap-2">
                        <Input
                          value={newAddress}
                          onChange={(e) => setNewAddress(e.target.value)}
                          placeholder="주소 입력"
                          className="h-7 text-xs w-48"
                          autoFocus
                        />
                        <Button size="sm" className="h-7" onClick={() => handleSave(c.id)} disabled={isPending}>저장</Button>
                        <Button size="sm" variant="secondary" className="h-7" onClick={() => setEditing(null)}>취소</Button>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs border-red-300 text-red-600 hover:bg-red-50"
                        onClick={() => { setEditing(c.id); setNewAddress('') }}
                      >
                        주소입력
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
