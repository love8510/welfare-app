'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { upsertInitialInterview } from '@/lib/actions/clients'
import { toast } from '@/lib/hooks/use-toast'

const CHRONIC_DISEASES = ['고혈압', '당뇨', '골다공증', '심장질환', '뇌졸중', '신장질환', '암', '백내장', '녹내장', '치매', '디스크', '관절염', '피부병', '대장/항문', '기타']
const ASSISTIVE_DEVICES = ['사용안함', '휠체어', '지팡이', '목발', '보청기', '틀니', '돋보기', '기타']
const CARE_GRADES = ['1등급', '2등급', '3등급', '4등급', '5등급', '인지지원등급', '등급외A', '등급외B', '없음']
const HOUSING_TYPES = ['자가', '전세', '월세', '임대', '무료임대', '의탁거주', '무허가', '기타']
const ECONOMIC_STATUSES = ['국민기초생활수급권자', '차상위', '국가유공자', '일반', '기타']

interface Client {
  id: string
  name: string
  gender?: string
  birth_date?: string
  address?: string
  phone_mobile?: string
  phone_home?: string
}

interface Interview {
  id?: string
  interviewed_at?: string
  economic_status?: string
  chronic_diseases?: string[]
  disability?: boolean
  disability_type?: string
  assistive_devices?: string[]
  care_grade?: string
  housing_type?: string
  other_services?: string
  other_service_org?: string
  requested_services?: string
  service_eligible?: boolean
  ineligible_reason?: string
  service_reason?: string
  service_content?: string
  referrer_name?: string
  referrer_relation?: string
  referrer_phone?: string
  referral_route?: string
  note?: string
}

interface Props {
  client: Client
  interview: Interview | null
  onPrint?: () => void
}

function calcAge(birthDate?: string) {
  if (!birthDate) return '-'
  const b = new Date(birthDate)
  const age = new Date().getFullYear() - b.getFullYear()
  return `${age}세`
}

