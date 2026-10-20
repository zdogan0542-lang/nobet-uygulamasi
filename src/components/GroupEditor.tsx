import { Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import ColorPicker from "./ColorPicker";
import { preset } from "../lib/colors";
import type { ColorKey } from "../lib/colors";
import {
  addAssignee,
  createList,
  deleteAssignee,
  deleteList,
  updateList,
} from "../lib/data";
import { advanceCycle, formatTR, todayISO } from "../lib/dates";
import type { GroupWithLists, ListWithAssignees } from "../lib/types";

interface Props {
  group: GroupWithLists;
  onChanged: () => void;
  onClose: () => void;
}

export default function GroupEditor({ group, onChanged, onClose }: Props) {
  const [newListName, setNewListName] = useState("");
  const [newListColor, setNewListColor] = useState<ColorKey>("slate");
  const [newListCycle, setNewListCycle] = useState(7);
  const [newAssignee, setNewAssignee] = useState<Record<string, string>>({});
  const [startingFor, setStartingFor] = useState<Record<string, string>>({});

  const groupColor = preset(group.color);

  async function handleAddList() {
    if (!newListName.trim()) return;
    await createList({
      group_id: group.id,
      name: newListName.trim(),
      color: newListColor,
      cycle_days: newListCycle,
    });
    setNewListName("");
    setNewListCycle(7);
    onChanged();
  }

  async function handleColorChange(list: ListWithAssignees, color: ColorKey) {
    await updateList(list.id, { color });
    onChanged();
  }

  async function handleStart(list: ListWithAssignees) {
    const name = startingFor[list.id]?.trim();
    if (!name) return;
    await updateList(list.id, {
      current_assignee: name,
      current_start_date: todayISO(),
    });
    setStartingFor((s) => ({ ...s, [list.id]: "" }));
    onChanged();
  }

  async function handleAddAssignee(listId: string) {
    const name = newAssignee[listId]?.trim();
    if (!name) return;
    await addAssignee(listId, name);
    setNewAssignee((s) => ({ ...s, [listId]: "" }));
    onChanged();
  }

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

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="mt-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        {/* Header with group color dot + border accent */}
        <div className={`flex items-center justify-between border-l-4 ${groupColor.border} rounded-tl-2xl px-5 py-4`}>
          <div className="flex items-center gap-2.5">
            <span className={`h-2.5 w-2.5 rounded-full ${groupColor.dot}`} />
            <h2 className="text-lg font-bold text-slate-900">{group.name}</h2>
            <span className="text-xs text-slate-400">grubunu düzenle</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-4 scrollbar-thin">
          {/* Existing lists */}
          {group.lists.length === 0 && (
            <p className="py-6 text-center text-sm text-slate-400">
              Henüz nöbet listesi yok. Aşağıdan ekleyin.
            </p>
          )}

          <div className="space-y-4">
            {group.lists.map((list) => {
              const c = preset(list.color);
              const startDate = list.current_start_date ?? todayISO();
              const nextStart = advanceCycle(startDate, list.cycle_days);
              return (
                <div
                  key={list.id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-sm font-bold ${c.pillBg} ${c.pillText}`}
                      >
                        {list.name}
                      </span>
                      <p className="mt-1.5 text-xs text-slate-500">
                        {list.cycle_days} günlük döngü ·{" "}
                        {list.current_assignee
                          ? `Şu an: ${list.current_assignee} (${formatTR(startDate)})`
                          : "Atanmamış"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        await deleteList(list.id);
                        onChanged();
                      }}
                      className="rounded-lg p-1.5 text-slate-300 transition-colors hover:bg-rose-50 hover:text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Color picker for this list */}
                  <div className="mt-3">
                    <ColorPicker
                      value={list.color}
                      onChange={(color) => handleColorChange(list, color)}
                      label="Liste rengi"
                    />
                  </div>

                  {/* Cycle days */}
                  <div className="mt-3">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Döngü (gün)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={list.cycle_days}
                      onChange={(e) => {
                        const v = Math.max(1, Number(e.target.value) || 1);
                        updateList(list.id, { cycle_days: v }).then(onChanged);
                      }}
                      className="w-24 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                    {list.current_start_date && (
                      <p className="mt-1 text-xs text-slate-400">
                        Sonraki başlangıç: {formatTR(nextStart)}
                      </p>
                    )}
                  </div>

                  {/* Assignees */}
                  <div className="mt-3">
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Sıralı nöbetçiler
                    </label>
                    <div className="space-y-1.5">
                      {list.assignees.map((a, i) => (
                        <div
                          key={a.id}
                          className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm"
                        >
                          <span className="flex items-center gap-2">
                            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                              {i + 1}
                            </span>
                            {a.name}
                          </span>
                          <button
                            type="button"
                            onClick={async () => {
                              await deleteAssignee(a.id);
                              onChanged();
                            }}
                            className="text-slate-300 transition-colors hover:text-rose-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={newAssignee[list.id] ?? ""}
                        onChange={(e) =>
                          setNewAssignee((s) => ({ ...s, [list.id]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && handleAddAssignee(list.id)}
                        placeholder="Nöbetçi adı"
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddAssignee(list.id)}
                        className="rounded-lg bg-slate-100 px-2.5 text-slate-600 transition-colors hover:bg-slate-200"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Start / advance controls */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      {!list.current_assignee && (
                        <>
                          <input
                            value={startingFor[list.id] ?? ""}
                            onChange={(e) =>
                              setStartingFor((s) => ({ ...s, [list.id]: e.target.value }))
                            }
                            onKeyDown={(e) => e.key === "Enter" && handleStart(list)}
                            placeholder="İlk nöbetçi"
                            className="w-36 rounded-lg border border-slate-200 px-3 py-1.5 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                          />
                          <button
                            type="button"
                            onClick={() => handleStart(list)}
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
                          >
                            Başlat
                          </button>
                        </>
                      )}
                      {list.current_assignee && (
                        <button
                          type="button"
                          onClick={() => handleAdvance(list)}
                          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
                        >
                          Nöbeti devret → {formatTR(nextStart)}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add new list */}
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 p-4">
            <h3 className="text-sm font-semibold text-slate-700">Yeni nöbet listesi</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddList()}
                placeholder="Liste adı (ör. Süpürge nöbeti)"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-slate-500">Döngü</label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={newListCycle}
                  onChange={(e) =>
                    setNewListCycle(Math.max(1, Number(e.target.value) || 1))
                  }
                  className="w-20 rounded-lg border border-slate-200 px-2.5 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
                <span className="text-xs text-slate-400">gün</span>
              </div>
            </div>
            <div className="mt-3">
              <ColorPicker
                value={newListColor}
                onChange={setNewListColor}
                label="Liste rengi"
              />
            </div>
            <button
              type="button"
              onClick={handleAddList}
              disabled={!newListName.trim()}
              className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
              Listeyi ekle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
