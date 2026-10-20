import { Plus, Settings2, Trash2 } from "lucide-react";
import { useState } from "react";
import ColorPicker from "./ColorPicker";
import { preset } from "../lib/colors";
import type { ColorKey } from "../lib/colors";
import { createGroup, deleteGroup, updateGroup } from "../lib/data";
import type { GroupWithLists } from "../lib/types";

interface Props {
  groups: GroupWithLists[];
  onChanged: () => void;
  onEditGroup: (group: GroupWithLists) => void;
}

export default function ManageView({ groups, onChanged, onEditGroup }: Props) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState<ColorKey>("blue");
  const [editing, setEditing] = useState<string | null>(null);

  async function handleAdd() {
    if (!newName.trim()) return;
    await createGroup({ name: newName.trim(), color: newColor });
    setNewName("");
    setNewColor("blue");
    onChanged();
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900">Gruplar & Nöbet Listeleri</h1>
      <p className="mt-1 text-sm text-slate-500">
        Grup ve liste renklerini buradan seçebilirsiniz. Değişiklikler anında kaydedilir.
      </p>

      {/* Create group */}
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">Yeni grup ekle</h2>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="Grup adı (ör. Öğrenciler)"
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
          />
          <button
            type="button"
            onClick={handleAdd}
            disabled={!newName.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Plus className="h-4 w-4" />
            Ekle
          </button>
        </div>
        <div className="mt-4">
          <ColorPicker value={newColor} onChange={setNewColor} label="Grup rengi" />
        </div>
      </div>

      {/* Existing groups */}
      <div className="mt-6 space-y-4">
        {groups.length === 0 && (
          <p className="py-10 text-center text-sm text-slate-400">
            Henüz grup yok. Yukarıdan bir grup ekleyin.
          </p>
        )}
        {groups.map((group) => {
          const c = preset(group.color);
          const isEditing = editing === group.id;
          return (
            <div
              key={group.id}
              className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${c.border} border-l-4`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
                  {isEditing ? (
                    <input
                      defaultValue={group.name}
                      onBlur={(e) => {
                        updateGroup(group.id, { name: e.target.value }).then(onChanged);
                        setEditing(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                      }}
                      autoFocus
                      className="rounded-lg border border-slate-200 px-2.5 py-1 text-base font-bold text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  ) : (
                    <h3 className="text-base font-bold text-slate-900">{group.name}</h3>
                  )}
                  <span className="text-xs text-slate-400">
                    {group.lists.length} liste
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditing(group.id)}
                    className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Grubu yeniden adlandır"
                  >
                    <Settings2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await deleteGroup(group.id);
                      onChanged();
                    }}
                    className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                    aria-label="Grubu sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Group color picker */}
              <div className="mt-4">
                <ColorPicker
                  value={group.color}
                  onChange={(color) =>
                    updateGroup(group.id, { color }).then(onChanged)
                  }
                  label="Grup rengi"
                />
              </div>

              {/* Lists preview */}
              {group.lists.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.lists.map((list) => {
                    const lc = preset(list.color);
                    return (
                      <span
                        key={list.id}
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${lc.pillBg} ${lc.pillText}`}
                      >
                        {list.name}
                      </span>
                    );
                  })}
                </div>
              )}

              <button
                type="button"
                onClick={() => onEditGroup(group)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Listeleri düzenle
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