export function InitialInterviewForm({ client, interview, onPrint }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [interviewedAt, setInterviewedAt] = useState(interview?.interviewed_at ?? new Date().toISOString().split('T')[0])
  const [economicStatus, setEconomicStatus] = useState(interview?.economic_status ?? '')
  const [chronicDiseases, setChronicDiseases] = useState<string[]>(interview?.chronic_diseases ?? [])
  const [disability, setDisability] = useState(interview?.disability ?? false)
  const [disabilityType, setDisabilityType] = useState(interview?.disability_type ?? '')
  const [assistiveDevices, setAssistiveDevices] = useState<string[]>(interview?.assistive_devices ?? [])
  const [careGrade, setCareGrade] = useState(interview?.care_grade ?? '')
  const [housingType, setHousingType] = useState(interview?.housing_type ?? '')
  const [otherServices, setOtherServices] = useState(interview?.other_services ?? '')
  const [otherServiceOrg, setOtherServiceOrg] = useState(interview?.other_service_org ?? '')
  const [requestedServices, setRequestedServices] = useState(interview?.requested_services ??
    '집단활동 프로그램, 기타 지역자원연계 서비스, 후원물품 전달 서비스, 혹한기 지원,\n주거환경개선사업, 혹서기 지원, 영양관리, 전화(안부, 안전확인, 말벗서비스),\n방문(안부, 안전확인, 말벗서비스), 행정대행지원서비스...')
  const [serviceEligible, setServiceEligible] = useState(interview?.service_eligible ?? true)
  const [ineligibleReason, setIneligibleReason] = useState(interview?.ineligible_reason ?? '')
  const [serviceReason, setServiceReason] = useState(interview?.service_reason ?? '자조능력 없음')
  const [serviceContent, setServiceContent] = useState(interview?.service_content ?? '')
  const [referrerName, setReferrerName] = useState(interview?.referrer_name ?? '')
  const [referrerRelation, setReferrerRelation] = useState(interview?.referrer_relation ?? '사회복지사')
  const [referrerPhone, setReferrerPhone] = useState(interview?.referrer_phone ?? '')
  const [referralRoute, setReferralRoute] = useState(interview?.referral_route ?? '복지기관')
  const [note, setNote] = useState(interview?.note ?? '기관에서 발굴')

  function toggleArr<T>(arr: T[], val: T, set: (a: T[]) => void) {
    set(arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val])
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await upsertInitialInterview(client.id, {
          interviewed_at: interviewedAt,
          economic_status: economicStatus,
          chronic_diseases: chronicDiseases,
          disability,
          disability_type: disabilityType,
          assistive_devices: assistiveDevices,
          care_grade: careGrade,
          housing_type: housingType,
          other_services: otherServices,
          other_service_org: otherServiceOrg,
          requested_services: requestedServices,
          service_eligible: serviceEligible,
          ineligible_reason: ineligibleReason,
          service_reason: serviceReason,
          service_content: serviceContent,
          referrer_name: referrerName,
          referrer_relation: referrerRelation,
          referrer_phone: referrerPhone,
          referral_route: referralRoute,
          note,
        })
        toast('저장되었습니다')
      } catch (err) {
        toast((err as Error).message, 'destructive')
      }
    })
  }

  return (
    <div>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-gray-50 py-3 z-10">
        <h1 className="text-xl font-bold">초기상담기록지</h1>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => router.push(`/clients/${client.id}`)}>리스트</Button>
          <Button variant="outline" onClick={onPrint}>출력(PDF)</Button>
          <Button onClick={handleSave} disabled={isPending}>{isPending ? '저장중...' : '저장'}</Button>
        </div>
      </div>

      {/* 1. 기본사항 */}
      <div className="bg-white rounded-lg border p-5 mb-4">
        <h2 className="font-semibold text-gray-500 text-sm mb-3 uppercase">1. 기본사항</h2>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div><span className="text-gray-500">성명</span><span className="ml-2 font-medium">{client.name}</span></div>
          <div><span className="text-gray-500">성별</span><span className="ml-2">{client.gender ?? '-'}</span></div>
          <div><span className="text-gray-500">연령</span><span className="ml-2">{calcAge(client.birth_date)}</span></div>
          <div><span className="text-gray-500">현주소</span><span className="ml-2">{client.address ?? '-'}</span></div>
          <div><span className="text-gray-500">연락처</span><span className="ml-2">{client.phone_mobile ?? client.phone_home ?? '-'}</span></div>
        </div>
      </div>

      {/* 3. 생활상태 */}
      <div className="bg-white rounded-lg border p-5 mb-4">
        <h2 className="font-semibold text-gray-500 text-sm mb-3 uppercase">3. 생활상태</h2>
        <div className="mb-3">
          <Label className="mb-2 block">1) 경제상황</Label>
          <div className="flex flex-wrap gap-4">
            {ECONOMIC_STATUSES.map((s) => (
              <label key={s} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" checked={economicStatus === s} onChange={() => setEconomicStatus(s)} />
                {s}
              </label>
            ))}
          </div>
        </div>
        <div>
          <Label className="mb-2 block">2) 주거형태</Label>
          <div className="flex flex-wrap gap-4">
            {HOUSING_TYPES.map((h) => (
              <label key={h} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" checked={housingType === h} onChange={() => setHousingType(h)} />
                {h}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 4. 신체상태 */}
      <div className="bg-white rounded-lg border p-5 mb-4">
        <h2 className="font-semibold text-gray-500 text-sm mb-3 uppercase">4. 신체상태</h2>

        <div className="mb-4">
          <Label className="mb-2 block">2) 만성질환</Label>
          <div className="grid grid-cols-5 gap-2">
            {CHRONIC_DISEASES.map((d) => (
              <label key={d} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="checkbox" checked={chronicDiseases.includes(d)} onChange={() => toggleArr(chronicDiseases, d, setChronicDiseases)} />
                {d}
              </label>
            ))}
          </div>
        </div>

        <div className="mb-4">
          <Label className="mb-2 block">3) 장애여부</Label>
          <div className="flex gap-4">
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <input type="radio" checked={disability} onChange={() => setDisability(true)} /> 유
            </label>
            <label className="flex items-center gap-1 text-sm cursor-pointer">
              <input type="radio" checked={!disability} onChange={() => setDisability(false)} /> 무
            </label>
            {disability && (
              <Input className="h-7 w-32" placeholder="장애유형" value={disabilityType} onChange={(e) => setDisabilityType(e.target.value)} />
            )}
          </div>
        </div>

        <div className="mb-4">
          <Label className="mb-2 block">4) 보장구</Label>
          <div className="flex flex-wrap gap-4">
            {ASSISTIVE_DEVICES.map((d) => (
              <label key={d} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="checkbox" checked={assistiveDevices.includes(d)} onChange={() => toggleArr(assistiveDevices, d, setAssistiveDevices)} />
                {d}
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="mb-2 block">5) 장기요양등급</Label>
          <div className="flex flex-wrap gap-3">
            {CARE_GRADES.map((g) => (
              <label key={g} className="flex items-center gap-1 text-sm cursor-pointer">
                <input type="radio" checked={careGrade === g} onChange={() => setCareGrade(g)} />
                {g}
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* 5. 타 서비스 */}
      <div className="bg-white rounded-lg border p-5 mb-4">
        <h2 className="font-semibold text-gray-500 text-sm mb-3 uppercase">5. 타 서비스 이용 현황</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>서비스명</Label>
            <Input value={otherServices} onChange={(e) => setOtherServices(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>이용기관</Label>
            <Input value={otherServiceOrg} onChange={(e) => setOtherServiceOrg(e.target.value)} className="mt-1" />
          </div>
        </div>
      </div>

      {/* 6. 신청서비스 */}
      <div className="bg-white rounded-lg border p-5 mb-4">
        <h2 className="font-semibold text-gray-500 text-sm mb-3 uppercase">6. 신청서비스</h2>
        <textarea
          rows={4}
          className="w-full border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          value={requestedServices}
          onChange={(e) => setRequestedServices(e.target.value)}
        />
      </div>

      {/* 7. 서비스 제공여부 */}
      <div className="bg-white rounded-lg border p-5 mb-4">
        <h2 className="font-semibold text-gray-500 text-sm mb-3 uppercase">7. 서비스 제공여부</h2>
        <div className="flex gap-4 mb-3">
          <label className="flex items-center gap-1 text-sm cursor-pointer">
            <input type="radio" checked={serviceEligible} onChange={() => setServiceEligible(true)} /> 적격
          </label>
          <label className="flex items-center gap-1 text-sm cursor-pointer">
            <input type="radio" checked={!serviceEligible} onChange={() => setServiceEligible(false)} /> 부적격
          </label>
          {!serviceEligible && (
            <Input className="h-7 flex-1" placeholder="부적격 사유" value={ineligibleReason} onChange={(e) => setIneligibleReason(e.target.value)} />
          )}
        </div>
        <div className="mb-3">
          <Label className="mb-2 block">서비스 사유</Label>
          {['자조능력 없음', '부양자의 부양능력 약화', '긴급지원', '기타'].map((r) => (
            <label key={r} className="flex items-center gap-1 text-sm mr-4 cursor-pointer inline-flex">
              <input type="radio" checked={serviceReason === r} onChange={() => setServiceReason(r)} />
              {r}
            </label>
          ))}
        </div>
        <div>
          <Label>제공 서비스 내용</Label>
          <textarea
            rows={3}
            className="w-full border rounded-md px-3 py-2 text-sm mt-1 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            value={serviceContent}
            onChange={(e) => setServiceContent(e.target.value)}
          />
        </div>
      </div>

      {/* 8. 의뢰인 */}
      <div className="bg-white rounded-lg border p-5 mb-4">
        <h2 className="font-semibold text-gray-500 text-sm mb-3 uppercase">8. 의뢰인</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>성명</Label>
            <Input value={referrerName} onChange={(e) => setReferrerName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>관계</Label>
            <Input value={referrerRelation} onChange={(e) => setReferrerRelation(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>전화번호</Label>
            <Input value={referrerPhone} onChange={(e) => setReferrerPhone(e.target.value)} className="mt-1" />
          </div>
          <div>
            <Label>의뢰경로</Label>
            <Input value={referralRoute} onChange={(e) => setReferralRoute(e.target.value)} className="mt-1" />
          </div>
        </div>
      </div>

      {/* 9. 비고 */}
      <div className="bg-white rounded-lg border p-5 mb-4">
        <h2 className="font-semibold text-gray-500 text-sm mb-3 uppercase">9. 비고</h2>
        <textarea
          rows={3}
          className="w-full border rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex items-center gap-4 mt-3">
          <Label>면접일</Label>
          <Input type="date" value={interviewedAt} onChange={(e) => setInterviewedAt(e.target.value)} className="w-36" />
        </div>
      </div>
    </div>
  )
}
