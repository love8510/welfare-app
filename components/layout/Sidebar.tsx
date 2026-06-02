'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const nav = [
  {
    group: '기관관리',
    items: [{ label: '기관조회', href: '/organization' }],
  },
  {
    group: '직원관리',
    items: [
      { label: '초기상담리스트', href: '/organization/staff?tab=initial' },
      { label: '직원등록', href: '/organization/staff/new' },
      { label: '직원조회', href: '/organization/staff' },
      { label: '4대보험가입내역', href: '/organization/staff/insurance' },
      { label: '권한관리', href: '/organization/roles' },
    ],
  },
  {
    group: '기초관리',
    items: [
      { label: '부서관리', href: '/organization/departments' },
      { label: '서비스관리', href: '/services' },
      { label: '사업계획', href: '/organization/business-plan' },
    ],
  },
  {
    group: '직원일괄처리',
    items: [
      { label: '직원 엑셀 일괄등록', href: '/organization/staff/bulk-upload' },
    ],
  },
  {
    group: '대상자관리',
    items: [
      { label: '대상자조회', href: '/clients' },
      { label: '대상자등록', href: '/clients/new' },
      { label: '빈주소 찾기', href: '/clients/empty-address' },
    ],
  },
  {
    group: '계획/진행/실적',
    items: [
      { label: '담당자별 일정등록', href: '/plans' },
      { label: '계획등록 및 수정', href: '/plans/monthly' },
      { label: '실적등록 및 수정', href: '/plans/performance' },
    ],
  },
  {
    group: '사례관리',
    items: [
      { label: '사례대상자 조회', href: '/cases' },
      { label: '신규 사례 등록', href: '/cases/new' },
    ],
  },
  {
    group: '미접촉 모니터링',
    items: [
      { label: '미접촉 대시보드', href: '/monitoring' },
      { label: '알림 발송 이력', href: '/monitoring/alert-history' },
      { label: '알림 설정', href: '/monitoring/settings' },
    ],
  },
  {
    group: '급여관리',
    items: [
      { label: '급여 목록', href: '/salary' },
      { label: '급여 계산', href: '/salary/calculate' },
      { label: '4대보험 가입내역', href: '/salary/insurance' },
    ],
  },
  {
    group: '재무회계',
    items: [
      { label: '세입세출 현황', href: '/finance' },
    ],
  },
  {
    group: '보고서',
    items: [
      { label: '중분류보고서', href: '/reports' },
      { label: '서비스제공집계표', href: '/reports/service-summary' },
      { label: '서비스내역', href: '/reports/service-detail' },
      { label: '허약노인조사표', href: '/reports/elderly-list' },
    ],
  },
  {
    group: '통계',
    items: [
      { label: '월별 통계', href: '/statistics' },
      { label: '서비스별 통계', href: '/statistics/by-service' },
      { label: '담당자별 통계', href: '/statistics/by-worker' },
      { label: '담당자 근무현황표', href: '/statistics/worker-worklog' },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="w-[200px] min-h-full bg-white border-r border-gray-200 py-4">
      {nav.map((section) => (
        <div key={section.group} className="mb-2">
          <div className="px-4 py-1.5 text-xs font-bold text-gray-500 uppercase tracking-wide">
            {section.group}
          </div>
          {section.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block px-6 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors',
                pathname === item.href && 'bg-green-50 text-[#2d7a2d] font-semibold border-r-2 border-[#2d7a2d]'
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </aside>
  )
}
