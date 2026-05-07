import { cn } from "../../lib/utils"

const avatarVariants = [
  "bg-gradient-to-br from-rose-50 to-pink-100 text-rose-800 ring-rose-200/70 dark:from-rose-950/80 dark:to-pink-950/70 dark:text-rose-100 dark:ring-rose-800/35",
  "bg-gradient-to-br from-fuchsia-50 to-purple-100 text-purple-800 ring-fuchsia-200/70 dark:from-fuchsia-950/80 dark:to-purple-950/70 dark:text-fuchsia-100 dark:ring-fuchsia-800/35",
  "bg-gradient-to-br from-violet-50 to-indigo-100 text-indigo-800 ring-violet-200/70 dark:from-violet-950/80 dark:to-indigo-950/70 dark:text-violet-100 dark:ring-violet-800/35",
  "bg-gradient-to-br from-sky-50 to-blue-100 text-blue-800 ring-sky-200/70 dark:from-sky-950/80 dark:to-blue-950/70 dark:text-sky-100 dark:ring-sky-800/35",
  "bg-gradient-to-br from-cyan-50 to-teal-100 text-teal-800 ring-cyan-200/70 dark:from-cyan-950/80 dark:to-teal-950/70 dark:text-cyan-100 dark:ring-cyan-800/35",
  "bg-gradient-to-br from-emerald-50 to-green-100 text-emerald-800 ring-emerald-200/70 dark:from-emerald-950/80 dark:to-green-950/70 dark:text-emerald-100 dark:ring-emerald-800/35",
  "bg-gradient-to-br from-lime-50 to-lime-100 text-lime-900 ring-lime-200/70 dark:from-lime-950/70 dark:to-lime-900/60 dark:text-lime-100 dark:ring-lime-800/35",
  "bg-gradient-to-br from-amber-50 to-orange-100 text-amber-900 ring-amber-200/70 dark:from-amber-950/80 dark:to-orange-950/70 dark:text-amber-100 dark:ring-amber-800/35",
]

function hashString(input: string) {
  let hash = 0
  for (let i = 0; i < input.length; i++) hash = (hash * 31 + input.charCodeAt(i)) | 0
  return Math.abs(hash)
}

function pickVariant(name: string) {
  const idx = hashString(name.trim().toLowerCase()) % avatarVariants.length
  return avatarVariants[idx] ?? "bg-muted text-muted-foreground"
}

const sizeClasses = {
  sm: "size-7 text-[11px]",
  md: "size-9 text-sm",
  lg: "size-11 text-base",
  xl: "size-14 text-lg",
} as const

export function AssigneeAvatar({
  name,
  title,
  size = "md",
  className,
}: {
  name: string
  title?: string
  size?: keyof typeof sizeClasses
  className?: string
}) {
  const letter = name.trim().slice(0, 1).toUpperCase() || "?"
  const variant = pickVariant(name)

  return (
    <span
      title={title ?? name}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-black/[0.06] dark:shadow-none dark:ring-white/[0.08]",
        sizeClasses[size],
        variant,
        className,
      )}
      aria-label={title ?? name}
    >
      {letter}
    </span>
  )
}
