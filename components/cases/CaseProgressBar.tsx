'use client'

const STEPS = [
  { label: '접수', key: 'received' },
  { label: '초기면접', key: 'initial_interview' },
  { label: '사정', key: 'assessment' },
  { label: '선정', key: 'selection' },
  { label: '계획', key: 'plan' },
  { label: '진행', key: 'progress' },
  { label: '평가', key: 'evaluation' },
  { label: '종결', key: 'close' },
]

interface CaseProgressBarProps {
  completedSteps: string[]
  currentStep?: string
}

export function CaseProgressBar({ completedSteps, currentStep }: CaseProgressBarProps) {
  return (
    <div className="flex items-center gap-1 bg-white rounded-lg border p-3 overflow-x-auto">
      {STEPS.map((step, i) => {
        const isDone = completedSteps.includes(step.key)
        const isCurrent = step.key === currentStep
        return (
          <div key={step.key} className="flex items-center gap-1 flex-shrink-0">
            <div className="flex flex-col items-center gap-0.5">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
                  ${isDone ? 'bg-green-500 text-white' : isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}
              >
                {isDone ? '✓' : isCurrent ? '●' : '○'}
              </div>
              <span className={`text-xs ${isDone ? 'text-green-600 font-semibold' : isCurrent ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-4 h-0.5 mb-3 ${isDone ? 'bg-green-400' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
