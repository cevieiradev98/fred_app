"use client"

import { useEffect, useState } from "react"
import { routineService, CreateRoutineItemData, UpdateRoutineItemData } from "@/lib/api/routine-service"
import { routineTemplateService, RoutineTemplate, CreateRoutineTemplateData, UpdateRoutineTemplateData } from "@/lib/api/routine-template-service"
import { glucoseService, CreateGlucoseReadingData } from "@/lib/api/glucose-service"
import { moodService, CreateMoodEntryData } from "@/lib/api/mood-service"
import { petService, CreatePetData } from "@/lib/api/pet-service"
import { RoutineItem, GlucoseReading, MoodEntry, Pet } from "@/types"

// Default pet ID for compatibility - will be managed by context later
const DEFAULT_PET_ID = "default-pet"

export function usePetData() {
  const [pets, setPets] = useState<Pet[]>([])
  const [currentPetId, setCurrentPetId] = useState<string>(DEFAULT_PET_ID)
  const [routineTemplates, setRoutineTemplates] = useState<RoutineTemplate[]>([])
  const [routineItems, setRoutineItems] = useState<RoutineItem[]>([])
  const [allRoutineItems, setAllRoutineItems] = useState<RoutineItem[]>([])
  const [glucoseReadings, setGlucoseReadings] = useState<GlucoseReading[]>([])
  const [moodEntries, setMoodEntries] = useState<MoodEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Load data on mount
  useEffect(() => {
    initializeApp()
  }, [])

  // Reload data when pet changes
  useEffect(() => {
    if (currentPetId && currentPetId !== DEFAULT_PET_ID) {
      loadPetData()
    }
  }, [currentPetId])

  const initializeApp = async () => {
    setIsLoading(true)
    try {
      await loadPets()
      // If no pets exist, create a default one
      const existingPets = await petService.getPets()
      if (existingPets.length === 0) {
        const defaultPet = await petService.createPet({
          name: "Meu Pet",
          breed: "Golden Retriever"
        })
        setPets([defaultPet])
        setCurrentPetId(defaultPet.id)
      } else {
        setPets(existingPets)
        setCurrentPetId(existingPets[0].id)
      }
    } catch (error) {
      console.error("Error initializing app:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadPets = async () => {
    try {
      const data = await petService.getPets()
      setPets(data)
    } catch (error) {
      console.error("Error loading pets:", error)
    }
  }

  const loadPetData = async () => {
    if (!currentPetId) return
    
    setIsLoading(true)
    try {
      // Ensure daily tasks exist before loading
      await ensureDailyTasks()
      
      await Promise.all([
        loadRoutineTemplates(),
        loadRoutineItems(),
        loadAllRoutineItems(),
        loadGlucoseReadings(),
        loadMoodEntries()
      ])
    } catch (error) {
      console.error("Error loading pet data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const ensureDailyTasks = async () => {
    if (!currentPetId) return
    try {
      const today = new Date().toISOString().split('T')[0]
      await routineTemplateService.ensureDailyTasks(currentPetId, today)
    } catch (error) {
      console.error("Error ensuring daily tasks:", error)
    }
  }

  const loadRoutineTemplates = async () => {
    if (!currentPetId) return
    try {
      const data = await routineTemplateService.getRoutineTemplates(currentPetId)
      setRoutineTemplates(data)
    } catch (error) {
      console.error("Error loading routine templates:", error)
    }
  }

  const loadRoutineItems = async () => {
    if (!currentPetId) return
    try {
      const data = await routineService.getRoutineItems(currentPetId)
      setRoutineItems(data)
    } catch (error) {
      console.error("Error loading routine items:", error)
    }
  }

  const loadAllRoutineItems = async () => {
    if (!currentPetId) return
    try {
      const data = await routineService.getAllRoutineItems(currentPetId)
      setAllRoutineItems(data)
    } catch (error) {
      console.error("Error loading all routine items:", error)
    }
  }

  const loadGlucoseReadings = async () => {
    if (!currentPetId) return
    try {
      const data = await glucoseService.getGlucoseReadings(currentPetId, 30)
      setGlucoseReadings(data)
    } catch (error) {
      console.error("Error loading glucose readings:", error)
    }
  }

  const loadMoodEntries = async () => {
    if (!currentPetId) return
    try {
      const data = await moodService.getMoodEntries(currentPetId, 30)
      setMoodEntries(data)
    } catch (error) {
      console.error("Error loading mood entries:", error)
    }
  }

  // Pet functions
  const addPet = async (petData: CreatePetData) => {
    try {
      const newPet = await petService.createPet(petData)
      await loadPets()
      setCurrentPetId(newPet.id)
      return newPet
    } catch (error) {
      console.error("Error adding pet:", error)
      throw error
    }
  }

  const switchPet = (petId: string) => {
    setCurrentPetId(petId)
  }

  // Routine functions
  const toggleRoutineItem = async (id: string, completed: boolean) => {
    try {
      await routineService.updateRoutineItem(id, {
        completed,
        completed_at: completed ? new Date().toISOString() : null,
      })
      await Promise.all([loadRoutineItems(), loadAllRoutineItems()])
    } catch (error) {
      console.error("Error updating routine item:", error)
    }
  }

  const addRoutineItem = async (period: "morning" | "afternoon" | "evening", task: string) => {
    if (!currentPetId) return
    try {
      // Create as template instead of direct routine item
      await routineTemplateService.createRoutineTemplate(currentPetId, { period, task })
      await loadRoutineTemplates()
      // Recreate today's tasks from updated templates
      await ensureDailyTasks()
      await Promise.all([loadRoutineItems(), loadAllRoutineItems()])
    } catch (error) {
      console.error("Error adding routine item:", error)
    }
  }

  const deleteRoutineItem = async (id: string) => {
    try {
      // Find the routine item to get its template_id
      const item = routineItems.find(i => i.id === id)
      
      if (item && item.template_id) {
        // If it has a template, delete the template (affects future days)
        await routineTemplateService.deleteRoutineTemplate(item.template_id)
        await loadRoutineTemplates()
      }
      
      // Also delete the current instance
      await routineService.deleteRoutineItem(id)
      await Promise.all([loadRoutineItems(), loadAllRoutineItems()])
    } catch (error) {
      console.error("Error deleting routine item:", error)
    }
  }

  // Template-specific functions
  const addRoutineTemplate = async (templateData: CreateRoutineTemplateData) => {
    if (!currentPetId) return
    try {
      await routineTemplateService.createRoutineTemplate(currentPetId, templateData)
      await loadRoutineTemplates()
      // Recreate today's tasks
      await ensureDailyTasks()
      await Promise.all([loadRoutineItems(), loadAllRoutineItems()])
    } catch (error) {
      console.error("Error adding routine template:", error)
    }
  }

  const updateRoutineTemplate = async (templateId: string, updates: UpdateRoutineTemplateData) => {
    try {
      await routineTemplateService.updateRoutineTemplate(templateId, updates)
      await loadRoutineTemplates()
      await ensureDailyTasks()
      await Promise.all([loadRoutineItems(), loadAllRoutineItems()])
    } catch (error) {
      console.error("Error updating routine template:", error)
    }
  }

  const deleteRoutineTemplate = async (templateId: string) => {
    try {
      await routineTemplateService.deleteRoutineTemplate(templateId)
      await loadRoutineTemplates()
      await ensureDailyTasks()
      await Promise.all([loadRoutineItems(), loadAllRoutineItems()])
    } catch (error) {
      console.error("Error deleting routine template:", error)
    }
  }

  // Glucose functions
  const addGlucoseReading = async (value: number, timeOfDay: string, protocol?: string, notes?: string) => {
    if (!currentPetId) return
    try {
      await glucoseService.createGlucoseReading(currentPetId, {
        value,
        time_of_day: timeOfDay,
        protocol,
        notes,
      })
      await loadGlucoseReadings()
    } catch (error) {
      console.error("Error adding glucose reading:", error)
    }
  }

  // Mood functions
  const addMoodEntry = async (entry: {
    energy_level: "alta" | "media" | "baixa"
    general_mood: string[]
    appetite: "alto" | "normal" | "baixo" | "nao-comeu"
    walk: "longo" | "curto" | "nao-passeou"
    notes?: string
  }) => {
    if (!currentPetId) return
    try {
      await moodService.createMoodEntry(currentPetId, entry)
      await loadMoodEntries()
    } catch (error) {
      console.error("Error adding mood entry:", error)
    }
  }

  const currentPet = pets.find(pet => pet.id === currentPetId)

  return {
    // Pet management
    pets,
    currentPet,
    currentPetId,
    addPet,
    switchPet,
    
    // Data
    routineTemplates,
    routineItems,
    allRoutineItems,
    glucoseReadings,
    moodEntries,
    isLoading,
    
    // Actions
    toggleRoutineItem,
    addRoutineItem,
    deleteRoutineItem,
    addGlucoseReading,
    addMoodEntry,
    
    // Template actions
    addRoutineTemplate,
    updateRoutineTemplate,
    deleteRoutineTemplate,
    
    refreshData: loadPetData,
    ensureDailyTasks,
  }
}
