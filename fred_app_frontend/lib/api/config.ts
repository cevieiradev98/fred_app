// Configuração da API REST
export const API_CONFIG = {
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
} as const

// Endpoints da API
export const API_ENDPOINTS = {
  pets: '/pets',
  routine: '/routine-items',
  glucose: '/glucose-readings', 
  mood: '/mood-entries',
} as const
