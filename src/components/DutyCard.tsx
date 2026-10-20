import { ChevronRight, RotateCw, User, Calendar } from "lucide-react";
import { preset } from "../lib/colors";
import { addDays, advanceCycle, formatTR, todayISO } from "../lib/dates";
import type { ListWithAssignees } from "../lib/types";

interface Props {
  list: ListWithAssignees;
  onAdvance: (id: string) => void;
}

export default function DutyCard({ list, onAdvance }: Props) {
  const color = preset(list.color);
  const startDate = list.current_start_date ?? todayISO();
  const nextDate = advanceCycle(startDate, list.cycle_days);
  const endDate = addDays(startDate, list.cycle_days - 1);

  const nextAssignee = (() => {
    const names = list.assignees.map((a) => a.name);
    if (names.length === 0) return null;
    const idx = names.indexOf(list.current_assignee ?? "");
    if (idx === -1) return names[0];
    return names[(idx + 1) % names.length];
  })();

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${color.hoverBg}`}
    >
      <div className={`absolute inset-y-0 left-0 w-1.5 ${color.dot}`} />

      <div className="pl-5 pr-5 py-4">
        {/* Title pill badge — no detached bullet dot */}
        <div className="flex items-center justify-between gap-3">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${color.pillBg} ${color.pillText}`}
          >
            {list.name}
          </span>
          <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
            {list.cycle_days} gün
          </span>
        </div>

        {/* Assignee */}
        <div className="mt-3 flex items-center gap-2">
          <User className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-800">
            {list.current_assignee ?? "Atanmamış"}
          </span>
        </div>

        {/* Date range */}
        <div className="mt-1.5 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-xs text-slate-500">
            {formatTR(startDate)} – {formatTR(endDate)}
          </span>
        </div>

        {/* Footer: advance + next */}
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
          <div className="text-xs text-slate-500">
            {nextAssignee ? (
              <>
                Sıradaki:{" "}
                <span className="font-semibold text-slate-700">{nextAssignee}</span>{" "}
                <span className="text-slate-400">({formatTR(nextDate)})</span>
              </>
            ) : (
              <span className="text-slate-400">Sırada kimse yok</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => onAdvance(list.id)}
            className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
          >
            <RotateCw className="h-3.5 w-3.5" />
            Nöbeti devret
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
