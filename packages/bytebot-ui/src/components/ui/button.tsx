import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-[var(--color-4g3n7-electric)] focus-visible:ring-[var(--color-4g3n7-electric)]/40 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-4g3n7-electric)] text-[var(--color-4g3n7-ink)] shadow-[0_14px_35px_rgba(39,245,197,0.28)] hover:bg-[var(--color-4g3n7-signal)]",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-[var(--color-4g3n7-electric)]/50 bg-[rgba(39,245,197,0.06)] text-[var(--foreground)] shadow-[0_10px_35px_rgba(0,0,0,0.25)] hover:bg-[rgba(39,245,197,0.12)]",
        secondary:
          "bg-[rgba(255,255,255,0.04)] text-[var(--foreground)] shadow-[0_10px_35px_rgba(0,0,0,0.25)] hover:bg-[rgba(255,255,255,0.07)]",
        ghost:
          "hover:bg-[rgba(255,255,255,0.06)] text-[var(--foreground)]",
        link: "text-[var(--color-4g3n7-electric)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    icon?: React.ReactNode
    iconPosition?: "left" | "right"
  }

function Button({
  className,
  variant,
  size,
  asChild = false,
  icon,
  iconPosition = "left",
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {icon && iconPosition === "left" && (
        <span className="mr-1 flex items-center">{icon}</span>
      )}
      {children}
      {icon && iconPosition === "right" && (
        <span className="ml-1 flex items-center">{icon}</span>
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
