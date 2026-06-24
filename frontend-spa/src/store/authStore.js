import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../api/index.js'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
          // Backend: { message, token, user }
          const res = await authApi.login(credentials)
          const { token, user } = res
          localStorage.setItem('vnpt_token', token)
          set({ user, token, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (err) {
          set({ isLoading: false, error: err.message })
          return { success: false, error: err.message }
        }
      },

      register: async (data) => {
        set({ isLoading: true, error: null })
        try {
          // Backend: { message, data: user } — không trả token
          // Sau khi đăng ký thành công, redirect về /login để user tự đăng nhập
          await authApi.register(data)
          set({ isLoading: false })
          return { success: true }
        } catch (err) {
          set({ isLoading: false, error: err.message })
          return { success: false, error: err.message }
        }
      },

      logout: () => {
        localStorage.removeItem('vnpt_token')
        // Xóa đúng key Zustand persist dùng
        localStorage.removeItem('vnpt_auth')
        set({ user: null, token: null, isAuthenticated: false })
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'vnpt_auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export default useAuthStore
