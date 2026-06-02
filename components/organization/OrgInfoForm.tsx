'use client'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUploader } from './ImageUploader'
import { ApprovalSlotSetting } from './ApprovalSlotSetting'
import { updateOrganization } from '@/lib/actions/organization'
import { toast } from '@/lib/hooks/use-toast'

const schema = z.object({
  name: z.string().min(1, '기관명은 필수입니다'),
  code: z.string().min(1, '기관기호는 필수입니다'),
  phone: z.string().min(1, '전화번호는 필수입니다'),
  fax: z.string().optional(),
  email: z.string().optional(),
  homepage: z.string().optional(),
  representative: z.string().optional(),
  mobile: z.string().optional(),
  business_no: z.string().optional(),
  zipcode: z.string().optional(),
  address: z.string().optional(),
  address_detail: z.string().optional(),
  work_start_time: z.string().optional(),
  work_end_time: z.string().optional(),
  industrial_insurance_rate: z.number().optional(),
  employment_dev_rate: z.number().optional(),
  severance_rate: z.number().optional(),
})

type FormValues = z.infer<typeof schema>

interface Props {
  org: Record<string, unknown>
}

export function OrgInfoForm({ org }: Props) {
  const [isPending, startTransition] = useTransition()
  const [logoUrl, setLogoUrl] = useState<string | null>((org.logo_url as string) ?? null)
  const [stampUrl, setStampUrl] = useState<string | null>((org.stamp_url as string) ?? null)
  const [approvalSlots, setApprovalSlots] = useState(Number(org.approval_slots) || 2)
  const [approvers, setApprovers] = useState<string[]>([
    (org.approver1 as string) ?? '센터장',
    (org.approver2 as string) ?? '담당',
    (org.approver3 as string) ?? '',
  ])

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: (org.name as string) ?? '',
      code: (org.code as string) ?? '',
      phone: (org.phone as string) ?? '',
      fax: (org.fax as string) ?? '',
      email: (org.email as string) ?? '',
      homepage: (org.homepage as string) ?? '',
      representative: (org.representative as string) ?? '',
      mobile: (org.mobile as string) ?? '',
      business_no: (org.business_no as string) ?? '',
      zipcode: (org.zipcode as string) ?? '',
      address: (org.address as string) ?? '',
      address_detail: (org.address_detail as string) ?? '',
      work_start_time: (org.work_start_time as string) ?? '09:00',
      work_end_time: (org.work_end_time as string) ?? '18:00',
      industrial_insurance_rate: Number(org.industrial_insurance_rate) || 0.793,
      employment_dev_rate: Number(org.employment_dev_rate) || 0.250,
      severance_rate: Number(org.severance_rate) || 8.3333,
    },
  })

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await updateOrganization({
          ...values,
          logo_url: logoUrl,
          stamp_url: stampUrl,
          approval_slots: approvalSlots,
          approver1: approvers[0] ?? null,
          approver2: approvers[1] ?? null,
          approver3: approvers[2] ?? null,
        })
        toast('저장되었습니다')
      } catch (err) {
        toast((err as Error).message, 'destructive')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">기관정보수정</h1>
        <Button type="submit" disabled={isPending}>
          {isPending ? '저장중...' : '저장'}
        </Button>
      </div>

      {/* 섹션1: 기본정보 */}
      <div className="bg-white rounded-lg border p-6 mb-4">
        <h2 className="font-semibold text-sm text-gray-500 mb-4 uppercase">기본정보</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>기관기호</Label>
            <Input {...register('code')} className="mt-1" />
            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code.message}</p>}
          </div>
          <div>
            <Label>기관명 *</Label>
            <Input {...register('name')} className="mt-1" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label>홈페이지</Label>
            <Input {...register('homepage')} className="mt-1" />
          </div>
          <div>
            <Label>전화번호 *</Label>
            <Input {...register('phone')} className="mt-1" />
            {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>}
          </div>
          <div>
            <Label>FAX번호</Label>
            <Input {...register('fax')} className="mt-1" />
          </div>
          <div>
            <Label>이메일</Label>
            <Input {...register('email')} className="mt-1" />
          </div>
          <div>
            <Label>대표자명</Label>
            <Input {...register('representative')} className="mt-1" />
          </div>
          <div>
            <Label>휴대폰</Label>
            <Input {...register('mobile')} className="mt-1" />
          </div>
          <div>
            <Label>사업자등록번호</Label>
            <Input {...register('business_no')} className="mt-1" />
          </div>
          <div className="col-span-3">
            <Label>주소</Label>
            <div className="flex gap-2 mt-1">
              <Input {...register('zipcode')} className="w-28" placeholder="우편번호" />
              <Input {...register('address')} className="flex-1" placeholder="도로명주소" />
              <Input {...register('address_detail')} className="flex-1" placeholder="상세주소" />
            </div>
          </div>
        </div>
      </div>

      {/* 섹션2: 이미지 등록 */}
      <div className="bg-white rounded-lg border p-6 mb-4">
        <h2 className="font-semibold text-sm text-gray-500 mb-4 uppercase">이미지 등록</h2>
        <div className="space-y-4">
          <ImageUploader
            bucket="org-assets"
            path={`logos/${org.id}`}
            currentUrl={logoUrl}
            onUpload={setLogoUrl}
            onDelete={() => setLogoUrl(null)}
            label="로고등록"
          />
          <ImageUploader
            bucket="org-assets"
            path={`stamps/${org.id}`}
            currentUrl={stampUrl}
            onUpload={setStampUrl}
            onDelete={() => setStampUrl(null)}
            label="직인등록"
          />
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">요양보호사 근무시간</span>
            <span className="text-sm">출근</span>
            <Input {...register('work_start_time')} type="time" className="w-28" />
            <span className="text-sm">~</span>
            <span className="text-sm">퇴근</span>
            <Input {...register('work_end_time')} type="time" className="w-28" />
            <span className="text-xs text-gray-400">미입력시 09:00~18:00</span>
          </div>
        </div>
      </div>

      {/* 섹션3: 요율 설정 */}
      <div className="bg-white rounded-lg border p-6 mb-4">
        <h2 className="font-semibold text-sm text-gray-500 mb-4 uppercase">요율 설정</h2>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Label className="w-28">산재보험율</Label>
            <Input
              type="number"
              step="0.001"
              {...register('industrial_insurance_rate', { valueAsNumber: true })}
              className="w-24"
            />
            <span className="text-sm">%</span>
            <span className="text-xs text-gray-400">※ 적용요율 0.756% (산재0.6% 및 출퇴근임금채권·석면 합산)</span>
          </div>
          <div className="flex items-center gap-3">
            <Label className="w-28">고안직능요율</Label>
            <Input
              type="number"
              step="0.001"
              {...register('employment_dev_rate', { valueAsNumber: true })}
              className="w-24"
            />
            <span className="text-sm">%</span>
            <span className="text-xs text-gray-400">※ 150인미만 0.25% / 150인이상 0.45%</span>
          </div>
          <div className="flex items-center gap-3">
            <Label className="w-28">퇴직적립금</Label>
            <Input
              type="number"
              step="0.0001"
              {...register('severance_rate', { valueAsNumber: true })}
              className="w-24"
            />
            <span className="text-sm">%</span>
          </div>
        </div>
      </div>

      {/* 섹션5: 결재란 설정 */}
      <div className="bg-white rounded-lg border p-6">
        <h2 className="font-semibold text-sm text-gray-500 mb-4 uppercase">결재란 설정</h2>
        <ApprovalSlotSetting
          slots={approvalSlots}
          approvers={approvers.slice(0, approvalSlots)}
          onChange={(slots, names) => {
            setApprovalSlots(slots)
            setApprovers(names)
          }}
        />
      </div>
    </form>
  )
}
