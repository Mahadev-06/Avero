import * as React from "react"
import { cn } from "@/lib/utils"

function Card({
  className,
  style,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex flex-col rounded-2xl text-[var(--text-color)] transition-all duration-200",
        className
      )}
      style={{
        backgroundColor: 'var(--card-bg)',
        boxShadow: 'var(--nm-raised-md)',
        border: '1px solid rgba(255, 255, 255, 0.45)',
        padding: '1.5rem',
        ...style,
      }}
      {...props}
    />
  )
}

function CardHeader({ className, style, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5 pb-3", className)}
      style={style}
      {...props}
    />
  )
}

function CardTitle({ className, style, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-title"
      className={cn("font-heading text-lg font-bold text-[var(--text-color)]", className)}
      style={style}
      {...props}
    />
  )
}

function CardDescription({ className, style, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-description"
      className={cn("text-sm text-[var(--text-muted)]", className)}
      style={style}
      {...props}
    />
  )
}

function CardContent({ className, style, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("w-full", className)}
      style={style}
      {...props}
    />
  )
}

function CardFooter({ className, style, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center pt-3 border-t border-[var(--border-subtle)]", className)}
      style={style}
      {...props}
    />
  )
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
}
