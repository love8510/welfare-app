export const INSURANCE_RATES = {
  nationalPension: { employee: 0.045, employer: 0.045 },
  healthInsurance: { employee: 0.03545, employer: 0.03545 },
  longTermCare: { rate: 0.1295 },
  employmentInsEmployee: 0.009,
} as const

export interface OrgRates {
  industrialInsRate: number   // 산재보험 %  예: 0.793
  employmentDevRate: number   // 고용보험 사업주 %  예: 0.250
  severanceRate: number       // 퇴직적립금 %  예: 8.3333
}

export const DEFAULT_ORG_RATES: OrgRates = {
  industrialInsRate: 0.793,
  employmentDevRate: 0.250,
  severanceRate: 8.3333,
}

export interface SalaryInput {
  baseSalary: number
  positionAllowance: number
  mealAllowance: number
  transportAllowance: number
  overtimePay: number
  holidayPay: number
  bonus: number
  otherPay: number
  otherDeduction: number
}

export interface SalaryCalcResult {
  gross: number
  npEe: number; hiEe: number; ltEe: number; eiEe: number
  it: number; lit: number; totalDed: number; netPay: number
  npEr: number; hiEr: number; ltEr: number; eiEr: number
  iiEr: number; sev: number; totalLaborCost: number
}

export function calculateSalary(input: SalaryInput, rates: OrgRates): SalaryCalcResult {
  const gross = input.baseSalary + input.positionAllowance + input.mealAllowance
    + input.transportAllowance + input.overtimePay + input.holidayPay
    + input.bonus + input.otherPay

  const taxableBase = Math.max(gross - 200000, 0)

  const npEe = Math.round(Math.min(gross, 5900000) * 0.045 / 10) * 10
  const hiEe = Math.round(gross * 0.03545 / 10) * 10
  const ltEe = Math.round(hiEe * 0.1295 / 10) * 10
  const eiEe = Math.round(gross * 0.009 / 10) * 10
  const it   = Math.max(Math.round(taxableBase * 0.03 / 10) * 10, 0)
  const lit  = Math.round(it * 0.1 / 10) * 10
  const totalDed = npEe + hiEe + ltEe + eiEe + it + lit + input.otherDeduction
  const netPay   = gross - totalDed

  const npEr  = npEe
  const hiEr  = hiEe
  const ltEr  = ltEe
  const eiEr  = Math.round(gross * rates.employmentDevRate / 100 / 10) * 10
  const iiEr  = Math.round(gross * rates.industrialInsRate / 100 / 10) * 10
  const sev   = Math.round(gross * rates.severanceRate    / 100 / 10) * 10
  const totalLaborCost = gross + npEr + hiEr + ltEr + eiEr + iiEr + sev

  return { gross, npEe, hiEe, ltEe, eiEe, it, lit, totalDed, netPay, npEr, hiEr, ltEr, eiEr, iiEr, sev, totalLaborCost }
}
