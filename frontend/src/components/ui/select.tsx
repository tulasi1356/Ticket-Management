import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "../../lib/utils"

export type SelectOption = {
  label: string
  value: string | number | null
}

type SelectProps = {
  items: SelectOption[]
  value?: string | number | null
  onChange?: (value: string) => void
  placeholder?: string
  label?: string
  className?: string
  /** Disable interaction */
  disabled?: boolean
}

export function Select({
  items,
  value,
  onChange,
  placeholder = "Select...",
  label,
  className,
  disabled,
}: SelectProps) {
  const triggerId = React.useId()

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label
          htmlFor={triggerId}
          className="text-sm font-medium text-gray-700"
        >
          {label}
        </label>
      ) : null}

      <SelectPrimitive.Root
        value={value?.toString()}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectPrimitive.Trigger
          id={triggerId}
          className={cn(
            "flex min-h-10 w-full min-w-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-900 transition-colors",
            "shadow-sm hover:border-gray-300 hover:bg-gray-50/80",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--app-focus-ring-color)] focus-visible:ring-offset-2 focus-visible:ring-offset-white",
            "data-[state=open]:border-blue-400 data-[state=open]:bg-white data-[state=open]:shadow-md",
            "disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:border-gray-200 disabled:hover:bg-white"
          )}
        >
          {/* Radix Icon is also a span — do not use [&>span]:flex-1 or chevron splits space 50/50 */}
          <span className="min-w-0 flex-1 overflow-hidden text-left">
            <SelectPrimitive.Value
              placeholder={placeholder}
              className="block truncate data-[placeholder]:text-gray-500"
            />
          </span>
          <SelectPrimitive.Icon className="shrink-0 text-gray-400">
            <ChevronDown className="size-4" aria-hidden />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            position="popper"
            sideOffset={6}
            collisionPadding={12}
            className={cn(
              "z-[60] max-h-[min(17rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-lg",
              "motion-reduce:animate-none"
            )}
          >
            <SelectPrimitive.Viewport className="p-1">
              {items.map((item) => (
                <SelectPrimitive.Item
                  key={item.value ?? "null"}
                  value={item.value?.toString() ?? ""}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-md py-2 pl-3 pr-9 text-sm text-gray-900 outline-none",
                    "data-[disabled]:pointer-events-none data-[disabled]:opacity-40",
                    "data-[highlighted]:bg-gray-50 data-[highlighted]:text-gray-900",
                    "data-[state=checked]:font-medium"
                  )}
                >
                  <SelectPrimitive.ItemText className="truncate">
                    {item.label}
                  </SelectPrimitive.ItemText>

                  <span className="absolute right-2 flex size-4 items-center justify-center text-blue-600">
                    <SelectPrimitive.ItemIndicator>
                      <Check className="size-4" strokeWidth={2.5} />
                    </SelectPrimitive.ItemIndicator>
                  </span>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  )
}
