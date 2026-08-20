import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-full border border-white/40 bg-clip-padding text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 cursor-pointer [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "btn-pearl text-white",
        outline:
          "bg-[var(--bg-color)] text-[var(--text-color)] border border-white/40 shadow-[6px_6px_12px_var(--neumorph-dark),-6px_-6px_12px_var(--neumorph-light)] hover:shadow-[8px_8px_16px_var(--neumorph-dark),-8px_-8px_16px_var(--neumorph-light)] active:shadow-[inset_4px_4px_12px_var(--neumorph-dark),inset_-4px_-4px_12px_var(--neumorph-light)] active:text-[var(--text-muted)]",
        secondary:
          "bg-[var(--bg-color)] text-[var(--text-color)] border border-white/40 shadow-[6px_6px_12px_var(--neumorph-dark),-6px_-6px_12px_var(--neumorph-light)] hover:shadow-[8px_8px_16px_var(--neumorph-dark),-8px_-8px_16px_var(--neumorph-light)] active:shadow-[inset_4px_4px_12px_var(--neumorph-dark),inset_-4px_-4px_12px_var(--neumorph-light)] active:text-[var(--text-muted)]",
        ghost:
          "hover:bg-[var(--nm-convex)] hover:text-[var(--text-color)] hover:shadow-[6px_6px_12px_var(--neumorph-dark),-6px_-6px_12px_var(--neumorph-light)] active:shadow-[inset_4px_4px_12px_var(--neumorph-dark),inset_-4px_-4px_12px_var(--neumorph-light)] active:text-[var(--text-muted)]",
        destructive:
          "bg-[var(--bg-color)] text-red-600 border border-red-500/30 shadow-[6px_6px_12px_var(--neumorph-dark),-6px_-6px_12px_var(--neumorph-light)] hover:shadow-[8px_8px_16px_var(--neumorph-dark),-8px_-8px_16px_var(--neumorph-light)] active:shadow-[inset_4px_4px_12px_var(--neumorph-dark),inset_-4px_-4px_12px_var(--neumorph-light)]",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-10 gap-2 px-4 text-sm font-bold",
        xs: "h-7 gap-1 rounded-full px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-full px-3 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-11 gap-2.5 rounded-full px-5 text-base font-bold",
        icon: "size-10 rounded-full",
        "icon-xs":
          "size-7 rounded-full [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-8 rounded-full",
        "icon-lg": "size-11 rounded-full",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
