<template>
  <div class="min-h-screen" :class="isDarkMode ? 'bg-gray-900' : 'bg-gray-50'">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              :class="[
                'text-2xl sm:text-3xl font-bold',
                isDarkMode ? 'text-white' : 'text-gray-900',
              ]"
            >
              Анализ Процесса
            </h1>
            <p :class="['text-sm mt-1 sm:mt-2', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
              Статистика длительности выполнения процессов и итераций
            </p>
          </div>
          <button
            @click="goToHistory"
            :class="[
              'inline-flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]',
              isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ]"
          >
            <History class="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span class="hidden sm:inline">История проверок</span>
            <span class="sm:hidden">История</span>
          </button>
        </div>
      </div>

      <!-- Date Range Filter -->
      <div
        :class="[
          'p-4 sm:p-6 rounded-lg border mb-6 sm:mb-8',
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
        ]"
      >
        <h3 :class="['text-lg font-medium mb-4', isDarkMode ? 'text-white' : 'text-gray-900']">
          Диапазон анализа
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label
              :class="[
                'block text-sm font-medium mb-2',
                isDarkMode ? 'text-gray-300' : 'text-gray-700',
              ]"
            >
              Дата начала
            </label>
            <input
              type="date"
              v-model="dateRange.from"
              :class="[
                'w-full px-3 py-2.5 rounded-lg border transition-colors text-sm',
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
              ]"
            />
          </div>
          <div>
            <label
              :class="[
                'block text-sm font-medium mb-2',
                isDarkMode ? 'text-gray-300' : 'text-gray-700',
              ]"
            >
              Дата окончания
            </label>
            <input
              type="date"
              v-model="dateRange.to"
              :class="[
                'w-full px-3 py-2.5 rounded-lg border transition-colors text-sm',
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
              ]"
            />
          </div>
          <div class="flex items-end">
            <button
              @click="loadAnalysis"
              :disabled="isLoading"
              :class="[
                'w-full px-4 py-2.5 rounded-lg font-medium transition-colors text-sm min-h-[44px]',
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed text-gray-600'
                  : isDarkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700',
              ]"
            >
              {{ isLoading ? 'Загрузка...' : 'Обновить анализ' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center items-center py-12">
        <div class="flex items-center space-x-3">
          <svg class="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span :class="['text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
            Загрузка анализа...
          </span>
        </div>
      </div>

      <!-- Main Content -->
      <div v-else-if="analysisData" class="space-y-6 sm:space-y-8">
        <!-- Summary Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <!-- Average Fix Duration -->
          <div
            :class="[
              'p-4 sm:p-6 rounded-lg border',
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
            ]"
          >
            <div class="flex items-center">
              <div
                :class="[
                  'w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mr-3 sm:mr-4',
                  isDarkMode ? 'bg-green-600' : 'bg-green-100',
                ]"
              >
                <Clock
                  class="w-5 h-5 sm:w-6 sm:h-6"
                  :class="isDarkMode ? 'text-white' : 'text-green-600'"
                />
              </div>
              <div>
                <p
                  :class="[
                    'text-xl sm:text-2xl font-bold',
                    isDarkMode ? 'text-white' : 'text-gray-900',
                  ]"
                >
                  {{ analysisData.average_fix_duration.toFixed(1) }}
                </p>
                <p :class="['text-xs sm:text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
                  Среднее время устранения
                </p>
                <p :class="['text-xs mt-1', isDarkMode ? 'text-gray-500' : 'text-gray-600']">
                  Min: {{ analysisData.min_fix_duration.toFixed(1) }}д · Max:
                  {{ analysisData.max_fix_duration.toFixed(1) }}д
                </p>
              </div>
            </div>
          </div>

          <!-- Average Review Duration -->
          <div
            :class="[
              'p-4 sm:p-6 rounded-lg border',
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
            ]"
          >
            <div class="flex items-center">
              <div
                :class="[
                  'w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mr-3 sm:mr-4',
                  isDarkMode ? 'bg-blue-600' : 'bg-blue-100',
                ]"
              >
                <CheckCircle
                  class="w-5 h-5 sm:w-6 sm:h-6"
                  :class="isDarkMode ? 'text-white' : 'text-blue-600'"
                />
              </div>
              <div>
                <p
                  :class="[
                    'text-xl sm:text-2xl font-bold',
                    isDarkMode ? 'text-white' : 'text-gray-900',
                  ]"
                >
                  {{ analysisData.average_review_duration.toFixed(1) }}
                </p>
                <p :class="['text-xs sm:text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
                  Среднее время проверки
                </p>
                <p :class="['text-xs mt-1', isDarkMode ? 'text-gray-500' : 'text-gray-600']">
                  Min: {{ analysisData.min_review_duration.toFixed(1) }}д · Max:
                  {{ analysisData.max_review_duration.toFixed(1) }}д
                </p>
              </div>
            </div>
          </div>

          <!-- Average Iterations -->
          <div
            :class="[
              'p-4 sm:p-6 rounded-lg border',
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
            ]"
          >
            <div class="flex items-center">
              <div
                :class="[
                  'w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mr-3 sm:mr-4',
                  isDarkMode ? 'bg-purple-600' : 'bg-purple-100',
                ]"
              >
                <RefreshCw
                  class="w-5 h-5 sm:w-6 sm:h-6"
                  :class="isDarkMode ? 'text-white' : 'text-purple-600'"
                />
              </div>
              <div>
                <p
                  :class="[
                    'text-xl sm:text-2xl font-bold',
                    isDarkMode ? 'text-white' : 'text-gray-900',
                  ]"
                >
                  {{ analysisData.average_iterations.toFixed(1) }}
                </p>
                <p :class="['text-xs sm:text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
                  Среднее количество итераций
                </p>
                <p :class="['text-xs mt-1', isDarkMode ? 'text-gray-500' : 'text-gray-600']">
                  Min: {{ analysisData.min_iterations }} · Max: {{ analysisData.max_iterations }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          <!-- Duration Distribution -->
          <div
            :class="[
              'p-4 sm:p-6 rounded-lg border',
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
            ]"
          >
            <h3 :class="['text-lg font-medium mb-4', isDarkMode ? 'text-white' : 'text-gray-900']">
              Распределение длительности процессов
            </h3>
            <div class="space-y-3 sm:space-y-4">
              <div
                v-for="doc in analysisData.documents.slice(0, 8)"
                :key="doc.doc_id"
                class="text-sm"
              >
                <div class="flex justify-between mb-1">
                  <span
                    :class="isDarkMode ? 'text-gray-300' : 'text-gray-700'"
                    class="truncate text-xs sm:text-sm"
                  >
                    {{ doc.filename }}
                  </span>
                  <span :class="isDarkMode ? 'text-gray-400' : 'text-gray-600'">
                    {{ doc.iterations }} итер.
                  </span>
                </div>
                <div class="flex space-x-1 mb-2">
                  <div
                    :class="['h-2 rounded-full', isDarkMode ? 'bg-green-600' : 'bg-green-500']"
                    :style="{
                      width: `${(doc.fix_duration / analysisData.max_fix_duration) * 100}%`,
                    }"
                    :title="`Устранение: ${doc.fix_duration}д`"
                  ></div>
                  <div
                    :class="['h-2 rounded-full', isDarkMode ? 'bg-blue-600' : 'bg-blue-500']"
                    :style="{
                      width: `${(doc.review_duration / analysisData.max_review_duration) * 100}%`,
                    }"
                    :title="`Проверка: ${doc.review_duration}д`"
                  ></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Iterations Analysis -->
          <div
            :class="[
              'p-4 sm:p-6 rounded-lg border',
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
            ]"
          >
            <h3 :class="['text-lg font-medium mb-4', isDarkMode ? 'text-white' : 'text-gray-900']">
              Анализ итераций
            </h3>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-3 sm:gap-4 text-center">
                <div :class="['p-3 sm:p-4 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-100']">
                  <p
                    :class="[
                      'text-xl sm:text-2xl font-bold',
                      isDarkMode ? 'text-white' : 'text-gray-900',
                    ]"
                  >
                    {{ analysisData.total_documents }}
                  </p>
                  <p
                    :class="['text-xs sm:text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']"
                  >
                    Всего документов
                  </p>
                </div>
                <div :class="['p-3 sm:p-4 rounded-lg', isDarkMode ? 'bg-gray-700' : 'bg-gray-100']">
                  <p
                    :class="[
                      'text-xl sm:text-2xl font-bold',
                      isDarkMode ? 'text-white' : 'text-gray-900',
                    ]"
                  >
                    {{ getDocumentsWithMultipleIterations }}
                  </p>
                  <p
                    :class="['text-xs sm:text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']"
                  >
                    С >1 итерацией
                  </p>
                </div>
              </div>
              <div
                class="text-xs sm:text-sm space-y-1"
                :class="isDarkMode ? 'text-gray-300' : 'text-gray-700'"
              >
                <p>• {{ getIterationStats(1) }} документов с 1 итерацией</p>
                <p>• {{ getIterationStats(2) }} документов с 2 итерациями</p>
                <p>• {{ getIterationStats(3) }} документов с 3+ итерациями</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Table -->
        <div
          :class="[
            'rounded-lg border',
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
          ]"
        >
          <div
            class="p-4 sm:p-6 border-b"
            :class="isDarkMode ? 'border-gray-700' : 'border-gray-200'"
          >
            <h3 :class="['text-lg font-medium', isDarkMode ? 'text-white' : 'text-gray-900']">
              Детальная статистика по документам
            </h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr :class="isDarkMode ? 'bg-gray-700' : 'bg-gray-50'">
                  <th
                    class="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    :class="isDarkMode ? 'text-gray-300' : 'text-gray-600'"
                  >
                    Документ
                  </th>
                  <th
                    class="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    :class="isDarkMode ? 'text-gray-300' : 'text-gray-600'"
                  >
                    Устранение
                  </th>
                  <th
                    class="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    :class="isDarkMode ? 'text-gray-300' : 'text-gray-600'"
                  >
                    Проверка
                  </th>
                  <th
                    class="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    :class="isDarkMode ? 'text-gray-300' : 'text-gray-600'"
                  >
                    Итерации
                  </th>
                  <th
                    class="px-4 sm:px-6 py-3 text-left text-xs font-medium uppercase tracking-wider"
                    :class="isDarkMode ? 'text-gray-300' : 'text-gray-600'"
                  >
                    Общее время
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y" :class="isDarkMode ? 'divide-gray-700' : 'divide-gray-200'">
                <tr
                  v-for="doc in analysisData.documents"
                  :key="doc.doc_id"
                  class="hover:bg-opacity-50 transition-colors"
                  :class="isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'"
                >
                  <td class="px-4 sm:px-6 py-4">
                    <div>
                      <p
                        :class="[
                          'font-medium text-sm',
                          isDarkMode ? 'text-white' : 'text-gray-900',
                        ]"
                      >
                        {{ doc.filename }}
                      </p>
                      <p :class="['text-xs', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
                        {{ formatDate(doc.upload_date) }}
                      </p>
                    </div>
                  </td>
                  <td class="px-4 sm:px-6 py-4">
                    <span
                      :class="[
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        getDurationColor(doc.fix_duration, 'fix'),
                      ]"
                    >
                      {{ doc.fix_duration.toFixed(1) }}д
                    </span>
                  </td>
                  <td class="px-4 sm:px-6 py-4">
                    <span
                      :class="[
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        getDurationColor(doc.review_duration, 'review'),
                      ]"
                    >
                      {{ doc.review_duration.toFixed(1) }}д
                    </span>
                  </td>
                  <td class="px-4 sm:px-6 py-4">
                    <span
                      :class="[
                        'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                        getIterationColor(doc.iterations),
                      ]"
                    >
                      {{ doc.iterations }}
                    </span>
                  </td>
                  <td class="px-4 sm:px-6 py-4">
                    <span
                      :class="[
                        'text-xs sm:text-sm',
                        isDarkMode ? 'text-gray-300' : 'text-gray-600',
                      ]"
                    >
                      {{ (doc.fix_duration + doc.review_duration).toFixed(1) }}д
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Export Section -->
        <div
          :class="[
            'p-4 sm:p-6 rounded-lg border',
            isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
          ]"
        >
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 :class="['text-lg font-medium', isDarkMode ? 'text-white' : 'text-gray-900']">
                Экспорт отчета
              </h3>
              <p :class="['text-sm mt-1', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
                Скачайте детальный отчет в формате CSV
              </p>
            </div>
            <button
              @click="exportReport"
              :class="[
                'inline-flex items-center justify-center px-4 py-2.5 rounded-lg font-medium transition-colors text-sm min-h-[44px]',
                isDarkMode
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-green-600 text-white hover:bg-green-700',
              ]"
            >
              <Download class="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              <span class="hidden sm:inline">Экспорт CSV</span>
              <span class="sm:hidden">Экспорт</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="!isLoading"
        :class="[
          'p-8 sm:p-12 text-center rounded-lg border',
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
        ]"
      >
        <BarChart3
          class="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4"
          :class="isDarkMode ? 'text-gray-600' : 'text-gray-400'"
        />
        <h3
          :class="[
            'text-lg sm:text-xl font-medium mb-2',
            isDarkMode ? 'text-gray-300' : 'text-gray-900',
          ]"
        >
          Данные для анализа не найдены
        </h3>
        <p :class="['text-sm mb-6', isDarkMode ? 'text-gray-500' : 'text-gray-600']">
          Выберите диапазон дат и обновите анализ
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { api, handleApiError } from '@/services/api'
import { History, Clock, CheckCircle, RefreshCw, Download, BarChart3 } from 'lucide-vue-next'

