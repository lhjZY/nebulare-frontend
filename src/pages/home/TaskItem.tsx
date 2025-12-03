import React, { useState, useRef } from "react";
import { MoreHorizontal } from "lucide-react";
import confetti from "canvas-confetti";
import { Checkbox } from "@/components/ui/checkbox";
import { Task } from "@/db/schema";
import { cn } from "@/lib/utils";
import { formatDate, isOverdue, isCompleted } from "./utils";

type Props = {
  task: Task;
  projectName: string;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
};

export default function TaskItem({ task, projectName, selected, onSelect, onDelete, onToggleComplete }: Props) {
  const [isExiting, setIsExiting] = useState(false);
  const checkboxRef = useRef<HTMLButtonElement>(null);
  const completed = isCompleted(task.status);

  const triggerConfetti = () => {
    if (!checkboxRef.current) return;
    const rect = checkboxRef.current.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x, y },
      colors: ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4"],
      scalar: 0.8,
      gravity: 1.2,
      ticks: 150
    });
  };

  const handleCheckChange = (checked: boolean) => {
    if (checked && !completed) {
      triggerConfetti();
      setIsExiting(true);
      // 等待动画完成后再更新状态
      setTimeout(() => {
        onToggleComplete(task.id, true);
        setIsExiting(false);
      }, 400);
    } else {
      onToggleComplete(task.id, checked);
    }
  };

  return (
    <div
      className={cn(
        "flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left hover:bg-surface-variant cursor-pointer transition-all duration-300",
        selected && "bg-surface-variant",
        isExiting && "opacity-0 scale-95 translate-y-4"
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
      <Checkbox
        ref={checkboxRef}
        checked={completed}
        onCheckedChange={handleCheckChange}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="flex-1">
        <div className={cn("text-sm", completed && "line-through text-outline")}>{task.title}</div>
        <div className="flex items-center gap-3 text-xs text-outline">
          <span>{projectName}</span>
          <span>{formatDate(task.startDate)}</span>
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
