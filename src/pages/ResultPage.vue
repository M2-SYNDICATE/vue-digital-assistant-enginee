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
  RefreshCw,
  FileText,
  Filter,
} from 'lucide-vue-next'

const props = defineProps<{
  id: string
}>()

const isDarkMode = inject('isDarkMode', ref(false))
const route = useRoute()
const router = useRouter()

const result = ref<DetailedResult | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)
const isProcessing = ref(false)

// Состояния для управления историей решений
const expandedPoints = ref<Set<string>>(new Set())
const isUpdatingStatus = ref(false)

// Добавляем фильтры
const activeFilter = ref<'all' | 'pending' | 'fixed' | 'rejected'>('all')

const resultId = computed(() => props.id || (route.params.id as string))

// Интерфейсы согласно новой структуре
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

interface ExtendedDetailedResult extends DetailedResult {
  error_points: ErrorPoint[]
  decisions?: Decision[]
}

// Computed свойства для фильтрации
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

const loadResult = async () => {
  try {
    console.log('Loading result with ID:', resultId.value)
    const detailedResult = (await api.getResult(resultId.value)) as ExtendedDetailedResult

    // Проверяем именно processing_status
    if (detailedResult && detailedResult.processing_status === 'processing') {
      isProcessing.value = true

      // 🔁 Функция опроса сервера
      const pollForResult = async () => {
        try {
          const updatedResult = (await api.getResult(resultId.value)) as ExtendedDetailedResult

          // Проверяем снова processing_status
          if (
            updatedResult &&
            updatedResult.processing_status !== 'processing' &&
            updatedResult.processing_status !== 'queued'
          ) {
            result.value = updatedResult
            isProcessing.value = false
          } else {
            // Повторяем опрос каждые 3 секунды
            setTimeout(pollForResult, 3000)
          }
        } catch (err) {
          console.error('Polling error:', err)
          const errorMessage = handleApiError(err)
          error.value = `Ошибка при проверке статуса: ${errorMessage}`
          isProcessing.value = false
        }
      }

      // Запускаем первый опрос
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

onMounted(async () => {
  await loadResult()
})

const goBack = () => {
  router.back()
}

const goToHistory = () => {
  router.push('/history')
}

const goToHome = () => {
  router.push('/')
}

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

const downloadAnnotatedFile = async () => {
  try {
    const blob = await api.downloadAnnotatedFile(resultId.value)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `annotated_${result.value?.filename || `document_${resultId.value}`}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading annotated file:', error)
    const errorMessage = handleApiError(error)
    alert(`Ошибка скачивания аннотированного файла: ${errorMessage}`)
  }
}

const downloadOriginalFile = async () => {
  try {
    const blob = await api.downloadFile(resultId.value)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = result.value?.filename || `document_${resultId.value}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading original file:', error)
    const errorMessage = handleApiError(error)
    alert(`Ошибка скачивания файла: ${errorMessage}`)
  }
}

// Скачивание PDF для конкретного пункта
const openPointPdf = async (pdfUrl: string, point: string) => {
  try {
    const blob = await api.downloadPdf(pdfUrl)
    const url = window.URL.createObjectURL(blob)
    // открываем во встроенном PDF viewer браузера
    window.open(url, '_blank')
  } catch (error) {
    console.error('Error opening point PDF:', error)
    const errorMessage = handleApiError(error)
    alert(`Ошибка открытия PDF: ${errorMessage}`)
  }
}

const groupDecisionsByVersion = (decisions: Decision[]) => {
  const grouped: Record<number, Decision[]> = {}

  for (const d of decisions) {
    const versionId = Number(d.version_number) || 0
    if (!grouped[versionId]) grouped[versionId] = []
    grouped[versionId].push(d)
  }

  // Возвращаем массив, отсортированный по убыванию
  return Object.entries(grouped)
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([versionId, items]) => ({
      versionId: Number(versionId),
      items,
    }))
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Функции для управления историей решений
const togglePointExpansion = (key: string | number) => {
  if (expandedPoints.value.has(key.toString())) {
    expandedPoints.value.delete(key.toString())
  } else {
    expandedPoints.value.add(key.toString())
  }
}

const isPointExpanded = (key: string | number) => {
  return expandedPoints.value.has(key.toString())
}

// Автоматическое создание решения для пункта
const createDecision = (
  errorPoint: string,
  occId: string,
  status: 'fixed' | 'rejected',
  authorRole: 'developer' | 'norm_controller',
) => {
  const author =
    authorRole === 'developer' ? 'Иванов А.С. (Разработчик)' : 'Петрова М.В. (Нормоконтролер)'

  const comments = {
    fixed: `Замечание по пункту ${errorPoint} исправлено.`,
    rejected: `Исправление замечания по пункту ${errorPoint} отклонено.`,
  }

  return {
    id: Date.now().toString() + Math.random(),
    error_point: errorPoint,
    occ_id: occId, // 👈 добавлено!
    status,
    author,
    author_role: authorRole,
    comment: comments[status],
    timestamp: new Date().toISOString(),
  }
}

// Обновление статуса для всех пунктов на "Исправлено"
const updateAllStatuses = async () => {
  if (!result.value) return

  isUpdatingStatus.value = true
  try {
    // Устанавливаем статус "fixed" для всех пунктов без решений
    const decisionsToUpdate = result.value.error_points
      .filter((errorPointObj) => !getCurrentStatus(errorPointObj.occ_id))
      .map((errorPointObj) =>
        createDecision(errorPointObj.point, errorPointObj.occ_id, 'fixed', 'developer'),
      )

    // Отправляем все решения на сервер
    await api.updateDecisions(resultId.value, decisionsToUpdate)

    // Обновляем локальное состояние
    if (!result.value.decisions) {
      result.value.decisions = []
    }

    decisionsToUpdate.forEach((decision) => {
      result.value!.decisions!.push(decision)
    })

    // Показываем уведомление об успехе
    alert('Статусы всех пунктов обновлены на "Исправлено"')
  } catch (err) {
    console.error('Error updating statuses:', err)
    const errorMessage = handleApiError(err)
    alert(`Ошибка при обновлении статусов: ${errorMessage}`)
  } finally {
    isUpdatingStatus.value = false
  }
}

// Получение статуса для отображения (для пунктов)
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

const getEmptyFilterMessage = () => {
  switch (activeFilter.value) {
    case 'pending':
      return 'Нет пунктов на рассмотрении'
    case 'fixed':
      return 'Нет исправленных пунктов'
    case 'rejected':
      return 'Нет отклоненных пунктов'
    default:
      return 'Нет пунктов для отображения'
  }
}

const getEmptyFilterSubMessage = () => {
  switch (activeFilter.value) {
    case 'pending':
      return 'Все пункты имеют решения'
    case 'fixed':
      return 'Исправленные пункты не найдены'
    case 'rejected':
      return 'Отклоненные пункты не найдены'
    default:
      return 'Попробуйте выбрать другой фильтр'
  }
}

// Получение статуса для отображения (для документа)
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

// Получение информации о роли
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

// Получение решений для конкретного пункта
const getDecisionsForOcc = (occId: string) => {
  if (!result.value?.decisions) return []
  return result.value.decisions
    .filter((d) => d.occ_id === occId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
}

// Получение текущего статуса для пункта
const getCurrentStatus = (occId: string) => {
  if (!result.value?.decisions) return null
  const occDecisions = result.value.decisions
    .filter((d) => d.occ_id === occId)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  if (occDecisions.length === 0) return null

  // Берём последнее по времени решение
  return occDecisions[0].status
}

// Проверка, есть ли нерешенные пункты
const hasUnresolvedPoints = computed(() => {
  if (!result.value) return false
  return result.value.error_points.some((pointObj) => !getCurrentStatus(pointObj.occ_id))
})

// Проверка, можно ли обновлять статусы (только для завершенных документов без финального статуса)
const canUpdateStatuses = computed(() => {
  if (!result.value) return false
  return (
    result.value.status === 'completed' &&
    !['approved', 'rejected', 'removed'].includes(result.value.status) &&
    hasUnresolvedPoints.value
  )
})

// Получение описания нарушения из объекта ErrorPoint
const getErrorDescription = (errorPoint: string) => {
  if (!result.value) return ''
  const pointObj = result.value.error_points.find((p) => p.point === errorPoint)
  return pointObj?.description || `Нарушение в пункте ${errorPoint}`
}

// Получение PDF URL для пункта
const getPdfUrl = (errorPoint: string) => {
  if (!result.value) return ''
  const pointObj = result.value.error_points.find((p) => p.point === errorPoint)
  return pointObj?.pdf_url || ''
}

// === МОДАЛКА "Внести изменения" ===
const showFixModal = ref(false)
const selectedFile = ref<File | null>(null)
const selectedFixedPoints = ref<Set<string>>(new Set())
const isSubmittingFixes = ref(false)

// Открытие и закрытие модалки
const openFixModal = () => {
  showFixModal.value = true
}
const closeFixModal = () => {
  showFixModal.value = false
  selectedFile.value = null
  selectedFixedPoints.value.clear()
}

// Обработчик выбора файла
const handleFileUpload = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0]
  }
}

const downloadFixedPdf = async (occId: string) => {
  try {
    const blob = await api.downloadFixedPdf(resultId.value, occId)
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `fixed_${occId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Ошибка скачивания исправленного PDF:', error)
    alert(`Ошибка при скачивании исправленного файла: ${handleApiError(error)}`)
  }
}

// Отправка данных на сервер
const submitFixes = async () => {
  if (!selectedFile.value) {
    alert('Пожалуйста, выберите PDF-файл.')
    return
  }
  if (selectedFixedPoints.value.size === 0) {
    alert('Выберите хотя бы один исправленный пункт.')
    return
  }

  try {
    isSubmittingFixes.value = true
    const points = Array.from(selectedFixedPoints.value)
    await api.submitFixes(resultId.value, selectedFile.value, points)
    alert('Изменения успешно отправлены!')
    closeFixModal()
    await loadResult() // перезагружаем результат
  } catch (err) {
    console.error('Ошибка при отправке изменений:', err)
    const errorMessage = handleApiError(err)
    alert(`Ошибка при отправке: ${errorMessage}`)
  } finally {
    isSubmittingFixes.value = false
  }
}

// Функции для открытия файлов
const openPdf = (type: 'original' | 'annotated') => {
  if (type === 'original') {
    downloadOriginalFile()
  } else {
    downloadAnnotatedFile()
  }
}

const openFile = (url: string) => {
  if (url) {
    window.open(url, '_blank')
  }
}
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
          <button
            @click="goToHome"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            Новая проверка
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
                  getDocumentStatusInfo(result.status).bgColor,
                  getDocumentStatusInfo(result.status).borderColor,
                  getDocumentStatusInfo(result.status).color,
                ]"
              >
                {{ getDocumentStatusInfo(result.status).icon }}
                {{ getDocumentStatusInfo(result.status).label }}
              </span>
            </div>

            <p
              v-if="result.status_author"
              :class="['mt-1 text-sm italic', isDarkMode ? 'text-gray-400' : 'text-gray-500']"
            >
              Автор статуса: {{ result.status_author }}
            </p>
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

                /
                {{ result.error_points.length }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="flex flex-wrap gap-4">
        <!-- Открыть файл с ошибками -->
        <button
          @click="openPdf('annotated')"
          :class="[
            'inline-flex items-center px-4 py-2.5 rounded-lg font-medium transition-colors min-h-[44px]',
            isDarkMode
              ? 'bg-red-700 text-white hover:bg-red-800'
              : 'bg-red-700 text-white hover:bg-red-800',
          ]"
        >
          <FileText class="w-4 h-4 mr-2" />
          Файл с ошибками
        </button>

        <!-- Открыть исходный файл -->
        <button
          @click="openPdf('original')"
          :class="[
            'inline-flex items-center px-4 py-2.5 rounded-lg font-medium transition-colors min-h-[44px]',
            isDarkMode
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-green-600 text-white hover:bg-green-700',
          ]"
        >
          <Download class="w-4 h-4 mr-2" />
          Исходный файл
        </button>

        <!-- Кнопка обновления статуса -->
        <button
          v-if="canUpdateStatuses"
          @click="updateAllStatuses"
          :disabled="isUpdatingStatus"
          :class="[
            'inline-flex items-center px-4 py-2.5 rounded-lg font-medium transition-colors min-h-[44px]',
            isUpdatingStatus
              ? 'bg-gray-400 cursor-not-allowed'
              : isDarkMode
                ? 'bg-orange-600 text-white hover:bg-orange-700'
                : 'bg-orange-600 text-white hover:bg-orange-700',
          ]"
        >
          <RefreshCw class="w-4 h-4 mr-2" :class="{ 'animate-spin': isUpdatingStatus }" />
          {{ isUpdatingStatus ? 'Обновление...' : 'Отметить все как исправлено' }}
        </button>
        <!-- Если все пункты исправлены — показываем кнопку "Итоговый файл" -->
        <button
          v-if="result.error_points.every((p) => getCurrentStatus(p.occ_id) === 'fixed')"
          @click="downloadAnnotatedFile"
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

        <!-- Иначе — обычная кнопка "Внести изменения" -->
        <button
          v-else-if="result.status !== 'approved' && result.status !== 'removed'"
          @click="openFixModal"
          :class="[
            'inline-flex items-center px-4 py-2.5 rounded-lg font-medium transition-colors min-h-[44px]',
            isDarkMode
              ? 'bg-purple-600 text-white hover:bg-purple-700'
              : 'bg-purple-600 text-white hover:bg-purple-700',
          ]"
        >
          <FileText class="w-4 h-4 mr-2" />
          Внести изменения
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
                @click="activeFilter = filter.id"
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
            <span v-if="result.error_points.length === 0"> Нарушений не обнаружено </span>
            <span v-else>
              {{ getEmptyFilterMessage() }}
            </span>
          </p>
          <p :class="['text-sm mt-2', isDarkMode ? 'text-gray-500' : 'text-gray-500']">
            <span v-if="result.error_points.length === 0">
              Документ соответствует всем требованиям
            </span>
            <span v-else>
              {{ getEmptyFilterSubMessage() }}
            </span>
          </p>
        </div>
        <div v-else class="space-y-3">
          <div
            v-for="(errorPointObj, index) in filteredPoints"
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
                        v-else-if="
                          !['fixed', 'rejected'].includes(
                            getCurrentStatus(errorPointObj.occ_id) || '',
                          )
                        "
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
                        <FileText class="w-3 h-3 mr-1" />
                        PDF с ошибкой
                      </button>
                      <!-- Кнопка для скачивания исправленного PDF -->
                      <button
                        v-if="getCurrentStatus(errorPointObj.occ_id) === 'fixed'"
                        @click.stop="downloadFixedPdf(errorPointObj.occ_id)"
                        :class="[
                          'inline-flex items-center px-2 py-1 rounded text-xs transition-colors',
                          isDarkMode
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
                        ]"
                      >
                        <FileDown class="w-3 h-3 mr-1" />
                        Исправленный PDF
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
                  История решений по конкретной ошибке:
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
                            new Date(items[0]?.timestamp).toLocaleString('ru-RU', {
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
                        <!-- Список решений -->
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

                          <!-- 🔽 Добавляем кнопки сразу под комментарием -->
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
                              <FileDown class="w-3 h-3 mr-1" />
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
                              <FileText class="w-3 h-3 mr-1" />
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
          <button
            @click="goToHome"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z"
              />
            </svg>
            Новая проверка
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
    <!-- Модальное окно: Внести изменения -->
    <div
      v-if="showFixModal"
      class="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50"
    >
      <div
        :class="[
          'w-full max-w-lg p-6 rounded-xl border shadow-lg',
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
        ]"
      >
        <h3 :class="['text-xl font-bold mb-4', isDarkMode ? 'text-white' : 'text-gray-900']">
          Внести изменения
        </h3>

        <div class="space-y-4">
          <!-- Загрузка файла -->
          <div>
            <label :class="['font-medium', isDarkMode ? 'text-gray-200' : 'text-gray-700']"
              >Загрузите исправленный PDF:</label
            >
            <input
              type="file"
              accept="application/pdf"
              @change="handleFileUpload"
              class="mt-2 block w-full text-sm border rounded-lg p-2"
              :class="
                isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-gray-200'
                  : 'bg-gray-50 border-gray-300 text-gray-900'
              "
            />
          </div>

          <!-- Выбор пунктов -->
          <div>
            <label
              :class="['font-medium mb-2 block', isDarkMode ? 'text-gray-200' : 'text-gray-700']"
              >Выберите исправленные пункты:</label
            >
            <div
              class="max-h-48 overflow-y-auto border rounded-lg p-3 space-y-2"
              :class="isDarkMode ? 'border-gray-700' : 'border-gray-200'"
            >
              <div
                v-for="(pointObj, index) in result.error_points"
                :key="`${pointObj.point}_${index}`"
                class="flex items-center space-x-2"
              >
                <input
                  type="checkbox"
                  :id="'point-' + pointObj.point + '-' + index"
                  :value="pointObj.occ_id"
                  :checked="selectedFixedPoints.has(pointObj.occ_id)"
                  @change="
                    (e) =>
                      e.target.checked
                        ? selectedFixedPoints.add(pointObj.occ_id)
                        : selectedFixedPoints.delete(pointObj.occ_id)
                  "
                  :disabled="getCurrentStatus(pointObj.occ_id) === 'fixed'"
                  class="rounded border-gray-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <label
                  :for="'point-' + pointObj.point + '-' + index"
                  :class="[
                    'cursor-pointer',
                    getCurrentStatus(pointObj.occ_id) === 'fixed'
                      ? isDarkMode
                        ? 'text-gray-500 line-through'
                        : 'text-gray-400 line-through'
                      : isDarkMode
                        ? 'text-gray-300'
                        : 'text-gray-700',
                  ]"
                >
                  Пункт {{ pointObj.point }} — {{ pointObj.description }}
                  <span
                    v-if="getCurrentStatus(pointObj.occ_id) === 'fixed'"
                    class="ml-1 text-xs italic"
                  >
                    (уже исправлен)
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Кнопки -->
        <div class="flex justify-end space-x-4 mt-6">
          <button
            @click="closeFixModal"
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
            @click="submitFixes"
            :disabled="isSubmittingFixes"
            :class="[
              'px-4 py-2 rounded-lg text-sm font-medium flex items-center',
              isSubmittingFixes
                ? 'bg-gray-400 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700',
            ]"
          >
            <RefreshCw v-if="isSubmittingFixes" class="w-4 h-4 mr-2 animate-spin" />
            {{ isSubmittingFixes ? 'Отправка...' : 'Отправить изменения' }}
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
