import React, { useState, useRef } from "react";
import { MoreHorizontal, Flag, Trash2 } from "lucide-react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Task } from "@/db/schema";
import { cn } from "@/lib/utils";
import CalendarModal from "@/components/modals/CalendarModal";
import { isCompleted, getPriorityConfig, PRIORITY_CONFIG, PriorityLevel } from "./utils";
import { getTaskItemDateLabel, isOverdueInTz } from "@/lib/dayjs";

type Props = {
  task: Task;
  projectName: string;
  projectColor?: string;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onUpdatePriority: (taskId: string, priority: number) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
};

const TaskItem = React.memo(
  function TaskItem({
    task,
    projectName,
    projectColor,
    selected,
    onSelect,
    onDelete,
    onToggleComplete,
    onUpdatePriority,
    onUpdateTask,
  }: Props) {
    const [isExiting, setIsExiting] = useState(false);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editedTitle, setEditedTitle] = useState(task.title);
    const checkboxRef = useRef<HTMLButtonElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);
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
        ticks: 150,
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
          "group flex w-full items-center gap-3 py-1.5 text-left hover:bg-accent cursor-pointer transition-all duration-300",
          // 所有 item 统一使用 border-l-4，保持 checkbox 对齐；左边距增大
          "pl-3 pr-2 border-l-4",
          selected
            ? "bg-accent text-accent-foreground"
            : "text-foreground hover:bg-accent/50",
          showProjectBorder ? "rounded-r-md" : "border-l-transparent rounded-md",
          isExiting && "opacity-0 scale-95 translate-y-4",
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
          {isEditingTitle ? (
            <input
              ref={titleInputRef}
              type="text"
              value={editedTitle}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={() => {
                if (editedTitle.trim() && editedTitle !== task.title) {
                  onUpdateTask(task.id, { title: editedTitle.trim() });
                } else {
                  setEditedTitle(task.title);
                }
                setIsEditingTitle(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                } else if (e.key === "Escape") {
                  setEditedTitle(task.title);
                  setIsEditingTitle(false);
                }
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-sm bg-transparent border-none outline-none focus:ring-0 p-0"
              autoFocus
            />
          ) : (
            <div
              className={cn("text-sm truncate cursor-text", completed && "line-through text-muted-foreground")}
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
                setEditedTitle(task.title);
                setTimeout(() => titleInputRef.current?.focus(), 0);
              }}
            >
              {task.title}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground truncate max-w-[80px]">{projectName}</span>
          <CalendarModal
            open={calendarOpen}
            onOpenChange={setCalendarOpen}
            startDate={task.startDate}
            dueDate={task.dueDate}
            onConfirm={(startDate, dueDate) => {
              onUpdateTask(task.id, { startDate, dueDate });
            }}
            trigger={
              <Button
                type="button"
                variant="ghost"
                data-empty={!task.startDate}
                className={cn(
                  "p-0 h-9 justify-end text-right font-normal border-0 bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent",
                  task.startDate
                    ? isOverdueInTz(task.startDate)
                      ? "text-destructive"
                      : "text-primary"
                    : "text-muted-foreground",
                )}
              >
                {getTaskItemDateLabel(task.startDate)}
              </Button>
            }
          />
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger asChild>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                }}
                className="rounded-full p-1 text-muted-foreground hover:bg-accent opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="更多操作"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="end" onClick={(e) => e.stopPropagation()}>
              <div className="text-xs text-muted-foreground mb-2 px-1">优先级</div>
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
                        "p-2 rounded-md hover:bg-accent transition-colors",
                        task.priority === level && "bg-accent",
                      )}
                      title={config.label}
                    >
                      <Flag className={cn("h-5 w-5", config.color)} />
                    </button>
                  );
                })}
              </div>
              <div className="border-t border-border pt-1">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="w-full flex items-center gap-2 px-2 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-md transition-colors"
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
  },
  (prevProps, nextProps) => {
    // 自定义比较函数：只在关键属性变化时重渲染
    return (
      prevProps.task.id === nextProps.task.id &&
      prevProps.task.title === nextProps.task.title &&
      prevProps.task.status === nextProps.task.status &&
      prevProps.task.priority === nextProps.task.priority &&
      prevProps.task.startDate === nextProps.task.startDate &&
      prevProps.task.dueDate === nextProps.task.dueDate &&
      prevProps.task.modifiedTime === nextProps.task.modifiedTime &&
      prevProps.projectName === nextProps.projectName &&
      prevProps.projectColor === nextProps.projectColor &&
      prevProps.selected === nextProps.selected &&
      prevProps.onUpdateTask === nextProps.onUpdateTask
    );
  },
);

export default TaskItem;
