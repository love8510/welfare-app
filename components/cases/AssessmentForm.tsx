'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CheckboxGroup } from './shared/CheckboxGroup'
import { RadioGroup } from './shared/RadioGroup'
import { upsertAssessment, getAssessment, getBlankFormData } from '@/lib/actions/cases'
import { toast } from '@/lib/hooks/use-toast'
import dynamic from 'next/dynamic'

const AssessmentPDF = dynamic(() => import('./pdf/AssessmentPDF'), { ssr: false })

const CHRONIC_OPTIONS = ['고혈압','당뇨','골다공증','심장질환','뇌졸중','신장질환','암','백내장','녹내장','치매','디스크','관절염','피부병','대장/항문']
const ASSISTIVE_OPTIONS = ['사용안함','휠체어','지팡이','목발','보청기','틀니','돋보기']
const HEALTH_OPTIONS = ['건강하다','질환은 있지만 건강한 편이다','특별한 질환은 없지만 노환으로 건강하지 못하다','질환으로 건강이 나쁘다']
const ADL_ITEMS = ['식사하기','옷입기','세면·목욕','화장실이용','이동하기','대소변조절']
const IADL_ITEMS = ['장보기','식사준비','가사일','빨래','교통수단이용','전화사용','약복용관리','금전관리']
const NEEDS_DOMAINS = ['신체건강','정신건강','사회관계','경제','주거','가족관계','법률','기타']
const ECONOMIC_OPTIONS = ['국민기초생활수급권자','차상위','국가유공자','일반']
const HOUSING_OWNERSHIP = ['자가','전세','임대','무료임대/의탁거주','무허가']
const HOUSING_FORM = ['단독','아파트','빌라/연립','다세대']

interface Client {
  id: string; name: string; gender?: string; birth_date?: string
  id_number?: string; address?: string; phone_home?: string; phone_mobile?: string
}

interface Props {
  caseId: string
  client: Client
  workerName?: string
}

