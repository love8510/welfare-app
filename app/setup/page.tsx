'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { setupOrganization } from '@/lib/actions/setup'

export default function SetupPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    representative: '',
    phone: '',
    address: '',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('기관명은 필수입니다'); return }
    setLoading(true)
    setError('')
    try {
      await setupOrganization(form)
      router.push('/organization')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '설정에 실패했습니다')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-[#2d7a2d] text-center mb-2">기관 초기 설정</h1>
        <p className="text-sm text-gray-500 text-center mb-6">처음 사용 시 기관 정보를 등록해주세요</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>기관명 <span className="text-red-500">*</span></Label>
            <Input name="name" value={form.name} onChange={handleChange} className="mt-1" placeholder="예: OO재가노인복지센터" required />
          </div>
          <div>
            <Label>대표자명</Label>
            <Input name="representative" value={form.representative} onChange={handleChange} className="mt-1" placeholder="예: 홍길동" />
          </div>
          <div>
            <Label>전화번호</Label>
            <Input name="phone" value={form.phone} onChange={handleChange} className="mt-1" placeholder="예: 02-1234-5678" />
          </div>
          <div>
            <Label>주소</Label>
            <Input name="address" value={form.address} onChange={handleChange} className="mt-1" placeholder="예: 서울시 강남구..." />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" className="w-full bg-[#2d7a2d] hover:bg-[#256325]" disabled={loading}>
            {loading ? '설정 중...' : '기관 등록 및 시작하기'}
          </Button>
        </form>
      </div>
    </div>
  )
}
