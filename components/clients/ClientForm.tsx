'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { IdNumberInput } from './IdNumberInput'
import { GuardianSection, type GuardianRow } from './GuardianSection'
import { WeeklyServicePlan, type PlanRow } from './WeeklyServicePlan'
import { createClientAction, updateClientAction } from '@/lib/actions/clients'
import { toast } from '@/lib/hooks/use-toast'

const schema = z.object({
  name: z.string().min(1, '성명을 입력해주세요'),
  gender: z.enum(['남', '여']).optional(),
  birth_date: z.string().optional(),
  phone_mobile: z.string().optional(),
  phone_home: z.string().optional(),
  zipcode: z.string().optional(),
  address: z.string().optional(),
  address_detail: z.string().optional(),
  resident_address: z.string().optional(),
  client_type: z.enum(['일반', '중점', '예비']).default('일반'),
  care_grade: z.string().optional(),
  living_alone: z.boolean().default(false),
  national_basic: z.boolean().default(false),
  status: z.enum(['이용', '중지', '종결', '예비']).default('이용'),
  contract_start: z.string().optional(),
  contract_end: z.string().optional(),
  memo: z.string().optional(),
  worker_id: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface Worker { id: string; name: string }
interface Props {
  mode: 'create' | 'edit'
  client?: Record<string, unknown>
  workers: Worker[]
}

export function ClientForm({ mode, client, workers }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [idNumber, setIdNumber] = useState((client?.id_number as string) ?? '')
  const [gender, setGender] = useState<'남' | '여' | ''>((client?.gender as '남' | '여') ?? '')
  const [guardians, setGuardians] = useState<GuardianRow[]>(
    (client?.guardians as GuardianRow[]) ?? []
  )
  const [plans, setPlans] = useState<PlanRow[]>(
    (client?.weekly_service_plans as PlanRow[]) ?? []
  )

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as never,
    defaultValues: {
      name: (client?.name as string) ?? '',
      gender: (client?.gender as '남' | '여') ?? undefined,
      birth_date: (client?.birth_date as string) ?? '',
      phone_mobile: (client?.phone_mobile as string) ?? '',
      phone_home: (client?.phone_home as string) ?? '',
      zipcode: (client?.zipcode as string) ?? '',
      address: (client?.address as string) ?? '',
      address_detail: (client?.address_detail as string) ?? '',
      resident_address: (client?.resident_address as string) ?? '',
      client_type: (client?.client_type as '일반' | '중점' | '예비') ?? '일반',
      care_grade: (client?.care_grade as string) ?? '',
      living_alone: (client?.living_alone as boolean) ?? false,
      national_basic: (client?.national_basic as boolean) ?? false,
      status: (client?.status as '이용' | '중지' | '종결' | '예비') ?? '이용',
      contract_start: (client?.contract_start as string) ?? '',
      contract_end: (client?.contract_end as string) ?? '',
      memo: (client?.memo as string) ?? '',
      worker_id: (client?.worker_id as string) ?? '',
    },
  })

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        const payload = {
          ...values,
          gender: gender || values.gender,
          id_number: idNumber ? btoa(idNumber) : null,
          guardians,
          weekly_service_plans: plans,
        }
        if (mode === 'create') {
          const id = await createClientAction(payload as Record<string, unknown>)
          toast('대상자가 등록되었습니다')
          router.push(`/clients/${id}`)
        } else {
          await updateClientAction(client!.id as string, payload as Record<string, unknown>)
          toast('저장되었습니다')
        }
      } catch (err) {
        toast((err as Error).message, 'destructive')
      }
    })
  }

  const livingAlone = watch('living_alone')

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-gray-50 py-3 z-10">
        <h1 className="text-xl font-bold">
          {mode === 'create' ? '대상자등록(재가지원)' : '대상자수정'}
        </h1>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => router.push('/clients')}>리스트</Button>
          <Button type="submit" disabled={isPending}>{isPending ? '저장중...' : '저장'}</Button>
        </div>
      </div>

      {/* 섹션1: 기본정보 */}
      <div className="bg-white rounded-lg border p-5 mb-4">
        <h2 className="font-semibold text-sm text-gray-500 mb-4 uppercase sticky top-16 bg-white py-1">
          기본정보
          <span className="ml-2 text-xs text-gray-400 normal-case font-normal">
            ※ 성별 판단을 위해 주민번호 7자리까지는 입력해 주십시오.
          </span>
        </h2>
        <div className="grid grid-cols-2 gap-6">
          {/* 왼쪽 */}
          <div className="space-y-3">
            <div>
              <Label>주민번호</Label>
              <div className="flex items-center gap-3 mt-1">
                <IdNumberInput
                  value={idNumber}
                  onChange={(raw, g) => { setIdNumber(raw); setGender(g) }}
                  masked={mode === 'edit'}
                />
                {gender && (
                  <span className={`text-sm font-semibold ${gender === '남' ? 'text-blue-600' : 'text-pink-600'}`}>
                    {gender}
                  </span>
                )}
              </div>
            </div>
            <div>
              <Label>성명 *</Label>
              <Input {...register('name')} className="mt-1" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label>생년월일</Label>
              <Input {...register('birth_date')} type="date" className="mt-1 w-40" />
            </div>
            <div>
              <Label>담당자</Label>
              <Select onValueChange={(v) => setValue('worker_id', v)} defaultValue={(client?.worker_id as string) ?? ''}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="담당자 선택" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">자동배정</SelectItem>
                  {workers.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>연락처(휴대폰)</Label>
              <Input {...register('phone_mobile')} className="mt-1" placeholder="010-0000-0000" />
            </div>
            <div>
              <Label>연락처(자택)</Label>
              <Input {...register('phone_home')} className="mt-1" />
            </div>
            <div>
              <Label>실거주지 주소</Label>
              <div className="flex gap-2 mt-1">
                <Input {...register('zipcode')} className="w-28" placeholder="우편번호" />
                <Input {...register('address')} className="flex-1" placeholder="도로명주소" />
              </div>
              <Input {...register('address_detail')} className="mt-1" placeholder="상세주소" />
            </div>
            <div>
              <Label>주민등록주소</Label>
              <Input {...register('resident_address')} className="mt-1" />
            </div>
          </div>

          {/* 오른쪽 */}
          <div className="space-y-3">
            <div>
              <Label>유형</Label>
              <Select onValueChange={(v) => setValue('client_type', v as '일반' | '중점' | '예비')} defaultValue={(client?.client_type as string) ?? '일반'}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['일반', '중점', '예비'].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>이용상태</Label>
              <Select onValueChange={(v) => setValue('status', v as '이용' | '중지' | '종결' | '예비')} defaultValue={(client?.status as string) ?? '이용'}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['이용', '중지', '종결', '예비'].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>장기요양등급</Label>
              <Input {...register('care_grade')} className="mt-1" placeholder="예: 3등급" />
            </div>
            <div className="flex items-center gap-2 mt-2">
              <input type="checkbox" id="living_alone" {...register('living_alone')} />
              <Label htmlFor="living_alone">독거여부</Label>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="national_basic" {...register('national_basic')} />
              <Label htmlFor="national_basic">국민기초생활수급자</Label>
            </div>
          </div>
        </div>

        {/* 보호자 섹션 */}
        <div className="mt-4 pt-4 border-t">
          <Label className="mb-2 block">보호자 정보</Label>
          <GuardianSection value={guardians} onChange={setGuardians} />
        </div>
      </div>

      {/* 섹션2: 이용정보 */}
      <div className="bg-white rounded-lg border p-5 mb-4">
        <h2 className="font-semibold text-sm text-gray-500 mb-4 uppercase">이용정보</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>계약 시작일</Label>
            <Input {...register('contract_start')} type="date" className="mt-1" />
          </div>
          <div>
            <Label>계약 종료일</Label>
            <Input {...register('contract_end')} type="date" className="mt-1" />
          </div>
          <div className="flex items-center gap-4 pt-5">
            <Label>독거여부</Label>
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <input type="radio" checked={livingAlone === true} onChange={() => setValue('living_alone', true)} /> 예
            </label>
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <input type="radio" checked={livingAlone === false} onChange={() => setValue('living_alone', false)} /> 아니오
            </label>
          </div>
        </div>
      </div>

      {/* 섹션3: 메모 */}
      <div className="bg-white rounded-lg border p-5 mb-4">
        <h2 className="font-semibold text-sm text-gray-500 mb-4 uppercase">메모관리</h2>
        <textarea
          {...register('memo')}
          rows={4}
          className="w-full border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          placeholder="메모를 입력하세요..."
        />
      </div>

      {/* 섹션4: 주간 서비스 제공계획 */}
      <div className="bg-white rounded-lg border p-5">
        <h2 className="font-semibold text-sm text-gray-500 mb-4 uppercase">주간 서비스 제공계획</h2>
        <WeeklyServicePlan value={plans} onChange={setPlans} />
      </div>
    </form>
  )
}
