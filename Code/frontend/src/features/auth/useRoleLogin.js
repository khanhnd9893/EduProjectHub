import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/useAuth.js'
import { saveLoginPortal } from './loginPortals.js'

const loginPaths = new Set(['/login', '/lecturer-login', '/admin-login'])
const invalidPortalMessage = 'Tài khoản này không thuộc cổng đăng nhập này.'

function getDestination(from) {
  const pathname = from?.pathname
  if (!pathname || !pathname.startsWith('/') || pathname.startsWith('//')) {
    return '/dashboard'
  }
  if (loginPaths.has(pathname)) {
    return '/dashboard'
  }
  return `${pathname}${from.search || ''}${from.hash || ''}`
}

export function useRoleLogin(allowedRoles) {
  const {
    isAuthenticated,
    isLoading: isCheckingSession,
    login,
  } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const destination = getDestination(location.state?.from)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!username.trim() || !password) {
      setError('Vui lòng nhập tài khoản và mật khẩu')
      return
    }

    setIsLoading(true)
    try {
      await login(
        { username: username.trim(), password },
        allowedRoles,
      )
      saveLoginPortal(location.pathname)
      navigate(destination, { replace: true })
    } catch (loginError) {
      if (loginError.message === invalidPortalMessage) {
        setError(invalidPortalMessage)
      } else {
      setError('Sai tài khoản hoặc mật khẩu')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return {
    username,
    password,
    setUsername,
    setPassword,
    error,
    isLoading,
    isCheckingSession,
    isAuthenticated,
    destination,
    handleSubmit,
  }
}
