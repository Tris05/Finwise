export const colors = {
  primary: "#009688", // teal
  accent: "#FFD54F", // gold
  background: "#FAFAF5", // off-white
  foreground: "#1F2937", // dark gray
  critical: "#E53935", // red (critical)
} as const

// Use analogous gradients; stay within existing hues (no new colors)
export const gradients = {
  // teal family gradient
  primary: "bg-gradient-to-br from-teal-600 to-teal-400",
  // gold family gradient
  accent: "bg-gradient-to-br from-amber-300 to-amber-200",
} as const

// Convenience badge variants consistent with limited palette
export const badgeVariants = {
  taxSaver: "bg-amber-100 text-amber-900 border-amber-200",
  riskMaster: "bg-teal-100 text-teal-900 border-teal-200",
} as const
