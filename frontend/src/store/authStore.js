import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // ── Actions ─────────────────────────────────────────────────────────
      login: async (credentials) => {
        set({ isLoading: true, error: null })
        try {
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
          const res = await authApi.register(data)
          const { token, user } = res
          localStorage.setItem('vnpt_token', token)
          set({ user, token, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (err) {
          set({ isLoading: false, error: err.message })
          return { success: false, error: err.message }
        }
      },

      logout: async () => {
        try { await authApi.logout() } catch (_) {}
        localStorage.removeItem('vnpt_token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      fetchMe: async () => {
        if (!get().token) return
        try {
          const user = await authApi.me()
          set({ user, isAuthenticated: true })
        } catch (_) {
          get().logout()
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'vnpt_auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
)

export default useAuthStore