const isDarkMode = inject('isDarkMode', ref(false))
const router = useRouter()

// Types
interface ProcessAnalysisData {
  average_fix_duration: number
  average_review_duration: number
  max_fix_duration: number
  min_fix_duration: number
  max_review_duration: number
  min_review_duration: number
  average_iterations: number
  max_iterations: number
  min_iterations: number
  documents: ProcessDocument[]
  total_documents: number
}

interface ProcessDocument {
  doc_id: string
  filename: string
  upload_date: string
  fix_duration: number
  review_duration: number
  iterations: number
}

// Data
const analysisData = ref<ProcessAnalysisData | null>(null)
const isLoading = ref(false)

// Date range (default: last 30 days)
const dateRange = ref({
  from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  to: new Date().toISOString().split('T')[0],
})

// Computed
const getDocumentsWithMultipleIterations = computed(() => {
  if (!analysisData.value) return 0
  return analysisData.value.documents.filter((doc) => doc.iterations > 1).length
})

// Methods
const getIterationStats = (iterations: number) => {
  if (!analysisData.value) return 0
  if (iterations === 3) {
    return analysisData.value.documents.filter((doc) => doc.iterations >= 3).length
  }
  return analysisData.value.documents.filter((doc) => doc.iterations === iterations).length
}

const getDurationColor = (duration: number, type: 'fix' | 'review') => {
  const thresholds = type === 'fix' ? { good: 2, warning: 5 } : { good: 1, warning: 3 }

  if (duration <= thresholds.good) {
    return isDarkMode.value
      ? 'bg-green-900/20 text-green-400 border border-green-800'
      : 'bg-green-50 text-green-700 border border-green-200'
  } else if (duration <= thresholds.warning) {
    return isDarkMode.value
      ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-800'
      : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
  } else {
    return isDarkMode.value
      ? 'bg-red-900/20 text-red-400 border border-red-800'
      : 'bg-red-50 text-red-700 border border-red-200'
  }
}

