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

const resultId = computed(() => props.id || (route.params.id as string))

onMounted(() => {
  const foundResult = getCheckResult(resultId.value)
  if (foundResult) {
    result.value = foundResult
  } else {
    // Redirect to home if result not found
    router.push('/')
  }
})

const goBack = () => {
  router.back()
}

const goToHistory = () => {
  router.push('/history')
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
          <History class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          </History>
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
    <div v-if="result" class="max-w-3xl mx-auto">
      <CheckResults :result="result" />
    </div>

    <!-- Loading State -->
    <div v-else :class="['text-center py-12', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
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
  </div>
</template>
