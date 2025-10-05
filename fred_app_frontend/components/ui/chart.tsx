"use client"

import * as React from "react"
import { Tooltip } from "recharts"

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    config?: Record<string, any>
  }
>(({ className, ...props }, ref) => {
  return <div ref={ref} className={className} {...props} />
})
ChartContainer.displayName = "ChartContainer"

const ChartTooltip = Tooltip

const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Tooltip> & {
    hideLabel?: boolean
    hideIndicator?: boolean
    indicator?: "line" | "dot" | "dashed"
    nameKey?: string
    labelKey?: string
  }
>(({ active, payload, label, hideLabel, hideIndicator, indicator, nameKey, labelKey, ...props }, ref) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        {!hideLabel && (
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col">
              <span className="text-[0.70rem] uppercase text-muted-foreground">{labelKey || "Data"}</span>
              <span className="font-bold text-muted-foreground">{label}</span>
            </div>
          </div>
        )}
        <div className="grid gap-2">
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              {!hideIndicator && (
                <div
                  className="h-2.5 w-2.5 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: entry.color,
                  }}
                />
              )}
              <div className="flex flex-col">
                <span className="text-[0.70rem] uppercase text-muted-foreground">{nameKey || entry.dataKey}</span>
                <span className="font-bold">{entry.value} mg/dL</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return null
})
ChartTooltipContent.displayName = "ChartTooltipContent"

export { ChartContainer, ChartTooltip, ChartTooltipContent }
