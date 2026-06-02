'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다')
      setLoading(false)
    } else {
      router.push('/organization')
      router.refresh()
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다')
      return
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setError(error.message === 'User already registered' ? '이미 가입된 이메일입니다' : '회원가입에 실패했습니다')
      setLoading(false)
    } else {
      setMessage('가입이 완료됐습니다. 이메일 인증 없이 바로 로그인하세요.')
      setLoading(false)
      setTab('login')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <h1 className="text-2xl font-bold text-[#2d7a2d] text-center mb-6">
          재가복지센터<br />통합관리시스템
        </h1>

        {/* 탭 */}
        <div className="flex mb-6 border-b">
          <button
            type="button"
            onClick={() => { setTab('login'); setError(''); setMessage('') }}
            className={`flex-1 pb-2 text-sm font-medium transition-colors ${
              tab === 'login'
                ? 'border-b-2 border-[#2d7a2d] text-[#2d7a2d]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => { setTab('signup'); setError(''); setMessage('') }}
            className={`flex-1 pb-2 text-sm font-medium transition-colors ${
              tab === 'signup'
                ? 'border-b-2 border-[#2d7a2d] text-[#2d7a2d]'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            회원가입
          </button>
        </div>

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label>이메일</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" required />
            </div>
            <div>
              <Label>비밀번호</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" required />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {message && <p className="text-green-600 text-sm">{message}</p>}
            <Button type="submit" className="w-full bg-[#2d7a2d] hover:bg-[#256325]" disabled={loading}>
              {loading ? '로그인 중...' : '로그인'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <Label>이메일</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" required />
            </div>
            <div>
              <Label>비밀번호</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" required placeholder="6자 이상" />
            </div>
            <div>
              <Label>비밀번호 확인</Label>
              <Input type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} className="mt-1" required />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Button type="submit" className="w-full bg-[#2d7a2d] hover:bg-[#256325]" disabled={loading}>
              {loading ? '처리 중...' : '회원가입'}
            </Button>
          </form>
        )}
      </div>
    </div>
  )
}
