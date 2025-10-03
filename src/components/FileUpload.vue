<script setup lang="ts">
import { ref, inject } from 'vue'
import { CloudUpload, CloudUploadIcon } from 'lucide-vue-next'

interface CheckResult {
  id: string
  fileName: string
  fileType: string
  uploadDate: string
  status: 'checking' | 'compliant' | 'non-compliant'
  violations: Array<{
    gostNumber: string
    section: string
    description: string
    severity: 'critical' | 'warning' | 'info'
  }>
  complianceScore: number
}

const emit = defineEmits<{
  fileChecked: [result: CheckResult]
}>()

const isDarkMode = inject('isDarkMode', ref(false))
const isDragOver = ref(false)
const isChecking = ref(false)
const uploadedFile = ref<File | null>(null)

const acceptedFormats = ['.pdf', '.dwg', '.dxf', '.step', '.stp']

const handleDragOver = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = true
}

const handleDragLeave = () => {
  isDragOver.value = false
}

const handleDrop = (e: DragEvent) => {
  e.preventDefault()
  isDragOver.value = false

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    handleFileSelect(files[0])
  }
}

const handleFileInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    handleFileSelect(target.files[0])
  }
}

const handleFileSelect = (file: File) => {
  const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()

  if (!acceptedFormats.includes(fileExtension)) {
    alert('Неподдерживаемый формат файла. Поддерживаются: ' + acceptedFormats.join(', '))
    return
  }

  uploadedFile.value = file
}

const startCheck = async () => {
  if (!uploadedFile.value) return

  isChecking.value = true

  // Симуляция проверки
  await new Promise((resolve) => setTimeout(resolve, 3000))

  const result: CheckResult = {
    id: Date.now().toString(),
    fileName: uploadedFile.value.name,
    fileType: uploadedFile.value.name.split('.').pop()?.toUpperCase() || 'Unknown',
    uploadDate: new Date().toLocaleString('ru-RU'),
    status: Math.random() > 0.5 ? 'compliant' : 'non-compliant',
    violations:
      Math.random() > 0.5
        ? []
        : [
            {
              gostNumber: 'ГОСТ 2.305-2008',
              section: 'п. 4.2.1',
              description: 'Отсутствует основная надпись',
              severity: 'critical',
            },
            {
              gostNumber: 'ГОС�� 2.316-2008',
              section: 'п. 3.1',
              description: 'Неправильное обозначение шероховатости',
              severity: 'warning',
            },
          ],
    complianceScore: Math.floor(Math.random() * 40) + 60,
  }

  isChecking.value = false
  emit('fileChecked', result)
}

const removeFile = () => {
  uploadedFile.value = null
}
</script>

<template>
  <div
    :class="[
      'rounded-lg shadow-sm border backdrop-blur-sm',
      isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-200',
    ]"
  >
    <!-- Заголовок -->
    <div :class="['p-6 border-b', isDarkMode ? 'border-gray-700' : 'border-gray-200']">
      <div class="flex items-center space-x-3">
        <div
          :class="[
            'w-8 h-8 rounded-lg flex items-center justify-center',
            isDarkMode ? 'bg-blue-600' : 'bg-blue-600',
          ]"
        >
          <CloudUpload
            class="w-5 h-5 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
          </CloudUpload>
        </div>
        <div>
          <h2 :class="['text-xl font-semibold', isDarkMode ? 'text-white' : 'text-gray-900']">
            Загрузка документа
          </h2>
          <p :class="['text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
            PDF, DWG, DXF, STEP
          </p>
        </div>
      </div>
    </div>

    <div class="p-6">
      <!-- Зона загрузки -->
      <div
        v-if="!uploadedFile"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
        :class="[
          'border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300',
          isDragOver
            ? isDarkMode
              ? 'border-blue-500 bg-blue-500/10'
              : 'border-blue-500 bg-blue-50'
            : isDarkMode
              ? 'border-gray-600 hover:border-gray-500'
              : 'border-gray-300 hover:border-gray-400',
        ]"
      >
        <div :class="['mb-4', isDarkMode ? 'text-gray-500' : 'text-gray-400']">
          <CloudUpload class="w-12 h-12 mx-auto"> </CloudUpload>
        </div>
        <h3 :class="['text-lg font-medium mb-2', isDarkMode ? 'text-gray-200' : 'text-gray-900']">
          Перетащите файл сюда
        </h3>
        <p :class="['mb-4', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
          или нажмите для выбора файла
        </p>
        <input
          type="file"
          :accept="acceptedFormats.join(',')"
          @change="handleFileInput"
          class="hidden"
          id="file-input"
        />
        <label
          for="file-input"
          class="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors font-medium"
        >
          <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Выбрать файл
        </label>
      </div>

      <!-- Загруженный файл -->
      <div v-else class="space-y-4">
        <div
          :class="[
            'flex items-center justify-between p-4 rounded-lg',
            isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50',
          ]"
        >
          <div class="flex items-center space-x-3">
            <div
              :class="[
                'w-10 h-10 rounded-lg flex items-center justify-center',
                isDarkMode ? 'bg-blue-600' : 'bg-blue-100',
              ]"
            >
              <svg
                :class="['w-6 h-6', isDarkMode ? 'text-white' : 'text-blue-600']"
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
            <div>
              <p :class="['font-medium', isDarkMode ? 'text-gray-200' : 'text-gray-900']">
                {{ uploadedFile.name }}
              </p>
              <p :class="['text-sm', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
                {{ (uploadedFile.size / 1024 / 1024).toFixed(2) }} МБ
              </p>
            </div>
          </div>
          <button
            @click="removeFile"
            :class="[
              'transition-colors',
              isDarkMode ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500',
            ]"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Кнопка проверки -->
        <button
          @click="startCheck"
          :disabled="isChecking"
          class="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <div v-if="isChecking" class="flex items-center justify-center">
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
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
            Анализ документа...
          </div>
          <span v-else>Запустить анализ</span>
        </button>
      </div>
    </div>
  </div>
</template>
