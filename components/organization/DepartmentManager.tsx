'use client'
import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '@/lib/actions/staff'
import { toast } from '@/lib/hooks/use-toast'

interface Dept { id: string; name: string; sort_order: number }

export function DepartmentManager() {
  const [depts, setDepts] = useState<Dept[]>([])
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getDepartments()
      setDepts(data as Dept[])
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAdd() {
    if (!newName.trim()) return
    try {
      await createDepartment(newName.trim())
      setNewName('')
      toast('부서가 추가되었습니다')
      load()
    } catch (err) {
      toast((err as Error).message, 'destructive')
    }
  }

  async function handleUpdate(id: string) {
    if (!editName.trim()) return
    try {
      await updateDepartment(id, editName.trim())
      setEditing(null)
      toast('수정되었습니다')
      load()
    } catch (err) {
      toast((err as Error).message, 'destructive')
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`"${name}" 부서를 삭제하시겠습니까?`)) return
    try {
      await deleteDepartment(id)
      toast('삭제되었습니다')
      load()
    } catch (err) {
      toast((err as Error).message, 'destructive')
    }
  }

  return (
    <div>
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              {['No', '부서명', '수정', '삭제'].map((h) => (
                <th key={h} className="px-4 py-2.5 text-left font-semibold text-gray-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">불러오는 중...</td></tr>
            ) : depts.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">부서가 없습니다</td></tr>
            ) : depts.map((d, i) => (
              <tr key={d.id} className="border-b hover:bg-blue-50">
                <td className="px-4 py-2">{i + 1}</td>
                <td className="px-4 py-2">
                  {editing === d.id ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleUpdate(d.id) }}
                      className="h-7 w-48"
                      autoFocus
                    />
                  ) : (
                    d.name
                  )}
                </td>
                <td className="px-4 py-2">
                  {editing === d.id ? (
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => handleUpdate(d.id)}>저장</Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>취소</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => { setEditing(d.id); setEditName(d.name) }}>수정</Button>
                  )}
                </td>
                <td className="px-4 py-2">
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(d.id, d.name)}>삭제</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 부서 추가 */}
      <div className="flex gap-2 mt-4">
        <Input
          placeholder="새 부서명 입력"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
          className="w-48"
        />
        <Button onClick={handleAdd} disabled={!newName.trim()}>부서 추가</Button>
      </div>
    </div>
  )
}
