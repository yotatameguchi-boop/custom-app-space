import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_HABITS,
  WEEKDAY_JP,
  formatTime,
  generateSchedule,
  type Habits,
  type Task,
} from "@/lib/schedule";

export const Route = createFileRoute("/schedule")({
  head: () => ({
    meta: [
      { title: "リズムプラン｜生活習慣から作るスケジュール" },
      {
        name: "description",
        content:
          "生活習慣とタスクの締切から、あなたに合った1〜2週間の集中スケジュールを自動生成。",
      },
      { property: "og:title", content: "リズムプラン｜生活習慣から作るスケジュール" },
      {
        property: "og:description",
        content: "生活リズムに合わせて、タスクを日々の集中ブロックへ分割します。",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Page,
});

type Tab = "habits" | "tasks" | "schedule";

const TASK_COLORS = ["#2d8a9e", "#5cbdb9", "#7c6cd6", "#e07a5f", "#f4a261", "#4a9d7c"];

const HABITS_KEY = "rp:habits";
const TASKS_KEY = "rp:tasks";

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function Page() {
  const [tab, setTab] = useState<Tab>("habits");
  const [habits, setHabits] = useState<Habits>(DEFAULT_HABITS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHabits(loadJSON(HABITS_KEY, DEFAULT_HABITS));
    setTasks(loadJSON(TASKS_KEY, []));
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) localStorage.setItem(HABITS_KEY, JSON.stringify(habits));
  }, [habits, hydrated]);
  useEffect(() => {
    if (hydrated) localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  }, [tasks, hydrated]);

  const schedule = useMemo(() => generateSchedule(tasks, habits, 14), [tasks, habits]);
  const totalRemaining = tasks.reduce((s, t) => s + t.totalMin, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-hero text-primary-foreground">
        <div className="mx-auto max-w-3xl px-5 pt-12 pb-10 md:pt-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-[11px] font-semibold tracking-wide backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--ocean-light)]" />
            RHYTHM PLAN
          </div>
          <h1 className="mt-5 text-3xl leading-[1.2] md:text-5xl">
            生活リズムに、
            <br />
            <span className="text-[color:var(--ocean-light)]">タスクを溶け込ませる。</span>
          </h1>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/85 md:text-base">
            起床・食事・仕事などの固定リズムと、締切のあるタスクを入力すると、
            2週間分の集中ブロックに自動で分割します。
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="sticky top-0 z-10 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-3xl gap-1 px-5 py-3">
          {(
            [
              { id: "habits", label: "生活習慣" },
              { id: "tasks", label: `タスク (${tasks.length})` },
              { id: "schedule", label: "スケジュール" },
            ] as { id: Tab; label: string }[]
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                tab === t.id
                  ? "bg-primary text-primary-foreground shadow-soft"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-5 pt-6 pb-20">
        {tab === "habits" && <HabitsForm habits={habits} setHabits={setHabits} />}
        {tab === "tasks" && (
          <TasksForm tasks={tasks} setTasks={setTasks} totalMin={totalRemaining} />
        )}
        {tab === "schedule" && <ScheduleView schedule={schedule} tasks={tasks} />}
      </main>
    </div>
  );
}

// ---------- Habits ----------
function HabitsForm({ habits, setHabits }: { habits: Habits; setHabits: (h: Habits) => void }) {
  const set = <K extends keyof Habits>(k: K, v: Habits[K]) => setHabits({ ...habits, [k]: v });
  const toggleDay = (d: number) =>
    set(
      "workDays",
      habits.workDays.includes(d)
        ? habits.workDays.filter((x) => x !== d)
        : [...habits.workDays, d].sort(),
    );
  return (
    <section className="space-y-5">
      <Card title="1日のリズム" sub="起床・就寝と食事の時間">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumField label="起床" suffix="時" value={habits.wakeHour} min={0} max={23}
            onChange={(v) => set("wakeHour", v)} />
          <NumField label="就寝" suffix="時" value={habits.sleepHour} min={0} max={23}
            onChange={(v) => set("sleepHour", v)} />
          <NumField label="朝食・支度" suffix="分" value={habits.breakfastMin} min={0} max={120}
            onChange={(v) => set("breakfastMin", v)} />
          <div />
          <NumField label="昼食開始" suffix="時" value={habits.lunchHour} min={0} max={23}
            onChange={(v) => set("lunchHour", v)} />
          <NumField label="昼食" suffix="分" value={habits.lunchMin} min={0} max={180}
            onChange={(v) => set("lunchMin", v)} />
          <NumField label="夕食開始" suffix="時" value={habits.dinnerHour} min={0} max={23}
            onChange={(v) => set("dinnerHour", v)} />
          <NumField label="夕食" suffix="分" value={habits.dinnerMin} min={0} max={180}
            onChange={(v) => set("dinnerMin", v)} />
        </div>
      </Card>

      <Card title="仕事 / 学校" sub="固定の拘束時間">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumField label="開始" suffix="時" value={habits.workStart} min={0} max={23}
            onChange={(v) => set("workStart", v)} />
          <NumField label="終了" suffix="時" value={habits.workEnd} min={0} max={23}
            onChange={(v) => set("workEnd", v)} />
        </div>
        <div className="mt-4">
          <div className="text-xs font-semibold text-foreground">出勤・登校日</div>
          <div className="mt-2 flex gap-1.5">
            {WEEKDAY_JP.map((w, i) => {
              const on = habits.workDays.includes(i);
              return (
                <button
                  key={i}
                  onClick={() => toggleDay(i)}
                  className={`h-9 flex-1 rounded-lg text-xs font-bold transition ${
                    on
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  }`}
                >
                  {w}
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      <Card title="集中の作り方" sub="連続集中ブロックと1日の上限">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumField label="集中ブロック長" suffix="分" value={habits.focusBlockMin} min={15} max={180} step={15}
            onChange={(v) => set("focusBlockMin", v)} />
          <NumField label="1日のタスク上限" suffix="分" value={habits.maxDailyTaskMin} min={30} max={600} step={30}
            onChange={(v) => set("maxDailyTaskMin", v)} />
        </div>
      </Card>
    </section>
  );
}

// ---------- Tasks ----------
function TasksForm({
  tasks,
  setTasks,
  totalMin,
}: {
  tasks: Task[];
  setTasks: (t: Task[]) => void;
  totalMin: number;
}) {
  const [draft, setDraft] = useState({
    title: "",
    hours: 2,
    deadline: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
    priority: "mid" as Task["priority"],
  });

  const add = () => {
    if (!draft.title.trim()) return;
    const t: Task = {
      id: crypto.randomUUID(),
      title: draft.title.trim(),
      totalMin: Math.max(15, Math.round(draft.hours * 60)),
      deadline: draft.deadline,
      priority: draft.priority,
      color: TASK_COLORS[tasks.length % TASK_COLORS.length],
    };
    setTasks([...tasks, t]);
    setDraft({ ...draft, title: "", hours: 2 });
  };
  const remove = (id: string) => setTasks(tasks.filter((t) => t.id !== id));

  return (
    <section className="space-y-5">
      <Card title="新しいタスク" sub="総時間と締切を入力すると、日々に分割されます">
        <div className="grid gap-3">
          <input
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
            placeholder="例: プレゼン資料を作る"
            className={inputCls}
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="text-xs font-semibold">総時間 (時間)</span>
              <input type="number" min={0.25} step={0.25} value={draft.hours}
                onChange={(e) => setDraft({ ...draft, hours: +e.target.value })}
                className={inputCls} />
            </label>
            <label className="block">
              <span className="text-xs font-semibold">締切</span>
              <input type="date" value={draft.deadline}
                onChange={(e) => setDraft({ ...draft, deadline: e.target.value })}
                className={inputCls} />
            </label>
            <label className="block">
              <span className="text-xs font-semibold">優先度</span>
              <select value={draft.priority}
                onChange={(e) => setDraft({ ...draft, priority: e.target.value as Task["priority"] })}
                className={inputCls}>
                <option value="high">高</option>
                <option value="mid">中</option>
                <option value="low">低</option>
              </select>
            </label>
          </div>
          <button
            onClick={add}
            className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-primary-foreground shadow-soft transition hover:opacity-90"
          >
            タスクを追加
          </button>
        </div>
      </Card>

      <div className="rounded-xl bg-secondary/60 p-3 text-xs text-secondary-foreground">
        登録中: <span className="font-bold">{tasks.length}</span> 件 /
        合計 <span className="font-bold">{Math.round(totalMin / 60 * 10) / 10}</span> 時間
      </div>

      {tasks.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">まだタスクがありません</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
              <span
                className="h-8 w-1.5 shrink-0 rounded-full"
                style={{ background: t.color }}
              />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{t.title}</div>
                <div className="text-[11px] text-muted-foreground">
                  {Math.round(t.totalMin / 60 * 10) / 10}h · 締切 {t.deadline} ·{" "}
                  {t.priority === "high" ? "高" : t.priority === "mid" ? "中" : "低"}
                </div>
              </div>
              <button
                onClick={() => remove(t.id)}
                className="rounded-lg px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted"
              >
                削除
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ---------- Schedule ----------
function ScheduleView({
  schedule,
  tasks,
}: {
  schedule: ReturnType<typeof generateSchedule>;
  tasks: Task[];
}) {
  const totalAllocated: Record<string, number> = {};
  for (const day of schedule) {
    for (const b of day.blocks) {
      if (b.kind === "task" && b.taskId) {
        totalAllocated[b.taskId] = (totalAllocated[b.taskId] ?? 0) + (b.endMin - b.startMin);
      }
    }
  }
  const unfinished = tasks.filter(
    (t) => (totalAllocated[t.id] ?? 0) < t.totalMin,
  );

  return (
    <section className="space-y-5">
      {tasks.length === 0 && (
        <div className="rounded-xl border bg-card p-6 text-center text-sm text-muted-foreground">
          タスクを追加すると、ここに 2 週間分のスケジュールが生成されます。
        </div>
      )}

      {unfinished.length > 0 && (
        <div className="rounded-xl border-l-4 border-[color:var(--risk-high)] bg-secondary/60 p-3 text-xs">
          <div className="font-bold text-foreground">締切までに割り当てきれないタスク</div>
          <ul className="mt-1 space-y-0.5 text-secondary-foreground">
            {unfinished.map((t) => (
              <li key={t.id}>
                ・{t.title} — 残り{" "}
                {Math.round((t.totalMin - (totalAllocated[t.id] ?? 0)) / 60 * 10) / 10}h
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {schedule.map((day) => {
          const taskBlocks = day.blocks.filter((b) => b.kind === "task");
          const workBlocks = day.blocks.filter((b) => b.kind !== "sleep");
          return (
            <div key={day.date} className="overflow-hidden rounded-2xl border bg-card shadow-soft">
              <div className="flex items-center justify-between bg-secondary/50 px-4 py-2.5">
                <div>
                  <div className="text-xs font-semibold text-muted-foreground">
                    {WEEKDAY_JP[day.weekday]}曜日
                  </div>
                  <div className="text-sm font-bold">{day.date}</div>
                </div>
                <div className="text-[11px] font-semibold text-primary">
                  集中 {Math.round(
                    taskBlocks.reduce((s, b) => s + (b.endMin - b.startMin), 0) / 60 * 10,
                  ) / 10}
                  h
                </div>
              </div>
              {workBlocks.length === 0 ? (
                <div className="p-4 text-xs text-muted-foreground">予定なし</div>
              ) : (
                <ul className="divide-y">
                  {workBlocks.map((b, i) => (
                    <li key={i} className="flex items-center gap-3 px-4 py-2">
                      <span
                        className="h-6 w-1 shrink-0 rounded-full"
                        style={{
                          background:
                            b.kind === "task"
                              ? b.color
                              : b.kind === "work"
                              ? "var(--ocean-deep)"
                              : "var(--muted-foreground)",
                          opacity: b.kind === "task" ? 1 : 0.45,
                        }}
                      />
                      <span className="w-24 shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">
                        {formatTime(b.startMin)}–{formatTime(b.endMin)}
                      </span>
                      <span
                        className={`truncate text-sm ${
                          b.kind === "task" ? "font-semibold text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {b.title}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---------- Primitives ----------
const inputCls =
  "mt-1.5 w-full rounded-xl border bg-background px-3 py-2.5 text-sm outline-none transition focus:border-ring focus:ring-2 focus:ring-ring/25";

function Card({
  title,
  sub,
  children,
}: {
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border bg-card p-5 shadow-soft md:p-6">
      <div>
        <h2 className="text-base font-bold">{title}</h2>
        {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function NumField({
  label,
  suffix,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  suffix?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-foreground">{label}</span>
        {suffix && <span className="text-[11px] text-muted-foreground">{suffix}</span>}
      </div>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step ?? 1}
        onChange={(e) => onChange(+e.target.value)}
        className={inputCls}
      />
    </label>
  );
}
