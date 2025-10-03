import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export interface User {
  id: string
  name: string
  email: string
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const isAuthenticated = computed(() => !!user.value)

  const login = (userData: User) => {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const logout = () => {
    user.value = null
    localStorage.removeItem('user')
  }

  const initAuth = () => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        user.value = JSON.parse(savedUser)
      } catch (error) {
        console.error('Ошибка при загрузке данных пользователя:', error)
        localStorage.removeItem('user')
      }
    }
  }

  return {
    user,
    isAuthenticated,
    login,
    logout,
    initAuth,
  }
})
