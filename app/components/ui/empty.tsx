import * as React from "react"
import { cn } from "@/lib/utils"

interface EmptyProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode
  title?: string
  description?: string
  action?: React.ReactNode
  children?: React.ReactNode
}

const Empty = React.forwardRef<HTMLDivElement, EmptyProps>(
  ({ className, icon, title, description, action, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col h-full",
          className
        )}
        {...props}
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center py-12 px-4">
          {icon && (
            <div className="mb-4 flex items-center justify-center">
              {icon}
            </div>
          )}
          {title && (
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              {description}
            </p>
          )}
          {action && (
            <div className="flex items-center gap-3">
              {action}
            </div>
          )}
        </div>
        {children && (
          <div className="mt-auto border-t pt-4 pb-2">
            {children}
          </div>
        )}
      </div>
    )
  }
)
Empty.displayName = "Empty"

export { Empty }

