import axios from 'axios'

const baseURL =
  (import.meta.env.VITE_API_URL || '/EduProjectHub/Code/Backend').replace(
    /\/+$/,
    '',
  )

const apiClient = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

apiClient.interceptors.request.use(async (config) => {
  if (!['post', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
    return config
  }

  if (config.url?.includes('/auth.php?action=login')) {
    return config
  }

  const { data } = await axios.get(`${baseURL}/groups.php`, {
    params: { action: 'csrf' },
    withCredentials: true,
  })
  config.headers['X-CSRF-Token'] = data.csrf_token
  return config
})

export default apiClient
