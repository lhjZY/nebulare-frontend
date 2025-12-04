import dayjs, { nowInTimezone, parseInTimezone, getBrowserTimezone } from "@/lib/dayjs";
import { Task } from "@/db/schema";
import { TaskGroup } from "./types";

export function groupTasks(tasks: Task[]): TaskGroup[] {
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

    // 使用任务的时区，如果没有则使用浏览器时区
    const tz = t.timeZone || getBrowserTimezone();
    const now = nowInTimezone(tz);
    const tomorrowDate = now.add(1, "day");
    const weekEnd = now.add(6, "day");
    const due = parseInTimezone(t.startDate, tz);

    if (due.isBefore(now, "day")) {
      overdue.push(t);
    } else if (due.isSame(now, "day")) {
      today.push(t);
    } else if (due.isSame(tomorrowDate, "day")) {
      tomorrow.push(t);
    } else if (due.isBefore(weekEnd, "day") || due.isSame(weekEnd, "day")) {
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

export function formatDate(ts?: number, tz?: string) {
  if (!ts) return "无日期";
  return parseInTimezone(ts, tz).format("MM月DD日");
}

export function isOverdue(ts?: number, tz?: string) {
  if (!ts) return false;
  const now = nowInTimezone(tz);
  return parseInTimezone(ts, tz).isBefore(now, "day");
}

export function isToday(ts?: number, tz?: string) {
  if (!ts) return false;
  const now = nowInTimezone(tz);
  return parseInTimezone(ts, tz).isSame(now, "day");
}

export function isWeek(ts?: number, tz?: string) {
  if (!ts) return false;
  const now = nowInTimezone(tz);
  const target = parseInTimezone(ts, tz);
  const weekEnd = now.add(6, "day");
  // 在今天或之后，并且在7天内（包含第7天）
  return (target.isSame(now, "day") || target.isAfter(now, "day")) && 
         (target.isBefore(weekEnd, "day") || target.isSame(weekEnd, "day"));
}

export function isTomorrow(ts?: number, tz?: string) {
  if (!ts) return false;
  const now = nowInTimezone(tz);
  return parseInTimezone(ts, tz).isSame(now.add(1, "day"), "day");
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
