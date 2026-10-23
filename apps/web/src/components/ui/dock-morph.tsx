"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import { Home, Search, Bell, User, Settings } from "lucide-react"

export interface DockMorphItem {
  icon: React.ComponentType<{ className?: string }>
  label: string
  onClick?: (e?: React.MouseEvent) => void
  showLabel?: boolean
  badge?: React.ReactNode
  isActive?: boolean
}

export interface DockMorphProps {
  className?: string
  items?: DockMorphItem[]
  position?: "bottom" | "top" | "left" | "inline"
  showLabels?: boolean
  children?: React.ReactNode
}

export default function DockMorph({ 
  items, 
  className, 
  position = "bottom",
  showLabels = false,
  children
}: DockMorphProps) {
  const [hovered, setHovered] = React.useState<number | null>(null)

  const dockItems: DockMorphItem[] =
    items && items.length > 0
      ? items
      : [
          { icon: Home, label: "Home", onClick: () => alert("Home clicked") },
          { icon: Search, label: "Search", onClick: () => alert("Search clicked") },
          { icon: Bell, label: "Notifications", onClick: () => alert("Notifications clicked") },
          { icon: User, label: "Profile", onClick: () => alert("Profile clicked") },
          { icon: Settings, label: "Settings", onClick: () => alert("Settings clicked") },
        ]

  // Position classes
  const positionClasses = {
    bottom: "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
    top: "fixed top-6 left-1/2 -translate-x-1/2 z-50",
    left: "fixed left-6 top-1/2 -translate-y-1/2 flex-col z-50",
    inline: "relative inline-flex items-center",
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        positionClasses[position],
        className
      )}
    >
      <TooltipProvider delayDuration={100}>
        <div
          className={cn(
            "relative flex items-center gap-1.5 p-1.5 rounded-2xl",
            position === "left" ? "flex-col gap-2 px-3 py-6" : "flex-row",
            "bg-zinc-100/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-xs border",
            "border-zinc-200/80 dark:border-zinc-800"
          )}
        >
          {dockItems.map((item, i) => {
            const hasLabel = showLabels || item.showLabel
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <div
                    className="relative flex items-center justify-center"
                    onMouseEnter={() => setHovered(i)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {/* Morphic glass bubble with monochrome white/gray/black styling */}
                    <AnimatePresence>
                      {hovered === i && (
                        <motion.div
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: 1.08, opacity: 1 }}
                          exit={{ scale: 0.8, opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 24,
                          }}
                          className={cn(
                            "absolute inset-0 rounded-xl -z-10",
                            "bg-white/80 dark:bg-zinc-800/90 shadow-sm border border-zinc-200/60 dark:border-zinc-700/60 backdrop-blur-md"
                          )}
                        />
                      )}
                    </AnimatePresence>

                    {/* Button: Either icon-only or with label */}
                    <button
                      type="button"
                      onClick={item.onClick}
                      className={cn(
                        "relative z-10 flex items-center gap-2 rounded-xl text-xs font-semibold transition-all duration-150",
                        hasLabel ? "px-3.5 py-2" : "p-2.5",
                        item.isActive
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                          : "text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-zinc-50"
                      )}
                    >
                      <item.icon className={cn(hasLabel ? "h-4 w-4 shrink-0" : "h-4 w-4")} />
                      {hasLabel && (
                        <span className="whitespace-nowrap select-none">{item.label}</span>
                      )}
                      {item.badge}
                    </button>
                  </div>
                </TooltipTrigger>
                
                {/* Tooltip Content (shown when labels are hidden) */}
                {!hasLabel && (
                  <TooltipContent
                    side={position === "left" ? "right" : "top"}
                    className="text-xs bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium px-2.5 py-1 rounded-md"
                  >
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
          {children}
        </div>
      </TooltipProvider>
    </div>
  )
}

export { DockMorph }
