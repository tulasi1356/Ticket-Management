"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "../../lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"

/* ================= TYPES ================= */

type DatePickerSize = "sm" | "md" | "lg"

interface DatePickerProps {
  value?: Date
  onChange?: (date?: Date) => void
  placeholder?: string
  size?: DatePickerSize
  disabled?: boolean
  className?: string
}

/* ================= STYLES ================= */

const sizeClasses: Record<DatePickerSize, string> = {
  sm: "h-8 text-sm px-2",
  md: "h-10 text-sm px-3",
  lg: "h-11 text-base px-4",
}

/* ================= COMPONENT ================= */

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  size = "md",
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id = "date-picker-button"
          aria-label="Date picker"
          type="button"
          disabled={disabled}
          className={cn(
            "w-full flex items-center rounded-md border border-gray-300 bg-white text-left shadow-sm transition",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
            "hover:border-gray-400",
            "disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400",
            sizeClasses[size],
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 text-gray-500 shrink-0" />

          <span
            className={cn(
              "truncate",
              !value && "text-gray-400"
            )}
          >
            {value ? format(value, "PPP") : placeholder}
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="z-[100] w-auto rounded-md border border-gray-200 bg-white p-3 shadow-lg"
      >
        <DayPicker
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date)
            setOpen(false)
          }}
          showOutsideDays
          className="text-sm"
          classNames={{
            months: "flex flex-col gap-4",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center text-sm font-medium",
            nav: "flex items-center gap-1",
            nav_button:
              "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100",
            table: "w-full border-collapse",
            head_row: "flex",
            head_cell:
              "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "h-9 w-9 text-center text-sm p-0 relative",
            day: "h-9 w-9 p-0 font-normal rounded-md hover:bg-gray-100",
            day_selected:
              "bg-blue-600 text-white hover:bg-blue-600 focus:bg-blue-600",
            day_today: "border border-blue-500",
            day_outside: "text-gray-400 opacity-50",
            day_disabled: "text-gray-300",
          }}
        />
      </PopoverContent>
    </Popover>
  )
}