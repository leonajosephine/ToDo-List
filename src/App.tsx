import type {
  FormEvent,
  KeyboardEvent,
  ChangeEvent,
} from "react";
import { useEffect, useState, useRef } from "react";

type Day =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

const DAY_LABELS: { id: Day; label: string; short: string }[] = [
  { id: "monday", label: "Monday", short: "Mon" },
  { id: "tuesday", label: "Tuesday", short: "Tue" },
  { id: "wednesday", label: "Wednesday", short: "Wed" },
  { id: "thursday", label: "Thursday", short: "Thu" },
  { id: "friday", label: "Friday", short: "Fri" },
  { id: "saturday", label: "Saturday", short: "Sat" },
  { id: "sunday", label: "Sunday", short: "Sun" },
];

type Filter = "all" | "open" | "done";

type Todo = {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
  day?: Day | null;
};

type BackgroundPreset = "none" | "preset1" | "preset2" | "preset3";

type Board = {
  id: string;
  title: string;
  todos: Todo[];
  statusFilter: Filter;
  dayFilter: Day | "all";
  useDays: boolean;
};

const STORAGE_KEY = "todo-boards-v1";

function createDefaultBoard(): Board {
  return {
    id: crypto.randomUUID(),
    title: "My Tasks",
    todos: [],
    statusFilter: "all",
    dayFilter: "all",
    useDays: false,
  };
}

