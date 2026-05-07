"use client"

import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown } from "lucide-react"

import { cn } from "../../lib/utils"

/* ================= TYPES ================= */

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
}

/* ================= COMPONENT ================= */

export function Select({
  items,
  value,
  onChange,
  placeholder = "Select...",
  label,
  className,
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <span className="text-sm font-medium">{label}</span>}

      <SelectPrimitive.Root
        value={value?.toString()}
        onValueChange={onChange}
      >
        <SelectPrimitive.Trigger
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border px-3 text-sm",
            "bg-white focus:outline-none focus:ring-2 focus:ring-blue-500",
            className
          )}
        >
          <SelectPrimitive.Value placeholder={placeholder} />
          <SelectPrimitive.Icon>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content className="z-50 rounded-md border bg-white shadow-md">
            <SelectPrimitive.Viewport className="p-1">
              {items.map((item) => (
                <SelectPrimitive.Item
                  key={item.value ?? "null"}
                  value={item.value?.toString() ?? ""}
                  className={cn(
                    "flex cursor-pointer items-center justify-between rounded px-2 py-2 text-sm",
                    "hover:bg-gray-100"
                  )}
                >
                  <SelectPrimitive.ItemText>
                    {item.label}
                  </SelectPrimitive.ItemText>

                  <SelectPrimitive.ItemIndicator>
                    <Check className="h-4 w-4" />
                  </SelectPrimitive.ItemIndicator>
                </SelectPrimitive.Item>
              ))}
            </SelectPrimitive.Viewport>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    </div>
  )
}