'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Filters {
  name: string
  receivedStart: string
  receivedEnd: string
  isClosed: string
  workerId: string
}

interface CaseSearchFilterProps {
  workers: { id: string; name: string }[]
  onSearch: (filters: Filters) => void
}

export function CaseSearchFilter({ workers, onSearch }: CaseSearchFilterProps) {
  const [name, setName] = useState('')
  const [receivedStart, setReceivedStart] = useState('')
  const [receivedEnd, setReceivedEnd] = useState('')
  const [isClosed, setIsClosed] = useState('false')
  const [workerId, setWorkerId] = useState('전체')

  const handleSearch = () => {
    onSearch({ name, receivedStart, receivedEnd, isClosed, workerId })
  }

  return (
    <div className="bg-white rounded-lg border p-3 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600 whitespace-nowrap">대상자명</span>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 w-28"
            placeholder="이름 검색"
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600 whitespace-nowrap">접수기간</span>
          <Input
            type="date"
            value={receivedStart}
            onChange={(e) => setReceivedStart(e.target.value)}
            className="h-8 w-36"
          />
          <span className="text-gray-400">~</span>
          <Input
            type="date"
            value={receivedEnd}
            onChange={(e) => setReceivedEnd(e.target.value)}
            className="h-8 w-36"
          />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600 whitespace-nowrap">종결여부</span>
          <Select value={isClosed} onValueChange={setIsClosed}>
            <SelectTrigger className="w-24 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="false">미결</SelectItem>
              <SelectItem value="true">종결</SelectItem>
              <SelectItem value="">전체</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-gray-600 whitespace-nowrap">담당자</span>
          <Select value={workerId} onValueChange={setWorkerId}>
            <SelectTrigger className="w-28 h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="전체">전체</SelectItem>
              {workers.map((w) => (
                <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" onClick={handleSearch}>조회</Button>
      </div>
    </div>
  )
}