export function AssessmentForm({ caseId, client, workerName }: Props) {
  const [saving, setSaving] = useState(false)
  const [assessedAt, setAssessedAt] = useState(new Date().toISOString().split('T')[0])
  const [economicStatus, setEconomicStatus] = useState('')
  const [incomeDetails, setIncomeDetails] = useState<Record<string, number>>({})
  const [monthlyIncome, setMonthlyIncome] = useState(0)
  const [housingType, setHousingType] = useState('')
  const [houseForm, setHouseForm] = useState('')
  const [houseFloor, setHouseFloor] = useState('')
  const [elevator, setElevator] = useState(false)
  const [housingCondition, setHousingCondition] = useState('')
  const [sanitation, setSanitation] = useState('')
  const [heatingType, setHeatingType] = useState('')
  const [kitchenType, setKitchenType] = useState('')
  const [healthOverall, setHealthOverall] = useState('')
  const [chronicDiseases, setChronicDiseases] = useState<string[]>([])
  const [disability, setDisability] = useState(false)
  const [disabilityType, setDisabilityType] = useState('')
  const [assistiveDevices, setAssistiveDevices] = useState<string[]>([])
  const [adlItems, setAdlItems] = useState<Record<string, string>>({})
  const [iadlItems, setIadlItems] = useState<Record<string, string>>({})
  const [needsAssessment, setNeedsAssessment] = useState<Record<string, { level: string; content: string }>>({})
  const [strengths, setStrengths] = useState('')
  const [availableResources, setAvailableResources] = useState('')
  const [overallOpinion, setOverallOpinion] = useState('')
  const [priorityNeeds, setPriorityNeeds] = useState('')
  const [recommendedServices, setRecommendedServices] = useState('')
  const [orgData, setOrgData] = useState<Record<string, unknown> | null>(null)

  const calcMonthly = (d: Record<string, number>) => Object.values(d).reduce((s, v) => s + (Number(v) || 0), 0)

  useEffect(() => {
    async function load() {
      try {
        const [existing, org] = await Promise.all([getAssessment(caseId), getBlankFormData()])
        setOrgData(org as Record<string, unknown> | null)
        if (existing) {
          const d = existing as Record<string, unknown>
          setAssessedAt((d.assessed_at as string) ?? new Date().toISOString().split('T')[0])
          setEconomicStatus((d.economic_status as string) ?? '')
          setIncomeDetails((d.income_details as Record<string, number>) ?? {})
          setMonthlyIncome((d.monthly_income as number) ?? 0)
          setHousingType((d.housing_type as string) ?? '')
          setHouseForm((d.house_form as string) ?? '')
          setHouseFloor((d.house_floor as string) ?? '')
          setElevator(!!(d.elevator))
          setHousingCondition((d.housing_condition as string) ?? '')
          setSanitation((d.sanitation as string) ?? '')
          setHeatingType((d.heating_type as string) ?? '')
          setKitchenType((d.kitchen_type as string) ?? '')
          setHealthOverall((d.health_overall as string) ?? '')
          setChronicDiseases((d.chronic_diseases as string[]) ?? [])
          setDisability(!!(d.disability))
          setDisabilityType((d.disability_type as string) ?? '')
          setAssistiveDevices((d.assistive_devices as string[]) ?? [])
          setAdlItems((d.adl_items as Record<string, string>) ?? {})
          setIadlItems((d.iadl_items as Record<string, string>) ?? {})
          setNeedsAssessment((d.needs_assessment as Record<string, { level: string; content: string }>) ?? {})
          setStrengths((d.strengths as string) ?? '')
          setAvailableResources((d.available_resources as string) ?? '')
          setOverallOpinion((d.overall_opinion as string) ?? '')
          setPriorityNeeds((d.priority_needs as string) ?? '')
          setRecommendedServices((d.recommended_services as string) ?? '')
        }
      } catch {}
    }
    load()
  }, [caseId])

  async function handleSave() {
    setSaving(true)
    try {
      await upsertAssessment(caseId, client.id, {
        assessed_at: assessedAt,
        economic_status: economicStatus,
        income_details: incomeDetails,
        monthly_income: monthlyIncome,
        housing_type: housingType,
        house_form: houseForm,
        house_floor: houseFloor,
        elevator,
        housing_condition: housingCondition,
        sanitation,
        heating_type: heatingType,
        kitchen_type: kitchenType,
        health_overall: healthOverall,
        chronic_diseases: chronicDiseases,
        disability,
        disability_type: disabilityType,
        assistive_devices: assistiveDevices,
        adl_items: adlItems,
        iadl_items: iadlItems,
        needs_assessment: needsAssessment,
        strengths,
        available_resources: availableResources,
        overall_opinion: overallOpinion,
        priority_needs: priorityNeeds,
        recommended_services: recommendedServices,
      })
      toast('저장되었습니다')
    } catch (err) {
      toast((err as Error).message, 'destructive')
    } finally {
      setSaving(false)
    }
  }

  const pdfData = {
    assessed_at: assessedAt, worker_name: workerName,
    client_name: client.name, gender: client.gender,
    age: client.birth_date ? `${new Date().getFullYear() - new Date(client.birth_date).getFullYear()}세` : '',
    id_number: client.id_number, address: client.address,
    phone_home: client.phone_home, phone_mobile: client.phone_mobile,
    economic_status: economicStatus, income_details: incomeDetails, monthly_income: monthlyIncome,
    housing_type: housingType, house_form: houseForm, house_floor: houseFloor,
    elevator, housing_condition: housingCondition, sanitation, heating_type: heatingType, kitchen_type: kitchenType,
    health_overall: healthOverall, chronic_diseases: chronicDiseases,
    disability, disability_type: disabilityType, assistive_devices: assistiveDevices,
    adl_items: adlItems, iadl_items: iadlItems, needs_assessment: needsAssessment,
    strengths, available_resources: availableResources,
    overall_opinion: overallOpinion, priority_needs: priorityNeeds, recommended_services: recommendedServices,
  }

  const INCOME_LABELS: Record<string, string> = {
    national_pension: '국민연금', basic_pension: '기초연금', disability_pension: '장애연금',
    labor_income: '근로소득', property_income: '재산소득', private_transfer: '사적이전', public_transfer: '공적이전', other: '기타',
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">사 정 기 록 지</h2>
        <div className="flex gap-2">
          <Button onClick={handleSave} disabled={saving}>{saving ? '저장 중...' : '저장'}</Button>
          <AssessmentPDF data={pdfData} org={orgData ?? {}} clientName={client.name} />
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span>상담일시:</span>
          <Input type="date" className="h-8 w-36" value={assessedAt} onChange={(e) => setAssessedAt(e.target.value)} />
        </div>
        <div><span>담당자: </span><span className="font-medium">{workerName ?? ''}</span></div>
      </div>

      {/* 1. 대상자 기본정보 */}
      <section>
        <h3 className="text-sm font-bold bg-gray-50 px-3 py-1.5 border rounded mb-2">1. 대상자 기본정보</h3>
        <div className="grid grid-cols-3 gap-3 text-sm bg-gray-50 p-3 rounded border">
          <div><span className="font-medium">성명:</span> {client.name}</div>
          <div><span className="font-medium">성별:</span> {client.gender ?? '-'}</div>
          <div><span className="font-medium">연령:</span> {client.birth_date ? `${new Date().getFullYear() - new Date(client.birth_date).getFullYear()}세` : '-'}</div>
          <div><span className="font-medium">현주소:</span> {client.address ?? '-'}</div>
          <div><span className="font-medium">자택:</span> {client.phone_home ?? '-'}</div>
          <div><span className="font-medium">핸드폰:</span> {client.phone_mobile ?? '-'}</div>
        </div>
      </section>

      {/* 2. 경제상황 */}
      <section>
        <h3 className="text-sm font-bold bg-gray-50 px-3 py-1.5 border rounded mb-2">2. 경제상황</h3>
        <div className="space-y-3 p-3 border rounded">
          <div>
            <div className="text-xs font-semibold mb-1">보호형태</div>
            <RadioGroup options={ECONOMIC_OPTIONS} value={economicStatus} onChange={setEconomicStatus} name="economic" otherKey="기타" />
          </div>
          <div>
            <div className="text-xs font-semibold mb-2">소득상황 상세</div>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(INCOME_LABELS).map(([k, label]) => (
                <div key={k} className="flex items-center gap-1 text-xs">
                  <span className="text-gray-600 whitespace-nowrap">{label}</span>
                  <Input
                    className="h-7 text-xs w-20"
                    type="number"
                    value={incomeDetails[k] ?? ''}
                    onChange={(e) => {
                      const next = { ...incomeDetails, [k]: Number(e.target.value) }
                      setIncomeDetails(next)
                      setMonthlyIncome(calcMonthly(next))
                    }}
                    placeholder="원"
                  />
                </div>
              ))}
            </div>
            <div className="text-sm mt-2 font-semibold text-blue-700">월 총 수입: {monthlyIncome.toLocaleString()}원</div>
          </div>
        </div>
      </section>

      {/* 3. 주거상황 */}
      <section>
        <h3 className="text-sm font-bold bg-gray-50 px-3 py-1.5 border rounded mb-2">3. 주거상황</h3>
        <div className="space-y-3 p-3 border rounded">
          <div>
            <div className="text-xs font-semibold mb-1">주택소유상태</div>
            <RadioGroup options={HOUSING_OWNERSHIP} value={housingType} onChange={setHousingType} name="housing" otherKey="기타" />
          </div>
          <div>
            <div className="text-xs font-semibold mb-1">주택형태</div>
            <RadioGroup options={HOUSING_FORM} value={houseForm} onChange={setHouseForm} name="houseForm" otherKey="기타" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <div className="text-xs text-gray-600 mb-1">층수</div>
              <Input className="h-8" value={houseFloor} onChange={(e) => setHouseFloor(e.target.value)} placeholder="예: 2층" />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">승강기</div>
              <RadioGroup options={['유','무']} value={elevator ? '유' : '무'} onChange={(v) => setElevator(v === '유')} name="elevator" />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">주택상태</div>
              <RadioGroup options={['양호','불량']} value={housingCondition} onChange={setHousingCondition} name="housingCond" />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">위생상태</div>
              <RadioGroup options={['양호','불량']} value={sanitation} onChange={setSanitation} name="sanitation" />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">난방형태</div>
              <Input className="h-8" value={heatingType} onChange={(e) => setHeatingType(e.target.value)} placeholder="예: 가스보일러" />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">화장실형태</div>
              <Input className="h-8" value={kitchenType} onChange={(e) => setKitchenType(e.target.value)} placeholder="예: 단독/서양식" />
            </div>
          </div>
        </div>
      </section>

      {/* 4. 건강상황 */}
      <section>
        <h3 className="text-sm font-bold bg-gray-50 px-3 py-1.5 border rounded mb-2">4. 건강상황</h3>
        <div className="space-y-3 p-3 border rounded">
          <div>
            <div className="text-xs font-semibold mb-1">전체적 건강상태</div>
            <RadioGroup options={HEALTH_OPTIONS} value={healthOverall} onChange={setHealthOverall} name="healthOverall" />
          </div>
          <div>
            <div className="text-xs font-semibold mb-1">만성질환</div>
            <CheckboxGroup options={CHRONIC_OPTIONS} value={chronicDiseases} onChange={setChronicDiseases} columns={4} />
          </div>
          <div>
            <div className="text-xs font-semibold mb-1">장애여부</div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1 text-sm"><input type="radio" checked={disability} onChange={() => setDisability(true)} /> 유</label>
              {disability && <Input className="h-7 w-32 text-xs" value={disabilityType} onChange={(e) => setDisabilityType(e.target.value)} placeholder="장애유형" />}
              <label className="flex items-center gap-1 text-sm"><input type="radio" checked={!disability} onChange={() => setDisability(false)} /> 무</label>
            </div>
          </div>
          <div>
            <div className="text-xs font-semibold mb-1">보장구</div>
            <CheckboxGroup options={ASSISTIVE_OPTIONS} value={assistiveDevices} onChange={setAssistiveDevices} columns={4} />
          </div>
        </div>
      </section>

      {/* 5. ADL */}
      <section>
        <h3 className="text-sm font-bold bg-gray-50 px-3 py-1.5 border rounded mb-2">5. 일상생활능력 (ADL)</h3>
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-50">
              {['항목','독립','부분도움','완전도움'].map((h) => <th key={h} className="px-3 py-1.5 text-center border-b border-r text-xs font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {ADL_ITEMS.map((item) => (
              <tr key={item} className="border-b">
                <td className="px-3 py-1.5 border-r text-sm">{item}</td>
                {['독립','부분도움','완전도움'].map((v) => (
                  <td key={v} className="px-3 py-1.5 border-r text-center">
                    <input type="radio" name={`adl_${item}`} checked={adlItems[item] === v} onChange={() => setAdlItems((p) => ({ ...p, [item]: v }))} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 6. IADL */}
      <section>
        <h3 className="text-sm font-bold bg-gray-50 px-3 py-1.5 border rounded mb-2">6. 수단적 일상생활능력 (IADL)</h3>
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-50">
              {['항목','독립','부분도움','완전도움'].map((h) => <th key={h} className="px-3 py-1.5 text-center border-b border-r text-xs font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {IADL_ITEMS.map((item) => (
              <tr key={item} className="border-b">
                <td className="px-3 py-1.5 border-r text-sm">{item}</td>
                {['독립','부분도움','완전도움'].map((v) => (
                  <td key={v} className="px-3 py-1.5 border-r text-center">
                    <input type="radio" name={`iadl_${item}`} checked={iadlItems[item] === v} onChange={() => setIadlItems((p) => ({ ...p, [item]: v }))} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 7. 욕구 및 문제 영역 */}
      <section>
        <h3 className="text-sm font-bold bg-gray-50 px-3 py-1.5 border rounded mb-2">7. 욕구 및 문제 영역 사정</h3>
        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-50">
              {['영역','욕구수준','세부내용'].map((h) => <th key={h} className="px-3 py-1.5 text-center border-b border-r text-xs font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {NEEDS_DOMAINS.map((domain) => (
              <tr key={domain} className="border-b">
                <td className="px-3 py-1.5 border-r font-medium">{domain}</td>
                <td className="px-2 py-1 border-r">
                  <select
                    className="w-full h-7 border rounded px-1 text-xs"
                    value={needsAssessment[domain]?.level ?? ''}
                    onChange={(e) => setNeedsAssessment((p) => ({ ...p, [domain]: { ...p[domain], level: e.target.value } }))}
                  >
                    <option value="">선택</option>
                    {['높음','보통','낮음'].map((v) => <option key={v} value={v}>{v}</option>)}
                  </select>
                </td>
                <td className="px-2 py-1">
                  <Input
                    className="h-7 text-xs"
                    value={needsAssessment[domain]?.content ?? ''}
                    onChange={(e) => setNeedsAssessment((p) => ({ ...p, [domain]: { ...p[domain], content: e.target.value } }))}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 8. 강점 및 자원 */}
      <section>
        <h3 className="text-sm font-bold bg-gray-50 px-3 py-1.5 border rounded mb-2">8. 강점 및 이용 가능한 자원</h3>
        <div className="space-y-2 p-3 border rounded">
          <div>
            <div className="text-xs text-gray-600 mb-1">강점</div>
            <textarea className="w-full border rounded p-2 text-sm" rows={2} value={strengths} onChange={(e) => setStrengths(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">이용가능 자원</div>
            <textarea className="w-full border rounded p-2 text-sm" rows={2} value={availableResources} onChange={(e) => setAvailableResources(e.target.value)} />
          </div>
        </div>
      </section>

      {/* 9. 종합의견 */}
      <section>
        <h3 className="text-sm font-bold bg-gray-50 px-3 py-1.5 border rounded mb-2">9. 종합의견</h3>
        <div className="space-y-2 p-3 border rounded">
          <div>
            <div className="text-xs text-gray-600 mb-1">종합의견</div>
            <textarea className="w-full border rounded p-2 text-sm" rows={4} value={overallOpinion} onChange={(e) => setOverallOpinion(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">우선순위 욕구</div>
            <textarea className="w-full border rounded p-2 text-sm" rows={2} value={priorityNeeds} onChange={(e) => setPriorityNeeds(e.target.value)} />
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">권고 서비스</div>
            <textarea className="w-full border rounded p-2 text-sm" rows={2} value={recommendedServices} onChange={(e) => setRecommendedServices(e.target.value)} />
          </div>
        </div>
      </section>

      <div className="text-sm text-right">상담일시: {assessedAt}  상담자: {workerName ?? ''}</div>
    </div>
  )
}
