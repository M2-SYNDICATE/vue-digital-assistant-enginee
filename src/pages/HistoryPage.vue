<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCheckStore } from '../stores/checkStore'
import { FileChartPie, Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-vue-next'

const isDarkMode = inject('isDarkMode', ref(false))
const router = useRouter()
const checkStore = useCheckStore()

// Пагинация
const currentPage = ref(1)
const itemsPerPage = 10

const paginatedResults = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return checkStore.results.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(checkStore.results.length / itemsPerPage)
})

const viewResult = (resultId: string) => {
  router.push(`/result/${resultId}`)
}

const goToHome = () => {
  router.push('/')
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'compliant':
      return CheckCircle
    case 'non-compliant':
      return XCircle
    case 'checking':
      return AlertCircle
    default:
      return AlertCircle
  }
}

const getStatusColor = (status: string) => {
  if (isDarkMode.value) {
    switch (status) {
      case 'compliant':
        return 'text-green-400'
      case 'non-compliant':
        return 'text-red-400'
      case 'checking':
        return 'text-yellow-400'
      default:
        return 'text-gray-400'
    }
  } else {
    switch (status) {
      case 'compliant':
        return 'text-green-600'
      case 'non-compliant':
        return 'text-red-600'
      case 'checking':
        return 'text-yellow-600'
      default:
        return 'text-gray-600'
    }
  }
}

