import { apiClient } from './client'
import { API_ENDPOINTS } from './config'
import { Pet } from '../../types'

export interface CreatePetData {
  name: string
  breed?: string
  age?: number
}

class PetService {
  async getPets(): Promise<Pet[]> {
    return apiClient.get<Pet[]>(API_ENDPOINTS.pets)
  }

  async getPet(id: string): Promise<Pet> {
    return apiClient.get<Pet>(`${API_ENDPOINTS.pets}/${id}`)
  }

  async createPet(data: CreatePetData): Promise<Pet> {
    return apiClient.post<Pet>(API_ENDPOINTS.pets, data)
  }

  async deletePet(id: string): Promise<void> {
    return apiClient.delete<void>(`${API_ENDPOINTS.pets}/${id}`)
  }
}

export const petService = new PetService()
