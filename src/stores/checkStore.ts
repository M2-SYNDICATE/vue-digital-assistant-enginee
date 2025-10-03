import { reactive } from 'vue'

export interface CheckResult {
  id: string
  fileName: string
  fileType: string
  uploadDate: string
  status: 'checking' | 'compliant' | 'non-compliant'
  violations: Array<{
    gostNumber: string
    section: string
    description: string
    severity: 'critical' | 'warning' | 'info'
  }>
  complianceScore: number
}

interface CheckStore {
  results: CheckResult[]
  currentResult: CheckResult | null
}

export const checkStore = reactive<CheckStore>({
  results: [],
  currentResult: null,
})

export const addCheckResult = (result: CheckResult) => {
  checkStore.results.unshift(result)
  checkStore.currentResult = result
}

export const getCheckResult = (id: string): CheckResult | undefined => {
  return checkStore.results.find((result) => result.id === id)
}

export const setCurrentResult = (result: CheckResult) => {
  checkStore.currentResult = result
}
