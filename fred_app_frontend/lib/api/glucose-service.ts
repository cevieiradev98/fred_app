import { apiClient } from './client'
import { API_ENDPOINTS } from './config'
import { GlucoseReading } from '../../types'

export interface CreateGlucoseReadingData {
  value: number
  protocol?: string
  notes?: string
  date?: string
}

class GlucoseService {
  async getGlucoseReadings(petId: string, limit = 30): Promise<GlucoseReading[]> {
    const endpoint = `${API_ENDPOINTS.glucose}?pet_id=${petId}&limit=${limit}&sort=created_at:desc`
    return apiClient.get<GlucoseReading[]>(endpoint)
  }

  async createGlucoseReading(petId: string, data: CreateGlucoseReadingData): Promise<GlucoseReading> {
    const payload = {
      ...data,
      date: data.date || new Date().toISOString().split("T")[0],
    }
    const endpoint = `${API_ENDPOINTS.glucose}?pet_id=${petId}`
    return apiClient.post<GlucoseReading>(endpoint, payload)
  }

  async deleteGlucoseReading(id: string): Promise<void> {
    return apiClient.delete<void>(`${API_ENDPOINTS.glucose}/${id}`)
  }
}

export const glucoseService = new GlucoseService()
