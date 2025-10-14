import { apiClient } from "./client"
import { API_ENDPOINTS } from "./config"
import {
  WalkEntry,
  WalkEnergyLevel,
  WalkPauseSegment,
  WalkPeeColor,
  WalkPeeCount,
  WalkPeeVolume,
  WalkPoopConsistency,
} from "@/types"

export interface CreateWalkEntryData {
  start_time: string
  end_time?: string | null
  duration_seconds?: number | null
  pause_events?: WalkPauseSegment[] | null
  energy_level?: WalkEnergyLevel | null
  behavior?: string[] | null
  completed_route?: boolean | null
  pee_count?: WalkPeeCount | null
  pee_volume?: WalkPeeVolume | null
  pee_color?: WalkPeeColor | null
  poop_made?: boolean | null
  poop_consistency?: WalkPoopConsistency | null
  poop_blood?: boolean | null
  poop_mucus?: boolean | null
  poop_color?: string | null
  photos?: string[] | null
  weather?: string | null
  temperature_celsius?: number | null
  route_distance_km?: number | null
  route_description?: string | null
  mobility_notes?: string | null
  disorientation?: boolean | null
  excessive_panting?: boolean | null
  cough?: boolean | null
  notes?: string | null
  alerts?: string[] | null
  date?: string | null
}

export interface UpdateWalkEntryData extends Omit<CreateWalkEntryData, "start_time"> {
  start_time?: never
}

class WalkService {
  async getWalkEntries(
    petId: string,
    options: { limit?: number; startDate?: string; endDate?: string } = {},
  ): Promise<WalkEntry[]> {
    const searchParams = new URLSearchParams({ pet_id: petId })

    if (options.limit) {
      searchParams.set("limit", String(options.limit))
    }

    if (options.startDate) {
      searchParams.set("start_date", options.startDate)
    }

    if (options.endDate) {
      searchParams.set("end_date", options.endDate)
    }

    // Always default to most recent first
    searchParams.set("sort", "start_time:desc")

    return apiClient.get<WalkEntry[]>(`${API_ENDPOINTS.walks}?${searchParams.toString()}`)
  }

  async createWalkEntry(petId: string, data: CreateWalkEntryData): Promise<WalkEntry> {
    const payload = {
      ...data,
      start_time: data.start_time || new Date().toISOString(),
    }
    return apiClient.post<WalkEntry>(`${API_ENDPOINTS.walks}?pet_id=${petId}`, payload)
  }

  async updateWalkEntry(id: string, data: UpdateWalkEntryData): Promise<WalkEntry> {
    return apiClient.patch<WalkEntry>(`${API_ENDPOINTS.walks}/${id}`, data)
  }

  async deleteWalkEntry(id: string): Promise<void> {
    return apiClient.delete<void>(`${API_ENDPOINTS.walks}/${id}`)
  }
}

export const walkService = new WalkService()
