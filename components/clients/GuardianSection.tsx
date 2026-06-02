'use client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export interface GuardianRow {
  id?: string
  name: string
  relation: string
  address: string
  age: string
  job: string
  cohabitation: boolean
  monthly_income: string
  note: string
  is_primary: boolean
}

interface Props {
  value: GuardianRow[]
  onChange: (rows: GuardianRow[]) => void
}

const RELATIONS = ['아들', '딸', '배우자', '며느리', '사위', '손자', '손녀', '형제', '자매', '기타']

export function GuardianSection({ value, onChange }: Props) {
  function addRow() {
    onChange([...value, { name: '', relation: '', address: '', age: '', job: '', cohabitation: false, monthly_income: '', note: '', is_primary: false }])
  }

  function update(idx: number, field: keyof GuardianRow, val: string | boolean) {
    const rows = [...value]
    rows[idx] = { ...rows[idx], [field]: val }
    onChange(rows)
  }

  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx))
  }

  return (
    <div>
      {value.length === 0 ? (
        <p className="text-sm text-gray-400 mb-2">※ 보호자정보가 없습니다</p>
      ) : (
        <div className="overflow-x-auto mb-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50">
                {['관계', '성명', '주소', '연령', '직업', '동거', '월소득(원)', '비고', '주보호자', '삭제'].map((h) => (
                  <th key={h} className="border px-2 py-1.5 text-center font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {value.map((g, i) => (
                <tr key={i} className="hover:bg-blue-50">
                  <td className="border px-1">
                    <Select value={g.relation} onValueChange={(v) => update(i, 'relation', v)}>
                      <SelectTrigger className="h-7 text-xs w-18"><SelectValue placeholder="-" /></SelectTrigger>
                      <SelectContent>{RELATIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </td>
                  <td className="border px-1"><Input className="h-7 text-xs w-20" value={g.name} onChange={(e) => update(i, 'name', e.target.value)} /></td>
                  <td className="border px-1"><Input className="h-7 text-xs w-32" value={g.address} onChange={(e) => update(i, 'address', e.target.value)} /></td>
                  <td className="border px-1"><Input type="number" className="h-7 text-xs w-14" value={g.age} onChange={(e) => update(i, 'age', e.target.value)} /></td>
                  <td className="border px-1"><Input className="h-7 text-xs w-20" value={g.job} onChange={(e) => update(i, 'job', e.target.value)} /></td>
                  <td className="border px-1 text-center">
                    <input type="checkbox" checked={g.cohabitation} onChange={(e) => update(i, 'cohabitation', e.target.checked)} />
                  </td>
                  <td className="border px-1"><Input type="number" className="h-7 text-xs w-24" value={g.monthly_income} onChange={(e) => update(i, 'monthly_income', e.target.value)} /></td>
                  <td className="border px-1"><Input className="h-7 text-xs w-20" value={g.note} onChange={(e) => update(i, 'note', e.target.value)} /></td>
                  <td className="border px-1 text-center">
                    <input type="checkbox" checked={g.is_primary} onChange={(e) => update(i, 'is_primary', e.target.checked)} />
                  </td>
                  <td className="border px-1"><Button type="button" variant="destructive" size="sm" className="h-7 text-xs" onClick={() => remove(i)}>삭제</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Button type="button" variant="outline" size="sm" onClick={addRow}>+ 보호자 추가</Button>
    </div>
  )
}
