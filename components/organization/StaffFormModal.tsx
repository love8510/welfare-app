'use client'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createStaff, updateStaff } from '@/lib/actions/staff'
import { toast } from '@/lib/hooks/use-toast'

const createSchema = z.object({
  name: z.string().min(1, '성명은 필수입니다'),
  employee_no: z.string().optional(),
  job_title: z.string().min(1, '직책은 필수입니다'),
  department_id: z.string().optional(),
  role_id: z.string().min(1, '권한은 필수입니다'),
  phone: z.string().optional(),
  mobile: z.string().optional(),
  email: z.string().email('올바른 이메일을 입력하세요'),
  hire_date: z.string().optional(),
  base_salary: z.number().optional(),
  password: z.string().min(6, '비밀번호는 6자 이상'),
})

const editSchema = createSchema.omit({ email: true, password: true }).extend({
  resign_date: z.string().optional(),
})

type CreateForm = z.infer<typeof createSchema>
type EditForm = z.infer<typeof editSchema>

interface Role { id: string; name: string }
interface Department { id: string; name: string }
interface Staff { id: string; name: string; employee_no?: string; job_title?: string; department_id?: string; role_id?: string; phone?: string; mobile?: string; hire_date?: string; resign_date?: string; base_salary?: number }

interface Props {
  mode: 'create' | 'edit'
  staff?: Staff
  roles: Role[]
  departments: Department[]
  onSuccess: () => void
  trigger: React.ReactNode
}

export function StaffFormModal({ mode, staff, roles, departments, onSuccess, trigger }: Props) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<CreateForm | EditForm>({
    resolver: zodResolver(mode === 'create' ? createSchema : editSchema) as never,
    defaultValues: mode === 'edit' && staff ? {
      name: staff.name,
      employee_no: staff.employee_no ?? '',
      job_title: staff.job_title ?? '',
      department_id: staff.department_id ?? '',
      role_id: staff.role_id ?? '',
      phone: staff.phone ?? '',
      mobile: staff.mobile ?? '',
      hire_date: staff.hire_date ?? '',
      resign_date: staff.resign_date ?? '',
      base_salary: staff.base_salary ?? undefined,
    } : {},
  })

  function onSubmit(values: CreateForm | EditForm) {
    startTransition(async () => {
      try {
        if (mode === 'create') {
          await createStaff(values as CreateForm & { email: string; password: string })
          toast('직원이 등록되었습니다')
        } else {
          await updateStaff(staff!.id, values as EditForm)
          toast('직원 정보가 수정되었습니다')
        }
        setOpen(false)
        onSuccess()
      } catch (err) {
        toast((err as Error).message, 'destructive')
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? '직원등록' : '직원수정'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit as never)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>성명 *</Label>
              <Input {...register('name')} className="mt-1" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <Label>직원번호</Label>
              <Input {...register('employee_no')} className="mt-1" />
            </div>
            <div>
              <Label>직책 *</Label>
              <Input {...register('job_title')} className="mt-1" />
              {errors.job_title && <p className="text-red-500 text-xs mt-1">{errors.job_title.message}</p>}
            </div>
            <div>
              <Label>부서</Label>
              <Select onValueChange={(v) => setValue('department_id', v)} defaultValue={staff?.department_id ?? ''}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="부서 선택" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">없음</SelectItem>
                  {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>권한 *</Label>
              <Select onValueChange={(v) => setValue('role_id', v)} defaultValue={staff?.role_id ?? ''}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="권한 선택" /></SelectTrigger>
                <SelectContent>
                  {roles.map((r) => <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.role_id && <p className="text-red-500 text-xs mt-1">{errors.role_id.message}</p>}
            </div>
            <div>
              <Label>전화번호</Label>
              <Input {...register('phone')} className="mt-1" />
            </div>
            <div>
              <Label>휴대폰</Label>
              <Input {...register('mobile')} className="mt-1" />
            </div>
            <div>
              <Label>입사일</Label>
              <Input {...register('hire_date')} type="date" className="mt-1" />
            </div>
            {mode === 'edit' && (
              <div>
                <Label>퇴직일</Label>
                <Input {...register('resign_date' as never)} type="date" className="mt-1" />
              </div>
            )}
            <div>
              <Label>기본급 (원)</Label>
              <Input {...register('base_salary', { valueAsNumber: true })} type="number" className="mt-1" />
            </div>
          </div>

          {mode === 'create' && (
            <>
              <hr />
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>등록 계정 이메일 *</Label>
                  <Input {...register('email' as never)} type="email" className="mt-1" placeholder="로그인용 이메일" />
                  {(errors as Record<string, { message?: string }>).email && (
                    <p className="text-red-500 text-xs mt-1">{(errors as Record<string, { message?: string }>).email?.message}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <Label>임시 비밀번호 *</Label>
                  <Input {...register('password' as never)} type="password" className="mt-1" />
                  {(errors as Record<string, { message?: string }>).password && (
                    <p className="text-red-500 text-xs mt-1">{(errors as Record<string, { message?: string }>).password?.message}</p>
                  )}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>취소</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? '처리중...' : mode === 'create' ? '등록' : '저장'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
