"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "@/hooks/useTheme"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme()

  // Resolve to explicit light/dark so Sonner never checks OS preference directly
  // (OS dark + app light would cause dark toasts otherwise)
  const effectiveTheme: ToasterProps["theme"] =
    theme === "dark" ? "dark"
    : theme === "light" ? "light"
    : typeof document !== "undefined" && document.documentElement.classList.contains("dark") ? "dark"
    : "light"

  return (
    <Sonner
      theme={effectiveTheme}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      {...props}
    />
  )
}

export { Toaster }
