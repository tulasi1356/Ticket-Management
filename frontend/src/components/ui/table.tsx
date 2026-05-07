import React, { forwardRef } from "react"
import { cn } from "../../lib/utils"

/* ================= TYPES ================= */

type TableVariant = "default" | "striped" | "bordered"
type TableSize = "sm" | "md" | "lg"

/* ================= STYLES ================= */

const tableVariants: Record<TableVariant, string> = {
  default: "border-collapse",
  striped: "border-collapse [&_tbody_tr:nth-child(even)]:bg-gray-50",
  bordered: "border border-gray-200",
}

const tableSizes: Record<TableSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
}

/* ================= TABLE ================= */

interface TableProps
  extends React.TableHTMLAttributes<HTMLTableElement> {
  variant?: TableVariant
  size?: TableSize
}

export const Table = forwardRef<HTMLTableElement, TableProps>(
  ({ className, variant = "default", size = "md", ...props }, ref) => {
    return (
      <table
        ref={ref}
        className={cn(
          "w-full",
          tableVariants[variant],
          tableSizes[size],
          className
        )}
        {...props}
      />
    )
  }
)

Table.displayName = "Table"

/* ================= HEADER ================= */

export const TableHeader = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <thead
    ref={ref}
    className={cn("bg-gray-100 border-b", className)}
    {...props}
  />
))

TableHeader.displayName = "TableHeader"

/* ================= BODY ================= */

export const TableBody = forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("", className)} {...props} />
))

TableBody.displayName = "TableBody"

/* ================= ROW ================= */

export const TableRow = forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement>
>(({ className, ...props }, ref) => (
  <tr
    ref={ref}
    className={cn("border-b hover:bg-gray-50", className)}
    {...props}
  />
))

TableRow.displayName = "TableRow"

/* ================= HEAD CELL ================= */

export const TableHead = forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn("text-left px-4 py-2 font-medium", className)}
    {...props}
  />
))

TableHead.displayName = "TableHead"

/* ================= DATA CELL ================= */

export const TableCell = forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn("px-4 py-2", className)}
    {...props}
  />
))

TableCell.displayName = "TableCell"