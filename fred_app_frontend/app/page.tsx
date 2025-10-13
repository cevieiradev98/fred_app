"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
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
} from "lucide-react"
import { usePetData } from "@/hooks/use-pet-data"
import { RoutineItem, GlucoseReading } from "@/types"
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

export default function FredCareApp() {
  const {
    routineItems,
    allRoutineItems,
    glucoseReadings,
    moodEntries,
    isLoading,
    toggleRoutineItem,
    addRoutineItem,
    deleteRoutineItem,
    addGlucoseReading,
    updateGlucoseReading,
    addMoodEntry,
    refreshData,
  } = usePetData()

  const [currentTab, setCurrentTab] = useState<"inicio" | "dashboard" | "glicemia" | "humor" | "historico">("inicio")
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
    const [filter, setFilter] = useState<"all" | "glicemia" | "humor" | "rotina">("all")

    const allEntries = [
      ...glucoseReadings.map((r) => ({ ...r, type: "glicemia", date: r.created_at })),
      ...moodEntries.map((r) => ({ ...r, type: "humor", date: r.created_at })),
      ...allRoutineItems.filter((r) => r.completed).map((r) => ({ ...r, type: "rotina", date: r.completed_at || r.date })),
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
