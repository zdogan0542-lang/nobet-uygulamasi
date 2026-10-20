import { ClipboardList, Settings2 } from "lucide-react";
import { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard";
import GroupEditor from "./components/GroupEditor";
import ManageView from "./components/ManageView";
import { fetchRoster } from "./lib/data";
import type { GroupWithLists } from "./lib/types";

type Tab = "dashboard" | "manage";

export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [groups, setGroups] = useState<GroupWithLists[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingGroup, setEditingGroup] = useState<GroupWithLists | null>(null);

  async function load() {
    try {
      setError(null);
      const data = await fetchRoster();
      setGroups(data);
      // keep editing group in sync with latest data
      setEditingGroup((cur) =>
        cur ? data.find((g) => g.id === cur.id) ?? null : null,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Veriler yüklenemedi");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top nav */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <ClipboardList className="h-5 w-5" />
            </div>
            <span className="text-base font-bold text-slate-900">Nöbetçi</span>
          </div>
          <nav className="flex gap-1 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setTab("dashboard")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                tab === "dashboard"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <ClipboardList className="h-4 w-4" />
              Panel
            </button>
            <button
              type="button"
              onClick={() => setTab("manage")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-all ${
                tab === "manage"
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Settings2 className="h-4 w-4" />
              Yönet
            </button>
          </nav>
        </div>
      </header>

      {error && (
        <div className="mx-auto mt-4 max-w-5xl px-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-sm text-slate-400">Yükleniyor…</div>
      ) : tab === "dashboard" ? (
        <Dashboard groups={groups} onChanged={load} />
      ) : (
        <ManageView
          groups={groups}
          onChanged={load}
          onEditGroup={setEditingGroup}
        />
      )}

      {editingGroup && (
        <GroupEditor
          group={editingGroup}
          onChanged={load}
          onClose={() => setEditingGroup(null)}
        />
      )}
    </div>
  );
}
