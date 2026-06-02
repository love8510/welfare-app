'use client'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { getWorkerListForOrg } from '@/lib/actions/clients'

export interface Filters {
  name: string
  contractStart: string
  contractEnd: string
  phone: string
  address: string
  clientType: string
  workerId: string
  status: string
  livingAlone: string
}

interface Props {
  onSearch: (f: Filters) => void
}

const DEFAULT: Filters = {
  name: '', contractStart: '', contractEnd: '', phone: '',
  address: '', clientType: '전체', workerId: '전체',
  status: '이용', livingAlone: '전체',
}

export function ClientSearchFilter({ onSearch }: Props) {
  const [f, setF] = useState<Filters>(DEFAULT)
  const [workers, setWorkers] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    getWorkerListForOrg().then(setWorkers)
  }, [])

  function set(key: keyof Filters, val: string) {
    setF((prev) => ({ ...prev, [key]: val }))
  }

  return (
    <div className="bg-white rounded-lg border p-4 mb-4 space-y-3">
      <div className="grid grid-cols-4 gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">대상자명</label>
          <Input value={f.name} onChange={(e) => set('name', e.target.value)} placeholder="이름 검색" className="h-8" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">계약일자 시작</label>
          <Input type="date" value={f.contractStart} onChange={(e) => set('contractStart', e.target.value)} className="h-8" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">계약일자 종료</label>
          <Input type="date" value={f.contractEnd} onChange={(e) => set('contractEnd', e.target.value)} className="h-8" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">연락처</label>
          <Input value={f.phone} onChange={(e) => set('phone', e.target.value)} placeholder="연락처 검색" className="h-8" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">주소</label>
          <Input value={f.address} onChange={(e) => set('address', e.target.value)} placeholder="주소 검색" className="h-8" />
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">유형</label>
          <Select value={f.clientType} onValueChange={(v) => set('clientType', v)}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['전체', '일반', '중점', '예비'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">담당자</label>
          <Select value={f.workerId} onValueChange={(v) => set('workerId', v)}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="전체">전체</SelectItem>
              {workers.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-gray-500 mb-1 block">이용상태</label>
          <Select value={f.status} onValueChange={(v) => set('status', v)}>
            <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['전체', '이용', '중지', '종결', '예비'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div>
          <label className="text-xs text-gray-500 mb-1 block">독거여부</label>
          <Select value={f.livingAlone} onValueChange={(v) => set('livingAlone', v)}>
            <SelectTrigger className="h-8 w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {['전체', '예', '아니오'].map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 mt-4">
          <Button type="button" onClick={() => onSearch(f)}>조회</Button>
          <Button type="button" variant="secondary" onClick={() => { setF(DEFAULT); onSearch(DEFAULT) }}>초기화</Button>
        </div>
      </div>
    </div>
  )
}
