export type ColorKey =
  | "blue"
  | "emerald"
  | "amber"
  | "rose"
  | "violet"
  | "teal"
  | "orange"
  | "cyan"
  | "pink"
  | "slate";

export interface ColorPreset {
  key: ColorKey;
  label: string;
  /** solid dot / border color */
  dot: string;
  /** border-l-4 accent class */
  border: string;
  /** soft pastel background for pill badge */
  pillBg: string;
  /** bold text color inside pill */
  pillText: string;
  /** soft tinted card background on hover */
  hoverBg: string;
  /** ring/outline for picker selection */
  ring: string;
}

export const COLOR_PRESETS: Record<ColorKey, ColorPreset> = {
  blue: {
    key: "blue",
    label: "Mavi",
    dot: "bg-blue-500",
    border: "border-blue-500",
    pillBg: "bg-blue-50",
    pillText: "text-blue-700",
    hoverBg: "hover:bg-blue-50/60",
    ring: "ring-blue-400",
  },
  emerald: {
    key: "emerald",
    label: "Yeşil",
    dot: "bg-emerald-500",
    border: "border-emerald-500",
    pillBg: "bg-emerald-50",
    pillText: "text-emerald-700",
    hoverBg: "hover:bg-emerald-50/60",
    ring: "ring-emerald-400",
  },
  amber: {
    key: "amber",
    label: "Amber",
    dot: "bg-amber-500",
    border: "border-amber-500",
    pillBg: "bg-amber-50",
    pillText: "text-amber-700",
    hoverBg: "hover:bg-amber-50/60",
    ring: "ring-amber-400",
  },
  rose: {
    key: "rose",
    label: "Gül",
    dot: "bg-rose-500",
    border: "border-rose-500",
    pillBg: "bg-rose-50",
    pillText: "text-rose-700",
    hoverBg: "hover:bg-rose-50/60",
    ring: "ring-rose-400",
  },
  violet: {
    key: "violet",
    label: "Mor",
    dot: "bg-violet-500",
    border: "border-violet-500",
    pillBg: "bg-violet-50",
    pillText: "text-violet-700",
    hoverBg: "hover:bg-violet-50/60",
    ring: "ring-violet-400",
  },
  teal: {
    key: "teal",
    label: "Teal",
    dot: "bg-teal-500",
    border: "border-teal-500",
    pillBg: "bg-teal-50",
    pillText: "text-teal-700",
    hoverBg: "hover:bg-teal-50/60",
    ring: "ring-teal-400",
  },
  orange: {
    key: "orange",
    label: "Turuncu",
    dot: "bg-orange-500",
    border: "border-orange-500",
    pillBg: "bg-orange-50",
    pillText: "text-orange-700",
    hoverBg: "hover:bg-orange-50/60",
    ring: "ring-orange-400",
  },
  cyan: {
    key: "cyan",
    label: "Camgöbeği",
    dot: "bg-cyan-500",
    border: "border-cyan-500",
    pillBg: "bg-cyan-50",
    pillText: "text-cyan-700",
    hoverBg: "hover:bg-cyan-50/60",
    ring: "ring-cyan-400",
  },
  pink: {
    key: "pink",
    label: "Pembe",
    dot: "bg-pink-500",
    border: "border-pink-500",
    pillBg: "bg-pink-50",
    pillText: "text-pink-700",
    hoverBg: "hover:bg-pink-50/60",
    ring: "ring-pink-400",
  },
  slate: {
    key: "slate",
    label: "Gri",
    dot: "bg-slate-500",
    border: "border-slate-500",
    pillBg: "bg-slate-100",
    pillText: "text-slate-700",
    hoverBg: "hover:bg-slate-50/80",
    ring: "ring-slate-400",
  },
};

export const COLOR_KEYS = Object.keys(COLOR_PRESETS) as ColorKey[];

export function preset(color: string): ColorPreset {
  return (COLOR_PRESETS as Record<string, ColorPreset>)[color] ?? COLOR_PRESETS.slate;
}
