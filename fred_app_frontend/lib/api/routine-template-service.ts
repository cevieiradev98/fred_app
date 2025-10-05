import { apiClient } from './client'

export interface RoutineTemplate {
  id: string
  period: 'morning' | 'afternoon' | 'evening'
  task: string
  is_active: boolean
  created_at: string
}

export interface CreateRoutineTemplateData {
  period: 'morning' | 'afternoon' | 'evening'
  task: string
}

export interface UpdateRoutineTemplateData {
  is_active?: boolean
  period?: 'morning' | 'afternoon' | 'evening'
  task?: string
}

export const routineTemplateService = {
  async getRoutineTemplates(petId: string, activeOnly: boolean = true): Promise<RoutineTemplate[]> {
    return apiClient.get<RoutineTemplate[]>(`/routine-templates?pet_id=${petId}&active_only=${activeOnly}`)
  },

  async createRoutineTemplate(petId: string, templateData: CreateRoutineTemplateData): Promise<RoutineTemplate> {
    return apiClient.post<RoutineTemplate>(`/routine-templates?pet_id=${petId}`, templateData)
  },

  async updateRoutineTemplate(templateId: string, updates: UpdateRoutineTemplateData): Promise<RoutineTemplate> {
    return apiClient.patch<RoutineTemplate>(`/routine-templates/${templateId}`, updates)
  },

  async deleteRoutineTemplate(templateId: string): Promise<void> {
    return apiClient.delete<void>(`/routine-templates/${templateId}`)
  },

  async ensureDailyTasks(petId: string, date?: string): Promise<any[]> {
    const targetDate = date || new Date().toISOString().split('T')[0]
    return apiClient.post<any[]>(`/routine-items/ensure-daily?pet_id=${petId}&date=${targetDate}`, {})
  }
}
