<script setup lang="ts">
import { inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import { checkStore, type CheckResult } from '../stores/checkStore'
import { FileChartPie } from 'lucide-vue-next'

const isDarkMode = inject('isDarkMode', ref(false))
const router = useRouter()

const handleItemClick = (result: CheckResult) => {
  router.push(`/result/${result.id}`)
}

const goToHome = () => {
  router.push('/')
}

const getStatusColor = (status: string) => {
  if (isDarkMode.value) {
    switch (status) {
      case 'compliant':
        return 'text-green-400 bg-green-500/20'
      case 'non-compliant':
        return 'text-red-400 bg-red-500/20'
      case 'checking':
        return 'text-yellow-400 bg-yellow-500/20'
      default:
        return 'text-gray-400 bg-gray-500/20'
    }
  } else {
    switch (status) {
      case 'compliant':
        return 'text-green-600 bg-green-50'
      case 'non-compliant':
        return 'text-red-600 bg-red-50'
      case 'checking':
        return 'text-yellow-600 bg-yellow-50'
      default:
        return 'text-gray-600 bg-gray-50'
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
      return 'Анализ...'
    default:
      return 'Неизвестно'
  }
}
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <!-- Title Section -->
    <div class="text-center mb-8">
      <div class="inline-flex items-center space-x-3 mb-4">
        <div>
          <h1 :class="['text-3xl font-bold', isDarkMode ? 'text-white' : 'text-gray-900']">
            История Анализов
          </h1>
          <p :class="['text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
            Все проведенные проверки документации
          </p>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <div
        :class="[
          'p-6 rounded-lg border text-center',
          isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200',
        ]"
      >
        <div :class="['text-2xl font-bold mb-1', isDarkMode ? 'text-white' : 'text-gray-900']">
          {{ checkStore.results.length }}
        </div>
        <div :class="['text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
          Всего проверок
        </div>
      </div>

      <div
        :class="[
          'p-6 rounded-lg border text-center',
          isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200',
        ]"
      >
        <div class="text-2xl font-bold mb-1 text-green-500">
          {{ checkStore.results.filter((r) => r.status === 'compliant').length }}
        </div>
        <div :class="['text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
          Соответствуют
        </div>
      </div>

      <div
        :class="[
          'p-6 rounded-lg border text-center',
          isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200',
        ]"
      >
        <div class="text-2xl font-bold mb-1 text-red-500">
          {{ checkStore.results.filter((r) => r.status === 'non-compliant').length }}
        </div>
        <div :class="['text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
          Не соответствуют
        </div>
      </div>

      <div
        :class="[
          'p-6 rounded-lg border text-center',
          isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200',
        ]"
      >
        <div :class="['text-2xl font-bold mb-1', isDarkMode ? 'text-white' : 'text-gray-900']">
          {{
            checkStore.results.length > 0
              ? Math.round(
                  checkStore.results.reduce((acc, r) => acc + r.complianceScore, 0) /
                    checkStore.results.length,
                )
              : 0
          }}%
        </div>
        <div :class="['text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">Средний балл</div>
      </div>
    </div>

    <!-- History List -->
    <div
      :class="[
        'rounded-lg shadow-sm border backdrop-blur-sm',
        isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-200',
      ]"
    >
      <!-- Header -->
      <div :class="['p-6 border-b', isDarkMode ? 'border-gray-700' : 'border-gray-200']">
        <div class="flex items-center justify-between">
          <h2 :class="['text-xl font-semibold', isDarkMode ? 'text-white' : 'text-gray-900']">
            Все проверки ({{ checkStore.results.length }})
          </h2>
          <button
            @click="goToHome"
            class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Новая проверка
          </button>
        </div>
      </div>

      <!-- Results List -->
      <div :class="['divide-y', isDarkMode ? 'divide-gray-700' : 'divide-gray-200']">
        <div
          v-for="item in checkStore.results"
          :key="item.id"
          @click="handleItemClick(item)"
          :class="[
            'p-6 cursor-pointer transition-colors',
            isDarkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50',
          ]"
        >
          <div class="flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <div class="flex items-center space-x-4 mb-3">
                <div
                  :class="[
                    'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                    isDarkMode ? 'bg-blue-600' : 'bg-blue-100',
                  ]"
                >
                  <svg
                    :class="['w-5 h-5', isDarkMode ? 'text-white' : 'text-blue-600']"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <h3
                    :class="[
                      'font-medium truncate text-lg',
                      isDarkMode ? 'text-gray-200' : 'text-gray-900',
                    ]"
                  >
                    {{ item.fileName }}
                  </h3>
                  <p :class="['text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
                    {{ item.uploadDate }}
                  </p>
                </div>
              </div>

              <div class="flex items-center space-x-6">
                <span
                  :class="[
                    'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium',
                    getStatusColor(item.status),
                  ]"
                >
                  {{ getStatusText(item.status) }}
                </span>

                <div v-if="item.status !== 'checking'" class="flex items-center space-x-2">
                  <span :class="['text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
                    Соответствие:
                  </span>
                  <div class="flex items-center space-x-2">
                    <div
                      :class="['w-16 h-2 rounded-full', isDarkMode ? 'bg-gray-700' : 'bg-gray-200']"
                    >
                      <div
                        :class="[
                          'h-2 rounded-full transition-all duration-300',
                          item.complianceScore >= 90
                            ? 'bg-green-500'
                            : item.complianceScore >= 70
                              ? 'bg-yellow-500'
                              : 'bg-red-500',
                        ]"
                        :style="{ width: item.complianceScore + '%' }"
                      ></div>
                    </div>
                    <span
                      :class="[
                        'text-sm font-medium',
                        isDarkMode ? 'text-gray-200' : 'text-gray-900',
                      ]"
                    >
                      {{ item.complianceScore }}%
                    </span>
                  </div>
                </div>

                <div v-if="item.violations.length > 0" class="flex items-center space-x-2">
                  <svg
                    class="w-4 h-4 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <span class="text-sm font-medium text-red-500">
                    {{ item.violations.length }} нарушений
                  </span>
                </div>
              </div>
            </div>

            <div class="flex items-center space-x-3 ml-6">
              <span
                :class="[
                  'text-xs px-2 py-1 rounded font-mono',
                  isDarkMode ? 'text-gray-300 bg-gray-700' : 'text-gray-500 bg-gray-100',
                ]"
              >
                {{ item.fileType }}
              </span>
              <svg
                :class="['w-5 h-5', isDarkMode ? 'text-gray-500' : 'text-gray-400']"
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

        <!-- Empty State -->
        <div v-if="checkStore.results.length === 0" class="p-12 text-center">
          <div :class="['mb-4', isDarkMode ? 'text-gray-600' : 'text-gray-400']">
            <FileChartPie class="w-16 h-16 mx-auto" fill="none"> </FileChartPie>
          </div>
          <h3 :class="['text-xl font-medium mb-2', isDarkMode ? 'text-gray-300' : 'text-gray-900']">
            История пуста
          </h3>
          <p :class="['text-sm mb-6', isDarkMode ? 'text-gray-500' : 'text-gray-600']">
            Здесь будут отображаться результаты всех проведенных анализов
          </p>
          <button
            @click="goToHome"
            class="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
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
    </div>
  </div>
</template>
