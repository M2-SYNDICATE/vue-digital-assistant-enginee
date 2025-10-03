import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

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

// Временное хранилище результатов
const results = ref<CheckResult[]>([
  // Пример данных для демонстрации
  {
    id: '1',
    fileName: 'Техническое задание.pdf',
    fileType: 'PDF',
    uploadDate: '2024-01-15T10:30:00Z',
    status: 'compliant',
    violations: [],
    complianceScore: 95,
  },
  {
    id: '2',
    fileName: 'Чертеж детали.dwg',
    fileType: 'DWG',
    uploadDate: '2024-01-14T14:20:00Z',
    status: 'non-compliant',
    violations: [
      {
        gostNumber: 'ГОСТ 2.104-2006',
        section: '4.2.1',
        description: 'Отсутствует основная надпись',
        severity: 'critical',
      },
      {
        gostNumber: 'ГОСТ 2.301-68',
        section: '2.1',
        description: 'Неправильная толщина линий',
        severity: 'warning',
      },
    ],
    complianceScore: 72,
  },
])

export const useCheckStore = defineStore('check', () => {
  return {
    results: computed(() => results.value),
    addResult: (result: CheckResult) => {
      results.value.unshift(result)
    },
    getResult: (id: string) => {
      return results.value.find((r) => r.id === id)
    },
  }
})

// Функции для совместимости с существующим кодом
export const addCheckResult = (result: CheckResult) => {
  results.value.unshift(result)
}

export const getCheckResult = (id: string): CheckResult | undefined => {
  return results.value.find((r) => r.id === id)
}

export type { CheckResult }
