import { COLOR_KEYS, COLOR_PRESETS, preset } from "../lib/colors";
import type { ColorKey } from "../lib/colors";

interface Props {
  value: string;
  onChange: (color: ColorKey) => void;
  label?: string;
}

export default function ColorPicker({ value, onChange, label }: Props) {
  const current = preset(value);

  return (
    <div>
      {label && (
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {COLOR_KEYS.map((key) => {
          const p = COLOR_PRESETS[key];
          const selected = key === current.key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-label={p.label}
              aria-pressed={selected}
              className={`relative h-8 w-8 rounded-full ${p.dot} transition-all duration-150 hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${p.ring} ${
                selected
                  ? "ring-2 ring-offset-2 ring-slate-800 scale-110"
                  : "ring-1 ring-black/5"
              }`}
            >
              {selected && (
                <span className="absolute inset-0 flex items-center justify-center text-white">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
