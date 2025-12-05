import React, { useState, useRef } from "react";
import { MoreHorizontal, Flag, Trash2 } from "lucide-react";
import confetti from "canvas-confetti";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Task } from "@/db/schema";
import { cn } from "@/lib/utils";
import { formatDate, isOverdue, isCompleted, getPriorityConfig, PRIORITY_CONFIG, PriorityLevel } from "./utils";

type Props = {
  task: Task;
  projectName: string;
  projectColor?: string;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onUpdatePriority: (taskId: string, priority: number) => void;
};

const TaskItem = React.memo(function TaskItem({ task, projectName, projectColor, selected, onSelect, onDelete, onToggleComplete, onUpdatePriority }: Props) {
  const [isExiting, setIsExiting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const checkboxRef = useRef<HTMLButtonElement>(null);
  const completed = isCompleted(task.status);
  const priorityConfig = getPriorityConfig(task.priority);

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

  // 有项目颜色时显示项目颜色边框（无论是否完成）
  const showProjectBorder = !!projectColor;

  return (
    <div
      className={cn(
        "group flex w-full items-center gap-3 py-1 text-left hover:bg-surface-variant cursor-pointer transition-all duration-300",
        // 所有 item 统一使用 border-l-4，保持 checkbox 对齐；左边距增大
        "pl-3 pr-2 border-l-4",
        showProjectBorder ? "rounded-r" : "border-l-transparent rounded",
        selected && "bg-surface-variant",
        isExiting && "opacity-0 scale-95 translate-y-4"
      )}
      style={showProjectBorder ? { borderLeftColor: projectColor } : undefined}
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
        className={!completed ? priorityConfig.borderColor : undefined}
      />
      <div className="flex-1 min-w-0">
        <div className={cn("text-sm truncate", completed && "line-through text-outline")}>{task.title}</div>
        <div className="text-xs text-outline truncate">
          {projectName}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {task.startDate && (
          <span className={cn(
            "text-xs",
            completed 
              ? "text-outline"  // 已完成：灰色
              : isOverdue(task.startDate, task.timeZone) 
                ? "text-red-500"  // 未完成+过期：红色
                : "text-blue-500"  // 未完成+未过期：蓝色
          )}>
            {formatDate(task.startDate, task.timeZone)}
          </span>
        )}
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
              }}
              className="rounded-full p-1 text-outline hover:bg-surface-variant opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="更多操作"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="end" onClick={(e) => e.stopPropagation()}>
            <div className="text-xs text-outline mb-2 px-1">优先级</div>
            <div className="flex items-center gap-2 mb-2">
              {([3, 2, 1, 0] as PriorityLevel[]).map((level) => {
                const config = PRIORITY_CONFIG[level];
                return (
                  <button
                    key={level}
                    onClick={() => {
                      onUpdatePriority(task.id, level);
                      setMenuOpen(false);
                    }}
                    className={cn(
                      "p-2 rounded hover:bg-surface-variant transition-colors",
                      task.priority === level && "bg-surface-variant"
                    )}
                    title={config.label}
                  >
                    <Flag className={cn("h-5 w-5", config.color)} />
                  </button>
                );
              })}
            </div>
            <div className="border-t pt-1">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="w-full flex items-center gap-2 px-2 py-2 text-sm text-red-500 hover:bg-surface-variant rounded transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>删除</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // 自定义比较函数：只在关键属性变化时重渲染
  return (
    prevProps.task.id === nextProps.task.id &&
    prevProps.task.title === nextProps.task.title &&
    prevProps.task.status === nextProps.task.status &&
    prevProps.task.priority === nextProps.task.priority &&
    prevProps.task.startDate === nextProps.task.startDate &&
    prevProps.task.modifiedTime === nextProps.task.modifiedTime &&
    prevProps.projectName === nextProps.projectName &&
    prevProps.projectColor === nextProps.projectColor &&
    prevProps.selected === nextProps.selected
  );
});

export default TaskItem;
