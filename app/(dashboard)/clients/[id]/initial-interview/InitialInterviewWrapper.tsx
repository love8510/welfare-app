'use client'
import { useState } from 'react'
import { InitialInterviewForm } from '@/components/clients/InitialInterviewForm'
import { InitialInterviewPDFButton } from '@/components/clients/InitialInterviewPDF'

interface Props {
  client: Record<string, unknown>
  interview: Record<string, unknown> | null
  org: Record<string, unknown> | null
}

export function InitialInterviewWrapper({ client, interview, org }: Props) {
  const [showPDF, setShowPDF] = useState(false)

  return (
    <div>
      {showPDF && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center gap-3">
          <span className="text-sm text-blue-700">PDF 다운로드 준비됨</span>
          <InitialInterviewPDFButton
            client={client as { name: string; gender?: string; birth_date?: string; address?: string; phone_mobile?: string }}
            interview={interview ?? {}}
            orgName={(org?.name as string) ?? ''}
            approver1={(org?.approver1 as string) ?? '센터장'}
            approver2={(org?.approver2 as string) ?? '담당'}
          />
          <button className="text-sm text-gray-500 hover:underline" onClick={() => setShowPDF(false)}>닫기</button>
        </div>
      )}
      <InitialInterviewForm
        client={client as { id: string; name: string; gender?: string; birth_date?: string; address?: string; phone_mobile?: string; phone_home?: string }}
        interview={interview as Record<string, unknown> | null}
        onPrint={() => setShowPDF(true)}
      />
    </div>
  )
}
