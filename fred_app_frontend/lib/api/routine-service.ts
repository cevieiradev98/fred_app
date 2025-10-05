import { apiClient } from './client'
import { API_ENDPOINTS } from './config'
import { RoutineItem } from '../../types'

export interface CreateRoutineItemData {
  period: "morning" | "afternoon" | "evening"
  task: string
  date?: string
}

export interface UpdateRoutineItemData {
  completed: boolean
  completed_at?: string | null
}

class RoutineService {
  async getRoutineItems(petId: string, date?: string): Promise<RoutineItem[]> {
    const today = date || new Date().toISOString().split("T")[0]
    const endpoint = `${API_ENDPOINTS.routine}?pet_id=${petId}&date=${today}&sort=period`
    return apiClient.get<RoutineItem[]>(endpoint)
  }

  async getAllRoutineItems(petId: string): Promise<RoutineItem[]> {
    const endpoint = `${API_ENDPOINTS.routine}?pet_id=${petId}`
    return apiClient.get<RoutineItem[]>(endpoint)
  }

  async createRoutineItem(petId: string, data: CreateRoutineItemData): Promise<RoutineItem> {
    const payload = {
      ...data,
      date: data.date || new Date().toISOString().split("T")[0],
      completed: false,
    }
    const endpoint = `${API_ENDPOINTS.routine}?pet_id=${petId}`
    return apiClient.post<RoutineItem>(endpoint, payload)
  }

  async updateRoutineItem(id: string, data: UpdateRoutineItemData): Promise<RoutineItem> {
    return apiClient.patch<RoutineItem>(`${API_ENDPOINTS.routine}/${id}`, data)
  }

  async deleteRoutineItem(id: string): Promise<void> {
    return apiClient.delete<void>(`${API_ENDPOINTS.routine}/${id}`)
  }
}

export const routineService = new RoutineService()
