import dayjs from "dayjs";
import { Task } from "@/db/schema";
import { TaskGroup } from "./types";

export function groupTasks(tasks: Task[]): TaskGroup[] {
  const now = dayjs();
  const overdue: Task[] = [];
  const today: Task[] = [];
  const tomorrow: Task[] = [];
  const week: Task[] = [];
  const nodate: Task[] = [];
  const completed: Task[] = [];

  for (const t of tasks) {
    if (isCompleted(t.status)) {
      completed.push(t);
      continue;
    }

    if (!t.startDate) {
      nodate.push(t);
      continue;
    }
    const due = dayjs(t.startDate);
    if (due.isBefore(now, "day")) {
      overdue.push(t);
    } else if (due.isSame(now, "day")) {
      today.push(t);
    } else if (due.diff(now, "day") === 1) {
      tomorrow.push(t);
    } else if (due.diff(now, "day") <= 6) {
      week.push(t);
    } else {
      nodate.push(t);
    }
  }

  return [
    { group: "已过期", accent: "text-red-500", tasks: overdue },
    { group: "今天", tasks: today },
    { group: "明天", tasks: tomorrow },
    { group: "最近7天", tasks: week },
    { group: "无日期", tasks: nodate },
    { group: "已完成", tasks: completed }
  ];
}

export function formatDate(ts?: number) {
  if (!ts) return "无日期";
  const d = dayjs(ts);
  return d.format("MM月DD日");
}

export function isOverdue(ts?: number) {
  if (!ts) return false;
  return dayjs(ts).isBefore(dayjs(), "day");
}

export function isToday(ts?: number) {
  if (!ts) return false;
  return dayjs(ts).isSame(dayjs(), "day");
}

export function isWeek(ts?: number) {
  if (!ts) return false;
  const diff = dayjs(ts).diff(dayjs(), "day");
  return diff >= 0 && diff <= 6;
}

export function isTomorrow(ts?: number) {
  if (!ts) return false;
  return dayjs(ts).diff(dayjs(), "day") === 1;
}

export function isCompleted(status?: number) {
  return status !== undefined && status >= 2;
}

// 优先级配置
export const PRIORITY_CONFIG = {
  0: { label: "默认", color: "text-gray-400", borderColor: "border-gray-300", bgColor: "bg-gray-400" },
  1: { label: "低", color: "text-blue-500", borderColor: "border-blue-500", bgColor: "bg-blue-500" },
  2: { label: "中", color: "text-yellow-500", borderColor: "border-yellow-500", bgColor: "bg-yellow-500" },
  3: { label: "高", color: "text-red-500", borderColor: "border-red-500", bgColor: "bg-red-500" }
} as const;

export type PriorityLevel = keyof typeof PRIORITY_CONFIG;

export function getPriorityConfig(priority: number) {
  return PRIORITY_CONFIG[(priority as PriorityLevel) ?? 0] || PRIORITY_CONFIG[0];
}
