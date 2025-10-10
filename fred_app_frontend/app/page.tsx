"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Clock, CheckCircle2, RotateCcw, Home, Droplets, Brain, Edit3, Plus, Trash2, History } from "lucide-react"
import { usePetData } from "@/hooks/use-pet-data"
import { RoutineItem } from "@/types"
import { PWAInstall } from "@/components/pwa-install"
import { OfflineIndicator } from "@/components/offline-indicator"
import { ToastContainer, toast } from "@/components/ui/toast"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from "recharts"

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
    addMoodEntry,
    refreshData,
  } = usePetData()

  const [currentTab, setCurrentTab] = useState<"dashboard" | "glicemia" | "humor" | "historico">("dashboard")
  const [isEditingRoutine, setIsEditingRoutine] = useState(false)
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

  const renderDashboard = () => {
    const periodNames = {
      morning: "Manhã",
      afternoon: "Tarde",
      evening: "Noite",
    }

    const groupedTasks = routineItems.reduce(
      (acc, task) => {
        if (!acc[task.period]) acc[task.period] = []
        acc[task.period].push(task)
        return acc
      },
      {} as Record<string, RoutineItem[]>,
    )

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

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Rotina Diária</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditingRoutine(!isEditingRoutine)}
            className="h-8 px-3 text-xs"
          >
            <Edit3 className="h-3 w-3 mr-1" />
            {isEditingRoutine ? "Concluir" : "Editar"}
          </Button>
        </div>

        {isEditingRoutine && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Adicionar Nova Tarefa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="time"
                  value={newTaskTime}
                  onChange={(e) => setNewTaskTime(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                  placeholder="Horário"
                />
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
              <input
                type="text"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="Descrição da tarefa"
              />
              <Button onClick={addTask} size="sm" className="w-full">
                <Plus className="h-3 w-3 mr-1" />
                Adicionar Tarefa
              </Button>
            </CardContent>
          </Card>
        )}

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
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
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
                  {isEditingRoutine && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteTask(task.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  const GlicemiaPage = () => {
    const { glucoseReadings, addGlucoseReading } = usePetData()
    const [newValue, setNewValue] = useState("")
    const [timeOfDay, setTimeOfDay] = useState("morning")

    const handleAddReading = async () => {
      const value = Number.parseInt(newValue)
      if (!value || value < 50 || value > 500) {
        toast.error("Valor deve estar entre 50 e 500 mg/dL")
        return
      }

      let protocol = ""
      let color = ""

      if (value < 80) {
        protocol = "⚠️ HIPOGLICEMIA - Dar mel ou açúcar imediatamente"
        color = "text-red-600"
      } else if (value <= 150) {
        protocol = "✅ Normal - Continuar rotina"
        color = "text-green-600"
      } else if (value <= 250) {
        protocol = "⚠️ Alto - Verificar alimentação e insulina"
        color = "text-yellow-600"
      } else {
        protocol = "🚨 MUITO ALTO - Contatar veterinário"
        color = "text-red-600"
      }

      await addGlucoseReading(value, timeOfDay, protocol)
      setNewValue("")
      toast.success("Glicemia registrada!")
    }

    const chartData = glucoseReadings
      .slice(0, 10)
      .reverse()
      .map((reading, index) => ({
        name: `${index + 1}`,
        value: reading.value,
        date: new Date(reading.created_at).toLocaleDateString("pt-BR"),
      }))

    return (
      <div className="space-y-6 pb-20">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Registrar Glicemia</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                placeholder="mg/dL"
                className="px-3 py-2 border rounded-md text-sm"
                min="50"
                max="500"
              />
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="px-3 py-2 border rounded-md text-sm"
              >
                <option value="morning">Manhã</option>
                <option value="afternoon">Tarde</option>
                <option value="evening">Noite</option>
              </select>
            </div>
            <Button onClick={handleAddReading} className="w-full">
              <Droplets className="h-4 w-4 mr-2" />
              Registrar
            </Button>
          </CardContent>
        </Card>

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
                className="h-[200px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[50, 400]} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="5 5" label="Baixo" />
                    <ReferenceLine y={150} stroke="#22c55e" strokeDasharray="5 5" label="Normal" />
                    <ReferenceLine y={250} stroke="#f59e0b" strokeDasharray="5 5" label="Alto" />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="var(--color-value)"
                      strokeWidth={2}
                      dot={{ fill: "var(--color-value)" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {glucoseReadings.slice(0, 5).map((reading) => (
            <Card key={reading.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{reading.value} mg/dL</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(reading.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      {TIME_OF_DAY_LABELS[reading.time_of_day] ?? reading.time_of_day}
                    </p>
                  </div>
                </div>
                {reading.protocol && <p className="text-sm mt-2 p-2 bg-muted rounded">{reading.protocol}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
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

      <header className="fixed top-0 left-0 right-0 bg-white border-b border-border z-40 safe-area-inset-top">
        <div className="flex items-center gap-3 p-4">
          <Avatar className="h-10 w-10">
            <AvatarImage src="/golden-retriever.png" alt="Fred" />
            <AvatarFallback>🐕</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Fred Care</h1>
            <p className="text-xs text-muted-foreground">Cuidados Diabéticos</p>
          </div>
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
        </div>
      </header>

      <main className="pt-20 px-4">
        {currentTab === "dashboard" && renderDashboard()}
        {currentTab === "glicemia" && <GlicemiaPage />}
        {currentTab === "humor" && <HumorPage />}
        {currentTab === "historico" && <HistoricoPage />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border z-40 safe-area-inset-bottom">
        <div className="flex">
          <button
            onClick={() => setCurrentTab("dashboard")}
            className={`flex-1 py-3 px-2 text-xs font-medium transition-colors active:scale-95 ${
              currentTab === "dashboard" ? "text-blue-600 bg-blue-50" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <Home className="h-5 w-5" />
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
