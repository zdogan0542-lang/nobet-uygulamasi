import { Calendar, Check, User } from "lucide-react";
import { preset } from "../lib/colors";
import { addDays, advanceCycle, formatTRWithWeekday, todayISO } from "../lib/dates";
import type { ListWithAssignees } from "../lib/types";

interface Props {
  list: ListWithAssignees;
  onComplete: (id: string) => void;
}

export default function DutyCard({ list, onComplete }: Props) {
  const color = preset(list.color);
  const startDate = list.current_start_date ?? todayISO();
  const endDate = addDays(startDate, list.cycle_days - 1);
  const nextDate = advanceCycle(startDate, list.cycle_days);

  const nextAssignee = (() => {
    const names = list.assignees.map((a) => a.name);
    if (names.length === 0) return null;
    const idx = names.indexOf(list.current_assignee ?? "");
    if (idx === -1) return names[0];
    return names[(idx + 1) % names.length];
  })();

  const active = !!list.current_assignee;

  return (
    <div
      className={`group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${color.hoverBg}`}
    >
      {/* Left vertical accent strip — list color */}
      <div className={`absolute inset-y-0 left-0 w-1.5 ${color.dot}`} />

      <div className="flex flex-1 flex-col pl-5 pr-5 py-4">
        {/* Title as soft-tinted pill badge (no detached bullet dot) */}
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

        {/* Current assignee */}
        <div className="mt-3.5 flex items-center gap-2">
          <User className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-800">
            {list.current_assignee ?? "Atanmamış"}
          </span>
        </div>

        {/* Clean light date row with calendar icon */}
        <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-slate-50 px-3.5 py-3">
          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-400">
              Önerilen tarih
            </p>
            <p className="mt-0.5 text-sm font-bold text-slate-800">
              {formatTRWithWeekday(endDate)}
            </p>
          </div>
        </div>

        {/* Next assignee */}
        <p className="mt-3 text-xs text-slate-500">
          {nextAssignee ? (
            <>
              Sıradaki:{" "}
              <span className="font-semibold text-slate-700">{nextAssignee}</span>{" "}
              <span className="text-slate-400">
                ({formatTRWithWeekday(nextDate)})
              </span>
            </>
          ) : (
            <span className="text-slate-400">Sırada kimse yok</span>
          )}
        </p>

        {/* Outlined clean action button */}
        <button
          type="button"
          disabled={!active}
          onClick={() => onComplete(list.id)}
          className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-all duration-150 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Check className="h-4 w-4 text-emerald-500" />
          Nöbetimi Tamamla
        </button>
      </div>
    </div>
  );
}
