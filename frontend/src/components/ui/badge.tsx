import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "dark" | "secondary" | "success" | "danger" | "destructive" | "info" | "outline" | "inset"
}

export function Badge({
  className,
  variant = "dark",
  ...props
}: BadgeProps) {
  const variantClass = {
    default: "badge-dark",
    dark: "badge-dark",
    secondary: "badge-secondary",
    success: "badge-success",
    danger: "badge-danger",
    destructive: "badge-danger",
    info: "badge-info",
    outline: "badge-dark",
    inset: "badge-dark",
  }[variant] || "badge-dark"

  return (
    <span
      className={cn(
        "badge",
        variantClass,
        "text-uppercase",
        className
      )}
      {...props}
    />
  )
}
