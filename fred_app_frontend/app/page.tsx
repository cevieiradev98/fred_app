"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Clock,
  CheckCircle2,
  RotateCcw,
  Home,
  Droplets,
  Brain,
  Plus,
  Trash2,
  History,
  ListChecks,
  Gauge,
  TrendingDown,
  TrendingUp,
  Syringe,
  Footprints,
  PauseCircle,
  PlayCircle,
  StopCircle,
  Activity,
  Timer,
  AlertTriangle,
  Thermometer,
  MapPin,
  CloudSun,
  Camera,
} from "lucide-react"
import { usePetData } from "@/hooks/use-pet-data"
import {
  RoutineItem,
  GlucoseReading,
  WalkEntry,
  WalkEnergyLevel,
  WalkPeeCount,
  WalkPeeVolume,
  WalkPeeColor,
  WalkPoopConsistency,
} from "@/types"
import { PWAInstall } from "@/components/pwa-install"
import { OfflineIndicator } from "@/components/offline-indicator"
import { ToastContainer, toast } from "@/components/ui/toast"
import { ChartContainer, ChartTooltip } from "@/components/ui/chart"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine, ReferenceArea, Area } from "recharts"
import { ThemeToggle } from "@/components/theme-toggle"

interface GlicemiaRecord {
  id: string
  value: number
  timestamp: Date
  protocol: string
  color: string
}

interface HumorRecord {
  energia: "alta" | "media" | "baixa"
  apetite: "alto" | "normal" | "baixo" | "nao-comeu"
  humor: string[]
  observacoes: string
  passeio: "longo" | "curto" | "nao-passeou"
  timestamp: Date
}

const TIME_OF_DAY_LABELS: Record<string, string> = {
  morning: "Manhã",
  afternoon: "Tarde",
  evening: "Noite",
  dawn: "Madrugada",
}

const WALK_ENERGY_OPTIONS: { value: WalkEnergyLevel; label: string }[] = [
  { value: "very-low", label: "Muito baixo" },
  { value: "low", label: "Baixo" },
  { value: "moderate", label: "Moderado" },
  { value: "high", label: "Alto" },
  { value: "very-high", label: "Muito animado" },
]

const WALK_ENERGY_SCORE: Record<WalkEnergyLevel, number> = {
  "very-low": 1,
  low: 2,
  moderate: 3,
  high: 4,
  "very-high": 5,
}

const WALK_BEHAVIOR_OPTIONS: { value: string; label: string }[] = [
  { value: "pulling-leash", label: "Puxou a guia" },
  { value: "steady-pace", label: "Andou no ritmo" },
  { value: "lagging-behind", label: "Ficou para trás" },
  { value: "needed-encouragement", label: "Precisou de incentivo" },
]

const WALK_PEE_COUNT_OPTIONS: { value: WalkPeeCount; label: string }[] = [
  { value: "none", label: "Não fez" },
  { value: "1x", label: "1x" },
  { value: "2x", label: "2x" },
  { value: "3x-plus", label: "3x ou mais" },
]

const WALK_PEE_VOLUME_OPTIONS: { value: WalkPeeVolume; label: string }[] = [
  { value: "low", label: "Pouco" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "Muito" },
]

const WALK_PEE_COLOR_OPTIONS: { value: WalkPeeColor; label: string }[] = [
  { value: "normal", label: "Normal" },
  { value: "dark", label: "Escura" },
  { value: "blood", label: "Com sangue" },
]

const WALK_POOP_CONSISTENCY_OPTIONS: { value: WalkPoopConsistency; label: string }[] = [
  { value: "hard", label: "Dura" },
  { value: "normal", label: "Normal" },
  { value: "soft", label: "Mole" },
  { value: "diarrhea", label: "Diarreia" },
]

const WALK_ENERGY_LABEL_MAP: Record<WalkEnergyLevel, string> = WALK_ENERGY_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option.label
    return acc
  },
  {} as Record<WalkEnergyLevel, string>
)

const WALK_PEE_COUNT_VALUE: Record<WalkPeeCount, number> = {
  none: 0,
  "1x": 1,
  "2x": 2,
  "3x-plus": 3,
}

