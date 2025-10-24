<script setup lang="ts">
import { inject, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { api, handleApiError, type DetailedResult } from '@/services/api'
import {
  History,
  Download,
  FileDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
  User,
  ChevronDown,
  ChevronUp,
  FileText,
  Filter,
  SquarePen,
  FileScan,
} from 'lucide-vue-next'

const props = defineProps<{ id: string }>()
const isDarkMode = inject('isDarkMode', ref(false))
const route = useRoute()
const router = useRouter()

const result = ref<ExtendedDetailedResult | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
const isProcessing = ref(false)

// Состояния для управления историей решений
const expandedPoints = ref<Set<string>>(new Set())

// Фильтры
const activeFilter = ref<'all' | 'pending' | 'fixed' | 'rejected'>('all')
const resultId = computed(() => props.id || (route.params.id as string))
const sortBy = ref<'point' | 'severity' | 'status'>('point')

// Интерфейсы
interface Decision {
  id: string
  error_point: string
  status: 'fixed' | 'rejected'
  author: string
  author_role: 'developer' | 'norm_controller'
  comment: string
  timestamp: string
  occ_id: string
  version_number: number
  file_fix_url?: string | null
  file_fix_url_annotated?: string | null
}

interface ErrorPoint {
  point: string
  description: string
  pdf_url: string
  occ_id: string
  fixed_file_url?: string
}

interface ExtendedDetailedResult extends Omit<DetailedResult, 'error_points'> {
  error_points: ErrorPoint[]
  decisions?: Decision[]
  processing_status?: string
  status?: string

  // Новые (универсальные) поля
  annotated_file_url?: string
  original_file_url?: string
  final_file_url?: string

  // Старые поля, которые реально приходят с бэка
  file_url?: string
  file_url_annotated?: string
  final_approved_pdf?: string
}

// Модалки для нормоконтроллера
const showStatusModal = ref(false)
const showCriterionModal = ref(false)
const selectedCriterion = ref<ErrorPoint | null>(null)
const selectedStatus = ref<'approved' | 'rejected' | 'removed'>('approved')
const selectedCriterionStatus = ref<'fixed' | 'rejected'>('fixed')
const criterionComment = ref('')
const isUpdatingStatus = ref(false)

// Computed свойства
const filteredPoints = computed(() => {
  if (!result.value) return []
  switch (activeFilter.value) {
    case 'pending':
      return result.value.error_points.filter((p) => !getCurrentStatus(p.occ_id))
    case 'fixed':
      return result.value.error_points.filter((p) => getCurrentStatus(p.occ_id) === 'fixed')
    case 'rejected':
      return result.value.error_points.filter((p) => getCurrentStatus(p.occ_id) === 'rejected')
    default:
      return result.value.error_points
  }
})

const pendingPointsCount = computed(() => {
  return result.value?.error_points.filter((p) => !getCurrentStatus(p.occ_id)).length || 0
})

const fixedPointsCount = computed(() => {
  return (
    result.value?.error_points.filter((p) => getCurrentStatus(p.occ_id) === 'fixed').length || 0
  )
})

const rejectedPointsCount = computed(() => {
  return (
    result.value?.error_points.filter((p) => getCurrentStatus(p.occ_id) === 'rejected').length || 0
  )
})

const sortedAndFilteredPoints = computed(() => {
  let points = filteredPoints.value.slice()
  switch (sortBy.value) {
    case 'severity':
      points.sort(
        (a, b) =>
          (result.value?.error_counts[b.point] || 0) - (result.value?.error_counts[a.point] || 0),
      )
      break
    case 'status':
      const statusOrder = { pending: 0, fixed: 1, rejected: 2 }
      points.sort(
        (a, b) =>
          (statusOrder[getCurrentStatus(a.occ_id) || 'pending'] ?? 0) -
          (statusOrder[getCurrentStatus(b.occ_id) || 'pending'] ?? 0),
      )
      break
    case 'point':
    default:
      points.sort((a, b) => a.point.localeCompare(b.point, 'ru', { numeric: true }))
  }
  return points
})

// Загрузка данных
const loadResult = async () => {
  try {
    console.log('Loading result with ID:', resultId.value)
    const detailedResult = (await api.getResult(
      resultId.value,
    )) as unknown as ExtendedDetailedResult

    detailedResult.annotated_file_url =
      detailedResult.annotated_file_url || detailedResult.file_url_annotated
    detailedResult.original_file_url = detailedResult.original_file_url || detailedResult.file_url
    detailedResult.final_file_url =
      detailedResult.final_file_url || detailedResult.final_approved_pdf

    if (detailedResult && detailedResult.processing_status === 'processing') {
      isProcessing.value = true
      const pollForResult = async () => {
        try {
          const updatedResult = (await api.getResult(
            resultId.value,
          )) as unknown as ExtendedDetailedResult
          if (
            updatedResult &&
            updatedResult.processing_status !== 'processing' &&
            updatedResult.processing_status !== 'queued'
          ) {
            result.value = updatedResult
            isProcessing.value = false
          } else {
            setTimeout(pollForResult, 3000)
          }
        } catch (err) {
          console.error('Polling error:', err)
          const errorMessage = handleApiError(err)
          error.value = `Ошибка при проверке статуса: ${errorMessage}`
          isProcessing.value = false
        }
      }
      setTimeout(pollForResult, 3000)
    } else {
      result.value = detailedResult
    }
  } catch (err) {
    console.error('Error loading result:', err)
    const errorMessage = handleApiError(err)
    error.value = `Ошибка при загрузке результата: ${errorMessage}`
  } finally {
    isLoading.value = false
  }
}

// Навигация
const goBack = () => router.back()
const goToHistory = () => router.push('/history/norm-controller')
const goToHome = () => router.push('/')

// Стили
const getSeverityColor = (count: number) => {
  if (isDarkMode.value) {
    if (count <= 3) return 'text-yellow-400'
    if (count <= 10) return 'text-orange-400'
    return 'text-red-400'
  } else {
    if (count <= 3) return 'text-yellow-600'
    if (count <= 10) return 'text-orange-600'
    return 'text-red-600'
  }
}

const downloadFile = async (filePath: string, suggestedName?: string) => {
  if (!filePath) {
    alert('Путь к файлу не указан')
    return
  }

  try {
    const normalizedPath = filePath.replace(/\\/g, '/')
    console.log('📥 Запрашиваю файл через API:', normalizedPath)

    // ✅ используем единый API-запрос
    const blob = await api.downloadByPath(normalizedPath)

    const blobUrl = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = suggestedName || normalizedPath.split('/').pop() || 'document.pdf'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(blobUrl)
  } catch (err) {
    console.error('Ошибка при скачивании файла:', err)
    alert(`Ошибка при скачивании файла: ${handleApiError(err)}`)
  }
}

// 📄 Скачать аннотированный файл (с ошибками)
const openAnnotatedFile = () => {
  if (result.value?.annotated_file_url)
    downloadFile(result.value.annotated_file_url, 'annotated.pdf')
}

// 📄 Скачать исходный файл
const openOriginalFile = () => {
  if (result.value?.original_file_url) downloadFile(result.value.original_file_url, 'original.pdf')
}

// 📄 Скачать итоговый файл
const openFinalFile = () => {
  if (result.value?.final_file_url) downloadFile(result.value.final_file_url, 'final.pdf')
}

// 📄 Скачать PDF конкретного пункта
const openPointPdf = async (pdfUrl: string, point: string) => {
  await downloadFile(pdfUrl, `error_point_${point}.pdf`)
}

// Управление историей решений
const togglePointExpansion = (key: string | number) => {
  if (expandedPoints.value.has(key.toString())) {
    expandedPoints.value.delete(key.toString())
  } else {
    expandedPoints.value.add(key.toString())
  }
}

const isPointExpanded = (key: string | number) => expandedPoints.value.has(key.toString())

// Группировка решений по версиям
const groupDecisionsByVersion = (decisions: Decision[]) => {
  const grouped: Record<number, Decision[]> = {}
  for (const d of decisions) {
    const versionId = Number(d.version_number) || 0
    if (!grouped[versionId]) grouped[versionId] = []
    grouped[versionId].push(d)
  }
  return Object.entries(grouped)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([versionId, items]) => ({ versionId: Number(versionId), items }))
}

