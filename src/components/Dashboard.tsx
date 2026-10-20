import { preset } from "../lib/colors";
import { advanceCycle, todayISO } from "../lib/dates";
import { updateList } from "../lib/data";
import DutyCard from "./DutyCard";
import type { GroupWithLists, ListWithAssignees } from "../lib/types";

interface Props {
  groups: GroupWithLists[];
  onChanged: () => void;
}

export default function Dashboard({ groups, onChanged }: Props) {
  async function handleAdvance(list: ListWithAssignees) {
    const names = list.assignees.map((a) => a.name);
    if (names.length === 0) return;
    const idx = names.indexOf(list.current_assignee ?? "");
    const next = names[(idx + 1) % names.length] ?? names[0];
    const startDate = list.current_start_date ?? todayISO();
    const nextStart = advanceCycle(startDate, list.cycle_days);
    await updateList(list.id, {
      current_assignee: next,
      current_start_date: nextStart,
    });
    onChanged();
  }

  const totalLists = groups.reduce((n, g) => n + g.lists.length, 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Nöbet Paneli</h1>
          <p className="mt-1 text-sm text-slate-500">
            {groups.length} grup · {totalLists} aktif nöbet listesi
          </p>
        </div>
      </div>

      {groups.length === 0 && (
        <div className="mt-12 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <p className="text-sm text-slate-500">
            Henüz grup veya nöbet listesi yok. "Yönet" sekmesinden başlayın.
          </p>
        </div>
      )}

      <div className="mt-8 space-y-8">
        {groups.map((group) => {
          const c = preset(group.color);
          return (
            <section key={group.id}>
              {/* Group header: colored dot + left border accent */}
              <div
                className={`mb-3 flex items-center gap-2.5 border-l-4 ${c.border} pl-3`}
              >
                <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
                <h2 className="text-lg font-bold text-slate-900">{group.name}</h2>
                <span className="text-xs text-slate-400">
                  {group.lists.length} nöbet
                </span>
              </div>

              {group.lists.length === 0 ? (
                <p className="pl-4 text-sm text-slate-400">
                  Bu grupta henüz nöbet listesi yok.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {group.lists.map((list) => (
                    <DutyCard
                      key={list.id}
                      list={list}
                      onAdvance={() => handleAdvance(list)}
                    />
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
