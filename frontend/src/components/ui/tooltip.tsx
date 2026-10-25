import * as React from "react";
import { cn } from "@/lib/utils";

export interface TooltipButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  title: string;
  placement?: "top" | "bottom" | "left" | "right";
}

export function TooltipButton({
  className,
  placement = "bottom",
  title,
  children,
  type = "button",
  ...props
}: TooltipButtonProps) {
  return (
    <button
      type={type}
      className={cn("btn btn-primary btn-sm text-dark", className)}
      data-toggle="tooltip"
      data-placement={placement}
      title={title}
      {...props}
    >
      {children}
    </button>
  );
}

export interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  placement?: "top" | "bottom" | "left" | "right";
}

export function Tooltip({
  className,
  placement = "bottom",
  title,
  children,
  ...props
}: TooltipProps) {
  return (
    <div
      className={cn("inline-flex", className)}
      data-toggle="tooltip"
      data-placement={placement}
      title={title}
      {...props}
    >
      {children}
    </div>
  );
}