// Форматирование даты
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Статусы
const getPointStatusInfo = (status: string) => {
  const statusMap = {
    fixed: {
      label: 'Исправлено',
      color: isDarkMode.value ? 'text-blue-400' : 'text-blue-600',
      bgColor: isDarkMode.value ? 'bg-blue-900/20' : 'bg-blue-50',
      borderColor: isDarkMode.value ? 'border-blue-800' : 'border-blue-200',
      icon: '🛠️',
    },
    rejected: {
      label: 'Отказано',
      color: isDarkMode.value ? 'text-red-400' : 'text-red-600',
      bgColor: isDarkMode.value ? 'bg-red-900/20' : 'bg-red-50',
      borderColor: isDarkMode.value ? 'border-red-800' : 'border-red-200',
      icon: '❌',
    },
  }
  return (
    statusMap[status as keyof typeof statusMap] || {
      label: 'Не решено',
      color: 'text-gray-500',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300',
      icon: '🔍',
    }
  )
}

const getDocumentStatusInfo = (status: string) => {
  const statusMap = {
    waiting: {
      label: 'В обработке',
      color: isDarkMode.value ? 'text-blue-400' : 'text-blue-600',
      bgColor: isDarkMode.value ? 'bg-blue-900/20' : 'bg-blue-50',
      borderColor: isDarkMode.value ? 'border-blue-800' : 'border-blue-200',
      icon: '⏳',
    },
    approved: {
      label: 'Согласовано',
      color: isDarkMode.value ? 'text-green-400' : 'text-green-600',
      bgColor: isDarkMode.value ? 'bg-green-900/20' : 'bg-green-50',
      borderColor: isDarkMode.value ? 'border-green-800' : 'border-green-200',
      icon: '✅',
    },
    rejected: {
      label: 'Отклонено',
      color: isDarkMode.value ? 'text-red-400' : 'text-red-600',
      bgColor: isDarkMode.value ? 'bg-red-900/20' : 'bg-red-50',
      borderColor: isDarkMode.value ? 'border-red-800' : 'border-red-200',
      icon: '❌',
    },
    removed: {
      label: 'Снято',
      color: isDarkMode.value ? 'text-gray-400' : 'text-gray-600',
      bgColor: isDarkMode.value ? 'bg-gray-900/20' : 'bg-gray-50',
      borderColor: isDarkMode.value ? 'border-gray-800' : 'border-gray-200',
      icon: '📝',
    },
  }
  return (
    statusMap[status as keyof typeof statusMap] || {
      label: 'Неизвестно',
      color: 'text-gray-500',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-300',
      icon: '❓',
    }
  )
}

