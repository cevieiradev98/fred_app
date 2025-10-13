import { apiClient } from './client'
import { API_ENDPOINTS } from './config'
import { GlucoseReading } from '../../types'

export interface CreateGlucoseReadingData {
  value: number
  protocol?: string
  notes?: string
  date?: string
  insulin_dose?: number | null
}

export interface UpdateGlucoseReadingData {
  insulin_dose?: number | null
  protocol?: string | null
  notes?: string | null
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

  async updateGlucoseReading(id: string, data: UpdateGlucoseReadingData): Promise<GlucoseReading> {
    return apiClient.patch<GlucoseReading>(`${API_ENDPOINTS.glucose}/${id}`, data)
  }

  async deleteGlucoseReading(id: string): Promise<void> {
    return apiClient.delete<void>(`${API_ENDPOINTS.glucose}/${id}`)
  }
}

export const glucoseService = new GlucoseService()
