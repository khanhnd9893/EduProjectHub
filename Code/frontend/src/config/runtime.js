const mockRequested = import.meta.env.VITE_USE_MOCK === 'true'

if (import.meta.env.PROD && mockRequested) {
  throw new Error('Mock mode is disabled in production builds. Set VITE_USE_MOCK=false.')
}

export const isMockMode = mockRequested
