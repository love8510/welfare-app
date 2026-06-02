'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckboxGroup } from './shared/CheckboxGroup'
import { RadioGroup } from './shared/RadioGroup'
import { upsertInitialInterviewForCase, getInitialInterviewByCase, getBlankFormData } from '@/lib/actions/cases'
import { toast } from '@/lib/hooks/use-toast'
import dynamic from 'next/dynamic'

const InitialInterviewPDF = dynamic(() => import('./pdf/InitialInterviewPDF'), { ssr: false })

const DEFAULT_SERVICES = `집단활동 프로그램, 지역자원연계 서비스, 후원물품 전달 서비스, 혹한기 지원, 주거환경개선사업, 혹서기 지원, 영양관리, 전화(안부·안전확인·말벗서비스), 방문(안부·안전확인·말벗서비스), 행정대행지원서비스, 차량지원서비스, 전화상담, 방문상담, 대상자 건강 및 생활교육, 생신 서비스, 명절 서비스, 어버이날 서비스, 여가활동지원서비스, 지역자원 활용 사회참여 기회 확대 및 연계, 자연재해 및 기타응급상황 등에 대한 보호`

const CHRONIC_OPTIONS = ['고혈압','당뇨','골다공증','심장질환','뇌졸중','신장질환','암','백내장','녹내장','치매','디스크','관절염','피부병','대장/항문']
const ASSISTIVE_OPTIONS = ['사용안함','휠체어','지팡이','목발','보청기','틀니','돋보기']
const CARE_GRADES = ['1등급','2등급','3등급','4등급','5등급','인지지원등급','등급외A,B','없음']
const ECONOMIC_OPTIONS = ['국민기초생활수급권자','차상위','국가유공자','일반']
const HOUSEHOLD_OPTIONS = ['독거','부부','아들가족','딸가족','친척동거','조손']
const HOUSING_OPTIONS = ['자가','전세','월세','임대','무료임대/의탁거주','무허가']
const HEALTH_OPTIONS = ['건강하다','질환은 있지만 건강한 편이다','특별한 질환은 없지만 노환으로 건강하지 못하다','질환으로 건강이 나쁘다']

interface FamilyMember {
  relation: string; name: string; address: string; age: string
  job: string; cohabit: boolean; monthly_income: string; note: string
}

interface Client {
  id: string; name: string; gender?: string; birth_date?: string
  id_number?: string; address?: string; phone_home?: string; phone_mobile?: string
}

interface Props {
  caseId: string
  client: Client
  workerName?: string
}

