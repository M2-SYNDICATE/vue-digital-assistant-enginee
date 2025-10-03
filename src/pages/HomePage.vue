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
  console.log('HomePage: Received result:', result) // Отладка

  // Добавляем результат в store
  addCheckResult(result)
  console.log('HomePage: Result added to store, navigating to:', `/result/${result.id}`) // Отладка

  // Перенаправляем на страницу результата
  router.push(`/result/${result.id}`)
}
</script>

<template>
  <div class="max-w-4xl mx-auto px-4 sm:px-6">
    <!-- Title Section -->
    <div class="text-center mb-6 sm:mb-8 lg:mb-12">
      <div class="mb-4 sm:mb-6">
        <h1
          :class="[
            'text-xl sm:text-2xl lg:text-4xl font-bold mb-2 sm:mb-3 leading-tight',
            isDarkMode ? 'text-white' : 'text-gray-900',
          ]"
        >
          Анализ Технической Документации
        </h1>
        <p
          :class="[
            'text-sm sm:text-base lg:text-lg px-2 sm:px-0',
            isDarkMode ? 'text-gray-400' : 'text-gray-600',
          ]"
        >
          Загрузите документ для проверки соответствия ГОСТ стандартам
        </p>
      </div>

      <!-- Technical Features -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8 lg:mb-12">
        <div
          :class="[
            'p-3 sm:p-4 lg:p-6 rounded-lg border',
            isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200',
          ]"
        >
          <div
            :class="[
              'w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4',
              isDarkMode ? 'bg-green-600' : 'bg-green-100',
            ]"
          >
            <Check
              :class="[
                'w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6',
                isDarkMode ? 'text-white' : 'text-green-600',
              ]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            />
          </div>
          <h3
            :class="[
              'font-semibold mb-1 sm:mb-2 text-xs sm:text-sm lg:text-base',
              isDarkMode ? 'text-gray-200' : 'text-gray-900',
            ]"
          >
            Автоматическая проверка
          </h3>
          <p
            :class="[
              'text-xs sm:text-xs lg:text-sm leading-relaxed',
              isDarkMode ? 'text-gray-400' : 'text-gray-600',
            ]"
          >
            Быстрый анализ соответствия ГОСТ стандартам
          </p>
        </div>

        <div
          :class="[
            'p-3 sm:p-4 lg:p-6 rounded-lg border',
            isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200',
          ]"
        >
          <div
            :class="[
              'w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4',
              isDarkMode ? 'bg-blue-600' : 'bg-blue-100',
            ]"
          >
            <File
              :class="[
                'w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6',
                isDarkMode ? 'text-white' : 'text-blue-600',
              ]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            />
          </div>
          <h3
            :class="[
              'font-semibold mb-1 sm:mb-2 text-xs sm:text-sm lg:text-base',
              isDarkMode ? 'text-gray-200' : 'text-gray-900',
            ]"
          >
            Поддержка форматов
          </h3>
          <p
            :class="[
              'text-xs sm:text-xs lg:text-sm leading-relaxed',
              isDarkMode ? 'text-gray-400' : 'text-gray-600',
            ]"
          >
            PDF, DWG, DXF, STEP файлы
          </p>
        </div>

        <div
          :class="[
            'p-3 sm:p-4 lg:p-6 rounded-lg border',
            isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white/50 border-gray-200',
          ]"
        >
          <div
            :class="[
              'w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-lg flex items-center justify-center mx-auto mb-2 sm:mb-3 lg:mb-4',
              isDarkMode ? 'bg-purple-600' : 'bg-purple-100',
            ]"
          >
            <ChartColumnIncreasing
              :class="[
                'w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6',
                isDarkMode ? 'text-white' : 'text-purple-600',
              ]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            />
          </div>
          <h3
            :class="[
              'font-semibold mb-1 sm:mb-2 text-xs sm:text-sm lg:text-base',
              isDarkMode ? 'text-gray-200' : 'text-gray-900',
            ]"
          >
            Детальные отчеты
          </h3>
          <p
            :class="[
              'text-xs sm:text-xs lg:text-sm leading-relaxed',
              isDarkMode ? 'text-gray-400' : 'text-gray-600',
            ]"
          >
            Подробный анализ нарушений и рекомендации
          </p>
        </div>
      </div>
    </div>

    <!-- File Upload Section -->
    <div class="max-w-sm sm:max-w-md lg:max-w-2xl mx-auto">
      <FileUpload @file-checked="handleFileChecked" />
    </div>
  </div>
</template>
