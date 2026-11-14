import { useEffect, useState } from 'react'
import { AuthContext } from './authContext.js'
import authApi from '../api/authApi.js'
import { isMockMode } from '../config/runtime.js'

export function AuthProvider({ children }) {
  const isMock = isMockMode
  const [user, setUser] = useState(() => {
    if (!isMock) {
      return null
    }

    const storedUser = localStorage.getItem('user')

    if (!storedUser) {
      return null
    }

    try {
      return JSON.parse(storedUser)
    } catch {
      localStorage.removeItem('user')
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(!isMock)
  const [authError, setAuthError] = useState('')

  useEffect(() => {
    if (isMock) {
      return
    }

    let active = true
    authApi
      .getCurrentUser()
      .then((currentUser) => {
        if (active) {
          setUser(currentUser)
          localStorage.setItem('user', JSON.stringify(currentUser))
        }
      })
      .catch((error) => {
        if (active) {
          setUser(null)
          localStorage.removeItem('user')
          if (error.cause?.response?.status !== 401) {
            setAuthError(
              error.message ||
                'Không thể xác thực phiên đăng nhập với backend PHP.',
            )
          }
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [isMock])

  async function retrySession() {
    setIsLoading(true)
    setAuthError('')
    try {
      const currentUser = await authApi.getCurrentUser()
      setUser(currentUser)
      localStorage.setItem('user', JSON.stringify(currentUser))
    } catch (error) {
      if (error.cause?.response?.status === 401) {
        setUser(null)
        localStorage.removeItem('user')
      } else {
        setAuthError(error.message)
      }
    } finally {
      setIsLoading(false)
    }
  }

  async function refreshCurrentUser() {
    const currentUser = await authApi.getCurrentUser()
    setUser(currentUser)
    localStorage.setItem('user', JSON.stringify(currentUser))
    return currentUser
  }

  async function login(credentials) {
    const result = await authApi.login(credentials)
    setAuthError('')
    setUser(result.user)
    if (result.token) {
      localStorage.setItem('token', result.token)
    } else {
      localStorage.removeItem('token')
    }
    localStorage.setItem('user', JSON.stringify(result.user))
    return result
  }

  async function logout() {
    await authApi.logout()
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  function updateUser(updatedUser) {
    setUser(updatedUser)
    localStorage.setItem('user', JSON.stringify(updatedUser))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role || null,
        isAuthenticated: Boolean(user),
        isLoading,
        authError,
        retrySession,
        refreshCurrentUser,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