export function InitialInterviewForm({ caseId, client, workerName }: Props) {
  const [saving, setSaving] = useState(false)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [economicStatus, setEconomicStatus] = useState('')
  const [householdType, setHouseholdType] = useState('')
  const [housingType, setHousingType] = useState('')
  const [housingDeposit, setHousingDeposit] = useState('')
  const [housingRent, setHousingRent] = useState('')
  const [healthOverall, setHealthOverall] = useState('')
  const [chronicDiseases, setChronicDiseases] = useState<string[]>([])
  const [chronicOther, setChronicOther] = useState('')
  const [disability, setDisability] = useState(false)
  const [disabilityType, setDisabilityType] = useState('')
  const [disabilityGrade, setDisabilityGrade] = useState('')
  const [assistiveDevices, setAssistiveDevices] = useState<string[]>([])
  const [careGrade, setCareGrade] = useState('')
  const [otherServices, setOtherServices] = useState('')
  const [appliedServices, setAppliedServices] = useState(DEFAULT_SERVICES)
  const [serviceEligible, setServiceEligible] = useState(true)
  const [ineligibleReason, setIneligibleReason] = useState('')
  const [serviceReason, setServiceReason] = useState('자조능력 없음')
  const [serviceContent, setServiceContent] = useState(DEFAULT_SERVICES)
  const [referrerName, setReferrerName] = useState('')
  const [referrerRelation, setReferrerRelation] = useState('사회복지사')
  const [referrerPhone, setReferrerPhone] = useState('')
  const [referralRoute, setReferralRoute] = useState('복지기관')
  const [note, setNote] = useState('기관에서 발굴')
  const [interviewDate, setInterviewDate] = useState(new Date().toISOString().split('T')[0])
  const [orgData, setOrgData] = useState<Record<string, unknown> | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [existing, org] = await Promise.all([
          getInitialInterviewByCase(caseId),
          getBlankFormData(),
        ])
        setOrgData(org as Record<string, unknown> | null)
        if (existing) {
          const d = existing as Record<string, unknown>
          setFamilyMembers((d.family_members as FamilyMember[]) ?? [])
          setEconomicStatus((d.economic_status as string) ?? '')
          setHouseholdType((d.household_type as string) ?? '')
          setHousingType((d.housing_type as string) ?? '')
          setChronicDiseases((d.chronic_diseases as string[]) ?? [])
          setDisability(!!(d.disability))
          setDisabilityType((d.disability_type as string) ?? '')
          setDisabilityGrade((d.disability_grade as string) ?? '')
          setAssistiveDevices((d.assistive_devices as string[]) ?? [])
          setCareGrade((d.care_grade as string) ?? '')
          setOtherServices((d.other_services as string) ?? '')
          setAppliedServices((d.applied_services as string) ?? DEFAULT_SERVICES)
          setServiceEligible(d.service_eligible !== false)
          setIneligibleReason((d.service_ineligible_reason as string) ?? '')
          setServiceReason((d.service_reason as string) ?? '자조능력 없음')
          setServiceContent((d.service_content as string) ?? DEFAULT_SERVICES)
          setReferrerName((d.referrer_name as string) ?? '')
          setReferrerRelation((d.referrer_relation as string) ?? '사회복지사')
          setReferrerPhone((d.referrer_phone as string) ?? '')
          setReferralRoute((d.referral_route as string) ?? '복지기관')
          setNote((d.note as string) ?? '기관에서 발굴')
          setInterviewDate((d.interview_date as string) ?? new Date().toISOString().split('T')[0])
        }
      } catch {}
    }
    load()
  }, [caseId])

  const addFamilyMember = () => setFamilyMembers((p) => [...p, { relation:'',name:'',address:'',age:'',job:'',cohabit:false,monthly_income:'',note:'' }])
  const removeFamilyMember = (i: number) => setFamilyMembers((p) => p.filter((_, idx) => idx !== i))
  const updateFamilyMember = (i: number, key: keyof FamilyMember, value: string | boolean) => {
    setFamilyMembers((p) => p.map((m, idx) => idx === i ? { ...m, [key]: value } : m))
  }

  async function handleSave() {
    setSaving(true)
    try {
      await upsertInitialInterviewForCase(caseId, client.id, {
        family_members: familyMembers,
        economic_status: economicStatus,
        household_type: householdType,
        housing_type: housingType,
        housing_deposit: housingDeposit,
        housing_rent: housingRent,
        health_overall: healthOverall,
        chronic_diseases: chronicOther ? [...chronicDiseases, chronicOther] : chronicDiseases,
        disability,
        disability_type: disabilityType,
        disability_grade: disabilityGrade,
        assistive_devices: assistiveDevices,
        care_grade: careGrade,
        other_services: otherServices,
        applied_services: appliedServices,
        service_eligible: serviceEligible,
        service_ineligible_reason: ineligibleReason,
        service_reason: serviceReason,
        service_content: serviceContent,
        referrer_name: referrerName,
        referrer_relation: referrerRelation,
        referrer_phone: referrerPhone,
        referral_route: referralRoute,
        note,
        interview_date: interviewDate,
        interviewer: workerName ?? '',
      })
      toast('저장되었습니다')
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setSaving(false)
    }
  }

  const pdfData = {
    client_name: client.name,
    gender: client.gender,
    age: client.birth_date ? `${new Date().getFullYear() - new Date(client.birth_date).getFullYear()}세` : '',
    id_number: client.id_number,
    address: client.address,
    phone_home: client.phone_home,
    phone_mobile: client.phone_mobile,
    family_members: familyMembers,
    economic_status: economicStatus,
    household_type: householdType,
    housing_type: housingType,
    housing_deposit: housingDeposit,
    housing_rent: housingRent,
    health_overall: healthOverall,
    chronic_diseases: chronicOther ? [...chronicDiseases, chronicOther] : chronicDiseases,
    disability,
    disability_type: disabilityType,
    disability_grade: disabilityGrade,
    assistive_devices: assistiveDevices,
    care_grade: careGrade,
    other_services: otherServices,
    applied_services: appliedServices,
    service_eligible: serviceEligible,
    service_ineligible_reason: ineligibleReason,
    service_reason: serviceReason,
    service_content: serviceContent,
    referrer_name: referrerName,
    referrer_relation: referrerRelation,
    referrer_phone: referrerPhone,
    referral_route: referralRoute,
    note,
    interview_date: interviewDate,
    interviewer: workerName ?? '',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">초기 면 접 지</h2>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : '저장'}</Button>
          <InitialInterviewPDF data={pdfData} org={orgData ?? {}} clientName={client.name} />
        </div>
      </div>

      {/* 1. 기본사항 */}
      <section>
        <h3 className="text-sm font-bold bg-gray-50 px-3 py-1.5 border rounded mb-2">1. 기본사항</h3>
        <div className="grid grid-cols-3 gap-3 text-sm bg-gray-50 p-3 rounded border">
          <div><span className="font-medium">성명:</span> {client.name}</div>
          <div><span className="font-medium">성별:</span> {client.gender ?? '-'}</div>
          <div><span className="font-medium">연령:</span> {client.birth_date ? `${new Date().getFullYear() - new Date(client.birth_date).getFullYear()}세` : '-'}</div>
          <div><span className="font-medium">현주소:</span> {client.address ?? '-'}</div>
          <div><span className="font-medium">자택:</span> {client.phone_home ?? '-'}</div>
          <div><span className="font-medium">핸드폰:</span> {client.phone_mobile ?? '-'}</div>
        </div>
      </section>

      {/* 2. 가족사항 */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold bg-gray-50 px-3 py-1.5 border rounded">2. 가족사항</h3>
          <Button variant="outline" size="sm" onClick={addFamilyMember}>+ 추가</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead>
              <tr className="bg-gray-50">
                {['관계','성명','주소','연령','직업','동거','월소득','비고','삭제'].map((h) => (
                  <th key={h} className="px-2 py-1.5 text-center text-xs font-semibold border-b border-r">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {familyMembers.map((m, i) => (
                <tr key={i} className="border-b">
                  {(['relation','name','address','age','job'] as const).map((k) => (
                    <td key={k} className="border-r p-1">
                      <Input className="h-7 text-xs" value={m[k]} onChange={(e) => updateFamilyMember(i, k, e.target.value)} />
                    </td>
                  ))}
                  <td className="border-r p-1 text-center">
                    <input type="checkbox" checked={m.cohabit} onChange={(e) => updateFamilyMember(i, 'cohabit', e.target.checked)} />
                  </td>
                  <td className="border-r p-1">
                    <Input className="h-7 text-xs" value={m.monthly_income} onChange={(e) => updateFamilyMember(i, 'monthly_income', e.target.value)} />
                  </td>
                  <td className="border-r p-1">
                    <Input className="h-7 text-xs" value={m.note} onChange={(e) => updateFamilyMember(i, 'note', e.target.value)} />
                  </td>
                  <td className="p-1 text-center">
                    <button className="text-red-500 text-xs" onClick={() => removeFamilyMember(i)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 3. 생활상태 */}
      <section>
        <h3 className="text-sm font-bold bg-gray-50 px-3 py-1.5 border rounded mb-2">3. 생활상태</h3>
        <div className="space-y-3 p-3 border rounded">
          <div>
            <div className="text-xs font-semibold mb-1">1) 경제상황</div>
            <RadioGroup options={ECONOMIC_OPTIONS} value={economicStatus} onChange={setEconomicStatus} name="economic" otherKey="기타" />
          </div>
          <div>
            <div className="text-xs font-semibold mb-1">2) 세대유형</div>
            <RadioGroup options={HOUSEHOLD_OPTIONS} value={householdType} onChange={setHouseholdType} name="household" otherKey="기타" />
          </div>
          <div>
            <div className="text-xs font-semibold mb-1">3) 주거형태</div>
            <div className="flex flex-wrap items-center gap-3">
              <RadioGroup options={HOUSING_OPTIONS} value={housingType} onChange={setHousingType} name="housing" otherKey="기타" />
              {housingType === '전세' && (
                <span className="text-xs text-gray-500">
                  보증금 <Input className="inline-block h-6 w-20 text-xs" value={housingDeposit} onChange={(e) => setHousingDeposit(e.target.value)} placeholder="만원" /> /
                  월세 <Input className="inline-block h-6 w-20 text-xs" value={housingRent} onChange={(e) => setHousingRent(e.target.value)} placeholder="만원" />
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 4. 신체상태 */}
      <section>
        <h3 className="text-sm font-bold bg-gray-50 px-3 py-1.5 border rounded mb-2">4. 신체상태</h3>
        <div className="space-y-3 p-3 border rounded">
          <div>
            <div className="text-xs font-semibold mb-1">1) 건강상태</div>
            <RadioGroup options={HEALTH_OPTIONS} value={healthOverall} onChange={setHealthOverall} name="health" />
          </div>
          <div>
            <div className="text-xs font-semibold mb-1">2) 만성질환</div>
            <CheckboxGroup options={CHRONIC_OPTIONS} value={chronicDiseases} onChange={setChronicDiseases} columns={4} otherKey="기타" otherValue={chronicOther} onOtherChange={setChronicOther} />
          </div>
          <div>
            <div className="text-xs font-semibold mb-1">3) 장애여부</div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" checked={disability} onChange={() => setDisability(true)} /> 유
              </label>
              {disability && (
                <>
                  <Input className="h-7 w-24 text-xs" value={disabilityType} onChange={(e) => setDisabilityType(e.target.value)} placeholder="장애유형" />
                  <Input className="h-7 w-16 text-xs" value={disabilityGrade} onChange={(e) => setDisabilityGrade(e.target.value)} placeholder="등급" />
                </>
              )}
              <label className="flex items-center gap-1 text-sm">
                <input type="radio" checked={!disability} onChange={() => setDisability(false)} /> 무
              </label>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold mb-1">4) 보장구</div>
            <CheckboxGroup options={ASSISTIVE_OPTIONS} value={assistiveDevices} onChange={setAssistiveDevices} columns={4} otherKey="기타" />
          </div>
          <div>
            <div className="text-xs font-semibold mb-1">5) 장기요양등급</div>
            <RadioGroup options={CARE_GRADES} value={careGrade} onChange={setCareGrade} name="careGrade" />
          </div>
        </div>
      </section>

      {/* 5. 타 서비스 */}
      <section>
        <h3 className="text-sm font-bold bg-gray-50 px-3 py-1.5 border rounded mb-2">5. 타 서비스 이용 현황</h3>
        <textarea
          className="w-full border rounded p-2 text-sm"
          rows={2}
          value={otherServices}
          onChange={(e) => setOtherServices(e.target.value)}
          placeholder="서비스명 / 이용기관"
        />
      </section>

      {/* 6. 신청서비스 */}
      <section>
        <h3 className="text-sm font-bold bg-gray-50 px-3 py-1.5 border rounded mb-2">6. 신청서비스</h3>
        <textarea
          className="w-full border rounded p-2 text-sm"
          rows={4}
          value={appliedServices}
          onChange={(e) => setAppliedServices(e.target.value)}
        />
      </section>

      {/* 7. 서비스 제공여부 */}
      <section>
        <h3 className="text-sm font-bold bg-gray-50 px-3 py-1.5 border rounded mb-2">7. 서비스 제공여부</h3>
        <div className="space-y-2 p-3 border rounded">
          <div className="flex gap-4">
            <label className="flex items-center gap-1 text-sm"><input type="radio" checked={serviceEligible} onChange={() => setServiceEligible(true)} /> 적격</label>
            <label className="flex items-center gap-1 text-sm"><input type="radio" checked={!serviceEligible} onChange={() => setServiceEligible(false)} /> 부적격</label>
          </div>
          {!serviceEligible && (
            <div>
              <div className="text-xs text-gray-600 mb-1">부적격 사유</div>
              <Input className="h-8" value={ineligibleReason} onChange={(e) => setIneligibleReason(e.target.value)} />
            </div>
          )}
          <div>
            <div className="text-xs text-gray-600 mb-1">서비스 사유</div>
            <RadioGroup options={['자조능력 없음','부양자의 부양능력 약화','긴급지원']} value={serviceReason} onChange={setServiceReason} name="serviceReason" otherKey="기타" />
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">제공 서비스 내용</div>
            <textarea className="w-full border rounded p-2 text-sm" rows={4} value={serviceContent} onChange={(e) => setServiceContent(e.target.value)} />
          </div>
        </div>
      </section>

      {/* 8. 의뢰인 */}
      <section>
        <h3 className="text-sm font-bold bg-gray-50 px-3 py-1.5 border rounded mb-2">8. 의뢰인</h3>
        <div className="grid grid-cols-4 gap-2 p-3 border rounded">
          <div>
            <div className="text-xs text-gray-600 mb-1">성명</div>
            <Input className="h-8" value={referrerName} onChange={(e) => setReferrerName(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">대상자와의 관계</div>
            <select className="w-full h-8 border rounded px-2 text-sm" value={referrerRelation} onChange={(e) => setReferrerRelation(e.target.value)}>
              {['사회복지사','가족','본인','이웃','기타'].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">전화번호</div>
            <Input className="h-8" value={referrerPhone} onChange={(e) => setReferrerPhone(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">의뢰경로</div>
            <select className="w-full h-8 border rounded px-2 text-sm" value={referralRoute} onChange={(e) => setReferralRoute(e.target.value)}>
              {['복지기관','본인','가족','기타'].map((v) => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* 9. 비고 */}
      <section>
        <h3 className="text-sm font-bold bg-gray-50 px-3 py-1.5 border rounded mb-2">9. 비고</h3>
        <textarea className="w-full border rounded p-2 text-sm" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </section>

      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span>면접일:</span>
          <Input type="date" className="h-8 w-36" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} />
        </div>
        <div><span>면접자: </span><span className="font-medium">{workerName ?? ''}</span></div>
      </div>
    </div>
  )
}
