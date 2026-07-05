import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '../api/index.js'
import { isTokenExpired } from '../utils/index.js'

// Import lazily để tránh circular dependency
const getCartStore = () => import('./cartStore.js').then(m => m.default)

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
          // Sync giỏ hàng từ DB ngay sau khi login
          getCartStore().then(store => store.getState().fetchCart())
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
        localStorage.removeItem('vnpt_auth')
        set({ user: null, token: null, isAuthenticated: false })
        // Xoá giỏ hàng local khi logout
        getCartStore().then(store => store.setState({ items: [] }))
      },

      clearError: () => set({ error: null }),

      // Gọi khi app khởi động: nếu token đã hết hạn (dù state persist vẫn còn
      // isAuthenticated: true từ trước) thì dọn sạch, coi như chưa đăng nhập.
      checkSession: () => {
        const { token, isAuthenticated } = get()
        if (isAuthenticated && isTokenExpired(token)) {
          get().logout()
        }
      },
    }),
    {
      name: 'vnpt_auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        // error KHÔNG persist — tránh state lỗi cũ ảnh hưởng lần load mới
      }),
    }
  )
)

export default useAuthStore