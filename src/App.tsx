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

  // ✅ LocalStorage laden
  useEffect(() => {
    const saved = localStorage.getItem("todos");
    if (saved) {
      try {
        setTodos(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  // ✅ LocalStorage speichern
  useEffect(() => {
    localStorage.setItem("todos", JSON.stringify(todos));
  }, [todos]);

  // CREATE
  const addTodo = () => {
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

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addTodo();
  };

  // UPDATE: done toggeln
  const toggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  // UPDATE: Titel bearbeiten
  const startEditing = (todo: Todo) => {
    setEditingId(todo.id);
    setEditingValue(todo.title);
  };

  const saveEditing = () => {
    if (!editingId) return;
    const trimmed = editingValue.trim();
    if (!trimmed) {
      // Wenn leer -> löschen
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900/80 shadow-2xl p-6 md:p-8">
        {/* Header */}
        <header className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              To-Do List
            </h1>
            <p className="text-sm text-slate-400">
              Simple CRUD App – built with React & Tailwind ✨
            </p>
          </div>
          <span className="rounded-full border border-slate-700 px-3 py-1 text-xs uppercase tracking-wide text-slate-300">
            {openCount} open
          </span>
        </header>

        {/* Add Form */}
        <form
          onSubmit={handleAddSubmit}
          className="mb-4 flex gap-2 items-center"
        >
          <input
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
            placeholder="Add a new task..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <button
            type="submit"
            className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium hover:bg-indigo-400 transition disabled:opacity-40"
            disabled={!input.trim()}
          >
            Add
          </button>
        </form>

        {/* Filter */}
        <div className="mb-4 flex items-center justify-between gap-2 text-xs">
          <div className="inline-flex rounded-xl bg-slate-800 p-1">
            {(["all", "open", "done"] as Filter[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-lg capitalize transition ${
                  filter === f
                    ? "bg-slate-100 text-slate-900"
                    : "text-slate-300 hover:bg-slate-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={clearDone}
            className="text-slate-400 hover:text-rose-300 text-xs"
          >
            Clear done
          </button>
        </div>

        {/* List */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {filteredTodos.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-6">
              No tasks here yet. Add your first one ✨
            </p>
          )}

          {filteredTodos.map((todo) => {
            const isEditing = editingId === todo.id;
            return (
              <div
                key={todo.id}
                className="group flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => toggleTodo(todo.id)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500"
                />

                {/* Text / Edit-Input */}
                <div className="flex-1">
                  {isEditing ? (
                    <input
                      className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-sm outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") saveEditing();
                        if (e.key === "Escape") cancelEditing();
                      }}
                    />
                  ) : (
                    <span
                      className={`block ${
                        todo.done ? "line-through text-slate-500" : ""
                      }`}
                    >
                      {todo.title}
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  {isEditing ? (
                    <>
                      <button
                        type="button"
                        onClick={saveEditing}
                        className="rounded-lg bg-emerald-500 px-2 py-1 text-xs text-slate-900 hover:bg-emerald-400"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={cancelEditing}
                        className="rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => startEditing(todo)}
                        className="rounded-lg border border-slate-600 px-2 py-1 text-xs text-slate-200 hover:bg-slate-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTodo(todo.id)}
                        className="rounded-lg bg-rose-500 px-2 py-1 text-xs text-slate-900 hover:bg-rose-400"
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
      </div>
    </div>
  );
}

export default App;
