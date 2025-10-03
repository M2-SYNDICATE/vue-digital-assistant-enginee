<script setup lang="ts">
import { inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import FileUpload from '../components/FileUpload.vue'
import { addCheckResult, type CheckResult } from '../stores/checkStore'
import { Check } from 'lucide-vue-next'
import { File } from 'lucide-vue-next'
import { ChartColumnIncreasing } from 'lucide-vue-next'

const isDarkMode = inject('isDarkMode', ref(false))
const router = useRouter()

const handleFileChecked = (result: CheckResult) => {
  addCheckResult(result)
  router.push(`/result/${result.id}`)
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4">
    <!-- Title Section -->
    <div class="text-center mb-8 sm:mb-12">
      <div class="inline-flex items-center space-x-3 mb-6">
        <div>
          <h1
            :class="[
              'text-2xl sm:text-4xl font-bold mb-2',
              isDarkMode ? 'text-white' : 'text-gray-900',
            ]"
          >
            Анализ Технической Документации
          </h1>
          <p :class="['text-base sm:text-lg', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
            Загрузите документ для проверки соответствия ГОСТ стандартам
          </p>
        </div>
      </div>

      <!-- Technical Features -->
      <div class="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-3 mb-8 sm:mb-12">
        <div
          :class="[
            'p-4 sm:p-6 rounded-lg border',
            isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200',
          ]"
        >
          <div
            :class="[
              'w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4',
              isDarkMode ? 'bg-green-600' : 'bg-green-100',
            ]"
          >
            <Check
              :class="['w-5 h-5 sm:w-6 sm:h-6', isDarkMode ? 'text-white' : 'text-green-600']"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
            </Check>
          </div>
          <h3
            :class="[
              'font-semibold mb-1 sm:mb-2 text-sm sm:text-base',
              isDarkMode ? 'text-gray-200' : 'text-gray-900',
            ]"
          >
            Автоматическая проверка
          </h3>
          <p :class="['text-xs sm:text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
            Быстрый анализ соответствия ГОСТ стандартам
          </p>
        </div>

        <div
          :class="[
            'p-4 sm:p-6 rounded-lg border',
            isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200',
          ]"
        >
          <div
            :class="[
              'w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4',
              isDarkMode ? 'bg-blue-600' : 'bg-blue-100',
            ]"
          >
            <File
              :class="['w-5 h-5 sm:w-6 sm:h-6', isDarkMode ? 'text-white' : 'text-blue-600']"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
            </File>
          </div>
          <h3
            :class="[
              'font-semibold mb-1 sm:mb-2 text-sm sm:text-base',
              isDarkMode ? 'text-gray-200' : 'text-gray-900',
            ]"
          >
            Поддержка форматов
          </h3>
          <p :class="['text-xs sm:text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
            PDF, DWG, DXF, STEP файлы
          </p>
        </div>

        <div
          :class="[
            'p-4 sm:p-6 rounded-lg border',
            isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200',
          ]"
        >
          <div
            :class="[
              'w-10 h-10 sm:w-12 sm:h-12 rounded-lg flex items-center justify-center mx-auto mb-3 sm:mb-4',
              isDarkMode ? 'bg-purple-600' : 'bg-purple-100',
            ]"
          >
            <ChartColumnIncreasing
              :class="['w-5 h-5 sm:w-6 sm:h-6', isDarkMode ? 'text-white' : 'text-purple-600']"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
            </ChartColumnIncreasing>
          </div>
          <h3
            :class="[
              'font-semibold mb-1 sm:mb-2 text-sm sm:text-base',
              isDarkMode ? 'text-gray-200' : 'text-gray-900',
            ]"
          >
            Детальные отчеты
          </h3>
          <p :class="['text-xs sm:text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
            Подробный анализ нарушений и рекомендации
          </p>
        </div>
      </div>
    </div>

    <!-- File Upload Section -->
    <div class="max-w-md sm:max-w-2xl mx-auto">
      <FileUpload @file-checked="handleFileChecked" />
    </div>
  </div>
</template>
