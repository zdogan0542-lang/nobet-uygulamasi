import {
  Activity,
  CalendarDays,
  FolderTree,
  Sparkles,
  Users,
} from "lucide-react";
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

  const totalAssignees = groups.reduce(
    (n, g) =>
      n +
      g.lists.reduce((m, l) => m + l.assignees.length, 0),
    0,
  );

  return (
    <div className="space-y-8">
      {/* Blue gradient welcome banner */}
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700 p-6 text-white shadow-lg shadow-blue-500/20 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Hoş Geldiniz
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-blue-100 sm:text-base">
              Nöbet akışınızı, yaklaşan sıralarınızı ve aktif görevlerinizi
              tek ekrandan takip edin.
            </p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          icon={Users}
          label="Kayıtlı Personel"
          value={totalAssignees}
          accent="text-blue-600 bg-blue-50"
        />
        <StatCard
          icon={FolderTree}
          label="Nöbet Grupları"
          value={groups.length}
          accent="text-emerald-600 bg-emerald-50"
        />
        <StatCard
          icon={Activity}
          label="Sistem Durumu"
          value="Aktif"
          accent="text-amber-600 bg-amber-50"
          isText
        />
      </div>

      {/* Active duty sections */}
      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
          <p className="mt-3 text-sm text-slate-500">
            Henüz grup veya nöbet listesi yok. "Nöbet Grupları" bölümünden
            başlayın.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => {
            const c = preset(group.color);
            return (
              <section key={group.id}>
                {/* Group header: colored dot + left border accent */}
                <div
                  className={`mb-3 flex items-center gap-2.5 border-l-4 ${c.border} pl-3`}
                >
                  <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
                  <h2 className="text-lg font-bold text-slate-900">
                    {group.name}
                  </h2>
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
                        onComplete={() => handleAdvance(list)}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  isText,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  accent: string;
  isText?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
        <p className="mt-0.5 text-2xl font-bold text-slate-900">
          {isText ? value : value}
        </p>
      </div>
    </div>
  );
}
