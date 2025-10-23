<script setup lang="ts">
import { inject, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  FileChartPie,
  AlertCircle,
  FileText,
  CheckCircle,
  XCircle,
  TrendingUp,
  BarChart3,
  ExternalLink,
  Download,
} from 'lucide-vue-next'
import { api, handleApiError, type HistoryItem, type ErrorCounts } from '@/services/api'

const isDarkMode = inject('isDarkMode', ref(false))
const router = useRouter()

// Типы для статистики
interface RequirementStats {
  id: string
  title: string
  description: string
  totalViolations: number
  affectedDocuments: number
  severity: 'critical' | 'high' | 'medium' | 'low'
}

interface ViolationDocument {
  id: string
  fileName: string
  fileType: string
  uploadDate: string
  pdfUrl?: string // Добавляем ссылку на PDF
  violationDetails: {
    requirementId: string
    description: string
    section: string
    pageNumber?: number
    severity: 'critical' | 'high' | 'medium' | 'low'
    pdfAnnotationUrl?: string // Ссылка на PDF с аннотациями
  }
}

// Данные статистики
const requirementsStats = ref<RequirementStats[]>([])
const violationDocuments = ref<ViolationDocument[]>([])
const isLoading = ref(false)
const selectedRequirement = ref<string | null>(null)

// Загрузка статистики
const loadStatistics = async () => {
  isLoading.value = true
  try {
    // Получаем историю для анализа
    const history = await api.getHistory()

    // Моковые данные для 9 требований (в реальном приложении это будет приходить с бэкенда)
    const mockRequirements: RequirementStats[] = [
      {
        id: 'req-1',
        title: 'Соответствие ГОСТ 2.105-95',
        description: 'Общие требования к текстовым документам',
        totalViolations: 12,
        affectedDocuments: 8,
        severity: 'high',
      },
      {
        id: 'req-2',
        title: 'Оформление титульного листа',
        description: 'Требования к оформлению титульного листа',
        totalViolations: 5,
        affectedDocuments: 3,
        severity: 'medium',
      },
      {
        id: 'req-3',
        title: 'Нумерация страниц',
        description: 'Правила нумерации страниц документа',
        totalViolations: 8,
        affectedDocuments: 6,
        severity: 'critical',
      },
      {
        id: 'req-4',
        title: 'Оформление таблиц',
        description: 'Требования к оформлению таблиц',
        totalViolations: 15,
        affectedDocuments: 10,
        severity: 'high',
      },
      {
        id: 'req-5',
        title: 'Оформление рисунков',
        description: 'Требования к оформлению иллюстраций',
        totalViolations: 7,
        affectedDocuments: 4,
        severity: 'medium',
      },
      {
        id: 'req-6',
        title: 'Библиографические ссылки',
        description: 'Правила оформления ссылок',
        totalViolations: 3,
        affectedDocuments: 2,
        severity: 'low',
      },
      {
        id: 'req-7',
        title: 'Термины и определения',
        description: 'Единообразие терминологии',
        totalViolations: 9,
        affectedDocuments: 7,
        severity: 'high',
      },
      {
        id: 'req-8',
        title: 'Единицы измерения',
        description: 'Соблюдение системы СИ',
        totalViolations: 6,
        affectedDocuments: 5,
        severity: 'medium',
      },
      {
        id: 'req-9',
        title: 'Оформление приложений',
        description: 'Требования к оформлению приложений',
        totalViolations: 4,
        affectedDocuments: 3,
        severity: 'low',
      },
    ]

    requirementsStats.value = mockRequirements

    // Моковые данные документов с нарушениями
    const mockViolationDocuments: ViolationDocument[] = [
      {
        id: '1',
        fileName: 'Техническое задание.pdf',
        fileType: 'PDF',
        uploadDate: '2024-01-15T10:30:00Z',
        pdfUrl: '/documents/tech_spec.pdf',
        violationDetails: {
          requirementId: 'req-1',
          description: 'Несоответствие требований к шрифту и межстрочному интервалу',
          section: 'Общие требования',
          pageNumber: 3,
          severity: 'high',
          pdfAnnotationUrl: '/documents/tech_spec_annotated.pdf',
        },
      },
      {
        id: '2',
        fileName: 'Проектная документация.docx',
        fileType: 'DOCX',
        uploadDate: '2024-01-14T15:45:00Z',
        pdfUrl: '/documents/project_docs.pdf',
        violationDetails: {
          requirementId: 'req-3',
          description: 'Неправильная нумерация страниц в содержании',
          section: 'Содержание',
          pageNumber: 2,
          severity: 'critical',
          pdfAnnotationUrl: '/documents/project_docs_annotated.pdf',
        },
      },
      {
        id: '3',
        fileName: 'Отчет по испытаниям.pdf',
        fileType: 'PDF',
        uploadDate: '2024-01-13T09:20:00Z',
        pdfUrl: '/documents/test_report.pdf',
        violationDetails: {
          requirementId: 'req-4',
          description: 'Таблицы не имеют сквозной нумерации',
          section: 'Результаты испытаний',
          pageNumber: 7,
          severity: 'high',
          pdfAnnotationUrl: '/documents/test_report_annotated.pdf',
        },
      },
    ]

    violationDocuments.value = mockViolationDocuments
  } catch (error) {
    console.error('Error loading statistics:', error)
    const errorMessage = handleApiError(error)
    alert(`Ошибка загрузки статистики: ${errorMessage}`)
  } finally {
    isLoading.value = false
  }
}