// Роли
const getRoleInfo = (role: string) => {
  const roles = {
    developer: {
      label: 'Разработчик',
      color: isDarkMode.value ? 'text-blue-400' : 'text-blue-600',
    },
    norm_controller: {
      label: 'Нормоконтролер',
      color: isDarkMode.value ? 'text-green-400' : 'text-green-600',
    },
  }
  return roles[role as keyof typeof roles] || { label: role, color: 'text-gray-500' }
}

// Работа с решениями
const getDecisionsForOcc = (occId: string) => {
  if (!result.value?.decisions) return []
  return result.value.decisions
    .filter((d) => d.occ_id === occId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

const getCurrentStatus = (occId: string) => {
  if (!result.value?.decisions) return null
  const occDecisions = result.value.decisions
    .filter((d) => d.occ_id === occId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  if (occDecisions.length === 0) return null
  return occDecisions[0]?.status || null
}

const statusComment = ref('')

// Модалки для нормоконтроллера
const openStatusModal = () => {
  showStatusModal.value = true
  selectedStatus.value = 'approved'
  statusComment.value = ''
}

const closeStatusModal = () => {
  showStatusModal.value = false
}

const openCriterionModal = (criterion: ErrorPoint) => {
  selectedCriterion.value = criterion
  selectedCriterionStatus.value = 'fixed'
  criterionComment.value = ''
  showCriterionModal.value = true
}

const closeCriterionModal = () => {
  showCriterionModal.value = false
  selectedCriterion.value = null
}

// API вызовы для нормоконтроллера
const updateDocumentStatus = async () => {
  if (!result.value) return

  try {
    isUpdatingStatus.value = true
    await api.updateDocumentStatus(resultId.value, {
      status: selectedStatus.value,
    })

    await loadResult()
    alert('Статус документа успешно обновлен')
    closeStatusModal()
  } catch (err) {
    console.error('Error updating document status:', err)
    const errorMessage = handleApiError(err)
    alert(`Ошибка при обновлении статуса: ${errorMessage}`)
  } finally {
    isUpdatingStatus.value = false
  }
}

const updateCriterionStatus = async () => {
  if (!selectedCriterion.value) return

  try {
    isUpdatingStatus.value = true

    // Отправляем данные по новой спецификации API
    await api.updateCriterionStatus(resultId.value, {
      occ_id: selectedCriterion.value.occ_id,
      error_point: selectedCriterion.value.point,
      status: selectedCriterionStatus.value,
      comment: criterionComment.value || undefined,
    })

    // Обновляем локальное состояние
    await loadResult()
    alert('Статус пункта успешно обновлен')
    closeCriterionModal()
  } catch (err) {
    console.error('Error updating criterion status:', err)
    const errorMessage = handleApiError(err)
    alert(`Ошибка при обновлении статуса пункта: ${errorMessage}`)
  } finally {
    isUpdatingStatus.value = false
  }
}

const resolveFileUrl = (url: string): string => {
  if (!url) return ''
  const normalized = url.replace(/\\/g, '/')
  const baseUrl = import.meta.env.VITE_API_URL || window.location.origin
  if (normalized.startsWith('http')) return normalized
  return `${baseUrl}${normalized.startsWith('/') ? '' : '/'}${normalized}`
}

const openFile = (url: string) => {
  const fullUrl = resolveFileUrl(url)
  window.open(fullUrl, '_blank')
}

onMounted(async () => {
  await loadResult()
})
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <!-- Navigation -->
    <div class="mb-8">
      <div class="flex items-center justify-between">
        <button
          @click="goBack"
          :class="[
            'inline-flex items-center text-sm font-medium transition-colors',
            isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700',
          ]"
        >
          <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Назад
        </button>
        <button
          @click="goToHistory"
          :class="[
            'inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            isDarkMode
              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          ]"
        >
          <History class="w-4 h-4 mr-2" />
          Все проверки
        </button>
      </div>
    </div>

    <!-- Title -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center space-x-3 mb-4">
        <div>
          <h1 :class="['text-3xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900']">
            Результат Анализа
          </h1>
          <p :class="['text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
            Детальный отчет о проверке документации
          </p>
        </div>
      </div>
    </div>

    <!-- Processing State -->
    <div v-if="isProcessing" class="max-w-2xl mx-auto">
      <div
        :class="[
          'rounded-lg border p-8 text-center',
          isDarkMode
            ? 'bg-blue-900/20 border-blue-800 text-blue-400'
            : 'bg-blue-50 border-blue-200 text-blue-600',
        ]"
      >
        <Clock class="w-12 h-12 mx-auto mb-4" />
        <h3 :class="['text-lg font-medium mb-2', isDarkMode ? 'text-blue-300' : 'text-blue-800']">
          В обработке
        </h3>
        <p class="mb-6">Ваш документ находится в процессе анализа. Пожалуйста, подождите.</p>
        <div class="space-x-4">
          <button
            @click="goToHistory"
            :class="[
              'inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ]"
          >
            <History class="w-4 h-4 mr-2" />
            Все проверки
          </button>
        </div>
      </div>
    </div>

    <!-- Results -->
    <div v-else-if="result && !isLoading && !error" class="space-y-8">
      <!-- Document Info -->
      <div
        :class="[
          'p-6 rounded-lg border',
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
        ]"
      >
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 :class="['font-medium', isDarkMode ? 'text-gray-200' : 'text-gray-700']">Файл</h3>
            <p :class="['mt-1', isDarkMode ? 'text-white' : 'text-gray-900']">
              {{ result.filename }}
            </p>
          </div>
          <div>
            <h3 :class="['font-medium', isDarkMode ? 'text-gray-200' : 'text-gray-700']">
              Дата загрузки
            </h3>
            <p :class="['mt-1', isDarkMode ? 'text-white' : 'text-gray-900']">
              {{ formatDate(result.upload_date) }}
            </p>
          </div>
          <div>
            <h3 :class="['font-medium', isDarkMode ? 'text-gray-200' : 'text-gray-700']">
              Статус исправлений
            </h3>
            <div class="mt-1">
              <span
                :class="[
                  'px-3 py-1 rounded-full text-sm font-medium border',
                  getDocumentStatusInfo(result.status ?? 'waiting').bgColor,
                  getDocumentStatusInfo(result.status ?? 'waiting').borderColor,
                  getDocumentStatusInfo(result.status ?? 'waiting').color,
                ]"
              >
                {{ getDocumentStatusInfo(result.status ?? 'waiting').icon }}
                {{ getDocumentStatusInfo(result.status ?? 'waiting').label }}
              </span>
            </div>
          </div>
        </div>

        <!-- Общая статистика -->
        <div class="mt-4 pt-4 border-t" :class="isDarkMode ? 'border-gray-700' : 'border-gray-200'">
          <div class="flex items-center space-x-6">
            <div>
              <h3 :class="['font-medium', isDarkMode ? 'text-gray-200' : 'text-gray-700']">
                Нарушений
              </h3>
              <p
                :class="[
                  'mt-1 text-lg font-bold',
                  result.total_violations > 0
                    ? isDarkMode
                      ? 'text-red-400'
                      : 'text-red-600'
                    : isDarkMode
                      ? 'text-green-400'
                      : 'text-green-600',
                ]"
              >
                {{ result.total_violations }}
              </p>
            </div>
            <div>
              <h3 :class="['font-medium', isDarkMode ? 'text-gray-200' : 'text-gray-700']">
                Решено пунктов
              </h3>
              <p :class="['mt-1 text-lg font-bold', isDarkMode ? 'text-white' : 'text-gray-900']">
                {{
                  result.error_points.filter((p) => getCurrentStatus(p.occ_id) === 'fixed').length
                }}
                / {{ result.error_points.length }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons для нормоконтроллера -->
      <div class="flex flex-wrap gap-4">
        <!-- Открыть файл с ошибками -->
        <button
          @click="openAnnotatedFile"
          :class="[
            'inline-flex items-center px-4 py-2.5 rounded-lg font-medium transition-colors min-h-[44px]',
            isDarkMode
              ? 'bg-red-700 text-white hover:bg-red-800'
              : 'bg-red-700 text-white hover:bg-red-800',
          ]"
        >
          <FileScan class="w-4 h-4 mr-2" />
          Файл с ошибками
        </button>

        <!-- Исходный файл -->
        <button
          @click="openOriginalFile"
          :class="[
            'inline-flex items-center px-4 py-2.5 rounded-lg font-medium transition-colors min-h-[44px]',
            isDarkMode
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-green-600 text-white hover:bg-green-700',
          ]"
        >
          <FileScan class="w-4 h-4 mr-2" />
          Исходный файл
        </button>

        <!-- Итоговый файл -->
        <button
          v-if="['approved', 'removed'].includes(result.status ?? '')"
          @click="openFinalFile"
          :class="[
            'inline-flex items-center px-4 py-2.5 rounded-lg font-medium transition-colors min-h-[44px]',
            isDarkMode
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-blue-600 text-white hover:bg-blue-700',
          ]"
        >
          <Download class="w-4 h-4 mr-2" />
          Итоговый файл
        </button>

        <!-- Изменить статус документа -->
        <button
          @click="openStatusModal"
          :class="[
            'inline-flex items-center px-4 py-2.5 rounded-lg font-medium transition-colors min-h-[44px]',
            isDarkMode
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-purple-600 text-white hover:bg-purple-700',
          ]"
        >
          <SquarePen class="w-4 h-4 mr-2" />
          Изменить статус документа
        </button>
      </div>

      <!-- Error Points -->
      <div
        :class="[
          'p-6 rounded-lg border',
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
        ]"
      >
        <div class="flex items-center justify-between mb-4">
          <h2 :class="['text-xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900']">
            Детали анализа
          </h2>
          <div class="text-sm" :class="isDarkMode ? 'text-gray-400' : 'text-gray-600'">
            {{ result.error_points.length }} пунктов
          </div>
        </div>

        <!-- Фильтры -->
        <div
          class="mb-6 p-4 rounded-lg border"
          :class="isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'"
        >
          <div class="flex items-center space-x-4">
            <Filter class="w-4 h-4" :class="isDarkMode ? 'text-gray-400' : 'text-gray-600'" />
            <div class="flex flex-wrap gap-2">
              <button
                v-for="filter in [
                  { id: 'all', label: 'Все', count: result.error_points.length },
                  { id: 'pending', label: 'На рассмотрении', count: pendingPointsCount },
                  { id: 'fixed', label: 'Исправлено', count: fixedPointsCount },
                  { id: 'rejected', label: 'Отклонено', count: rejectedPointsCount },
                ]"
                :key="filter.id"
                @click="activeFilter = filter.id as 'all' | 'pending' | 'fixed' | 'rejected'"
                :class="[
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  activeFilter === filter.id
                    ? isDarkMode
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-600 text-white'
                    : isDarkMode
                      ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300',
                ]"
              >
                {{ filter.label }} ({{ filter.count }})
              </button>
            </div>
          </div>
        </div>

        <!-- Сообщения для разных случаев -->
        <div v-if="filteredPoints.length === 0" class="text-center py-8">
          <CheckCircle
            v-if="result.error_points.length === 0"
            :class="['w-12 h-12 mx-auto mb-4', isDarkMode ? 'text-green-400' : 'text-green-600']"
          />
          <Filter
            v-else
            :class="['w-12 h-12 mx-auto mb-4', isDarkMode ? 'text-gray-400' : 'text-gray-600']"
          />
          <p :class="['text-lg', isDarkMode ? 'text-gray-300' : 'text-gray-600']">
            <span v-if="result.error_points.length === 0">Нарушений не обнаружено</span>
            <span v-else>Нет пунктов для отображения</span>
          </p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="(errorPointObj, index) in sortedAndFilteredPoints"
            :key="`${errorPointObj.point}_${index}`"
            :class="[
              'rounded-lg border transition-colors',
              isDarkMode
                ? 'border-gray-700 hover:border-gray-600'
                : 'border-gray-200 hover:border-gray-300',
            ]"
          >
            <!-- Заголовок пункта -->
            <div class="p-4 cursor-pointer" @click="togglePointExpansion(errorPointObj.occ_id)">
              <div class="flex items-start justify-between">
                <div class="flex items-start space-x-3 flex-1">
                  <AlertTriangle
                    :class="[
                      'w-5 h-5 mt-0.5 flex-shrink-0',
                      getSeverityColor(result.error_counts[errorPointObj.point] || 0),
                    ]"
                  />
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center space-x-3">
                      <h3 :class="['font-medium', isDarkMode ? 'text-white' : 'text-gray-900']">
                        Пункт {{ errorPointObj.point }}
                      </h3>
                      <!-- Текущий статус пункта -->
                      <span
                        v-if="getCurrentStatus(errorPointObj.occ_id)"
                        :class="[
                          'px-2 py-1 rounded-full text-xs font-medium border',
                          getPointStatusInfo(getCurrentStatus(errorPointObj.occ_id)!).bgColor,
                          getPointStatusInfo(getCurrentStatus(errorPointObj.occ_id)!).borderColor,
                          getPointStatusInfo(getCurrentStatus(errorPointObj.occ_id)!).color,
                        ]"
                      >
                        {{ getPointStatusInfo(getCurrentStatus(errorPointObj.occ_id)!).icon }}
                        {{ getPointStatusInfo(getCurrentStatus(errorPointObj.occ_id)!).label }}
                      </span>
                      <span
                        v-else
                        :class="[
                          'px-2 py-1 rounded-full text-xs font-medium border',
                          isDarkMode
                            ? 'bg-yellow-900/30 border-yellow-800 text-yellow-300'
                            : 'bg-yellow-50 border-yellow-300 text-yellow-700',
                        ]"
                      >
                        🟡 Требует решения
                      </span>
                    </div>
                    <p :class="['mt-1 text-sm', isDarkMode ? 'text-gray-300' : 'text-gray-600']">
                      {{ errorPointObj.description }}
                    </p>
                    <div class="flex items-center space-x-4 mt-2">
                      <!-- Кнопка скачивания PDF -->
                      <button
                        v-if="errorPointObj.pdf_url"
                        @click.stop="openPointPdf(errorPointObj.pdf_url, errorPointObj.point)"
                        :class="[
                          'inline-flex items-center px-2 py-1 rounded text-xs transition-colors',
                          isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                        ]"
                      >
                        <FileScan class="w-3 h-3 mr-1" />
                        PDF с ошибкой
                      </button>
                      <!-- Кнопка изменения статуса пункта -->
                      <button
                        @click.stop="openCriterionModal(errorPointObj)"
                        :class="[
                          'inline-flex items-center px-3 py-1 rounded text-xs font-medium transition-colors',
                          isDarkMode
                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                            : 'bg-purple-600 text-white hover:bg-purple-700',
                        ]"
                      >
                        <SquarePen class="w-3 h-3 mr-1" />
                        Изменить статус пункта
                      </button>
                    </div>
                  </div>
                </div>
                <ChevronDown
                  v-if="!isPointExpanded(errorPointObj.occ_id)"
                  :class="[
                    'w-5 h-5 flex-shrink-0 ml-2',
                    isDarkMode ? 'text-gray-400' : 'text-gray-500',
                  ]"
                />
                <ChevronUp
                  v-else
                  :class="[
                    'w-5 h-5 flex-shrink-0 ml-2',
                    isDarkMode ? 'text-gray-400' : 'text-gray-500',
                  ]"
                />
              </div>
            </div>

            <!-- Раскрывающаяся часть с историей решений -->
            <div
              v-if="isPointExpanded(errorPointObj.occ_id)"
              class="border-t"
              :class="isDarkMode ? 'border-gray-700' : 'border-gray-200'"
            >
              <div class="p-4">
                <h4
                  :class="[
                    'text-sm font-medium mb-3',
                    isDarkMode ? 'text-gray-300' : 'text-gray-700',
                  ]"
                >
                  История решений:
                </h4>
                <div
                  v-if="getDecisionsForOcc(errorPointObj.occ_id).length === 0"
                  :class="[
                    'p-4 text-center rounded-lg',
                    isDarkMode ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-50 text-gray-500',
                  ]"
                >
                  <MessageSquare class="w-8 h-8 mx-auto mb-2" />
                  <p class="text-sm">Решения по этой ошибке ещё не принимались</p>
                </div>

                <!-- История решений -->
                <div v-if="getDecisionsForOcc(errorPointObj.occ_id).length">
                  <div
                    v-for="{ versionId, items } in groupDecisionsByVersion(
                      getDecisionsForOcc(errorPointObj.occ_id),
                    )"
                    :key="versionId"
                    class="mb-3 border rounded-lg overflow-hidden transition-all"
                    :class="
                      isDarkMode ? 'border-gray-700 bg-gray-800/40' : 'border-gray-200 bg-gray-50'
                    "
                  >
                    <!-- Заголовок версии -->
                    <div
                      class="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                      @click="togglePointExpansion(`version_${errorPointObj.occ_id}_${versionId}`)"
                      :class="[
                        'border-b transition-colors',
                        isDarkMode
                          ? 'border-gray-700 hover:bg-gray-700/40'
                          : 'border-gray-200 hover:bg-gray-100',
                      ]"
                    >
                      <div class="flex items-center space-x-3">
                        <History class="w-4 h-4 text-green-500" />
                        <h4
                          class="font-semibold"
                          :class="isDarkMode ? 'text-gray-100' : 'text-gray-800'"
                        >
                          Версия {{ versionId }}
                        </h4>
                        <span
                          class="text-xs"
                          :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'"
                        >
                          {{
                            new Date(items[0]?.timestamp ?? '').toLocaleString('ru-RU', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })
                          }}
                        </span>
                      </div>
                      <ChevronDown
                        v-if="!isPointExpanded(`version_${errorPointObj.occ_id}_${versionId}`)"
                        class="w-4 h-4"
                        :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'"
                      />
                      <ChevronUp
                        v-else
                        class="w-4 h-4"
                        :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'"
                      />
                    </div>

                    <!-- Контент версии -->
                    <transition name="fade">
                      <div
                        v-if="isPointExpanded(`version_${errorPointObj.occ_id}_${versionId}`)"
                        class="p-4 space-y-3"
                      >
                        <div
                          v-for="decision in items"
                          :key="decision.id"
                          :class="[
                            'p-3 rounded-lg border shadow-sm transition-all',
                            isDarkMode
                              ? 'bg-gray-900/40 border-gray-700 hover:border-gray-600'
                              : 'bg-white border-gray-200 hover:border-gray-300',
                          ]"
                        >
                          <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center space-x-2">
                              <span class="text-xl">{{
                                getPointStatusInfo(decision.status).icon
                              }}</span>
                              <span
                                :class="[
                                  'font-semibold',
                                  getPointStatusInfo(decision.status).color,
                                ]"
                              >
                                {{ getPointStatusInfo(decision.status).label }}
                              </span>
                            </div>
                            <span
                              class="text-xs"
                              :class="isDarkMode ? 'text-gray-400' : 'text-gray-500'"
                            >
                              {{
                                new Date(decision.timestamp).toLocaleString('ru-RU', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })
                              }}
                            </span>
                          </div>
                          <div class="text-sm mb-2">
                            <div class="flex items-center space-x-2">
                              <User
                                class="w-4 h-4"
                                :class="getRoleInfo(decision.author_role).color"
                              />
                              <span
                                :class="[
                                  getRoleInfo(decision.author_role).color,
                                  isDarkMode ? 'text-gray-300' : 'text-gray-700',
                                ]"
                              >
                                {{ decision.author }}
                                <span
                                  :class="[
                                    'ml-2 text-xs italic',
                                    isDarkMode ? 'text-gray-400' : 'text-gray-500',
                                  ]"
                                >
                                  ({{ getRoleInfo(decision.author_role).label }})
                                </span>
                              </span>
                            </div>
                            <p
                              class="mt-2 p-2 rounded border text-sm"
                              :class="
                                isDarkMode
                                  ? 'bg-gray-800/50 border-gray-700 text-gray-300'
                                  : 'bg-gray-50 border-gray-200 text-gray-700'
                              "
                            >
                              {{ decision.comment }}
                            </p>
                          </div>
                          <!-- Файлы -->
                          <div class="flex flex-wrap gap-2 mt-2">
                            <button
                              v-if="decision.file_fix_url && decision.file_fix_url.trim() !== ''"
                              @click.stop="openFile(decision.file_fix_url)"
                              :class="[
                                'inline-flex items-center px-3 py-1 rounded text-xs font-medium transition-colors',
                                isDarkMode
                                  ? 'bg-blue-700 text-white hover:bg-blue-600'
                                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200',
                              ]"
                            >
                              <FileScan class="w-3 h-3 mr-1" />
                              Загруженный файл
                            </button>
                            <button
                              v-if="
                                decision.file_fix_url_annotated &&
                                decision.file_fix_url_annotated.trim() !== ''
                              "
                              @click.stop="openFile(decision.file_fix_url_annotated)"
                              :class="[
                                'inline-flex items-center px-3 py-1 rounded text-xs font-medium transition-colors',
                                isDarkMode
                                  ? 'bg-red-700 text-white hover:bg-red-600'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200',
                              ]"
                            >
                              <FileScan class="w-3 h-3 mr-1" />
                              Файл с ошибкой
                            </button>
                          </div>
                        </div>
                      </div>
                    </transition>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Full Report -->
      <div
        v-if="result.full_report"
        :class="[
          'p-6 rounded-lg border',
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
        ]"
      >
        <h2 :class="['text-xl font-bold mb-4', isDarkMode ? 'text-white' : 'text-gray-900']">
          Полный отчет
        </h2>
        <pre
          :class="[
            'whitespace-pre-wrap break-words p-4 rounded-lg font-mono text-sm',
            isDarkMode ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-700',
          ]"
          >{{ result.full_report }}</pre
        >
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error && !isLoading" class="max-w-2xl mx-auto">
      <div
        :class="[
          'rounded-lg border p-8 text-center',
          isDarkMode
            ? 'bg-red-900/20 border-red-800 text-red-400'
            : 'bg-red-50 border-red-200 text-red-600',
        ]"
      >
        <svg class="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
          />
        </svg>
        <h3 :class="['text-lg font-medium mb-2', isDarkMode ? 'text-red-300' : 'text-red-800']">
          Ошибка загрузки
        </h3>
        <p class="mb-6">{{ error }}</p>
        <div class="space-x-4">
          <button
            @click="goToHistory"
            :class="[
              'inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ]"
          >
            <History class="w-4 h-4 mr-2" />
            Все проверки
          </button>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-else-if="isLoading" class="flex justify-center items-center py-12">
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
          Загрузка результата...
        </span>
      </div>
    </div>

    <!-- Модальное окно: Изменить статус документа -->
    <div
      v-if="showStatusModal"
      class="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50"
    >
      <div
        :class="[
          'w-full max-w-md p-6 rounded-xl border shadow-lg',
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
        ]"
      >
        <h3 :class="['text-xl font-bold mb-4', isDarkMode ? 'text-white' : 'text-gray-900']">
          Изменить статус документа
        </h3>
        <div class="space-y-4">
          <!-- Выбор статуса -->
          <div>
            <label
              :class="['font-medium block mb-2', isDarkMode ? 'text-gray-200' : 'text-gray-700']"
            >
              Статус:
            </label>
            <select
              v-model="selectedStatus"
              class="w-full rounded-lg px-3 py-2 border"
              :class="
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              "
            >
              <option value="approved">Согласовано</option>
              <option value="rejected">Отклонено</option>
              <option value="removed">Снято</option>
            </select>
          </div>
        </div>
        <!-- Кнопки -->
        <div class="flex justify-end space-x-4 mt-6">
          <button
            @click="closeStatusModal"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ]"
          >
            Отмена
          </button>
          <button
            @click="updateDocumentStatus"
            :disabled="isUpdatingStatus"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              isUpdatingStatus
                ? 'bg-gray-400 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700',
            ]"
          >
            {{ isUpdatingStatus ? 'Обновление...' : 'Обновить статус' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно: Изменить статус пункта -->
    <div
      v-if="showCriterionModal"
      class="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50"
    >
      <div
        :class="[
          'w-full max-w-md p-6 rounded-xl border shadow-lg',
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
        ]"
      >
        <h3 :class="['text-xl font-bold mb-4', isDarkMode ? 'text-white' : 'text-gray-900']">
          Изменить статус пункта {{ selectedCriterion?.point }}
        </h3>
        <div class="space-y-4">
          <!-- Выбор статуса -->
          <div>
            <label
              :class="['font-medium block mb-2', isDarkMode ? 'text-gray-200' : 'text-gray-700']"
            >
              Статус:
            </label>
            <select
              v-model="selectedCriterionStatus"
              class="w-full rounded-lg px-3 py-2 border"
              :class="
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              "
            >
              <option value="fixed">Исправлено</option>
              <option value="rejected">Отклонено</option>
            </select>
          </div>
          <!-- Комментарий -->
          <div>
            <label
              :class="['font-medium block mb-2', isDarkMode ? 'text-gray-200' : 'text-gray-700']"
            >
              Комментарий (необязательно):
            </label>
            <textarea
              v-model="criterionComment"
              rows="3"
              class="w-full rounded-lg px-3 py-2 border"
              :class="
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white'
                  : 'bg-white border-gray-300 text-gray-900'
              "
            ></textarea>
          </div>
        </div>
        <!-- Кнопки -->
        <div class="flex justify-end space-x-4 mt-6">
          <button
            @click="closeCriterionModal"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
            ]"
          >
            Отмена
          </button>
          <button
            @click="updateCriterionStatus"
            :disabled="isUpdatingStatus"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              isUpdatingStatus
                ? 'bg-gray-400 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700',
            ]"
          >
            {{ isUpdatingStatus ? 'Обновление...' : 'Обновить статус' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
