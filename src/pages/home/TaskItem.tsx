import React from "react";
import { MoreHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Task } from "@/db/schema";
import { cn } from "@/lib/utils";
import { formatDate, isOverdue } from "./utils";

type Props = {
  task: Task;
  projectName: string;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
};

export default function TaskItem({ task, projectName, selected, onSelect, onDelete }: Props) {
  return (
    <div
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-surface-variant cursor-pointer",
        selected && "bg-surface-variant"
      )}
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      <Checkbox />
      <div className="flex-1">
        <div className="text-sm">{task.title}</div>
        <div className="flex items-center gap-3 text-xs text-outline">
          <span>{projectName}</span>
          <span className={cn(isOverdue(task.dueDate) && "text-red-500")}>{formatDate(task.dueDate)}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="rounded-full p-1 text-outline hover:bg-surface-variant"
        aria-label="删除任务"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
}