// Фильтрация документов по выбранному требованию
const filteredDocuments = computed(() => {
  if (!selectedRequirement.value) return []
  return violationDocuments.value.filter(
    (doc) => doc.violationDetails.requirementId === selectedRequirement.value,
  )
})

// Получение информации о выбранном требовании
const selectedRequirementInfo = computed(() => {
  if (!selectedRequirement.value) return null
  return requirementsStats.value.find((req) => req.id === selectedRequirement.value)
})

// Функции для стилей
const getSeverityColor = (severity: string) => {
  if (isDarkMode.value) {
    switch (severity) {
      case 'critical':
        return 'text-red-400'
      case 'high':
        return 'text-orange-400'
      case 'medium':
        return 'text-yellow-400'
      case 'low':
        return 'text-blue-400'
      default:
        return 'text-gray-400'
    }
  } else {
    switch (severity) {
      case 'critical':
        return 'text-red-600'
      case 'high':
        return 'text-orange-600'
      case 'medium':
        return 'text-yellow-600'
      case 'low':
        return 'text-blue-600'
      default:
        return 'text-gray-600'
    }
  }
}

const getSeverityBgColor = (severity: string) => {
  if (isDarkMode.value) {
    switch (severity) {
      case 'critical':
        return 'bg-red-900/20'
      case 'high':
        return 'bg-orange-900/20'
      case 'medium':
        return 'bg-yellow-900/20'
      case 'low':
        return 'bg-blue-900/20'
      default:
        return 'bg-gray-900/20'
    }
  } else {
    switch (severity) {
      case 'critical':
        return 'bg-red-50'
      case 'high':
        return 'bg-orange-50'
      case 'medium':
        return 'bg-yellow-50'
      case 'low':
        return 'bg-blue-50'
      default:
        return 'bg-gray-50'
    }
  }
}

const getSeverityBorderColor = (severity: string) => {
  if (isDarkMode.value) {
    switch (severity) {
      case 'critical':
        return 'border-red-800'
      case 'high':
        return 'border-orange-800'
      case 'medium':
        return 'border-yellow-800'
      case 'low':
        return 'border-blue-800'
      default:
        return 'border-gray-800'
    }
  } else {
    switch (severity) {
      case 'critical':
        return 'border-red-200'
      case 'high':
        return 'border-orange-200'
      case 'medium':
        return 'border-yellow-200'
      case 'low':
        return 'border-blue-200'
      default:
        return 'border-gray-200'
    }
  }
}

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'critical':
      return XCircle
    case 'high':
      return AlertCircle
    case 'medium':
      return TrendingUp
    case 'low':
      return BarChart3
    default:
      return AlertCircle
  }
}

