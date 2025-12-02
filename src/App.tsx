import type { FormEvent, KeyboardEvent } from "react";
import { useEffect, useState } from "react";

type Todo = {
  id: string;
  title: string;
  done: boolean;
  createdAt: number;
};

type Filter = "all" | "open" | "done";

function App() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  // Beim Laden: aus localStorage lesen
  useEffect(() => {
    const raw = localStorage.getItem("todos");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Todo[];
      if (Array.isArray(parsed)) {
        setTodos(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Bei Änderungen: in localStorage speichern
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  // CREATE
  const handleAdd = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed) return;

    const newTodo: Todo = {
      id: crypto.randomUUID(),
      title: trimmed,
      done: false,
      createdAt: Date.now(),
    };

    setTodos((prev) => [newTodo, ...prev]);
    setInput("");
  };

  // UPDATE: done toggeln
  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  // UPDATE: bearbeiten starten
  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingValue(todo.title);
  };

  const handleEditingKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      saveEditing();
    }
    if (e.key === "Escape") {
      cancelEditing();
    }
  };

  const saveEditing = () => {
    if (!editingId) return;
    const trimmed = editingValue.trim();

    if (!trimmed) {
      setTodos((prev) => prev.filter((t) => t.id !== editingId));
    } else {
      setTodos((prev) =>
        prev.map((t) => (t.id === editingId ? { ...t, title: trimmed } : t))
      );
    }

    setEditingId(null);
    setEditingValue("");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingValue("");
  };

  // DELETE
  const deleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const clearDone = () => {
    setTodos((prev) => prev.filter((t) => !t.done));
  };

  // FILTER
  const filteredTodos = todos.filter((t) => {
    if (filter === "open") return !t.done;
    if (filter === "done") return t.done;
    return true;
  });

  const openCount = todos.filter((t) => !t.done).length;
  const doneCount = todos.length - openCount;

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-xl rounded-3xl border border-slate-800/70 bg-slate-900/70 backdrop-blur-xl shadow-[0_0_40px_rgba(79,70,229,0.35)] p-6 md:p-8">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              To-Do List
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Simple CRUD App – React · TypeScript · Tailwind ✨
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="rounded-full border border-slate-700 bg-slate-900/70 px-3 py-1 text-xs uppercase tracking-wide text-slate-200">
              {openCount} open
            </span>
            <span className="text-[10px] text-slate-500">
              {todos.length} total · {doneCount} done
            </span>
          </div>
        </header>

        {/* Add Form */}
        <form onSubmit={handleAdd} className="mb-5 flex gap-2 items-center">
          <div className="flex-1 relative">
            <input
              className="w-full rounded-2xl border border-slate-700/80 bg-slate-950/60 px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40 transition-shadow"
              placeholder="Add a new task..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-wide text-slate-500">
              Enter ↵
            </span>
          </div>
          <button
            type="submit"
            className="rounded-2xl bg-linear-to-r from-indigo-500 to-violet-500 px-4 py-2.5 text-xs md:text-sm font-medium shadow-lg shadow-indigo-500/30 hover:from-indigo-400 hover:to-violet-400 active:scale-[0.98] transition disabled:opacity-40 disabled:shadow-none"
            disabled={!input.trim()}
          >
            Add
          </button>
        </form>

        {/* Filter */}
        <div className="mb-4 flex items-center justify-between gap-2 text-xs">
          <div className="inline-flex rounded-2xl bg-slate-900/80 border border-slate-700/80 p-1">
            {(["all", "open", "done"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-xl capitalize transition text-xs md:text-[11px] ${
                  filter === f
                    ? "bg-slate-100 text-slate-900 shadow-sm"
                    : "text-slate-300 hover:bg-slate-800/80"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={clearDone}
            className="text-slate-400 hover:text-rose-300 text-[11px] md:text-xs underline-offset-2 hover:underline"
          >
            Clear done
          </button>
        </div>

        {/* List */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {filteredTodos.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-8">
              No tasks yet. Add your first one ✨
            </p>
          )}

          {filteredTodos.map((todo) => {
            const isEditing = editingId === todo.id;
            return (
              <div
                key={todo.id}
                className="group flex items-center gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/70 px-3.5 py-2.5 text-sm hover:border-indigo-400/70 hover:bg-slate-900/90 transition-all"
              >
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => toggleTodo(todo.id)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-950 text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:ring-offset-2 focus:ring-offset-slate-900"
                />

                <div className="flex-1">
                  {isEditing ? (
                    <input
                      className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      autoFocus
                      onKeyDown={handleEditingKeyDown}
                    />
                  ) : (
                    <span
                      className={`block ${
                        todo.done
                          ? "line-through text-slate-500"
                          : "text-slate-100"
                      }`}
                    >
                      {todo.title}
                    </span>
                  )}
                  <span className="mt-0.5 block text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 transition">
                    {todo.done ? "Completed" : "Created"} ·{" "}
                    {new Date(todo.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={saveEditing}
                        className="rounded-lg bg-emerald-500 px-2 py-1 text-[11px] text-slate-900 hover:bg-emerald-400"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="rounded-lg border border-slate-600 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEditing(todo)}
                        className="rounded-lg border border-slate-600 px-2 py-1 text-[11px] text-slate-200 hover:bg-slate-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTodo(todo.id)}
                        className="rounded-lg bg-rose-500 px-2 py-1 text-[11px] text-slate-900 hover:bg-rose-400"
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer / Stats */}
        <footer className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            {todos.length === 0
              ? "No tasks yet – perfect time to start ✨"
              : `${openCount} open · ${doneCount} done · ${todos.length} total`}
          </span>
          <span className="hidden md:inline">
            Changes are saved locally in your browser.
          </span>
        </footer>
      </div>
    </div>
  );
}

export default App;
