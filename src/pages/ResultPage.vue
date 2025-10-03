<script setup lang="ts">
import { inject, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CheckResults from '../components/CheckResults.vue'
import { getCheckResult, type CheckResult } from '../stores/checkStore'
import { History } from 'lucide-vue-next'

const props = defineProps<{
  id: string
}>()

const isDarkMode = inject('isDarkMode', ref(false))
const route = useRoute()
const router = useRouter()

const result = ref<CheckResult | null>(null)
const isLoading = ref(true)
const error = ref<string | null>(null)

const resultId = computed(() => props.id || (route.params.id as string))

onMounted(async () => {
  try {
    // Имитация загрузки
    await new Promise((resolve) => setTimeout(resolve, 500))

    console.log('Looking for result with ID:', resultId.value) // Отладка

    const foundResult = getCheckResult(resultId.value)
    console.log('Found result:', foundResult) // Отладка

    if (foundResult) {
      result.value = foundResult
    } else {
      error.value = `Результат с ID "${resultId.value}" не найден`
      console.error('Result not found for ID:', resultId.value) // Отладка
      // Не перенаправляем сразу, показываем ошибку
      // router.push('/404')
      // return
    }
  } catch (err) {
    console.error('Error loading result:', err)
    error.value = 'Ошибка при загрузке результата'
  } finally {
    isLoading.value = false
  }
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
</script>

<template>
  <div class="max-w-4xl mx-auto">
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
          Главная
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

    <!-- Results -->
    <div v-if="result && !isLoading && !error" class="max-w-3xl mx-auto">
      <CheckResults :result="result" />
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
          Результат не найден
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
    <div
      v-else-if="isLoading"
      :class="['text-center py-12', isDarkMode ? 'text-gray-400' : 'text-gray-600']"
    >
      <svg class="w-8 h-8 animate-spin mx-auto mb-4" fill="none" viewBox="0 0 24 24">
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
      <p>Загрузка результатов...</p>
    </div>

    <!-- Debug Info (только в development) -->
    <div v-if="!isLoading" class="mt-8 text-center">
      <details :class="['text-xs', isDarkMode ? 'text-gray-500' : 'text-gray-400']">
        <summary class="cursor-pointer">Debug Info</summary>
        <div class="mt-2 font-mono">
          <p>Result ID: {{ resultId }}</p>
          <p>Has Result: {{ !!result }}</p>
          <p>Error: {{ error }}</p>
        </div>
      </details>
    </div>
  </div>
</template>
