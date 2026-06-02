'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBudgetItem, updateBudgetItem, copyBudgetFromPrevYear } from '@/lib/actions/finance'
import { toast } from '@/lib/hooks/use-toast'

interface Props {
  year: number
  existingCategories?: string[]
  editItem?: { id: string; type: 'income' | 'expense'; category: string; sub_category?: string; item_name: string; budget_amount: number; sort_order?: number }
  onSaved: () => void
  onCancel: () => void
}

export function BudgetItemForm({ year, existingCategories = [], editItem, onSaved, onCancel }: Props) {
  const [type, setType] = useState<'income' | 'expense'>(editItem?.type ?? 'expense')
  const [category, setCategory] = useState(editItem?.category ?? '')
  const [subCategory, setSubCategory] = useState(editItem?.sub_category ?? '')
  const [itemName, setItemName] = useState(editItem?.item_name ?? '')
  const [budgetAmount, setBudgetAmount] = useState(editItem?.budget_amount ?? 0)
  const [sortOrder, setSortOrder] = useState(editItem?.sort_order ?? 0)
  const [saving, setSaving] = useState(false)
  const [copying, setCopying] = useState(false)

  async function handleSave() {
    if (!category || !itemName || budgetAmount <= 0) {
      toast('필수 항목을 입력해주세요', 'destructive')
      return
    }
    setSaving(true)
    try {
      if (editItem) {
        await updateBudgetItem(editItem.id, { type, category, sub_category: subCategory, item_name: itemName, budget_amount: budgetAmount, sort_order: sortOrder })
      } else {
        await createBudgetItem({ year, type, category, sub_category: subCategory, item_name: itemName, budget_amount: budgetAmount, sort_order: sortOrder })
      }
      toast('저장되었습니다')
      onSaved()
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setSaving(false)
    }
  }

  async function handleCopyPrevYear() {
    if (!confirm(`${year - 1}년 예산 항목을 ${year}년으로 복사하시겠습니까?`)) return
    setCopying(true)
    try {
      await copyBudgetFromPrevYear(year - 1, year)
      toast('복사되었습니다')
      onSaved()
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-xl w-full max-w-md p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg">{editItem ? '예산항목 수정' : '예산항목 추가'}</h3>
          {!editItem && (
            <Button variant="outline" size="sm" onClick={handleCopyPrevYear} disabled={copying}>
              {copying ? '복사중...' : `${year - 1}년 예산 가져오기`}
            </Button>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <Label>구분 *</Label>
            <div className="flex gap-2 mt-1">
              {(['expense', 'income'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${type === t ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                >
                  {t === 'expense' ? '세출' : '세입'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label>대분류 *</Label>
            <Input
              className="mt-1"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              list="category-list"
              placeholder="예: 인건비, 보조금수입"
            />
            <datalist id="category-list">
              {existingCategories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>

          <div>
            <Label>중분류</Label>
            <Input className="mt-1" value={subCategory} onChange={(e) => setSubCategory(e.target.value)} placeholder="선택사항" />
          </div>

          <div>
            <Label>항목명 *</Label>
            <Input className="mt-1" value={itemName} onChange={(e) => setItemName(e.target.value)} placeholder="항목명 입력" />
          </div>

          <div>
            <Label>예산액 (원) *</Label>
            <Input
              type="number"
              className="mt-1"
              value={budgetAmount === 0 ? '' : budgetAmount}
              onChange={(e) => setBudgetAmount(Number(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div>
            <Label>순서</Label>
            <Input type="number" className="mt-1" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value) || 0)} />
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving} className="flex-1">{saving ? '저장중...' : '저장'}</Button>
          <Button variant="outline" onClick={onCancel}>취소</Button>
        </div>
      </div>
    </div>
  )
}
