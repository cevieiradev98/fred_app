import { apiClient } from './client'
import { API_ENDPOINTS } from './config'
import { MoodEntry } from '../../types'

export interface CreateMoodEntryData {
  energy_level: "alta" | "media" | "baixa"
  general_mood: string[]
  appetite: "alto" | "normal" | "baixo" | "nao-comeu"
  walk: "longo" | "curto" | "nao-passeou"
  notes?: string
  date?: string
}

class MoodService {
  async getMoodEntries(petId: string, limit = 30): Promise<MoodEntry[]> {
    const endpoint = `${API_ENDPOINTS.mood}?pet_id=${petId}&limit=${limit}&sort=created_at:desc`
    return apiClient.get<MoodEntry[]>(endpoint)
  }

  async createMoodEntry(petId: string, data: CreateMoodEntryData): Promise<MoodEntry> {
    const payload = {
      ...data,
      date: data.date || new Date().toISOString().split("T")[0],
    }
    const endpoint = `${API_ENDPOINTS.mood}?pet_id=${petId}`
    return apiClient.post<MoodEntry>(endpoint, payload)
  }

  async deleteMoodEntry(id: string): Promise<void> {
    return apiClient.delete<void>(`${API_ENDPOINTS.mood}/${id}`)
  }
}

export const moodService = new MoodService()