const getIterationColor = (iterations: number) => {
  if (iterations === 1) {
    return isDarkMode.value
      ? 'bg-green-900/20 text-green-400 border border-green-800'
      : 'bg-green-50 text-green-700 border border-green-200'
  } else if (iterations === 2) {
    return isDarkMode.value
      ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-800'
      : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
  } else {
    return isDarkMode.value
      ? 'bg-red-900/20 text-red-400 border border-red-800'
      : 'bg-red-50 text-red-700 border border-red-200'
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// API calls
const loadAnalysis = async () => {
  isLoading.value = true
  try {
    const startDate = new Date(`${dateRange.value.from}T00:00:00Z`).toISOString()
    const endDate = new Date(`${dateRange.value.to}T23:59:59Z`).toISOString()

    analysisData.value = await api.getProcessAnalysis(startDate, endDate, true)
  } catch (error) {
    console.error('Error loading process analysis:', error)
    alert(handleApiError(error))
  } finally {
    isLoading.value = false
  }
}

const exportReport = () => {
  if (!analysisData.value) return

  const headers = [
    'Документ',
    'Дата загрузки',
    'Устранение (дней)',
    'Проверка (дней)',
    'Итерации',
    'Общее время',
  ]
  const csvData = analysisData.value.documents.map((doc) => [
    doc.filename,
    formatDate(doc.upload_date),
    doc.fix_duration.toFixed(1),
    doc.review_duration.toFixed(1),
    doc.iterations,
    (doc.fix_duration + doc.review_duration).toFixed(1),
  ])

  const csvContent = [headers, ...csvData]
    .map((row) => row.map((field) => `"${field}"`).join(','))
    .join('\n')

  const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `process_analysis_${dateRange.value.from}_${dateRange.value.to}.csv`
  link.click()
}

const goToHistory = () => {
  router.push('/history')
}

// Lifecycle
onMounted(() => {
  loadAnalysis()
})
</script>