function App() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [backgroundUrl, setBackgroundUrl] = useState("");
  const [backgroundPreset, setBackgroundPreset] =
    useState<BackgroundPreset>("preset1");
  const [editingBoardTitleId, setEditingBoardTitleId] = useState<string | null>(
    null
  );
  const [editingBoardTitleValue, setEditingBoardTitleValue] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initial laden (inkl. Migration von alter Single-List-Version)
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as {
          boards?: Board[];
          backgroundUrl?: string;
          backgroundPreset?: BackgroundPreset;
        };
        if (Array.isArray(parsed.boards) && parsed.boards.length > 0) {
          const migratedBoards: Board[] = parsed.boards.map((b) => ({
            ...b,
            useDays: b.useDays ?? false,
          }));
          setBoards(migratedBoards);
          setBackgroundUrl(parsed.backgroundUrl ?? "");
          setBackgroundPreset(parsed.backgroundPreset ?? "preset1");
          return;
        }
      } catch {
        // ignore
      }
    }

    // Versuch alte Struktur "todos" zu migrieren
    const oldTodosRaw = localStorage.getItem("todos");
    if (oldTodosRaw) {
      try {
        const oldTodos = JSON.parse(oldTodosRaw) as Todo[];
        setBoards([
          {
            ...createDefaultBoard(),
            todos: oldTodos.map((t) => ({ ...t, day: t.day ?? null })),
          },
        ]);
        return;
      } catch {
        // ignore
      }
    }

    // Fallback: ein leeres Board
    setBoards([createDefaultBoard()]);
  }, []);

  // Speichern
  useEffect(() => {
    const payload = {
      boards,
      backgroundUrl,
      backgroundPreset,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [boards, backgroundUrl, backgroundPreset]);

  // Board-Helfer
  const updateBoard = (id: string, updater: (prev: Board) => Board) => {
    setBoards((prev) => prev.map((b) => (b.id === id ? updater(b) : b)));
  };

  const addBoard = () => {
    setBoards((prev) => [
      ...prev,
      {
        ...createDefaultBoard(),
        title: "New Board",
      },
    ]);
  };

  const deleteBoard = (id: string) => {
    setBoards((prev) => {
      if (prev.length <= 1) return prev; // mindestens 1 Board behalten
      return prev.filter((b) => b.id !== id);
    });
  };

  const startEditBoardTitle = (board: Board) => {
    setEditingBoardTitleId(board.id);
    setEditingBoardTitleValue(board.title);
  };

  const saveBoardTitle = () => {
    if (!editingBoardTitleId) return;
    const trimmed = editingBoardTitleValue.trim();
    if (!trimmed) {
      setEditingBoardTitleId(null);
      setEditingBoardTitleValue("");
      return;
    }

    setBoards((prev) =>
      prev.map((b) =>
        b.id === editingBoardTitleId ? { ...b, title: trimmed } : b
      )
    );

    setEditingBoardTitleId(null);
    setEditingBoardTitleValue("");
  };

  const cancelBoardTitleEdit = () => {
    setEditingBoardTitleId(null);
    setEditingBoardTitleValue("");
  };

  const handleBoardTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") saveBoardTitle();
    if (e.key === "Escape") cancelBoardTitleEdit();
  };

  const handleBackgroundUrlChange = (e: ChangeEvent<HTMLInputElement>) => {
    setBackgroundUrl(e.target.value);
  };

  const handleBackgroundFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setBackgroundUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const toggleBoardWeekMode = (id: string) => {
    updateBoard(id, (prev) => ({
      ...prev,
      useDays: !prev.useDays,
    }));
  };

  return (
    <div className="relative min-h-screen text-slate-50">
      {/* Hintergrund: Bild + Overlay */}
      <div className="fixed inset-0 -z-20">
        <div className="absolute inset-0 bg-slate-950" />
        {backgroundPreset === "preset1" && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950" />
        )}
        {backgroundPreset === "preset2" && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900" />
        )}
        {backgroundPreset === "preset3" && (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-950" />
        )}
        {backgroundUrl && (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${backgroundUrl})` }}
          />
        )}
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]" />
      </div>

      {/* leichter Glow im Hintergrund */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-32 left-10 h-64 w-64 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="absolute bottom-0 right-10 h-80 w-80 rounded-full bg-fuchsia-500/15 blur-3xl" />
      </div>

      {/* Inhalt */}
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 md:px-6 md:py-10">
        {/* Top-Bar */}
        <header className="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
              Glassboard
            </h1>
            <p className="mt-1 text-xs text-slate-400 md:text-sm">
              Organize your tasks in flexible boards – with optional weekly
              planning ✨
            </p>
          </div>

          <div className="flex flex-col gap-2 text-xs md:min-w-[320px]">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-xl">
              <span className="text-[11px] text-slate-300">Background</span>
              <div className="inline-flex gap-1 rounded-2xl bg-slate-950/40 p-1">
                {(["preset1", "preset2", "preset3"] as BackgroundPreset[]).map(
                  (preset, index) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBackgroundPreset(preset)}
                      className={`h-6 w-6 rounded-xl text-[10px] ${
                        backgroundPreset === preset
                          ? "ring-2 ring-slate-100 ring-offset-2 ring-offset-slate-900"
                          : "opacity-70 hover:opacity-100"
                      } ${
                        preset === "preset1"
                          ? "bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-950"
                          : preset === "preset2"
                          ? "bg-gradient-to-br from-slate-950 via-purple-900 to-slate-900"
                          : "bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-950"
                      }`}
                      title={`Preset ${index + 1}`}
                    />
                  )
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="ml-auto rounded-xl border border-white/25 bg-slate-950/40 px-2 py-1 text-[11px] text-slate-100 hover:bg-slate-900"
              >
                Upload
              </button>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-xl">
              <input
                type="text"
                placeholder="Paste image URL (optional)"
                className="min-w-0 flex-1 bg-transparent text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
                value={backgroundUrl}
                onChange={handleBackgroundUrlChange}
              />
            </div>

            <div className="self-end text-[10px] text-slate-500">
              Tip: dark / blurred images work best for readability.
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBackgroundFileChange}
            />
          </div>
        </header>

        {/* Boards Grid */}
        <main className="flex-1">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
            {boards.map((board) => {
              const total = board.todos.length;
              const openCount = board.todos.filter((t) => !t.done).length;
              const doneCount = total - openCount;

              // gefilterte Todos (Status + Wochentag)
              const filteredTodos = board.todos.filter((t) => {
                if (board.statusFilter === "open" && t.done) return false;
                if (board.statusFilter === "done" && !t.done) return false;
                if (
                  board.useDays &&
                  board.dayFilter !== "all" &&
                  t.day !== board.dayFilter
                ) {
                  return false;
                }
                return true;
              });

              // Funktionen nur für dieses Board
              const handleAddTodo = (e: FormEvent<HTMLFormElement>) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                const title = String(formData.get("title") ?? "").trim();
                const day = String(formData.get("day") ?? "");
                if (!title) return;

                const newTodo: Todo = {
                  id: crypto.randomUUID(),
                  title,
                  done: false,
                  createdAt: Date.now(),
                  day:
                    board.useDays && day && day !== "none"
                      ? (day as Day)
                      : null,
                };

                updateBoard(board.id, (prev) => ({
                  ...prev,
                  todos: [newTodo, ...prev.todos],
                }));

                form.reset();
              };

              const toggleTodo = (id: string) => {
                updateBoard(board.id, (prev) => ({
                  ...prev,
                  todos: prev.todos.map((t) =>
                    t.id === id ? { ...t, done: !t.done } : t
                  ),
                }));
              };

              const startEditingTodo = (id: string) => {
                const todo = board.todos.find((t) => t.id === id);
                if (!todo) return;
                const nextTitle = window.prompt("Edit task", todo.title);
                if (nextTitle === null) return;
                const trimmed = nextTitle.trim();
                if (!trimmed) {
                  updateBoard(board.id, (prev) => ({
                    ...prev,
                    todos: prev.todos.filter((t) => t.id !== id),
                  }));
                } else {
                  updateBoard(board.id, (prev) => ({
                    ...prev,
                    todos: prev.todos.map((t) =>
                      t.id === id ? { ...t, title: trimmed } : t
                    ),
                  }));
                }
              };

              const deleteTodo = (id: string) => {
                updateBoard(board.id, (prev) => ({
                  ...prev,
                  todos: prev.todos.filter((t) => t.id !== id),
                }));
              };

              const clearDone = () => {
                updateBoard(board.id, (prev) => ({
                  ...prev,
                  todos: prev.todos.filter((t) => !t.done),
                }));
              };

              const setStatusFilter = (filter: Filter) => {
                updateBoard(board.id, (prev) => ({
                  ...prev,
                  statusFilter: filter,
                }));
              };

              const setDayFilter = (day: Day | "all") => {
                updateBoard(board.id, (prev) => ({
                  ...prev,
                  dayFilter: day,
                }));
              };

              const isEditingTitle = editingBoardTitleId === board.id;

              return (
                <section
                  key={board.id}
                  className="flex h-full flex-col rounded-3xl border border-white/15 bg-white/10 p-4 shadow-[0_0_35px_rgba(15,23,42,0.7)] backdrop-blur-2xl transition hover:border-indigo-300/60 hover:bg-white/15"
                >
                  {/* Board Header */}
                  <header className="mb-3 flex items-start justify-between gap-2">
                    <div className="flex-1">
                      {isEditingTitle ? (
                        <div className="flex items-center gap-2">
                          <input
                            className="w-full rounded-xl border border-white/30 bg-slate-950/40 px-2 py-1 text-xs outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-400"
                            value={editingBoardTitleValue}
                            onChange={(e) =>
                              setEditingBoardTitleValue(e.target.value)
                            }
                            onKeyDown={handleBoardTitleKeyDown}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={saveBoardTitle}
                            className="rounded-xl bg-emerald-500 px-2 py-1 text-[11px] text-slate-950 hover:bg-emerald-400"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelBoardTitleEdit}
                            className="rounded-xl border border-white/40 px-2 py-1 text-[11px] text-slate-100 hover:bg-slate-900/60"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <h2 className="text-sm font-semibold tracking-tight text-slate-50">
                          {board.title}
                        </h2>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <button
                        type="button"
                        onClick={() => toggleBoardWeekMode(board.id)}
                        className={`rounded-full border px-2 py-1 text-[10px] ${
                          board.useDays
                            ? "border-emerald-400/70 bg-emerald-500/20 text-emerald-50"
                            : "border-white/30 bg-white/10 text-slate-100"
                        }`}
                      >
                        Week mode: {board.useDays ? "On" : "Off"}
                      </button>
                      <div className="flex items-center gap-1">
                        {!isEditingTitle && (
                          <button
                            type="button"
                            onClick={() => startEditBoardTitle(board)}
                            className="rounded-full border border-white/30 bg-white/10 px-2 py-1 text-[10px] text-slate-100 hover:bg-white/20"
                            title="Rename board"
                          >
                            ✏️
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => deleteBoard(board.id)}
                          disabled={boards.length <= 1}
                          className="rounded-full border border-rose-400/60 bg-rose-500/20 px-2 py-1 text-[10px] text-rose-100 hover:bg-rose-500/30 disabled:border-slate-600 disabled:bg-slate-800/60 disabled:text-slate-400"
                          title={
                            boards.length <= 1
                              ? "At least one board must remain"
                              : "Delete board"
                          }
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </header>

                  {/* Add-Form */}
                  <form
                    onSubmit={handleAddTodo}
                    className="mb-3 flex flex-col gap-2 text-xs"
                  >
                    <div className="flex gap-2">
                      <input
                        name="title"
                        className="flex-1 rounded-2xl border border-white/25 bg-slate-950/40 px-3 py-1.5 text-xs outline-none placeholder:text-slate-500 focus:border-indigo-300 focus:ring-1 focus:ring-indigo-400"
                        placeholder="Add a new task..."
                      />
                      <button
                        type="submit"
                        className="rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-500 px-3 py-1.5 text-[11px] font-medium text-slate-50 shadow-md shadow-indigo-500/30 hover:from-indigo-400 hover:to-violet-400 active:scale-[0.97]"
                      >
                        Add
                      </button>
                    </div>
                    {board.useDays && (
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-slate-400">
                          Day:
                        </span>
                        <select
                          name="day"
                          className="rounded-xl border border-white/20 bg-slate-950/40 px-2 py-1 text-[11px] text-slate-100 outline-none focus:border-indigo-300 focus:ring-1 focus:ring-indigo-400"
                          defaultValue="none"
                        >
                          <option value="none">None</option>
                          {DAY_LABELS.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </form>

                  {/* Filter */}
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-[10px]">
                    <div className="inline-flex rounded-2xl bg-slate-950/40 px-1 py-1">
                      {(["all", "open", "done"] as Filter[]).map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => setStatusFilter(f)}
                          className={`rounded-xl px-2 py-1 capitalize transition ${
                            board.statusFilter === f
                              ? "bg-slate-100 text-slate-900 shadow-sm"
                              : "text-slate-200 hover:bg-slate-900/70"
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                    {board.useDays && (
                      <div className="inline-flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => setDayFilter("all")}
                          className={`rounded-xl px-2 py-1 transition ${
                            board.dayFilter === "all"
                              ? "bg-slate-100 text-slate-900"
                              : "bg-slate-950/40 text-slate-200 hover:bg-slate-900/80"
                          }`}
                        >
                          All days
                        </button>
                        {DAY_LABELS.map((d) => (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => setDayFilter(d.id)}
                            className={`rounded-xl px-2 py-1 transition ${
                              board.dayFilter === d.id
                                ? "bg-indigo-400 text-slate-950"
                                : "bg-slate-950/40 text-slate-200 hover:bg-slate-900/80"
                            }`}
                          >
                            {d.short}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Todo-Liste */}
                  <div className="flex-1 space-y-2 overflow-y-auto pr-1 text-xs">
                    {filteredTodos.length === 0 && (
                      <p className="py-4 text-center text-[11px] text-slate-400">
                        No tasks match this filter. ✨
                      </p>
                    )}

                    {filteredTodos.map((todo) => {
                      const dayLabel =
                        board.useDays &&
                        todo.day &&
                        DAY_LABELS.find((d) => d.id === todo.day)?.short;

                      return (
                        <div
                          key={todo.id}
                          className="group flex items-start gap-2 rounded-2xl border border-white/15 bg-slate-950/40 px-3 py-2 hover:border-indigo-300/60 hover:bg-slate-950/70"
                        >
                          <input
                            type="checkbox"
                            checked={todo.done}
                            onChange={() => toggleTodo(todo.id)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-500 bg-slate-900 text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 focus:ring-offset-slate-900"
                          />
                          <div className="flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`block text-[13px] ${
                                  todo.done
                                    ? "line-through text-slate-500"
                                    : "text-slate-50"
                                }`}
                              >
                                {todo.title}
                              </span>
                              {dayLabel && (
                                <span className="rounded-full bg-slate-900/80 px-2 py-0.5 text-[10px] text-slate-200">
                                  {dayLabel}
                                </span>
                              )}
                            </div>
                            <div className="mt-0.5 flex items-center justify-between text-[10px] text-slate-500">
                              <span>
                                {todo.done ? "Completed" : "Created"} ·{" "}
                                {new Date(todo.createdAt).toLocaleTimeString(
                                  [],
                                  {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </span>
                              <div className="flex items-center gap-1 opacity-0 transition group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => startEditingTodo(todo.id)}
                                  className="rounded-lg border border-white/30 px-2 py-0.5 text-[10px] text-slate-100 hover:bg-slate-800"
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteTodo(todo.id)}
                                  className="rounded-lg bg-rose-500/80 px-2 py-0.5 text-[10px] text-slate-950 hover:bg-rose-400"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Board Footer */}
                  <footer className="mt-3 flex items-center justify-between text-[10px] text-slate-400">
                    <span>
                      {total === 0
                        ? "No tasks yet."
                        : `${openCount} open · ${doneCount} done · ${total} total`}
                    </span>
                    <button
                      type="button"
                      onClick={clearDone}
                      className="text-rose-200 hover:text-rose-100 underline-offset-2 hover:underline"
                    >
                      Clear done
                    </button>
                  </footer>
                </section>
              );
            })}

            {/* Plus-Board */}
            <button
              type="button"
              onClick={addBoard}
              className="flex h-full min-h-[220px] items-center justify-center rounded-3xl border border-dashed border-white/30 bg-white/5 p-4 text-slate-200 backdrop-blur-2xl transition hover:border-indigo-400/70 hover:bg-white/15"
            >
              <div className="flex flex-col items-center gap-2 text-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 text-2xl shadow-lg shadow-indigo-500/40">
                  +
                </div>
                <span className="text-xs font-medium">
                  Add new board (e.g. “Monday”, “Work”, “Uni”…)
                </span>
              </div>
            </button>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-6 text-[10px] text-slate-500">
          Data is stored locally in your browser. Create multiple boards for
          days, projects or themes – whatever fits your workflow.
        </footer>
      </div>
    </div>
  );
}

export default App;