const formatDuration = (totalSeconds: number) => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`
  }
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

export default function FredCareApp() {
  const {
    routineItems,
    allRoutineItems,
    glucoseReadings,
    moodEntries,
    walkEntries,
    isLoading,
    toggleRoutineItem,
    addRoutineItem,
    deleteRoutineItem,
    addGlucoseReading,
    updateGlucoseReading,
    addMoodEntry,
    createWalkEntry,
    updateWalkEntry,
    deleteWalkEntry,
    refreshData,
  } = usePetData()

  const [currentTab, setCurrentTab] = useState<"inicio" | "dashboard" | "glicemia" | "humor" | "passeios" | "historico">("inicio")
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false)
  const [newTaskTime, setNewTaskTime] = useState("")
  const [newTaskDescription, setNewTaskDescription] = useState("")
  const [newTaskPeriod, setNewTaskPeriod] = useState<"morning" | "afternoon" | "evening">("morning")

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("SW registered: ", registration)
        })
        .catch((registrationError) => {
          console.log("SW registration failed: ", registrationError)
        })
    }
  }, [])

  const toggleTask = async (taskId: string) => {
    const task = routineItems.find((t) => t.id === taskId)
    if (!task) return

    const newCompleted = !task.completed
    await toggleRoutineItem(taskId, newCompleted)

    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    toast.success(newCompleted ? "Tarefa concluída!" : "Tarefa desmarcada")
  }

  const addTask = async () => {
    if (!newTaskTime || !newTaskDescription) {
      toast.error("Preencha horário e descrição")
      return
    }

    const taskWithTime = `${newTaskTime} - ${newTaskDescription}`
    await addRoutineItem(newTaskPeriod, taskWithTime)

    setNewTaskTime("")
    setNewTaskDescription("")
    setIsAddTaskModalOpen(false)
    toast.success("Tarefa adicionada!")
  }

  const deleteTask = async (taskId: string) => {
    await deleteRoutineItem(taskId)
    toast.success("Tarefa removida!")
  }

  const resetDay = async () => {
    // Reset all completed tasks
    for (const task of routineItems.filter((t) => t.completed)) {
      await toggleRoutineItem(task.id, false)
    }
    toast.success("Dia resetado com sucesso!")
  }

  const completedTasks = routineItems.filter((task) => task.completed).length
  const progressPercentage = routineItems.length > 0 ? (completedTasks / routineItems.length) * 100 : 0

  const renderRoutineSection = () => {
    const periodNames = {
      morning: "Manhã",
      afternoon: "Tarde",
      evening: "Noite",
    }

    const groupedTasks = routineItems.reduce((acc, task) => {
      if (!acc[task.period]) acc[task.period] = []
      acc[task.period].push(task)
      return acc
    }, {} as Record<string, RoutineItem[]>)

    return (
      <>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Rotina Diária</h2>
          <Button size="sm" onClick={() => setIsAddTaskModalOpen(true)} className="h-8 px-3 text-xs">
            <Plus className="h-3 w-3 mr-1" />
            Nova Tarefa
          </Button>
        </div>

        {Object.entries(groupedTasks).map(([period, tasks]) => (
          <Card key={period}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {periodNames[period as keyof typeof periodNames]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className={`group flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    task.completed ? "bg-muted/60 opacity-60" : "bg-background hover:bg-muted/30"
                  }`}
                >
                  <Checkbox
                    checked={task.completed}
                    onCheckedChange={() => toggleTask(task.id)}
                    className="h-6 w-6 rounded-md border-2"
                  />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${task.completed ? "line-through text-muted-foreground" : ""}`}>
                      {task.task}
                    </p>
                  </div>
                  <Button
                    aria-label="Remover tarefa"
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteTask(task.id)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-red-600 hover:bg-red-50 focus:text-red-600 focus:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}

        <Dialog open={isAddTaskModalOpen} onOpenChange={setIsAddTaskModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar nova tarefa</DialogTitle>
              <DialogDescription>Defina o horário, período e descrição para incluir na rotina diária.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Horário</span>
                  <input
                    type="time"
                    value={newTaskTime}
                    onChange={(e) => setNewTaskTime(e.target.value)}
                    className="px-3 py-2 border rounded-md text-sm"
                    placeholder="Horário"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Período</span>
                  <select
                    value={newTaskPeriod}
                    onChange={(e) => setNewTaskPeriod(e.target.value as "morning" | "afternoon" | "evening")}
                    className="px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="morning">Manhã</option>
                    <option value="afternoon">Tarde</option>
                    <option value="evening">Noite</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-sm font-medium">Descrição</span>
                <input
                  type="text"
                  value={newTaskDescription}
                  onChange={(e) => setNewTaskDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm"
                  placeholder="Descrição da tarefa"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={addTask}>
                <Plus className="h-3 w-3 mr-1" />
                Adicionar Tarefa
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  const renderDashboard = () => {
    return (
      <div className="space-y-6 pb-20">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Progresso do Dia</CardTitle>
              <Button variant="outline" size="sm" onClick={resetDay} className="h-8 px-3 text-xs bg-transparent">
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Progress value={progressPercentage} className="flex-1 h-2" />
              <span className="text-sm font-medium text-muted-foreground">
                {completedTasks}/{routineItems.length}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              <span>{Math.round(progressPercentage)}% concluído</span>
            </div>
          </CardContent>
        </Card>

        {renderRoutineSection()}
      </div>
    )
  }

  const GlucoseRegistrationCard = () => {
    const [newValue, setNewValue] = useState("")

    const handleAddReading = async () => {
      const value = Number.parseInt(newValue)
      if (!value || value < 50 || value > 500) {
        toast.error("Valor deve estar entre 50 e 500 mg/dL")
        return
      }

      let protocol = ""

      if (value < 80) {
        protocol = "⚠️ HIPOGLICEMIA - Dar mel ou açúcar imediatamente"
      } else if (value <= 150) {
        protocol = "✅ Normal - Continuar rotina"
      } else if (value <= 250) {
        protocol = "⚠️ Alto - Verificar alimentação e insulina"
      } else {
        protocol = "🚨 MUITO ALTO - Contatar veterinário"
      }

      await addGlucoseReading(value, "", protocol)
      setNewValue("")
      toast.success("Glicemia registrada!")
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registrar Glicemia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2">
            <input
              type="number"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="Valor em mg/dL"
              className="px-3 py-2 border rounded-md text-sm"
              min="50"
              max="500"
            />
            <p className="text-xs text-muted-foreground">
              O período do dia será determinado automaticamente pelo horário do registro
            </p>
          </div>
          <Button onClick={handleAddReading} className="w-full">
            <Droplets className="h-4 w-4 mr-2" />
            Registrar
          </Button>
        </CardContent>
      </Card>
    )
  }

  const GlicemiaPage = () => {
    const monthAgo = new Date()
    monthAgo.setMonth(monthAgo.getMonth() - 1)

    const readingsLastMonth = glucoseReadings.filter((reading) => {
      const readingDate = new Date(reading.created_at)
      if (Number.isNaN(readingDate.getTime())) return false
      return readingDate >= monthAgo
    })

    const lastReading = glucoseReadings[0] ?? null
    const minReadingEntry = readingsLastMonth.length
      ? readingsLastMonth.reduce((min, reading) => (reading.value < min.value ? reading : min), readingsLastMonth[0])
      : null
    const maxReadingEntry = readingsLastMonth.length
      ? readingsLastMonth.reduce((max, reading) => (reading.value > max.value ? reading : max), readingsLastMonth[0])
      : null
    const averageReading =
      readingsLastMonth.length > 0
        ? readingsLastMonth.reduce((total, reading) => total + reading.value, 0) / readingsLastMonth.length
        : null

    const formatDateTime = (value?: string) => {
      if (!value) return null
      const parsed = new Date(value)
      if (Number.isNaN(parsed.getTime())) return null
      return parsed.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    }

    const chartData = glucoseReadings
      .slice(0, 14)
      .reverse()
      .map((reading) => {
        const createdAt = new Date(reading.created_at)
        const shortLabel = createdAt
          .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
          .replace(".", "")
        const detailedLabel = createdAt.toLocaleString("pt-BR", {
          day: "2-digit",
          month: "long",
          hour: "2-digit",
          minute: "2-digit",
        })

        return {
          id: reading.id,
          value: reading.value,
          label: shortLabel,
          tooltipLabel: detailedLabel,
          timeOfDay: TIME_OF_DAY_LABELS[reading.time_of_day] ?? reading.time_of_day,
          insulinDose: reading.insulin_dose,
          protocol: reading.protocol,
        }
      })

    const renderGlucoseDot = (props: any) => {
      const { cx, cy, value } = props
      if (typeof cx !== "number" || typeof cy !== "number") return null

      const statusColor =
        value < 80 ? "#ef4444" : value > 250 ? "#d97706" : value > 150 ? "#f97316" : "#2563eb"

      return (
        <g>
          <circle cx={cx} cy={cy} r={6} fill="hsl(var(--background))" stroke={statusColor} strokeWidth={2} />
          <circle cx={cx} cy={cy} r={3} fill={statusColor} />
        </g>
      )
    }

    const GlucoseTooltip = ({ active, payload }: any) => {
      if (!active || !payload || !payload.length) return null
      const item = payload[0].payload

      return (
        <div className="flex min-w-[180px] flex-col gap-2 rounded-lg border border-border bg-background/95 p-3 text-sm shadow-lg backdrop-blur">
          <div className="space-y-1">
            <p className="text-[0.65rem] font-semibold uppercase text-muted-foreground">Registro</p>
            <p className="font-semibold leading-snug text-foreground">{item.tooltipLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-blue-600 dark:text-blue-300">{item.value} mg/dL</span>
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-blue-700 dark:bg-slate-800 dark:text-blue-200">
              {item.timeOfDay}
            </span>
          </div>
          {item.insulinDose !== null && item.insulinDose !== undefined && (
            <p className="text-xs text-muted-foreground">Insulina aplicada: {item.insulinDose} U</p>
          )}
          {item.protocol && <p className="text-xs leading-relaxed text-muted-foreground">{item.protocol}</p>}
        </div>
      )
    }

    const [selectedReading, setSelectedReading] = useState<GlucoseReading | null>(null)
    const [isInsulinModalOpen, setIsInsulinModalOpen] = useState(false)
    const [insulinInput, setInsulinInput] = useState("")
    const [isSavingInsulin, setIsSavingInsulin] = useState(false)

    const handleCardClick = (reading: GlucoseReading) => {
      setSelectedReading(reading)
      setInsulinInput(
        reading.insulin_dose !== null && reading.insulin_dose !== undefined ? reading.insulin_dose.toString() : ""
      )
      setIsInsulinModalOpen(true)
    }

    const handleCloseInsulinModal = (open: boolean) => {
      setIsInsulinModalOpen(open)
      if (!open) {
        setSelectedReading(null)
        setInsulinInput("")
        setIsSavingInsulin(false)
      }
    }

    const handleInsulinSave = async () => {
      if (!selectedReading) return

      const trimmed = insulinInput.trim()
      let insulinValue: number | null = null

      if (trimmed !== "") {
        const normalized = trimmed.replace(",", ".")
        const parsed = Number.parseFloat(normalized)

        if (Number.isNaN(parsed)) {
          toast.error("Informe um número válido para a dose de insulina")
          return
        }

        if (parsed < 0) {
          toast.error("A dose de insulina não pode ser negativa")
          return
        }

        if (parsed > 100) {
          toast.error("A dose de insulina parece muito alta. Verifique o valor informado.")
          return
        }

        insulinValue = Number.parseFloat(parsed.toFixed(2))
      }

      try {
        setIsSavingInsulin(true)
        await updateGlucoseReading(selectedReading.id, { insulin_dose: insulinValue })
        toast.success(insulinValue !== null ? "Dose de insulina registrada!" : "Dose de insulina removida!")
        handleCloseInsulinModal(false)
      } catch (error) {
        console.error(error)
        toast.error("Não foi possível salvar a dose de insulina. Tente novamente.")
      } finally {
        setIsSavingInsulin(false)
      }
    }

    return (
      <div className="space-y-6 pb-20">
        <GlucoseRegistrationCard />

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Última leitura</span>
                <Clock className="h-4 w-4" />
              </div>
              <div className="mt-2">
                <p className="text-2xl font-bold">
                  {lastReading ? `${lastReading.value} mg/dL` : "--"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {lastReading ? formatDateTime(lastReading.created_at) ?? "Sem data" : "Sem registros"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Menor (30 dias)</span>
                <TrendingDown className="h-4 w-4" />
              </div>
              <div className="mt-2">
                <p className="text-2xl font-bold">
                  {minReadingEntry ? `${minReadingEntry.value} mg/dL` : "--"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {minReadingEntry
                    ? formatDateTime(minReadingEntry.created_at) ?? "Sem data"
                    : "Sem registros no período"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Maior (30 dias)</span>
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="mt-2">
                <p className="text-2xl font-bold">
                  {maxReadingEntry ? `${maxReadingEntry.value} mg/dL` : "--"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {maxReadingEntry
                    ? formatDateTime(maxReadingEntry.created_at) ?? "Sem data"
                    : "Sem registros no período"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Média (30 dias)</span>
                <Gauge className="h-4 w-4" />
              </div>
              <div className="mt-2">
                <p className="text-2xl font-bold">
                  {averageReading !== null ? `${averageReading.toFixed(1)} mg/dL` : "--"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {averageReading !== null
                    ? `Considerando ${readingsLastMonth.length} registros`
                    : "Sem registros no período"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Histórico de Glicemia</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  value: {
                    label: "Glicemia (mg/dL)",
                    color: "hsl(var(--chart-1))",
                  },
                }}
                className="h-[240px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{
                      top: 30,
                      right: 12,
                      left: 12,
                      bottom: 10,
                    }}
                  >
                    <defs>
                      <linearGradient id="glucoseArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="6 8" stroke="hsl(var(--chart-grid, 215 20% 83%))" strokeOpacity={0.6} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={12}
                      fontSize={12}
                      tickFormatter={(value: string) => value.toUpperCase()}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      width={46}
                      fontSize={12}
                      domain={["dataMin - 20", "dataMax + 20"]}
                      tickFormatter={(value) => `${value}`}
                    />
                    <ChartTooltip content={<GlucoseTooltip />} cursor={{ strokeDasharray: "4 4", stroke: "hsl(var(--muted-foreground))" }} />
                    <ReferenceArea y1={80} y2={150} fill="hsl(var(--chart-2, 152 76% 65%))" fillOpacity={0.08} />
                    <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="6 4" />
                    <ReferenceLine y={150} stroke="#22c55e" strokeDasharray="6 4" />
                    <ReferenceLine y={250} stroke="#f59e0b" strokeDasharray="6 4" />
                    <Area type="monotone" dataKey="value" stroke="none" fill="url(#glucoseArea)" />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="var(--color-value)"
                      strokeWidth={3}
                      dot={renderGlucoseDot}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {glucoseReadings.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                Nenhum registro de glicemia encontrado. Adicione uma nova medição para começar.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {glucoseReadings.map((reading) => (
                <Card
                  key={reading.id}
                  onClick={() => handleCardClick(reading)}
                  role="button"
                  aria-label={`Registrar insulina para glicemia de ${reading.value} mg/dL`}
                  className="group cursor-pointer border border-blue-100/80 bg-gradient-to-br from-white via-blue-50/60 to-blue-100/30 transition-all hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-md dark:border-slate-700 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800"
                >
                  <CardContent className="flex h-full flex-col justify-between gap-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Glicemia</p>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          {reading.value}
                          <span className="ml-1 text-sm font-semibold text-muted-foreground">mg/dL</span>
                        </p>
                      </div>
                      {reading.insulin_dose !== null && reading.insulin_dose !== undefined ? (
                        <Badge className="gap-1 bg-blue-600/15 text-blue-700 hover:bg-blue-600/25 dark:bg-blue-500/15 dark:text-blue-200">
                          <Syringe className="h-3.5 w-3.5" />
                          {reading.insulin_dose} U
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 border-dashed text-muted-foreground">
                          <Syringe className="h-3.5 w-3.5" />
                          Sem dose
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{new Date(reading.created_at).toLocaleString("pt-BR")}</span>
                      </div>
                      <div className="flex items-center gap-2 text-foreground">
                        <Droplets className="h-4 w-4 text-blue-500 dark:text-blue-300" />
                        <span>{TIME_OF_DAY_LABELS[reading.time_of_day] ?? reading.time_of_day}</span>
                      </div>
                    </div>

                    {reading.protocol && (
                      <p className="rounded-md bg-blue-50 p-3 text-xs text-blue-700 shadow-sm group-hover:bg-blue-100 dark:bg-slate-800 dark:text-blue-200 dark:group-hover:bg-slate-700">
                        {reading.protocol}
                      </p>
                    )}

                    <p className="flex items-center gap-2 text-xs font-medium text-blue-600 transition-colors group-hover:text-blue-700 dark:text-blue-300">
                      <Syringe className="h-3 w-3" />
                      {reading.insulin_dose !== null && reading.insulin_dose !== undefined
                        ? "Editar dose registrada"
                        : "Adicionar dose de insulina"}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <Dialog open={isInsulinModalOpen} onOpenChange={handleCloseInsulinModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Registrar insulina aplicada</DialogTitle>
              <DialogDescription>
                {selectedReading
                  ? `Informe a dose de insulina aplicada para a medição de ${selectedReading.value} mg/dL.`
                  : "Informe a dose de insulina aplicada para esta medição."}
              </DialogDescription>
            </DialogHeader>

            {selectedReading && (
              <div className="space-y-5">
                <div className="rounded-md border border-dashed border-blue-200 bg-blue-50/60 p-3 text-sm dark:border-slate-700 dark:bg-slate-900/80">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-700 dark:text-blue-200">
                      {selectedReading.value} mg/dL
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {TIME_OF_DAY_LABELS[selectedReading.time_of_day] ?? selectedReading.time_of_day}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(selectedReading.created_at).toLocaleString("pt-BR")}
                  </p>
                  {selectedReading.protocol && (
                    <p className="mt-2 rounded bg-white/60 p-2 text-xs text-blue-700 dark:bg-slate-800 dark:text-blue-200">
                      {selectedReading.protocol}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="insulin-dose" className="text-sm font-medium">
                    Dose aplicada (unidades)
                  </label>
                  <input
                    id="insulin-dose"
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max="100"
                    step="0.1"
                    value={insulinInput}
                    onChange={(e) => setInsulinInput(e.target.value)}
                    placeholder="Ex: 2.5"
                    className="w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-slate-700 dark:bg-slate-900"
                  />
                  <p className="text-xs text-muted-foreground">
                    Deixe em branco caso não tenha sido aplicada insulina nesta medição.
                  </p>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:justify-end">
              <Button
                variant="outline"
                onClick={() => handleCloseInsulinModal(false)}
                disabled={isSavingInsulin}
                className="sm:w-auto"
              >
                Cancelar
              </Button>
              <Button onClick={handleInsulinSave} disabled={isSavingInsulin} className="sm:w-auto">
                {isSavingInsulin ? "Salvando..." : "Salvar dose"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  const WalksPage = () => {
    interface WalkFormState {
      walkId: string
      energy_level: WalkEnergyLevel | null
      behavior: string[]
      completed_route: boolean
      pee_count: WalkPeeCount | null
      pee_volume: WalkPeeVolume | null
      pee_color: WalkPeeColor | null
      poop_made: boolean
      poop_consistency: WalkPoopConsistency | null
      poop_blood: boolean
      poop_mucus: boolean
      poop_color: string
      weather: string
      temperature_celsius: string
      route_distance_km: string
      route_description: string
      mobility_notes: string
      disorientation: boolean
      excessive_panting: boolean
      cough: boolean
      notes: string
      photosText: string
    }

    const [isFinishModalOpen, setIsFinishModalOpen] = useState(false)
    const [processingAction, setProcessingAction] = useState<null | "start" | "pause" | "resume" | "finish" | "cancel">(null)
    const [walkForm, setWalkForm] = useState<WalkFormState | null>(null)
    const [timerTick, setTimerTick] = useState(() => Date.now())
    const [lastGeneratedAlerts, setLastGeneratedAlerts] = useState<string[]>([])

    const activeWalk = useMemo(() => {
      const openWalks = walkEntries.filter((entry) => !entry.end_time)
      if (openWalks.length === 0) {
        return null
      }
      const sorted = [...openWalks].sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
      return sorted[0]
    }, [walkEntries])

    const completedWalks = useMemo(() => {
      const closed = walkEntries.filter((entry) => entry.end_time)
      return [...closed].sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())
    }, [walkEntries])

    const isPaused = useMemo(() => {
      if (!activeWalk) return false
      const pauses = activeWalk.pause_events ?? []
      if (pauses.length === 0) return false
      const lastPause = pauses[pauses.length - 1]
      return !lastPause?.ended_at
    }, [activeWalk])

    const buildWalkFormState = useCallback((entry: WalkEntry): WalkFormState => {
      return {
        walkId: entry.id,
        energy_level: (entry.energy_level as WalkEnergyLevel | null) ?? null,
        behavior: entry.behavior ? [...entry.behavior] : [],
        completed_route: entry.completed_route !== false,
        pee_count: (entry.pee_count as WalkPeeCount | null) ?? null,
        pee_volume: (entry.pee_volume as WalkPeeVolume | null) ?? null,
        pee_color: (entry.pee_color as WalkPeeColor | null) ?? null,
        poop_made: entry.poop_made ?? false,
        poop_consistency: (entry.poop_consistency as WalkPoopConsistency | null) ?? null,
        poop_blood: Boolean(entry.poop_blood),
        poop_mucus: Boolean(entry.poop_mucus),
        poop_color: entry.poop_color ?? "",
        weather: entry.weather ?? "",
        temperature_celsius:
          entry.temperature_celsius !== null && entry.temperature_celsius !== undefined ? String(entry.temperature_celsius) : "",
        route_distance_km:
          entry.route_distance_km !== null && entry.route_distance_km !== undefined ? String(entry.route_distance_km) : "",
        route_description: entry.route_description ?? "",
        mobility_notes: entry.mobility_notes ?? "",
        disorientation: Boolean(entry.disorientation),
        excessive_panting: Boolean(entry.excessive_panting),
        cough: Boolean(entry.cough),
        notes: entry.notes ?? "",
        photosText: entry.photos?.join("\n") ?? "",
      }
    }, [])

    useEffect(() => {
      if (!activeWalk) {
        setWalkForm(null)
        return
      }
      const interval = window.setInterval(() => setTimerTick(Date.now()), 1000)
      return () => window.clearInterval(interval)
    }, [activeWalk, isPaused])

    useEffect(() => {
      if (!activeWalk) {
        setWalkForm(null)
        return
      }
      setWalkForm((prev) => {
        if (prev && prev.walkId === activeWalk.id) {
          return prev
        }
        setLastGeneratedAlerts([])
        return buildWalkFormState(activeWalk)
      })
    }, [activeWalk, buildWalkFormState])

    const computeElapsedSeconds = useCallback(
      (entry: WalkEntry, referenceTime?: number) => {
        const startTimestamp = new Date(entry.start_time).getTime()
        if (!Number.isFinite(startTimestamp)) {
          return 0
        }
        const reference = referenceTime ?? timerTick
        const endTimestamp = entry.end_time ? new Date(entry.end_time).getTime() : reference
        const effectiveEnd = Number.isFinite(endTimestamp) ? endTimestamp : reference
        const pauses = entry.pause_events ?? []
        const pausedMs = pauses.reduce((acc, pause) => {
          if (!pause?.started_at) return acc
          const pauseStart = new Date(pause.started_at).getTime()
          if (!Number.isFinite(pauseStart)) return acc
          const pauseEndRaw = pause.ended_at ? new Date(pause.ended_at).getTime() : reference
          if (!Number.isFinite(pauseEndRaw) || pauseEndRaw < pauseStart) return acc
          return acc + (pauseEndRaw - pauseStart)
        }, 0)
        const elapsedMs = Math.max(0, effectiveEnd - startTimestamp - pausedMs)
        return Math.round(elapsedMs / 1000)
      },
      [timerTick]
    )

    const activeElapsedSeconds = activeWalk ? computeElapsedSeconds(activeWalk) : 0

    const setFormField = useCallback(
      <K extends keyof WalkFormState>(field: K, value: WalkFormState[K]) => {
        setWalkForm((prev) => (prev ? { ...prev, [field]: value } : prev))
      },
      []
    )

    const handleToggleBehavior = useCallback((value: string) => {
      setWalkForm((prev) => {
        if (!prev) return prev
        const alreadySelected = prev.behavior.includes(value)
        const nextBehavior = alreadySelected ? prev.behavior.filter((item) => item !== value) : [...prev.behavior, value]
        return { ...prev, behavior: nextBehavior }
      })
    }, [])

    const getBehaviorLabel = useCallback((value: string) => {
      const option = WALK_BEHAVIOR_OPTIONS.find((item) => item.value === value)
      return option ? option.label : value
    }, [])

    const formatPeeSummary = useCallback((entry: WalkEntry) => {
      if (!entry.pee_count) return "Não informado"
      const countLabel = WALK_PEE_COUNT_OPTIONS.find((option) => option.value === entry.pee_count)?.label ?? entry.pee_count
      const pieces = [countLabel]
      if (entry.pee_volume) {
        pieces.push(WALK_PEE_VOLUME_OPTIONS.find((option) => option.value === entry.pee_volume)?.label ?? entry.pee_volume)
      }
      if (entry.pee_color && entry.pee_color !== "normal") {
        pieces.push(WALK_PEE_COLOR_OPTIONS.find((option) => option.value === entry.pee_color)?.label ?? entry.pee_color)
      }
      return pieces.join(" • ")
    }, [])

    const formatPoopSummary = useCallback((entry: WalkEntry) => {
      if (!entry.poop_made) return "Não fez"
      const pieces: string[] = []
      if (entry.poop_consistency) {
        pieces.push(
          WALK_POOP_CONSISTENCY_OPTIONS.find((option) => option.value === entry.poop_consistency)?.label ?? entry.poop_consistency
        )
      }
      const flags: string[] = []
      if (entry.poop_blood) flags.push("sangue")
      if (entry.poop_mucus) flags.push("muco")
      if (flags.length) {
        pieces.push(flags.join(" e "))
      }
      return pieces.join(" • ") || "Fez"
    }, [])

    const computeAlertMessages = useCallback(
      (entry: WalkEntry, history: WalkEntry[]) => {
        const messages = new Set<string>()

        const entryPeeValue =
          entry.pee_count && entry.pee_count in WALK_PEE_COUNT_VALUE
            ? WALK_PEE_COUNT_VALUE[entry.pee_count as WalkPeeCount]
            : null
        const historyPeeValues = history
          .map((item) =>
            item.pee_count && item.pee_count in WALK_PEE_COUNT_VALUE
              ? WALK_PEE_COUNT_VALUE[item.pee_count as WalkPeeCount]
              : null
          )
          .filter((value): value is number => value !== null)

        if (entryPeeValue !== null && historyPeeValues.length) {
          const avgPee = historyPeeValues.reduce((acc, value) => acc + value, 0) / historyPeeValues.length
          if (avgPee > 0 && entryPeeValue < avgPee) {
            const diffPercent = Math.round(((avgPee - entryPeeValue) / avgPee) * 100)
            if (diffPercent >= 30) {
              messages.add("Xixi 30% abaixo do padrão recente.")
            } else if (avgPee - entryPeeValue >= 1) {
              messages.add("Menor frequência de xixi que o habitual.")
            }
          }
        } else if (entryPeeValue === 0 && historyPeeValues.length && historyPeeValues.every((value) => value > 0)) {
          messages.add("Sem xixi neste passeio, diferente dos anteriores.")
        }

        if (entry.pee_color === "blood") {
          messages.add("Sangue no xixi: acompanhe e contate o veterinário se persistir.")
        } else if (entry.pee_color === "dark") {
          messages.add("Xixi mais escuro que o normal.")
        }

        const entryEnergyScore =
          entry.energy_level && entry.energy_level in WALK_ENERGY_SCORE
            ? WALK_ENERGY_SCORE[entry.energy_level as WalkEnergyLevel]
            : null
        const historyEnergyScores = history
          .map((item) =>
            item.energy_level && item.energy_level in WALK_ENERGY_SCORE
              ? WALK_ENERGY_SCORE[item.energy_level as WalkEnergyLevel]
              : null
          )
          .filter((value): value is number => value !== null)

        if (entryEnergyScore !== null && historyEnergyScores.length) {
          const avgEnergy = historyEnergyScores.reduce((acc, value) => acc + value, 0) / historyEnergyScores.length
          if (avgEnergy > 0 && entryEnergyScore < avgEnergy) {
            const diffPercent = Math.round(((avgEnergy - entryEnergyScore) / avgEnergy) * 100)
            if (diffPercent >= 30) {
              messages.add("Energia abaixo do padrão dos últimos passeios.")
            } else if (avgEnergy - entryEnergyScore >= 1.5) {
              messages.add("Queda relevante de energia registrada.")
            }
          }
        }

        const entryDuration =
          entry.duration_seconds !== undefined && entry.duration_seconds !== null
            ? entry.duration_seconds
            : entry.end_time
              ? computeElapsedSeconds(entry, new Date(entry.end_time).getTime())
              : null
        const historyDurations = history
          .map((item) =>
            item.duration_seconds !== undefined && item.duration_seconds !== null
              ? item.duration_seconds
              : item.end_time
                ? computeElapsedSeconds(item, new Date(item.end_time).getTime())
                : null
          )
          .filter((value): value is number => value !== null)

        if (entryDuration !== null && historyDurations.length) {
          const avgDuration = historyDurations.reduce((acc, value) => acc + value, 0) / historyDurations.length
          if (avgDuration > 0 && entryDuration < avgDuration * 0.7) {
            messages.add("Passeio mais curto que o habitual.")
          }
        }

        if (entry.completed_route === false) {
          messages.add("Percurso habitual não foi concluído.")
        }

        if (entry.poop_blood) {
          messages.add("Sangue nas fezes: monitore e acione o veterinário se persistir.")
        }
        if (entry.poop_mucus) {
          messages.add("Muco nas fezes percebido.")
        }
        if (entry.poop_consistency === "diarrhea") {
          messages.add("Fezes diarreicas registradas.")
        }

        if (entry.disorientation) {
          messages.add("Sinais de desorientação durante o passeio.")
        }
        if (entry.excessive_panting) {
          messages.add("Ofegância acima do normal.")
        }
        if (entry.cough) {
          messages.add("Tosse observada durante o passeio.")
        }
        if (entry.mobility_notes) {
          messages.add("Dificuldades de mobilidade relatadas.")
        }

        if (entry.temperature_celsius !== null && entry.temperature_celsius !== undefined && entry.temperature_celsius >= 30) {
          messages.add("Temperatura alta: redobre a hidratação.")
        }

        if (entry.alerts && entry.alerts.length) {
          entry.alerts.forEach((message) => messages.add(message))
        }

        return Array.from(messages)
      },
      [computeElapsedSeconds]
    )

    const latestCompletedWalk = completedWalks[0] ?? null
    const historyWithoutLatest = useMemo(
      () => (latestCompletedWalk ? completedWalks.slice(1, 8) : completedWalks.slice(0, 7)),
      [completedWalks, latestCompletedWalk]
    )

    const summaryAlerts = useMemo(() => {
      if (!latestCompletedWalk) return []
      return computeAlertMessages(latestCompletedWalk, historyWithoutLatest)
    }, [computeAlertMessages, latestCompletedWalk, historyWithoutLatest])

    const weeklySnapshot = useMemo(() => {
      const now = Date.now()
      const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000
      const recent = completedWalks.filter((entry) => new Date(entry.start_time).getTime() >= sevenDaysAgo)
      if (recent.length === 0) {
        return {
          total: 0,
          avgDurationMinutes: 0,
          avgEnergyLabel: null as string | null,
          peeAverageLabel: null as string | null,
          poopRate: 0,
        }
      }

      const durations = recent.map((entry) => {
        if (typeof entry.duration_seconds === "number" && !Number.isNaN(entry.duration_seconds)) {
          return entry.duration_seconds
        }
        if (entry.end_time) {
          return computeElapsedSeconds(entry, new Date(entry.end_time).getTime())
        }
        return 0
      })
      const avgDuration = durations.reduce((acc, value) => acc + value, 0) / durations.length

      const energyValues = recent
        .map((entry) =>
          entry.energy_level && entry.energy_level in WALK_ENERGY_SCORE
            ? WALK_ENERGY_SCORE[entry.energy_level as WalkEnergyLevel]
            : null
        )
        .filter((value): value is number => value !== null)
      let avgEnergyLabel: string | null = null
      if (energyValues.length) {
        const avgEnergy = energyValues.reduce((acc, value) => acc + value, 0) / energyValues.length
        const closest = WALK_ENERGY_OPTIONS.reduce((best, option) => {
          const diffCurrent = Math.abs(WALK_ENERGY_SCORE[option.value] - avgEnergy)
          const diffBest = Math.abs(WALK_ENERGY_SCORE[best.value] - avgEnergy)
          return diffCurrent < diffBest ? option : best
        }, WALK_ENERGY_OPTIONS[0])
        avgEnergyLabel = closest.label
      }

      const peeValues = recent
        .map((entry) =>
          entry.pee_count && entry.pee_count in WALK_PEE_COUNT_VALUE
            ? WALK_PEE_COUNT_VALUE[entry.pee_count as WalkPeeCount]
            : null
        )
        .filter((value): value is number => value !== null)
      let peeAverageLabel: string | null = null
      if (peeValues.length) {
        const avgPee = peeValues.reduce((acc, value) => acc + value, 0) / peeValues.length
        if (avgPee === 0) peeAverageLabel = "Sem xixi"
        else if (avgPee < 1.5) peeAverageLabel = "1x em média"
        else if (avgPee < 2.5) peeAverageLabel = "2x em média"
        else peeAverageLabel = "3x ou mais"
      }

      const poopCount = recent.filter((entry) => entry.poop_made).length
      const poopRate = Math.round((poopCount / recent.length) * 100)

      return {
        total: recent.length,
        avgDurationMinutes: Math.round(avgDuration / 60),
        avgEnergyLabel,
        peeAverageLabel,
        poopRate,
      }
    }, [completedWalks, computeElapsedSeconds])

    const energyTrendData = useMemo(() => {
      return completedWalks
        .filter((entry) => entry.energy_level && entry.energy_level in WALK_ENERGY_SCORE)
        .slice(0, 10)
        .reverse()
        .map((entry) => {
          const label = new Date(entry.start_time)
            .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
            .replace(".", "")
          return {
            label,
            energy: WALK_ENERGY_SCORE[entry.energy_level as WalkEnergyLevel],
            energyText: WALK_ENERGY_LABEL_MAP[entry.energy_level as WalkEnergyLevel],
          }
        })
    }, [completedWalks])

    const lastWalks = useMemo(() => completedWalks.slice(0, 5), [completedWalks])

    const missingFields = useMemo(() => {
      if (!walkForm) return []
      const missing: string[] = []
      if (!walkForm.energy_level) missing.push("nível de energia")
      if (walkForm.behavior.length === 0) missing.push("comportamento")
      if (!walkForm.pee_count) missing.push("registro de xixi")
      if (walkForm.poop_made && !walkForm.poop_consistency) missing.push("consistência do cocô")
      return missing
    }, [walkForm])

    const handleStartWalk = async () => {
      setProcessingAction("start")
      try {
        const now = new Date().toISOString()
        await createWalkEntry({
          start_time: now,
          pause_events: [],
          completed_route: true,
          alerts: [],
        })
        toast.success("Passeio iniciado! Boa caminhada 🐾")
      } catch (error) {
        console.error(error)
        toast.error("Não foi possível iniciar o passeio.")
      } finally {
        setProcessingAction(null)
      }
    }

    const handlePauseResume = async () => {
      if (!activeWalk) return
      const action = isPaused ? "resume" : "pause"
      setProcessingAction(action)
      try {
        const now = new Date().toISOString()
        const events = [...(activeWalk.pause_events ?? [])]
        if (isPaused) {
          if (events.length === 0) {
            toast.error("Nenhuma pausa ativa para retomar.")
            return
          }
          events[events.length - 1] = {
            ...events[events.length - 1],
            ended_at: now,
          }
        } else {
          events.push({
            started_at: now,
            ended_at: null,
          })
        }
        await updateWalkEntry(activeWalk.id, { pause_events: events })
        toast.success(isPaused ? "Passeio retomado!" : "Passeio pausado.")
      } catch (error) {
        console.error(error)
        toast.error("Não foi possível atualizar o passeio.")
      } finally {
        setProcessingAction(null)
      }
    }

    const handleCancelWalk = async () => {
      if (!activeWalk) return
      const confirmCancel = window.confirm("Deseja cancelar o passeio em andamento? Os dados atuais serão descartados.")
      if (!confirmCancel) return
      setProcessingAction("cancel")
      try {
        await deleteWalkEntry(activeWalk.id)
        setWalkForm(null)
        toast.success("Passeio cancelado.")
      } catch (error) {
        console.error(error)
        toast.error("Não foi possível cancelar o passeio.")
      } finally {
        setProcessingAction(null)
      }
    }

    const handleFinishSubmit = async () => {
      if (!activeWalk || !walkForm) return

      if (missingFields.length) {
        toast.error(`Complete: ${missingFields.join(", ")}`)
        return
      }

      setProcessingAction("finish")
      try {
        const now = new Date().toISOString()
        const durationSeconds = computeElapsedSeconds(activeWalk, Date.now())

        const temperatureParsed =
          walkForm.temperature_celsius.trim() !== ""
            ? Number.parseFloat(walkForm.temperature_celsius.replace(",", "."))
            : null
        const temperatureValue =
          temperatureParsed !== null && Number.isFinite(temperatureParsed) ? temperatureParsed : null

        const distanceParsed =
          walkForm.route_distance_km.trim() !== ""
            ? Number.parseFloat(walkForm.route_distance_km.replace(",", "."))
            : null
        const distanceValue = distanceParsed !== null && Number.isFinite(distanceParsed) ? distanceParsed : null

        const photos = walkForm.photosText
          .split("\n")
          .map((value) => value.trim())
          .filter((value) => value.length > 0)

        const entrySnapshot: WalkEntry = {
          ...activeWalk,
          end_time: now,
          duration_seconds: durationSeconds,
          energy_level: walkForm.energy_level,
          behavior: walkForm.behavior,
          completed_route: walkForm.completed_route,
          pee_count: walkForm.pee_count,
          pee_volume: walkForm.pee_volume,
          pee_color: walkForm.pee_color,
          poop_made: walkForm.poop_made,
          poop_consistency: walkForm.poop_consistency,
          poop_blood: walkForm.poop_blood,
          poop_mucus: walkForm.poop_mucus,
          poop_color: walkForm.poop_color || null,
          weather: walkForm.weather || null,
          temperature_celsius: temperatureValue,
          route_distance_km: distanceValue,
          route_description: walkForm.route_description || null,
          mobility_notes: walkForm.mobility_notes || null,
          disorientation: walkForm.disorientation,
          excessive_panting: walkForm.excessive_panting,
          cough: walkForm.cough,
          notes: walkForm.notes || null,
          photos: photos.length ? photos : null,
          alerts: activeWalk.alerts ?? null,
        }

        const alerts = computeAlertMessages(
          entrySnapshot,
          completedWalks.filter((entry) => entry.id !== activeWalk.id)
        )
        entrySnapshot.alerts = alerts

        const payload: UpdateWalkEntryData = {
          end_time: entrySnapshot.end_time,
          duration_seconds: entrySnapshot.duration_seconds,
          energy_level: entrySnapshot.energy_level,
          behavior: entrySnapshot.behavior,
          completed_route: entrySnapshot.completed_route,
          pee_count: entrySnapshot.pee_count,
          pee_volume: entrySnapshot.pee_volume,
          pee_color: entrySnapshot.pee_color,
          poop_made: entrySnapshot.poop_made,
          poop_consistency: entrySnapshot.poop_consistency,
          poop_blood: entrySnapshot.poop_blood,
          poop_mucus: entrySnapshot.poop_mucus,
          poop_color: entrySnapshot.poop_color,
          weather: entrySnapshot.weather,
          temperature_celsius: entrySnapshot.temperature_celsius,
          route_distance_km: entrySnapshot.route_distance_km,
          route_description: entrySnapshot.route_description,
          mobility_notes: entrySnapshot.mobility_notes,
          disorientation: entrySnapshot.disorientation,
          excessive_panting: entrySnapshot.excessive_panting,
          cough: entrySnapshot.cough,
          notes: entrySnapshot.notes,
          photos: entrySnapshot.photos,
          alerts,
        }

        await updateWalkEntry(activeWalk.id, payload)
        setIsFinishModalOpen(false)
        setWalkForm(null)
        setLastGeneratedAlerts(alerts)
        toast.success(alerts.length ? "Passeio registrado com alertas importantes." : "Passeio registrado com sucesso!")
      } catch (error) {
        console.error(error)
        toast.error("Não foi possível finalizar o passeio.")
      } finally {
        setProcessingAction(null)
      }
    }

    return (
      <div className="space-y-6 pb-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Footprints className="h-5 w-5" />
              Passeios monitorados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-xl font-semibold">
                  {activeWalk ? (isPaused ? "Pausado" : "Em andamento") : "Pronto para iniciar"}
                </p>
                {activeWalk && (
                  <p className="text-xs text-muted-foreground">
                    Iniciado em{" "}
                    {new Date(activeWalk.start_time).toLocaleString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Timer className="h-4 w-4 text-blue-500" />
                  <span className="text-3xl font-mono">{formatDuration(activeElapsedSeconds)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Tempo decorrido</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {activeWalk ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePauseResume}
                    disabled={processingAction !== null && processingAction !== (isPaused ? "resume" : "pause")}
                  >
                    {isPaused ? <PlayCircle className="mr-1 h-4 w-4" /> : <PauseCircle className="mr-1 h-4 w-4" />}
                    {processingAction === (isPaused ? "resume" : "pause")
                      ? isPaused
                        ? "Retomando..."
                        : "Pausando..."
                      : isPaused
                        ? "Retomar"
                        : "Pausar"}
                  </Button>
                  <Button size="sm" onClick={() => setIsFinishModalOpen(true)} disabled={processingAction !== null}>
                    <StopCircle className="mr-1 h-4 w-4" />
                    Finalizar passeio
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelWalk}
                    disabled={processingAction !== null}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    Cancelar
                  </Button>
                </>
              ) : (
                <Button onClick={handleStartWalk} disabled={processingAction === "start"}>
                  <PlayCircle className="mr-1 h-4 w-4" />
                  {processingAction === "start" ? "Iniciando..." : "Iniciar passeio"}
                </Button>
              )}
            </div>

            {activeWalk && missingFields.length > 0 && (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700">
                Preencha: {missingFields.join(", ")} antes de finalizar.
              </div>
            )}

            {!activeWalk && latestCompletedWalk && (
              <div className="rounded-md border border-dashed border-muted-foreground/40 p-3 text-sm text-muted-foreground">
                Último passeio finalizado em{" "}
                {new Date(latestCompletedWalk.end_time ?? latestCompletedWalk.start_time).toLocaleString("pt-BR", {
                  day: "2-digit",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                . Energia:{" "}
                {latestCompletedWalk.energy_level
                  ? WALK_ENERGY_LABEL_MAP[latestCompletedWalk.energy_level as WalkEnergyLevel]
                  : "não informada"}
                . Tempo total:{" "}
                {formatDuration(
                  latestCompletedWalk.duration_seconds ??
                    computeElapsedSeconds(
                      latestCompletedWalk,
                      latestCompletedWalk.end_time ? new Date(latestCompletedWalk.end_time).getTime() : undefined
                    )
                )}
                .
              </div>
            )}
          </CardContent>
        </Card>

        {activeWalk && walkForm && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Energia e comportamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium">Nível de energia</p>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {WALK_ENERGY_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant={walkForm.energy_level === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormField("energy_level", option.value)}
                        className="text-xs"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Comportamento</p>
                  <div className="flex flex-wrap gap-2">
                    {WALK_BEHAVIOR_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant={walkForm.behavior.includes(option.value) ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleToggleBehavior(option.value)}
                        className="text-xs"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-medium">Percurso</p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={walkForm.completed_route ? "default" : "outline"}
                        onClick={() => setFormField("completed_route", true)}
                        className="flex-1 text-xs"
                      >
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Completou
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={!walkForm.completed_route ? "default" : "outline"}
                        onClick={() => setFormField("completed_route", false)}
                        className="flex-1 text-xs"
                      >
                        <TrendingDown className="mr-1 h-3 w-3" />
                        Parou antes
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Distância estimada (km)</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.1"
                      min="0"
                      value={walkForm.route_distance_km}
                      onChange={(event) => setFormField("route_distance_km", event.target.value)}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      placeholder="Ex: 1.8"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Descrição da rota</label>
                  <textarea
                    value={walkForm.route_description}
                    onChange={(event) => setFormField("route_description", event.target.value)}
                    rows={2}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="Anote mudanças no percurso ou locais importantes..."
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Necessidades fisiológicas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="mb-2 text-sm font-medium">Registro de xixi</p>
                  <div className="flex flex-wrap gap-2">
                    {WALK_PEE_COUNT_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        variant={walkForm.pee_count === option.value ? "default" : "outline"}
                        size="sm"
                        onClick={() => setFormField("pee_count", option.value)}
                        className="text-xs"
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Volume
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {WALK_PEE_VOLUME_OPTIONS.map((option) => (
                          <Button
                            key={option.value}
                            variant={walkForm.pee_volume === option.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFormField("pee_volume", option.value)}
                            className="text-xs"
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Cor
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {WALK_PEE_COLOR_OPTIONS.map((option) => (
                          <Button
                            key={option.value}
                            variant={walkForm.pee_color === option.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFormField("pee_color", option.value)}
                            className="text-xs"
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium">Registro de cocô</p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={walkForm.poop_made ? "default" : "outline"}
                      onClick={() => setFormField("poop_made", true)}
                      className="flex-1 text-xs"
                    >
                      Fez
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={!walkForm.poop_made ? "default" : "outline"}
                      onClick={() => setFormField("poop_made", false)}
                      className="flex-1 text-xs"
                    >
                      Não fez
                    </Button>
                  </div>

                  {walkForm.poop_made && (
                    <div className="mt-3 space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {WALK_POOP_CONSISTENCY_OPTIONS.map((option) => (
                          <Button
                            key={option.value}
                            variant={walkForm.poop_consistency === option.value ? "default" : "outline"}
                            size="sm"
                            onClick={() => setFormField("poop_consistency", option.value)}
                            className="text-xs"
                          >
                            {option.label}
                          </Button>
                        ))}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                          <Checkbox
                            id={`poop-blood-${walkForm.walkId}`}
                            checked={walkForm.poop_blood}
                            onCheckedChange={(checked) => setFormField("poop_blood", Boolean(checked))}
                          />
                          <label htmlFor={`poop-blood-${walkForm.walkId}`} className="text-xs">
                            Sangue
                          </label>
                        </div>
                        <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                          <Checkbox
                            id={`poop-mucus-${walkForm.walkId}`}
                            checked={walkForm.poop_mucus}
                            onCheckedChange={(checked) => setFormField("poop_mucus", Boolean(checked))}
                          />
                          <label htmlFor={`poop-mucus-${walkForm.walkId}`} className="text-xs">
                            Muco
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          Cor incomum
                        </label>
                        <input
                          type="text"
                          value={walkForm.poop_color}
                          onChange={(event) => setFormField("poop_color", event.target.value)}
                          className="w-full rounded-md border px-3 py-2 text-sm"
                          placeholder="Ex: esverdeado, muito escuro..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contexto e sinais importantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 flex items-center gap-2 text-sm font-medium">
                      <CloudSun className="h-4 w-4 text-amber-500" />
                      Clima e temperatura
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        inputMode="decimal"
                        step="0.1"
                        min="-10"
                        value={walkForm.temperature_celsius}
                        onChange={(event) => setFormField("temperature_celsius", event.target.value)}
                        className="w-28 rounded-md border px-3 py-2 text-sm"
                        placeholder="°C"
                      />
                      <input
                        type="text"
                        value={walkForm.weather}
                        onChange={(event) => setFormField("weather", event.target.value)}
                        className="flex-1 rounded-md border px-3 py-2 text-sm"
                        placeholder="Ensolarado, nublado, chuvoso..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium">Mobilidade (mancar, dificuldade...)</label>
                    <input
                      type="text"
                      value={walkForm.mobility_notes}
                      onChange={(event) => setFormField("mobility_notes", event.target.value)}
                      className="w-full rounded-md border px-3 py-2 text-sm"
                      placeholder="Descreva sinais observados"
                    />
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                    <Checkbox
                      id={`disorientation-${walkForm.walkId}`}
                      checked={walkForm.disorientation}
                      onCheckedChange={(checked) => setFormField("disorientation", Boolean(checked))}
                    />
                    <label htmlFor={`disorientation-${walkForm.walkId}`} className="text-xs">
                      Desorientação
                    </label>
                  </div>
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                    <Checkbox
                      id={`panting-${walkForm.walkId}`}
                      checked={walkForm.excessive_panting}
                      onCheckedChange={(checked) => setFormField("excessive_panting", Boolean(checked))}
                    />
                    <label htmlFor={`panting-${walkForm.walkId}`} className="text-xs">
                      Ofegância excessiva
                    </label>
                  </div>
                  <div className="flex items-center gap-2 rounded-md border px-3 py-2">
                    <Checkbox
                      id={`cough-${walkForm.walkId}`}
                      checked={walkForm.cough}
                      onCheckedChange={(checked) => setFormField("cough", Boolean(checked))}
                    />
                    <label htmlFor={`cough-${walkForm.walkId}`} className="text-xs">
                      Tosse
                    </label>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">Observações gerais</label>
                  <textarea
                    value={walkForm.notes}
                    onChange={(event) => setFormField("notes", event.target.value)}
                    rows={3}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="Anote qualquer detalhe relevante sobre o passeio..."
                  />
                </div>

                <div>
                  <label className="mb-1 flex items-center gap-2 text-sm font-medium">
                    <Camera className="h-4 w-4 text-muted-foreground" />
                    Fotos ou referências (URLs)
                  </label>
                  <textarea
                    value={walkForm.photosText}
                    onChange={(event) => setFormField("photosText", event.target.value)}
                    rows={2}
                    className="w-full rounded-md border px-3 py-2 text-sm"
                    placeholder="Cole links de fotos ou referências para mostrar ao veterinário..."
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {lastGeneratedAlerts.length > 0 && (
          <Alert className="border-amber-200 bg-amber-50 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Alertas do último passeio registrado</AlertTitle>
            <AlertDescription className="space-y-1">
              {lastGeneratedAlerts.map((alert, index) => (
                <p key={index}>{alert}</p>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {!activeWalk && summaryAlerts.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertTitle>Observações recentes</AlertTitle>
            <AlertDescription className="space-y-1">
              {summaryAlerts.map((alert, index) => (
                <p key={index}>{alert}</p>
              ))}
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Resumo dos últimos 7 dias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Passeios registrados</p>
                <p className="text-lg font-semibold">{weeklySnapshot.total}</p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Duração média</p>
                <p className="text-lg font-semibold">
                  {weeklySnapshot.avgDurationMinutes > 0 ? `${weeklySnapshot.avgDurationMinutes} min` : "—"}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Energia predominante</p>
                <p className="text-lg font-semibold">
                  {weeklySnapshot.avgEnergyLabel ?? "—"}
                </p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Cocô realizado</p>
                <p className="text-lg font-semibold">{weeklySnapshot.poopRate}%</p>
                <p className="text-xs text-muted-foreground">dos passeios</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tendência de energia</CardTitle>
          </CardHeader>
          <CardContent>
            {energyTrendData.length >= 2 ? (
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={energyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis domain={[1, 5]} tickCount={5} tickFormatter={(value) => String(value)} />
                    <ChartTooltip
                      cursor={false}
                      content={({ payload }) => {
                        if (!payload || payload.length === 0) return null
                        const item = payload[0].payload
                        return (
                          <div className="rounded-md border bg-background px-3 py-2 text-xs">
                            <p>{item.energyText}</p>
                            <p className="text-muted-foreground">Escala: {item.energy}/5</p>
                          </div>
                        )
                      }}
                    />
                    <Line type="monotone" dataKey="energy" stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Registre mais passeios para visualizar a tendência de energia.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Últimos passeios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lastWalks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda não há passeios finalizados.</p>
            ) : (
              lastWalks.map((entry) => {
                const entryDuration =
                  entry.duration_seconds ??
                  computeElapsedSeconds(entry, entry.end_time ? new Date(entry.end_time).getTime() : undefined)
                return (
                  <div key={entry.id} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">
                        {new Date(entry.start_time).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
                      </p>
                      <Badge variant="outline">{formatDuration(entryDuration)}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {entry.energy_level && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-1 text-blue-700">
                          <Activity className="h-3 w-3" />
                          {WALK_ENERGY_LABEL_MAP[entry.energy_level as WalkEnergyLevel]}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-amber-700">
                        <Droplets className="h-3 w-3" />
                        {formatPeeSummary(entry)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-emerald-700">
                        <Gauge className="h-3 w-3" />
                        {formatPoopSummary(entry)}
                      </span>
                      {entry.route_distance_km !== null && entry.route_distance_km !== undefined && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-1 text-purple-700">
                          <MapPin className="h-3 w-3" />
                          {entry.route_distance_km.toFixed(1)} km
                        </span>
                      )}
                      {entry.temperature_celsius !== null && entry.temperature_celsius !== undefined && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                          <Thermometer className="h-3 w-3" />
                          {entry.temperature_celsius.toFixed(1)}°C
                        </span>
                      )}
                    </div>
                    {entry.behavior && entry.behavior.length > 0 && (
                      <div className="flex flex-wrap gap-2 text-xs">
                        {entry.behavior.map((behavior) => (
                          <Badge key={behavior} variant="secondary">
                            {getBehaviorLabel(behavior)}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {entry.alerts && entry.alerts.length > 0 && (
                      <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                        {entry.alerts.map((alert, index) => (
                          <p key={index}>{alert}</p>
                        ))}
                      </div>
                    )}
                    {entry.notes && <p className="text-xs text-muted-foreground">Notas: {entry.notes}</p>}
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>

        <Dialog open={isFinishModalOpen} onOpenChange={setIsFinishModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Finalizar passeio</DialogTitle>
              <DialogDescription>Confirme os dados antes de salvar.</DialogDescription>
            </DialogHeader>
            {activeWalk && walkForm ? (
              <div className="space-y-4 text-sm">
                <div className="rounded-md border bg-muted/40 p-3">
                  <p className="font-medium">Resumo rápido</p>
                  <p className="text-muted-foreground">Duração estimada: {formatDuration(activeElapsedSeconds)}</p>
                  <p className="text-muted-foreground">
                    Energia:{" "}
                    {walkForm.energy_level ? WALK_ENERGY_LABEL_MAP[walkForm.energy_level] : "não preenchido"}
                  </p>
                </div>
                {missingFields.length > 0 && (
                  <Alert className="border-amber-200 bg-amber-50 text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Campos obrigatórios pendentes</AlertTitle>
                    <AlertDescription>
                      {missingFields.join(", ")}
                    </AlertDescription>
                  </Alert>
                )}
                {walkForm.notes && <p className="text-muted-foreground">Notas: {walkForm.notes}</p>}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Nenhum passeio em andamento.</p>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFinishModalOpen(false)} disabled={processingAction === "finish"}>
                Voltar
              </Button>
              <Button onClick={handleFinishSubmit} disabled={processingAction === "finish"}>
                {processingAction === "finish" ? "Salvando..." : "Salvar registro"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  const HumorPage = () => {
    const { addMoodEntry } = usePetData()
    const [energia, setEnergia] = useState<"alta" | "media" | "baixa" | undefined>()
    const [humor, setHumor] = useState<string[]>([])
    const [apetite, setApetite] = useState<"alto" | "normal" | "baixo" | "nao-comeu" | undefined>()
    const [passeio, setPasseio] = useState<"longo" | "curto" | "nao-passeou" | undefined>()
    const [observacoes, setObservacoes] = useState("")

    const humorOptions = ["feliz", "quieto", "estressado", "cansado"]

    const toggleHumor = (option: string) => {
      setHumor((prev) => (prev.includes(option) ? prev.filter((h) => h !== option) : [...prev, option]))
    }

    const handleSave = async () => {
      if (!energia || !apetite || !passeio) {
        toast.error("Preencha todos os campos obrigatórios")
        return
      }

      await addMoodEntry({
        energy_level: energia,
        general_mood: humor,
        appetite: apetite,
        walk: passeio,
        notes: observacoes || undefined,
      })

      // Reset form
      setEnergia(undefined)
      setHumor([])
      setApetite(undefined)
      setPasseio(undefined)
      setObservacoes("")

      toast.success("Humor registrado!")
    }

    return (
      <div className="space-y-6 pb-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registrar Humor do Fred</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Energia</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "alta", label: "Alta" },
                  { value: "media", label: "Média" },
                  { value: "baixa", label: "Baixa" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={energia === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEnergia(option.value as "alta" | "media" | "baixa")}
                    className="text-xs"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Humor Geral (pode marcar vários)</label>
              <div className="grid grid-cols-2 gap-2">
                {humorOptions.map((option) => (
                  <Button
                    key={option}
                    variant={humor.includes(option) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleHumor(option)}
                    className="text-xs capitalize"
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Apetite</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "alto", label: "Alto" },
                  { value: "normal", label: "Normal" },
                  { value: "baixo", label: "Baixo" },
                  { value: "nao-comeu", label: "Não comeu" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={apetite === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setApetite(option.value as "alto" | "normal" | "baixo" | "nao-comeu")}
                    className="text-xs"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Passeio</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "longo", label: "Longo" },
                  { value: "curto", label: "Curto" },
                  { value: "nao-passeou", label: "Não passeou" },
                ].map((option) => (
                  <Button
                    key={option.value}
                    variant={passeio === option.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPasseio(option.value as "longo" | "curto" | "nao-passeou")}
                    className="text-xs"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Observações</label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Observações adicionais..."
                className="w-full px-3 py-2 border rounded-md text-sm resize-none"
                rows={3}
              />
            </div>

            <Button onClick={handleSave} className="w-full">
              <Brain className="h-4 w-4 mr-2" />
              Salvar Registro
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const HistoricoPage = () => {
    const [filter, setFilter] = useState<"all" | "glicemia" | "humor" | "rotina" | "passeio">("all")

    const allEntries = [
      ...glucoseReadings.map((r) => ({ ...r, type: "glicemia", date: r.created_at })),
      ...moodEntries.map((r) => ({ ...r, type: "humor", date: r.created_at })),
      ...allRoutineItems.filter((r) => r.completed).map((r) => ({ ...r, type: "rotina", date: r.completed_at || r.date })),
      ...walkEntries
        .filter((r) => r.end_time)
        .map((r) => ({ ...r, type: "passeio", date: r.end_time ?? r.start_time })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const filteredEntries = filter === "all" ? allEntries : allEntries.filter((e) => e.type === filter)

    return (
      <div className="space-y-6 pb-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Histórico Completo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: "all", label: "Todos" },
                { value: "glicemia", label: "Glicemia" },
                { value: "humor", label: "Humor" },
                { value: "rotina", label: "Rotina" },
                { value: "passeio", label: "Passeios" },
              ].map((option) => (
                <Button
                  key={option.value}
                  variant={filter === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(option.value as any)}
                  className="text-xs"
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-3">
          {filteredEntries.slice(0, 20).map((entry, index) => (
            <Card key={`${entry.type}-${entry.id || index}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {entry.type === "glicemia" && (
                      <div>
                        <p className="font-medium">Glicemia: {(entry as any).value} mg/dL</p>
                        <p className="text-sm text-muted-foreground">
                          {TIME_OF_DAY_LABELS[(entry as any).time_of_day] ?? (entry as any).time_of_day}
                        </p>
                        {(entry as any).protocol && (
                          <p className="text-xs mt-1 p-2 bg-muted rounded">{(entry as any).protocol}</p>
                        )}
                      </div>
                    )}
                    {entry.type === "humor" && (
                      <div>
                        <p className="font-medium">Registro de Humor</p>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>Energia: {(entry as any).energy_level}</p>
                          <p>Humor: {(entry as any).general_mood?.join(", ") || "Não informado"}</p>
                          <p>Apetite: {(entry as any).appetite}</p>
                          <p>Passeio: {(entry as any).walk}</p>
                        </div>
                      </div>
                    )}
                    {entry.type === "rotina" && (
                      <div>
                        <p className="font-medium">Tarefa Concluída</p>
                        <p className="text-sm text-muted-foreground">{(entry as any).task}</p>
                      </div>
                    )}
                    {entry.type === "passeio" && (
                      <div>
                        <p className="font-medium">Passeio registrado</p>
                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p>
                            Energia:{" "}
                            {(entry as WalkEntry).energy_level
                              ? WALK_ENERGY_LABEL_MAP[(entry as WalkEntry).energy_level as WalkEnergyLevel]
                              : "Não informada"}
                          </p>
                          <p>
                            Duração:{" "}
                            {(entry as WalkEntry).duration_seconds
                              ? formatDuration((entry as WalkEntry).duration_seconds ?? 0)
                              : "—"}
                          </p>
                          <p>
                            Xixi:{" "}
                            {(entry as WalkEntry).pee_count
                              ? WALK_PEE_COUNT_OPTIONS.find(
                                    (option) => option.value === (entry as WalkEntry).pee_count
                                  )?.label ?? (entry as WalkEntry).pee_count
                              : "Não informado"}
                          </p>
                          <p>
                            Cocô:{" "}
                            {(entry as WalkEntry).poop_made
                              ? WALK_POOP_CONSISTENCY_OPTIONS.find(
                                    (option) => option.value === (entry as WalkEntry).poop_consistency
                                  )?.label ?? "Fez"
                              : "Não fez"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">{new Date(entry.date).toLocaleString("pt-BR")}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <OfflineIndicator />
      <ToastContainer />

      <header className="fixed top-0 left-0 right-0 bg-background border-b border-border z-40 safe-area-inset-top">
        <div className="flex items-center gap-3 p-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/fred.jpg" alt="Fred" />
            <AvatarFallback>🐕</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Fred Care</h1>
            <p className="text-xs text-muted-foreground">Cuidados Diabéticos</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div
                className={`w-2 h-2 rounded-full ${
                  completedTasks === routineItems.length
                    ? "bg-green-500"
                    : completedTasks > 0
                      ? "bg-yellow-500"
                      : "bg-gray-300"
                }`}
              />
              <span className="text-xs text-muted-foreground">{Math.round(progressPercentage)}%</span>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="pt-20 px-4">
        {currentTab === "inicio" && (
          <div className="space-y-6 pb-20">
            <GlucoseRegistrationCard />
            {renderRoutineSection()}
          </div>
        )}
        {currentTab === "dashboard" && renderDashboard()}
        {currentTab === "glicemia" && <GlicemiaPage />}
        {currentTab === "humor" && <HumorPage />}
        {currentTab === "passeios" && <WalksPage />}
        {currentTab === "historico" && <HistoricoPage />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-40 safe-area-inset-bottom">
        <div className="flex">
          <button
            onClick={() => setCurrentTab("inicio")}
            className={`flex-1 py-3 px-2 text-xs font-medium transition-colors active:scale-95 ${
              currentTab === "inicio" ? "text-blue-600 bg-blue-50" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <Home className="h-5 w-5" />
              <span>Início</span>
            </div>
          </button>
          <button
            onClick={() => setCurrentTab("dashboard")}
            className={`flex-1 py-3 px-2 text-xs font-medium transition-colors active:scale-95 ${
              currentTab === "dashboard" ? "text-blue-600 bg-blue-50" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <ListChecks className="h-5 w-5" />
              <span>Rotina</span>
            </div>
          </button>
          <button
            onClick={() => setCurrentTab("glicemia")}
            className={`flex-1 py-3 px-2 text-xs font-medium transition-colors active:scale-95 ${
              currentTab === "glicemia" ? "text-blue-600 bg-blue-50" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <Droplets className="h-5 w-5" />
              <span>Glicemia</span>
            </div>
          </button>
          <button
            onClick={() => setCurrentTab("humor")}
            className={`flex-1 py-3 px-2 text-xs font-medium transition-colors active:scale-95 ${
              currentTab === "humor" ? "text-blue-600 bg-blue-50" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <Brain className="h-4 w-4" />
              <span>Humor</span>
            </div>
          </button>
          <button
            onClick={() => setCurrentTab("passeios")}
            className={`flex-1 py-3 px-2 text-xs font-medium transition-colors active:scale-95 ${
              currentTab === "passeios" ? "text-blue-600 bg-blue-50" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <Footprints className="h-4 w-4" />
              <span>Passeios</span>
            </div>
          </button>
          <button
            onClick={() => setCurrentTab("historico")}
            className={`flex-1 py-3 px-2 text-xs font-medium transition-colors active:scale-95 ${
              currentTab === "historico" ? "text-blue-600 bg-blue-50" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <History className="h-4 w-4" />
              <span>Histórico</span>
            </div>
          </button>
        </div>
      </nav>

      <PWAInstall />
    </div>
  )
}
