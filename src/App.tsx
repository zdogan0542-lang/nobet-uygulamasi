import { Construction } from "lucide-react";
import { useEffect, useState } from "react";
import Dashboard from "./components/Dashboard";
import GroupEditor from "./components/GroupEditor";
import ManageView from "./components/ManageView";
import Sidebar, { type NavKey } from "./components/Sidebar";
import { fetchRoster } from "./lib/data";
import type { GroupWithLists } from "./lib/types";

export default function App() {
  const [nav, setNav] = useState<NavKey>("dashboard");
  const [groups, setGroups] = useState<GroupWithLists[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingGroup, setEditingGroup] = useState<GroupWithLists | null>(null);

  async function load() {
    try {
      const data = await fetchRoster();
      setGroups(data);
      setEditingGroup((cur) =>
        cur ? data.find((g) => g.id === cur.id) ?? null : null,
      );
    } catch {
      // fetchRoster already falls back to mock data, but guard just in case
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar active={nav} onNavigate={setNav} />

      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
          {loading ? (
            <div className="py-24 text-center text-sm text-slate-400">
              Yükleniyor…
            </div>
          ) : nav === "dashboard" ? (
            <Dashboard groups={groups} onChanged={load} />
          ) : nav === "groups" ? (
            <ManageView
              groups={groups}
              onChanged={load}
              onEditGroup={setEditingGroup}
            />
          ) : (
            <Placeholder />
          )}
        </div>
      </main>

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

function Placeholder() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-24 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
        <Construction className="h-6 w-6 text-slate-400" />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-600">
        Bu bölüm yakında
      </p>
      <p className="mt-1 text-xs text-slate-400">
        Bu sayfa henüz geliştirilme aşamasında.
      </p>
    </div>
  );
}