const getStatusText = (status: string) => {
  switch (status) {
    case 'compliant':
      return 'Соответствует'
    case 'non-compliant':
      return 'Не соответствует'
    case 'checking':
      return 'Проверяется'
    default:
      return 'Неизвестно'
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

const formatDateMobile = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
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
            История Проверок
          </h1>
          <p :class="['text-sm mt-1 sm:mt-2', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
            Все результаты анализа документации
          </p>
        </div>
        <button
          @click="goToHome"
          class="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base min-h-[44px]"
        >
          <svg
            class="w-4 h-4 sm:w-5 sm:h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span class="hidden sm:inline">Новая проверка</span>
          <span class="sm:hidden">Новая</span>
        </button>
      </div>
    </div>

    <!-- Stats -->
    <div
      v-if="checkStore.results.length > 0"
      class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8"
    >
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
            <FileChartPie
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
              {{ checkStore.results.length }}
            </p>
            <p :class="['text-xs sm:text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
              Всего проверок
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
              isDarkMode ? 'bg-green-600' : 'bg-green-100',
            ]"
          >
            <CheckCircle
              :class="['w-5 h-5 sm:w-6 sm:h-6', isDarkMode ? 'text-white' : 'text-green-600']"
            />
          </div>
          <div>
            <p
              :class="[
                'text-xl sm:text-2xl font-bold',
                isDarkMode ? 'text-white' : 'text-gray-900',
              ]"
            >
              {{ checkStore.results.filter((r) => r.status === 'compliant').length }}
            </p>
            <p :class="['text-xs sm:text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
              Соответствуют
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
              isDarkMode ? 'bg-red-600' : 'bg-red-100',
            ]"
          >
            <XCircle
              :class="['w-5 h-5 sm:w-6 sm:h-6', isDarkMode ? 'text-white' : 'text-red-600']"
            />
          </div>
          <div>
            <p
              :class="[
                'text-xl sm:text-2xl font-bold',
                isDarkMode ? 'text-white' : 'text-gray-900',
              ]"
            >
              {{ checkStore.results.filter((r) => r.status === 'non-compliant').length }}
            </p>
            <p :class="['text-xs sm:text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
              Не соответствуют
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- Results List -->
    <div v-if="checkStore.results.length > 0" class="space-y-3 sm:space-y-4">
      <div
        v-for="result in paginatedResults"
        :key="result.id"
        :class="[
          'border rounded-lg p-4 sm:p-6 transition-all duration-200 cursor-pointer hover:shadow-lg active:scale-[0.98]',
          isDarkMode
            ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
            : 'bg-white border-gray-200 hover:border-gray-300',
        ]"
        @click="viewResult(result.id)"
      >
        <!-- Desktop Layout -->
        <div class="hidden sm:flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div
              :class="[
                'w-12 h-12 rounded-lg flex items-center justify-center',
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100',
              ]"
            >
              <FileChartPie :class="['w-6 h-6', isDarkMode ? 'text-gray-400' : 'text-gray-600']" />
            </div>
            <div>
              <h3 :class="['font-medium', isDarkMode ? 'text-white' : 'text-gray-900']">
                {{ result.fileName }}
              </h3>
              <div class="flex items-center space-x-4 mt-1">
                <span
                  :class="[
                    'text-sm px-2 py-1 rounded font-mono',
                    isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-600 bg-gray-100',
                  ]"
                >
                  {{ result.fileType }}
                </span>
                <div class="flex items-center text-sm text-gray-500">
                  <Calendar class="w-4 h-4 mr-1" />
                  {{ formatDate(result.uploadDate) }}
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center space-x-4">
            <div class="text-right">
              <div :class="['text-2xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900']">
                {{ result.complianceScore }}%
              </div>
              <div class="flex items-center">
                <component
                  :is="getStatusIcon(result.status)"
                  :class="['w-4 h-4 mr-1', getStatusColor(result.status)]"
                />
                <span :class="['text-sm', getStatusColor(result.status)]">
                  {{ getStatusText(result.status) }}
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

        <!-- Mobile Layout -->
        <div class="sm:hidden">
          <div class="flex items-start justify-between mb-3">
            <div class="flex items-center space-x-3 flex-1 min-w-0">
              <div
                :class="[
                  'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100',
                ]"
              >
                <FileChartPie
                  :class="['w-5 h-5', isDarkMode ? 'text-gray-400' : 'text-gray-600']"
                />
              </div>
              <div class="min-w-0 flex-1">
                <h3
                  :class="[
                    'font-medium text-sm leading-tight truncate',
                    isDarkMode ? 'text-white' : 'text-gray-900',
                  ]"
                >
                  {{ result.fileName }}
                </h3>
                <div class="flex items-center space-x-2 mt-1">
                  <span
                    :class="[
                      'text-xs px-2 py-0.5 rounded font-mono',
                      isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-600 bg-gray-100',
                    ]"
                  >
                    {{ result.fileType }}
                  </span>
                </div>
              </div>
            </div>
            <div
              :class="[
                'text-right flex-shrink-0 ml-2',
                isDarkMode ? 'text-white' : 'text-gray-900',
              ]"
            >
              <div class="text-lg font-bold">{{ result.complianceScore }}%</div>
            </div>
          </div>

          <div class="flex items-center justify-between">
            <div class="flex items-center text-xs text-gray-500">
              <Calendar class="w-3 h-3 mr-1" />
              {{ formatDateMobile(result.uploadDate) }}
            </div>
            <div class="flex items-center">
              <component
                :is="getStatusIcon(result.status)"
                :class="['w-4 h-4 mr-1', getStatusColor(result.status)]"
              />
              <span :class="['text-xs', getStatusColor(result.status)]">
                {{ getStatusText(result.status) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Violations (both layouts) -->
        <div
          v-if="result.violations.length > 0"
          :class="[
            'pt-3 sm:pt-4 border-t',
            isDarkMode ? 'border-gray-700 mt-3 sm:mt-4' : 'border-gray-200 mt-3 sm:mt-4',
          ]"
        >
          <div class="flex items-center text-xs sm:text-sm text-gray-500">
            <AlertCircle class="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
            {{ result.violations.length }} нарушений обнаружено
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="flex justify-center mt-6 sm:mt-8">
        <div class="flex space-x-1 sm:space-x-2">
          <button
            v-for="page in totalPages"
            :key="page"
            @click="currentPage = page"
            :class="[
              'px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center',
              page === currentPage
                ? 'bg-blue-600 text-white'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
            ]"
          >
            {{ page }}
          </button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="checkStore.results.length === 0" class="p-8 sm:p-12 text-center">
      <div :class="['mb-4', isDarkMode ? 'text-gray-600' : 'text-gray-400']">
        <FileChartPie class="w-12 h-12 sm:w-16 sm:h-16 mx-auto" />
      </div>
      <h3
        :class="[
          'text-lg sm:text-xl font-medium mb-2',
          isDarkMode ? 'text-gray-300' : 'text-gray-900',
        ]"
      >
        История пуста
      </h3>
      <p :class="['text-sm mb-6', isDarkMode ? 'text-gray-500' : 'text-gray-600']">
        Здесь будут отображаться результаты всех проведенных анализов
      </p>
      <button
        @click="goToHome"
        class="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium min-h-[44px]"
      >
        <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        Начать первую проверку
      </button>
    </div>
  </div>
</template>
