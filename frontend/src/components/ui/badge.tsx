import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "secondary" | "destructive" | "inset"
}

export function Badge({
  className,
  variant = "default",
  style,
  ...props
}: BadgeProps) {
  let variantStyle: React.CSSProperties = {
    boxShadow: '3px 3px 6px var(--neumorph-dark), -3px -3px 6px var(--neumorph-light)',
    backgroundColor: 'var(--bg-color)',
    color: 'var(--text-color)',
    border: '1px solid rgba(255, 255, 255, 0.6)',
  }

  if (variant === "inset" || variant === "outline") {
    variantStyle = {
      backgroundColor: 'transparent',
      color: 'var(--color-accent-500)',
      border: '1px solid rgba(0, 0, 0, 0.08)',
      boxShadow: 'none',
    }
  } else if (variant === "destructive") {
    variantStyle = {
      boxShadow: '3px 3px 6px var(--neumorph-dark), -3px -3px 6px var(--neumorph-light)',
      backgroundColor: 'var(--bg-color)',
      color: '#ef4444',
      border: '1px solid rgba(239, 68, 68, 0.25)',
    }
  }

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-bold tracking-wide transition-all",
        className
      )}
      style={{
        ...variantStyle,
        ...style,
      }}
      {...props}
    />
  )
}
