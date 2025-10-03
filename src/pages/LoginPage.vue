<script setup lang="ts">
import { inject, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'

const isDarkMode = inject('isDarkMode', ref(false))
const router = useRouter()
const authStore = useAuthStore()

// Состояние формы
const form = reactive({
  email: '',
  password: '',
})

// Состояние UI
const isLoading = ref(false)
const showPassword = ref(false)
const errors = reactive({
  email: '',
  password: '',
})

// Валидация email
const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Обработка отправки формы
const handleSubmit = async () => {
  // Сброс ошибок
  errors.email = ''
  errors.password = ''

  // Валидация
  let hasErrors = false

  if (!form.email) {
    errors.email = 'Введите email'
    hasErrors = true
  } else if (!validateEmail(form.email)) {
    errors.email = 'Введите корректный email'
    hasErrors = true
  }

  if (!form.password) {
    errors.password = 'Введите пароль'
    hasErrors = true
  } else if (form.password.length < 6) {
    errors.password = 'Пароль должен содержать минимум 6 символов'
    hasErrors = true
  }

  if (hasErrors) return

  // Имитация загрузки
  isLoading.value = true

  try {
    // Имитация авторизации
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Создаем пользователя (в реальном приложении данные придут с сервера)
    const userData = {
      id: '1',
      name: 'Пользователь',
      email: form.email,
    }

    // Авторизуем пользователя
    authStore.login(userData)

    // Успешный вход - router guard автоматически перенаправит на главную
    router.push('/')
  } catch (error) {
    console.error('Ошибка входа:', error)
    errors.email = 'Ошибка авторизации. Попробуйте еще раз.'
  } finally {
    isLoading.value = false
  }
}

// Переключение видимости пароля
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

// Очистка ошибки при вводе
const clearError = (field: keyof typeof errors) => {
  errors[field] = ''
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4 py-8">
    <!-- Фоновая сетка -->
    <div
      :class="[
        'absolute inset-0 opacity-5 pointer-events-none',
        'bg-grid-pattern',
        isDarkMode ? 'text-blue-400' : 'text-blue-600',
      ]"
    ></div>

    <!-- Контейнер формы -->
    <div class="w-full max-w-md relative z-10">
      <!-- Заголовок -->
      <div class="text-center mb-8">
        <div
          class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-6 shadow-lg"
        >
          <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h1
          :class="[
            'text-2xl sm:text-3xl font-bold mb-2',
            isDarkMode ? 'text-white' : 'text-gray-900',
          ]"
        >
          Добро пожаловать
        </h1>
        <p :class="['text-sm sm:text-base', isDarkMode ? 'text-gray-400' : 'text-gray-600']">
          Войдите в систему технической проверки
        </p>
      </div>

      <!-- Форма входа -->
      <div
        :class="[
          'p-6 sm:p-8 rounded-2xl border backdrop-blur-sm',
          isDarkMode
            ? 'bg-gray-800/50 border-gray-700 shadow-2xl'
            : 'bg-white/50 border-gray-200 shadow-xl',
        ]"
      >
        <form @submit.prevent="handleSubmit" class="space-y-6">
          <!-- Поле Email -->
          <div class="space-y-2">
            <label
              for="email"
              :class="['block text-sm font-medium', isDarkMode ? 'text-gray-200' : 'text-gray-700']"
            >
              Email адрес
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail
                  :class="[
                    'w-5 h-5 transition-colors duration-200',
                    errors.email ? 'text-red-500' : isDarkMode ? 'text-gray-400' : 'text-gray-400',
                  ]"
                />
              </div>
              <input
                id="email"
                v-model="form.email"
                @input="clearError('email')"
                type="email"
                autocomplete="email"
                placeholder="your@email.com"
                :class="[
                  'block w-full pl-10 pr-3 py-3 border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
                  errors.email
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : isDarkMode
                      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:ring-offset-white',
                ]"
              />
            </div>
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 transform -translate-y-1"
              enter-to-class="opacity-100 transform translate-y-0"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 transform translate-y-0"
              leave-to-class="opacity-0 transform -translate-y-1"
            >
              <p v-if="errors.email" class="text-sm text-red-500 flex items-center space-x-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{{ errors.email }}</span>
              </p>
            </Transition>
          </div>

          <!-- Поле Пароль -->
          <div class="space-y-2">
            <label
              for="password"
              :class="['block text-sm font-medium', isDarkMode ? 'text-gray-200' : 'text-gray-700']"
            >
              Пароль
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock
                  :class="[
                    'w-5 h-5 transition-colors duration-200',
                    errors.password
                      ? 'text-red-500'
                      : isDarkMode
                        ? 'text-gray-400'
                        : 'text-gray-400',
                  ]"
                />
              </div>
              <input
                id="password"
                v-model="form.password"
                @input="clearError('password')"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Введите пароль"
                :class="[
                  'block w-full pl-10 pr-12 py-3 border rounded-xl text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
                  errors.password
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : isDarkMode
                      ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500 focus:ring-offset-gray-800'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500 focus:ring-offset-white',
                ]"
              />
              <button
                type="button"
                @click="togglePasswordVisibility"
                class="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <EyeOff
                  v-if="showPassword"
                  :class="[
                    'w-5 h-5 transition-colors duration-200 hover:scale-110',
                    isDarkMode
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-400 hover:text-gray-600',
                  ]"
                />
                <Eye
                  v-else
                  :class="[
                    'w-5 h-5 transition-colors duration-200 hover:scale-110',
                    isDarkMode
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-400 hover:text-gray-600',
                  ]"
                />
              </button>
            </div>
            <Transition
              enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 transform -translate-y-1"
              enter-to-class="opacity-100 transform translate-y-0"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 transform translate-y-0"
              leave-to-class="opacity-0 transform -translate-y-1"
            >
              <p v-if="errors.password" class="text-sm text-red-500 flex items-center space-x-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{{ errors.password }}</span>
              </p>
            </Transition>
          </div>

          <!-- Кнопка входа -->
          <button
            type="submit"
            :disabled="isLoading"
            :class="[
              'w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed',
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white focus:ring-offset-gray-800'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white focus:ring-offset-white',
              isLoading ? 'transform scale-95' : 'hover:transform hover:scale-105 active:scale-95',
            ]"
          >
            <div v-if="isLoading" class="flex items-center space-x-2">
              <svg
                class="w-4 h-4 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>Вход в систему...</span>
            </div>
            <div v-else class="flex items-center space-x-2">
              <span>Войти</span>
              <ArrowRight
                class="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1"
              />
            </div>
          </button>
        </form>
      </div>

      <!-- Техническая информация -->
      <div class="mt-8 text-center">
        <div
          :class="[
            'inline-flex items-center space-x-2 text-xs font-mono',
            isDarkMode ? 'text-gray-500' : 'text-gray-400',
          ]"
        >
          <div class="w-2 h-2 bg-current rounded-full"></div>
          <span>SECURE LOGIN SYSTEM v2.0</span>
          <div class="w-2 h-2 bg-current rounded-full"></div>
        </div>
      </div>
    </div>
  </div>
</template>
