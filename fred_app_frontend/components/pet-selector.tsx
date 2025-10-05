"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, User } from "lucide-react"
import { Pet } from "@/types"
import { CreatePetData } from "@/lib/api/pet-service"

interface PetSelectorProps {
  pets: Pet[]
  currentPet?: Pet
  onPetChange: (petId: string) => void
  onAddPet: (petData: CreatePetData) => Promise<Pet>
}

export function PetSelector({ pets, currentPet, onPetChange, onAddPet }: PetSelectorProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newPetData, setNewPetData] = useState<CreatePetData>({
    name: "",
    breed: "",
    age: undefined
  })

  const handleAddPet = async () => {
    if (!newPetData.name.trim()) return

    try {
      await onAddPet(newPetData)
      setNewPetData({ name: "", breed: "", age: undefined })
      setIsAddDialogOpen(false)
    } catch (error) {
      console.error("Error adding pet:", error)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={currentPet?.id || ""} onValueChange={onPetChange}>
        <SelectTrigger className="w-[200px]">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <SelectValue placeholder="Selecione um pet" />
          </div>
        </SelectTrigger>
        <SelectContent>
          {pets.map((pet) => (
            <SelectItem key={pet.id} value={pet.id}>
              <div className="flex flex-col">
                <span className="font-medium">{pet.name}</span>
                {pet.breed && <span className="text-xs text-muted-foreground">{pet.breed}</span>}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Pet</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="pet-name">Nome *</Label>
              <Input
                id="pet-name"
                value={newPetData.name}
                onChange={(e) => setNewPetData({ ...newPetData, name: e.target.value })}
                placeholder="Nome do pet"
              />
            </div>
            <div>
              <Label htmlFor="pet-breed">Raça</Label>
              <Input
                id="pet-breed"
                value={newPetData.breed || ""}
                onChange={(e) => setNewPetData({ ...newPetData, breed: e.target.value })}
                placeholder="Raça do pet"
              />
            </div>
            <div>
              <Label htmlFor="pet-age">Idade (anos)</Label>
              <Input
                id="pet-age"
                type="number"
                value={newPetData.age || ""}
                onChange={(e) => setNewPetData({ 
                  ...newPetData, 
                  age: e.target.value ? parseInt(e.target.value) : undefined 
                })}
                placeholder="Idade do pet"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddPet} disabled={!newPetData.name.trim()}>
                Adicionar Pet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
