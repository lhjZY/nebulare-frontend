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

    if (!t.dueDate) {
      nodate.push(t);
      continue;
    }
    const due = dayjs(t.dueDate);
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

export function isCompleted(status?: number) {
  return status !== undefined && status >= 2;
}