// Обработчики
const selectRequirement = (requirementId: string) => {
  selectedRequirement.value = requirementId
}

const clearSelection = () => {
  selectedRequirement.value = null
}

const viewDocument = (documentId: string) => {
  router.push(`/result/${documentId}`)
}

// Функция для открытия PDF с аннотациями
const openAnnotatedPdf = (document: ViolationDocument, event: Event) => {
  event.stopPropagation() // Предотвращаем переход к деталям документа

  if (document.violationDetails.pdfAnnotationUrl) {
    // Открываем PDF в новой вкладке
    window.open(document.violationDetails.pdfAnnotationUrl, '_blank')
  } else if (document.pdfUrl) {
    // Если нет аннотированной версии, открываем оригинал
    window.open(document.pdfUrl, '_blank')
  } else {
    alert('PDF документ недоступен')
  }
}

// Функция для скачивания оригинального PDF
const downloadOriginalPdf = (document: ViolationDocument, event: Event) => {
  event.stopPropagation()

  if (document.pdfUrl) {
    const link = document.createElement('a')
    link.href = document.pdfUrl
    link.download = document.fileName
    link.click()
  } else {
    alert('Оригинальный документ недоступен')
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  loadStatistics()
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-4 sm:px-6">
    <!-- Header -->
    <div class="mb-6 sm:mb-8">
      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1
            :class="['text-2xl sm:text-3xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900']"
          >
            Статистика по замечаниям
          </h1>
          <p :class="['text-sm mt-1 sm:mt-2', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
            Сводная статистика по требованиям ГОСТ и документам с замечаниями
          </p>
        </div>

        <button
          v-if="selectedRequirement"
          @click="clearSelection"
          :class="[
            'inline-flex items-center justify-center px-4 py-2.5 rounded-lg transition-colors font-medium text-sm sm:text-base min-h-[44px]',
            isDarkMode
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          ]"
        >
          <XCircle class="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
          Назад к списку
        </button>
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
          Загрузка статистики...
        </span>
      </div>
    </div>

    <!-- Requirements Grid -->
    <div v-if="!selectedRequirement && !isLoading" class="space-y-6">
      <!-- Summary Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
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
              <FileText
                :class="['w-5 h-5 sm:w-6 sm:h-6', isDarkMode ? 'text-white' : 'text-blue-600']"
              />
            </div>
            <div>
              <p
                :class="[
                  'text-xl sm:text-2xl font-bold',
                  isDarkMode ? 'text-white' : 'text-gray-900',
                ]"
              >
                {{ requirementsStats.length }}
              </p>
              <p :class="['text-xs sm:text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
                Всего требований
              </p>
            </div>
          </div>
        </div>

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
                isDarkMode ? 'bg-orange-600' : 'bg-orange-100',
              ]"
            >
              <AlertCircle
                :class="['w-5 h-5 sm:w-6 sm:h-6', isDarkMode ? 'text-white' : 'text-orange-600']"
              />
            </div>
            <div>
              <p
                :class="[
                  'text-xl sm:text-2xl font-bold',
                  isDarkMode ? 'text-white' : 'text-gray-900',
                ]"
              >
                {{ requirementsStats.reduce((sum, req) => sum + req.totalViolations, 0) }}
              </p>
              <p :class="['text-xs sm:text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
                Всего замечаний
              </p>
            </div>
          </div>
        </div>

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
              <FileChartPie
                :class="['w-5 h-5 sm:w-6 sm:h-6', isDarkMode ? 'text-white' : 'text-purple-600']"
              />
            </div>
            <div>
              <p
                :class="[
                  'text-xl sm:text-2xl font-bold',
                  isDarkMode ? 'text-white' : 'text-gray-900',
                ]"
              >
                {{ new Set(violationDocuments.map((doc) => doc.id)).size }}
              </p>
              <p :class="['text-xs sm:text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
                Документов с замечаниями
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Requirements List -->
      <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        <div
          v-for="requirement in requirementsStats"
          :key="requirement.id"
          :class="[
            'border rounded-lg p-4 sm:p-6 transition-all duration-200 cursor-pointer hover:shadow-lg active:scale-[0.98]',
            isDarkMode
              ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
              : 'bg-white border-gray-200 hover:border-gray-300',
          ]"
          @click="selectRequirement(requirement.id)"
        >
          <div class="flex items-start justify-between mb-3">
            <div
              :class="[
                'flex items-center px-2 py-1 rounded text-sm border',
                getSeverityBgColor(requirement.severity),
                getSeverityBorderColor(requirement.severity),
              ]"
            >
              <component
                :is="getSeverityIcon(requirement.severity)"
                :class="['w-3 h-3 mr-1', getSeverityColor(requirement.severity)]"
              />
              <span :class="['font-medium', getSeverityColor(requirement.severity)]">
                {{
                  requirement.severity === 'critical'
                    ? 'Критическое'
                    : requirement.severity === 'high'
                      ? 'Высокое'
                      : requirement.severity === 'medium'
                        ? 'Среднее'
                        : 'Низкое'
                }}
              </span>
            </div>
          </div>

          <h3 :class="['font-medium mb-2', isDarkMode ? 'text-white' : 'text-gray-900']">
            {{ requirement.title }}
          </h3>
          <p :class="['text-sm mb-4', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
            {{ requirement.description }}
          </p>

          <div class="flex items-center justify-between text-sm">
            <div class="flex items-center space-x-4">
              <div class="flex items-center">
                <AlertCircle class="w-4 h-4 mr-1 text-red-500" />
                <span :class="[isDarkMode ? 'text-gray-300' : 'text-gray-700']">
                  {{ requirement.totalViolations }} замечаний
                </span>
              </div>
              <div class="flex items-center">
                <FileText class="w-4 h-4 mr-1 text-blue-500" />
                <span :class="[isDarkMode ? 'text-gray-300' : 'text-gray-700']">
                  {{ requirement.affectedDocuments }} документов
                </span>
              </div>
            </div>
            <svg
              class="w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Documents List for Selected Requirement -->
    <div v-if="selectedRequirement && !isLoading" class="space-y-6">
      <!-- Requirement Header -->
      <div
        :class="[
          'border rounded-lg p-6',
          getSeverityBgColor(selectedRequirementInfo?.severity || 'medium'),
          getSeverityBorderColor(selectedRequirementInfo?.severity || 'medium'),
        ]"
      >
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center mb-2">
              <component
                :is="getSeverityIcon(selectedRequirementInfo?.severity || 'medium')"
                :class="[
                  'w-5 h-5 mr-2',
                  getSeverityColor(selectedRequirementInfo?.severity || 'medium'),
                ]"
              />
              <h2
                :class="[
                  'text-xl font-bold',
                  getSeverityColor(selectedRequirementInfo?.severity || 'medium'),
                ]"
              >
                {{ selectedRequirementInfo?.title }}
              </h2>
            </div>
            <p :class="['text-sm mb-4', isDarkMode ? 'text-gray-300' : 'text-gray-700']">
              {{ selectedRequirementInfo?.description }}
            </p>
            <div class="flex items-center space-x-6 text-sm">
              <div class="flex items-center">
                <AlertCircle class="w-4 h-4 mr-1" />
                <span :class="[isDarkMode ? 'text-gray-300' : 'text-gray-700']">
                  {{ selectedRequirementInfo?.totalViolations }} замечаний
                </span>
              </div>
              <div class="flex items-center">
                <FileText class="w-4 h-4 mr-1" />
                <span :class="[isDarkMode ? 'text-gray-300' : 'text-gray-700']">
                  {{ filteredDocuments.length }} документов с нарушениями
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Documents List -->
      <div class="space-y-4">
        <div
          v-for="document in filteredDocuments"
          :key="document.id"
          :class="[
            'border rounded-lg p-4 sm:p-6 transition-all duration-200 cursor-pointer hover:shadow-lg',
            isDarkMode
              ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
              : 'bg-white border-gray-200 hover:border-gray-300',
          ]"
        >
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center space-x-4 flex-1">
              <div
                :class="[
                  'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100',
                ]"
              >
                <FileText :class="['w-6 h-6', isDarkMode ? 'text-gray-400' : 'text-gray-600']" />
              </div>
              <div class="flex-1 min-w-0">
                <h3 :class="['font-medium mb-1', isDarkMode ? 'text-white' : 'text-gray-900']">
                  {{ document.fileName }}
                </h3>
                <div class="flex items-center space-x-4 text-sm">
                  <span
                    :class="[
                      'px-2 py-1 rounded font-mono',
                      isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-600 bg-gray-100',
                    ]"
                  >
                    {{ document.fileType }}
                  </span>
                  <span :class="[isDarkMode ? 'text-gray-400' : 'text-gray-500']">
                    {{ formatDate(document.uploadDate) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="flex items-center space-x-2 flex-shrink-0">
              <!-- Кнопка просмотра деталей -->
              <button
                @click="viewDocument(document.id)"
                :class="[
                  'inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isDarkMode
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700',
                ]"
              >
                <ExternalLink class="w-4 h-4 mr-1" />
                Детали
              </button>

              <!-- Кнопка PDF с аннотациями -->
              <button
                v-if="document.violationDetails.pdfAnnotationUrl || document.pdfUrl"
                @click="openAnnotatedPdf(document, $event)"
                :class="[
                  'inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isDarkMode
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-red-600 text-white hover:bg-red-700',
                ]"
              >
                <span class="mr-1">✏️</span>
                PDF с замечаниями
              </button>

              <!-- Кнопка скачивания оригинала -->
              <button
                v-if="document.pdfUrl"
                @click="downloadOriginalPdf(document, $event)"
                :class="[
                  'inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                  isDarkMode
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                ]"
              >
                <Download class="w-4 h-4 mr-1" />
                Скачать
              </button>
            </div>
          </div>

          <!-- Violation Details -->
          <div
            :class="[
              'border-l-4 pl-4 py-2',
              isDarkMode ? 'border-red-500 bg-red-900/10' : 'border-red-400 bg-red-50',
            ]"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <div class="flex items-center mb-1">
                  <span class="text-lg mr-2">✏️</span>
                  <span :class="['font-medium', isDarkMode ? 'text-red-300' : 'text-red-700']">
                    Замечание
                  </span>
                </div>
                <p :class="['text-sm mb-2', isDarkMode ? 'text-gray-300' : 'text-gray-700']">
                  {{ document.violationDetails.description }}
                </p>
                <div class="flex items-center space-x-4 text-xs">
                  <span :class="[isDarkMode ? 'text-gray-400' : 'text-gray-600']">
                    Раздел: {{ document.violationDetails.section }}
                  </span>
                  <span
                    v-if="document.violationDetails.pageNumber"
                    :class="[isDarkMode ? 'text-gray-400' : 'text-gray-600']"
                  >
                    Страница: {{ document.violationDetails.pageNumber }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- No Documents Message -->
      <div
        v-if="filteredDocuments.length === 0"
        :class="[
          'text-center py-12 rounded-lg border',
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
        ]"
      >
        <FileText class="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 :class="['text-lg font-medium mb-2', isDarkMode ? 'text-gray-300' : 'text-gray-900']">
          Нет документов с замечаниями
        </h3>
        <p :class="['text-sm', isDarkMode ? 'text-gray-500' : 'text-gray-600']">
          По выбранному требованию не найдено документов с нарушениями
        </p>
      </div>
    </div>

    <!-- Empty State -->
    <div
      v-if="!isLoading && requirementsStats.length === 0 && !selectedRequirement"
      class="p-8 sm:p-12 text-center"
    >
      <div :class="['mb-4', isDarkMode ? 'text-gray-600' : 'text-gray-400']">
        <BarChart3 class="w-12 h-12 sm:w-16 sm:h-16 mx-auto" />
      </div>
      <h3
        :class="[
          'text-lg sm:text-xl font-medium mb-2',
          isDarkMode ? 'text-gray-300' : 'text-gray-900',
        ]"
      >
        Статистика недоступна
      </h3>
      <p :class="['text-sm mb-6', isDarkMode ? 'text-gray-500' : 'text-gray-600']">
        Данные для статистики по замечаниям пока не собраны
      </p>
    </div>
  </div>
</template>
