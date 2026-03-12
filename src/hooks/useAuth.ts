'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface AdminUser {
  id: number
  email: string
  name: string
}

interface AuthState {
  user: AdminUser | null
  loading: boolean
  isAuthenticated: boolean
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false
  })
  const router = useRouter()

  const logout = useCallback(() => {
    localStorage.removeItem('adminToken')
    setAuthState({
      user: null,
      loading: false,
      isAuthenticated: false
    })
    router.push('/admin')
  }, [router])

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('adminToken')

    if (!token) {
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false
      })
      return false
    }

    // Lightweight client-only check: trust presence of token
    // Optionally decode payload for display only (no verification)
    let userFromToken: AdminUser | null = null
    try {
      const payload = JSON.parse(atob(token.split('.')[1] || '')) as Partial<{
        adminId: number; email: string; name: string
      }>
      if (payload && payload.email && payload.name && payload.adminId) {
        userFromToken = {
          id: payload.adminId,
          email: payload.email,
          name: payload.name,
        }
      }
    } catch {
      // ignore decode errors; still consider authenticated while token exists
    }

    setAuthState({
      user: userFromToken,
      loading: false,
      isAuthenticated: true,
    })
    return true
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        localStorage.setItem('adminToken', data.token)
        
        setAuthState({
          user: data.admin,
          loading: false,
          isAuthenticated: true
        })
        return { success: true }
      } else {
        const errorData = await response.json()
        return { success: false, error: errorData.message || 'Login failed' }
      }
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' }
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // Removed periodic re-validation to simplify session handling

  return {
    ...authState,
    login,
    logout,
    checkAuth
  }
}
