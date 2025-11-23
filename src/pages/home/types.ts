import { Task } from "@/db/schema";

export type TaskGroup = {
  group: string;
  accent?: string;
  tasks: Task[];
};
