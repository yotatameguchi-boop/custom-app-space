// Schedule generator: splits tasks into daily work blocks around habits.

export type Habits = {
  wakeHour: number; // 0-23
  sleepHour: number; // 0-23 (end of day)
  breakfastMin: number; // minutes for meals
  lunchHour: number;
  lunchMin: number;
  dinnerHour: number;
  dinnerMin: number;
  workStart: number; // fixed work/school block start
  workEnd: number;
  workDays: number[]; // 0=Sun ... 6=Sat
  focusBlockMin: number; // preferred contiguous work block (min)
  maxDailyTaskMin: number; // cap of task work minutes per day
};

export const DEFAULT_HABITS: Habits = {
  wakeHour: 7,
  sleepHour: 23,
  breakfastMin: 30,
  lunchHour: 12,
  lunchMin: 45,
  dinnerHour: 19,
  dinnerMin: 60,
  workStart: 9,
  workEnd: 18,
  workDays: [1, 2, 3, 4, 5],
  focusBlockMin: 60,
  maxDailyTaskMin: 180,
};

export type Task = {
  id: string;
  title: string;
  totalMin: number; // total effort in minutes
  deadline: string; // ISO date (YYYY-MM-DD)
  priority: "low" | "mid" | "high";
  color: string;
};

export type Block = {
  taskId: string | null; // null = habit / fixed
  title: string;
  startMin: number; // minutes from 00:00 that day
  endMin: number;
  kind: "habit" | "work" | "task" | "sleep";
  color?: string;
};

export type DaySchedule = {
  date: string; // YYYY-MM-DD
  weekday: number;
  blocks: Block[];
};

const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

// Build the immovable skeleton for a given day.
function skeleton(date: Date, h: Habits): Block[] {
  const wd = date.getDay();
  const blocks: Block[] = [];
  // sleep before wake
  blocks.push({ taskId: null, title: "睡眠", startMin: 0, endMin: h.wakeHour * 60, kind: "sleep" });
  // breakfast right after wake
  blocks.push({
    taskId: null,
    title: "朝食・支度",
    startMin: h.wakeHour * 60,
    endMin: h.wakeHour * 60 + h.breakfastMin,
    kind: "habit",
  });
  // work/school (only on workDays)
  if (h.workDays.includes(wd) && h.workEnd > h.workStart) {
    blocks.push({
      taskId: null,
      title: "仕事 / 学校",
      startMin: h.workStart * 60,
      endMin: h.workEnd * 60,
      kind: "work",
    });
  }
  // lunch
  blocks.push({
    taskId: null,
    title: "昼食",
    startMin: h.lunchHour * 60,
    endMin: h.lunchHour * 60 + h.lunchMin,
    kind: "habit",
  });
  // dinner
  blocks.push({
    taskId: null,
    title: "夕食",
    startMin: h.dinnerHour * 60,
    endMin: h.dinnerHour * 60 + h.dinnerMin,
    kind: "habit",
  });
  // sleep after sleepHour
  blocks.push({
    taskId: null,
    title: "睡眠",
    startMin: h.sleepHour * 60,
    endMin: 24 * 60,
    kind: "sleep",
  });
  return blocks.sort((a, b) => a.startMin - b.startMin);
}

// Merge overlapping/adjacent fixed blocks then compute free slots.
function freeSlots(fixed: Block[]): { start: number; end: number }[] {
  const sorted = [...fixed].sort((a, b) => a.startMin - b.startMin);
  const merged: { start: number; end: number }[] = [];
  for (const b of sorted) {
    const last = merged[merged.length - 1];
    if (last && b.startMin <= last.end) {
      last.end = Math.max(last.end, b.endMin);
    } else {
      merged.push({ start: b.startMin, end: b.endMin });
    }
  }
  const gaps: { start: number; end: number }[] = [];
  let cursor = 0;
  for (const m of merged) {
    if (m.start > cursor) gaps.push({ start: cursor, end: m.start });
    cursor = m.end;
  }
  if (cursor < 24 * 60) gaps.push({ start: cursor, end: 24 * 60 });
  return gaps.filter((g) => g.end - g.start >= 15);
}

export function generateSchedule(
  tasks: Task[],
  habits: Habits,
  days = 14,
  startDate = new Date(),
): DaySchedule[] {
  // Sort tasks by deadline asc, then priority
  const prioW = { high: 0, mid: 1, low: 2 };
  const queue = tasks
    .map((t) => ({ ...t, remaining: t.totalMin }))
    .sort((a, b) => {
      if (a.deadline !== b.deadline) return a.deadline.localeCompare(b.deadline);
      return prioW[a.priority] - prioW[b.priority];
    });

  const schedule: DaySchedule[] = [];
  for (let i = 0; i < days; i++) {
    const date = addDays(startDate, i);
    const iso = isoDate(date);
    const fixed = skeleton(date, habits);
    const gaps = freeSlots(fixed);
    const blocks: Block[] = [...fixed];

    let dailyUsed = 0;
    for (const gap of gaps) {
      let cursor = gap.start;
      while (cursor + 15 <= gap.end && dailyUsed < habits.maxDailyTaskMin) {
        const task = queue.find(
          (t) => t.remaining > 0 && t.deadline >= iso,
        );
        if (!task) break;
        const slotLen = Math.min(
          gap.end - cursor,
          habits.focusBlockMin,
          task.remaining,
          habits.maxDailyTaskMin - dailyUsed,
        );
        if (slotLen < 15) break;
        blocks.push({
          taskId: task.id,
          title: task.title,
          startMin: cursor,
          endMin: cursor + slotLen,
          kind: "task",
          color: task.color,
        });
        task.remaining -= slotLen;
        dailyUsed += slotLen;
        cursor += slotLen;
        // small break between focus blocks
        cursor += 15;
      }
    }

    blocks.sort((a, b) => a.startMin - b.startMin);
    schedule.push({ date: iso, weekday: date.getDay(), blocks });
  }
  return schedule;
}

export function formatTime(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export const WEEKDAY_JP = ["日", "月", "火", "水", "木", "金", "土"];
