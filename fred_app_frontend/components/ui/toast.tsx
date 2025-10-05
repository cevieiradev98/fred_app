"use client"

import { useState, useEffect } from "react"
import { CheckCircle, AlertCircle, X } from "lucide-react"

interface Toast {
  id: string
  message: string
  type: "success" | "error"
}

let toastId = 0

export const toast = {
  success: (message: string) => {
    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: { id: (++toastId).toString(), message, type: "success" },
      }),
    )
  },
  error: (message: string) => {
    window.dispatchEvent(
      new CustomEvent("toast", {
        detail: { id: (++toastId).toString(), message, type: "error" },
      }),
    )
  },
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const handleToast = (event: CustomEvent) => {
      const newToast = event.detail as Toast
      setToasts((prev) => [...prev, newToast])

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newToast.id))
      }, 3000)
    }

    window.addEventListener("toast", handleToast as EventListener)
    return () => window.removeEventListener("toast", handleToast as EventListener)
  }, [])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 p-3 rounded-lg shadow-lg max-w-sm ${
            toast.type === "success"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span className="text-sm">{toast.message}</span>
          <button onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))} className="ml-auto">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
