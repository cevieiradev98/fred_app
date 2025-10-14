// Pet interface
export interface Pet {
  id: string
  name: string
  breed?: string
  age?: number
  created_at: string
  updated_at?: string
}

// Routine interface (compatible with backend)
export interface RoutineItem {
  id: string
  template_id?: string
  period: "morning" | "afternoon" | "evening"
  task: string
  completed: boolean
  completed_at?: string
  date: string
}

// Glucose interface (compatible with backend)
export interface GlucoseReading {
  id: string
  value: number
  time_of_day: string
  protocol?: string
  notes?: string
  insulin_dose?: number | null
  date: string
  created_at: string
}

// Mood interface (compatible with backend)
export interface MoodEntry {
  id: string
  energy_level: "alta" | "media" | "baixa"
  general_mood: string[]
  appetite: "alto" | "normal" | "baixo" | "nao-comeu"
  walk: "longo" | "curto" | "nao-passeou"
  notes?: string
  date: string
  created_at: string
}

export type WalkEnergyLevel = "very-low" | "low" | "moderate" | "high" | "very-high"
export type WalkPeeCount = "none" | "1x" | "2x" | "3x-plus"
export type WalkPeeVolume = "low" | "normal" | "high"
export type WalkPeeColor = "normal" | "dark" | "blood"
export type WalkPoopConsistency = "hard" | "normal" | "soft" | "diarrhea"
export type SeniorAlertTag = "mobility" | "disorientation" | "panting" | "cough"

export interface WalkPauseSegment {
  started_at: string
  ended_at?: string | null
}

export interface WalkEntry {
  id: string
  date: string
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
  created_at: string
}

// Legacy interfaces for backward compatibility
export interface DailyTask {
  id: string
  time: string
  task: string
  completed: boolean
}

export interface GlicemiaRecord {
  id: string
  value: number
  timestamp: Date
  protocol: string
  color: string
}

export interface HumorRecord {
  id: string
  energia: number
  apetite: number
  humor: number
  observacoes: string
  passeou: boolean
  comeuBem: boolean
  timestamp: Date
}

// Interfaces preparadas para integração futura com Supabase
export interface Database {
  public: {
    Tables: {
      daily_tasks: {
        Row: DailyTask & { pet_id: string; date: string }
        Insert: Omit<DailyTask, "id"> & { pet_id: string; date: string }
        Update: Partial<DailyTask>
      }
      glicemia_records: {
        Row: GlicemiaRecord & { pet_id: string }
        Insert: Omit<GlicemiaRecord, "id"> & { pet_id: string }
        Update: Partial<GlicemiaRecord>
      }
      humor_records: {
        Row: HumorRecord & { pet_id: string }
        Insert: Omit<HumorRecord, "id"> & { pet_id: string }
        Update: Partial<HumorRecord>
      }
    }
  }
}
