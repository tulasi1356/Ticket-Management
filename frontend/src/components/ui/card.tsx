import * as React from "react"
import { cn } from "../../lib/utils"

/* ROOT */
export function Card({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white shadow-sm",
        className
      )}
    >
      {children}
    </div>
  )
}

/* HEADER */
export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1.5 p-4 pb-2", className)}>
      {children}
    </div>
  )
}

/* TITLE */
export function CardTitle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <h3 className={cn("text-lg font-semibold leading-none", className)}>
      {children}
    </h3>
  )
}

/* DESCRIPTION */
export function CardDescription({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <p className={cn("text-sm text-gray-500", className)}>
      {children}
    </p>
  )
}

/* ACTION (top-right button area) */
export function CardAction({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("absolute right-4 top-4", className)}>
      {children}
    </div>
  )
}

/* CONTENT */
export function CardContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("p-4 pt-2", className)}>
      {children}
    </div>
  )
}

/* FOOTER */
export function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-2 p-4 pt-2", className)}>
      {children}
    </div>
  )
}