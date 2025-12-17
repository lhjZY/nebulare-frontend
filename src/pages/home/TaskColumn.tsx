import React, { useMemo } from "react";
import { Filter, PanelLeftClose, PanelRightClose } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TaskItem from "./TaskItem";
import { Task } from "@/db/schema";
import { TaskGroup } from "./types";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEffect, useRef, useState } from "react";
import CalendarModal from "@/components/modals/CalendarModal";
import { CalendarDays as CalendarIcon } from "lucide-react";
import { getDateRangeLabel, isOverdueInTz } from "@/lib/dayjs";
import { cn } from "@/lib/utils";
type Props = {
  groups: TaskGroup[];
  projectLookup: Map<string, { name: string; color: string }>;
  onSelectTask: (id: string | null) => void;
  selectedTaskId: string | null;
  selectedProjectId: string | null;
  newTitle: string;
  newStartDate?: number;
  newDueDate?: number;
  onChangeTitle: (v: string) => void;
  onChangeStartDate: (v: number | undefined) => void;
  onChangeDueDate: (v: number | undefined) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSyncing: boolean;
  lastError: string | null;
  onDeleteTask: (id: string) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onUpdatePriority: (taskId: string, priority: number) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  columnTitle: string;
  inputPlaceholder: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

const TaskColumn = React.memo(
  function TaskColumn({
    groups,
    projectLookup,
    onSelectTask,
    selectedTaskId,
    selectedProjectId,
    newTitle,
    newStartDate,
    newDueDate,
    onChangeTitle,
    onChangeStartDate,
    onChangeDueDate,
    onSubmit,
    isSyncing,
    lastError,
    onDeleteTask,
    onToggleComplete,
    onUpdatePriority,
    onUpdateTask,
    columnTitle,
    inputPlaceholder,
    sidebarCollapsed,
    onToggleSidebar,
  }: Props) {
    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
    const [inputFocused, setInputFocused] = useState(false);
    const [openGroups, setOpenGroups] = useState<string[]>([]);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const isInputEmpty = newTitle.trim() === "";
    const inputRef = useRef<HTMLInputElement>(null);

    // SmartList 到分组名称的映射
    const smartListToGroup: Record<string, string> = {
      today: "今天",
      tomorrow: "明天",
      week: "最近7天",
    };

    // 根据 selectedProjectId 过滤要显示的分组
    const filteredGroups = useMemo(() => {
      // 时间类 SmartList：只显示对应的分组
      if (selectedProjectId && smartListToGroup[selectedProjectId]) {
        const targetGroup = smartListToGroup[selectedProjectId];
        return groups.filter((g) => g.group === targetGroup);
      }

      // "所有"视图：过滤掉任务数为0的分组
      if (selectedProjectId === "all" || !selectedProjectId) {
        return groups.filter((g) => g.tasks.length > 0);
      }

      // 其他情况（inbox、具体项目）：显示所有分组，但过滤掉空分组
      return groups.filter((g) => g.tasks.length > 0);
    }, [groups, selectedProjectId]);

    const handleConfirmDelete = async () => {
      if (!pendingDeleteId) return;
      await onDeleteTask(pendingDeleteId);
      setPendingDeleteId(null);
    };

    useEffect(() => {
      setOpenGroups((prev) => {
        // 获取所有有任务的分组
        const groupsWithTasks = new Set(
          filteredGroups.filter((group) => group.tasks.length > 0).map((group) => group.group),
        );
        // 保留之前已展开且仍然存在的分组，同时添加新的有任务的分组
        const merged = new Set([...prev.filter((g) => groupsWithTasks.has(g)), ...groupsWithTasks]);
        return Array.from(merged);
      });
    }, [filteredGroups]);

    return (
      <Card className="flex h-full flex-col">
        <CardHeader className="flex flex-col">
          <div className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-lg transition-transform duration-200"
                onClick={onToggleSidebar}
              >
                {sidebarCollapsed ? (
                  <PanelRightClose className="h-4 w-4" />
                ) : (
                  <PanelLeftClose className="h-4 w-4" />
                )}
              </Button>
              <div className="text-xl font-semibold">{columnTitle}</div>
            </div>
            <Button variant="ghost" size="sm" className="rounded-lg">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={onSubmit} className="group relative flex items-center gap-2">
            <Input
              placeholder={inputPlaceholder}
              value={newTitle}
              onChange={(e) => onChangeTitle(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              ref={inputRef}
              className={cn(
                "mt-1 w-full border border-solid rounded-default border-transparent bg-grey-3 pr-[170px] transition-colors focus:border-primary focus:outline-none",
                !inputFocused && isInputEmpty ? "bg-gray-100" : "bg-white",
              )}
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-2">
              <CalendarModal
                open={calendarOpen}
                onOpenChange={setCalendarOpen}
                startDate={newStartDate}
                dueDate={newDueDate}
                onConfirm={(startDate, dueDate) => {
                  onChangeStartDate(startDate);
                  onChangeDueDate(dueDate);
                  inputRef.current?.focus();
                }}
                trigger={
                  <Button
                    type="button"
                    variant="ghost"
                    data-empty={!newStartDate}
                    className={cn(
                      "h-9 w-[150px] justify-end text-right font-normal border-0 bg-transparent hover:bg-transparent focus:bg-transparent active:bg-transparent",
                      newStartDate
                        ? isOverdueInTz(newStartDate)
                          ? "text-red-500"
                          : "text-blue-500"
                        : "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="h-4 w-4 shrink-0" />
                    {getDateRangeLabel(newStartDate, newDueDate)}
                  </Button>
                }
              />
            </div>
          </form>
        </CardHeader>
        <CardContent className="hover-scroll flex-1 space-y-4">
          {isSyncing && <p className="text-xs text-outline">同步中...</p>}
          {lastError && <p className="text-xs text-red-500">同步失败: {lastError}</p>}
          <Accordion
            type="multiple"
            className="space-y-2"
            value={openGroups}
            onValueChange={setOpenGroups}
          >
            {filteredGroups.map((group) => (
              <AccordionItem key={group.group} value={group.group}>
                <AccordionTrigger>
                  <span className={group.accent}>{group.group}</span>
                  <span className="text-xs text-outline">({group.tasks.length})</span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1">
                    {group.tasks.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task as Task}
                        projectName={projectLookup.get(task.projectId)?.name || "收集箱"}
                        projectColor={projectLookup.get(task.projectId)?.color}
                        selected={selectedTaskId === task.id}
                        onSelect={() => onSelectTask(task.id)}
                        onDelete={() => setPendingDeleteId(task.id)}
                        onToggleComplete={onToggleComplete}
                        onUpdatePriority={onUpdatePriority}
                        onUpdateTask={onUpdateTask}
                      />
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          <AlertDialog
            open={pendingDeleteId !== null}
            onOpenChange={(open) => !open && setPendingDeleteId(null)}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>确认删除任务？</AlertDialogTitle>
                <AlertDialogDescription>
                  此操作会在同步后从所有设备移除该任务。
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setPendingDeleteId(null)}>取消</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmDelete}>删除</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    );
  },
  (prevProps, nextProps) => {
    // 自定义比较函数：深度比较 groups 的实际内容
    const groupsEqual =
      prevProps.groups.length === nextProps.groups.length &&
      prevProps.groups.every((g, i) => {
        const ng = nextProps.groups[i];
        return (
          g.group === ng.group &&
          g.accent === ng.accent &&
          g.tasks.length === ng.tasks.length &&
          g.tasks.every((t, j) => {
            const nt = ng.tasks[j];
            return (
              t.id === nt.id &&
              t.title === nt.title &&
              t.status === nt.status &&
              t.priority === nt.priority &&
              t.startDate === nt.startDate &&
              t.modifiedTime === nt.modifiedTime
            );
          })
        );
      });

    // 比较 projectLookup Map
    const projectLookupEqual = (() => {
      if (prevProps.projectLookup.size !== nextProps.projectLookup.size) return false;
      for (const [key, value] of prevProps.projectLookup) {
        const nextValue = nextProps.projectLookup.get(key);
        if (!nextValue || value.name !== nextValue.name || value.color !== nextValue.color) {
          return false;
        }
      }
      return true;
    })();

    return (
      groupsEqual &&
      projectLookupEqual &&
      prevProps.selectedTaskId === nextProps.selectedTaskId &&
      prevProps.selectedProjectId === nextProps.selectedProjectId &&
      prevProps.newTitle === nextProps.newTitle &&
      prevProps.newStartDate === nextProps.newStartDate &&
      prevProps.newDueDate === nextProps.newDueDate &&
      prevProps.isSyncing === nextProps.isSyncing &&
      prevProps.lastError === nextProps.lastError &&
      prevProps.columnTitle === nextProps.columnTitle &&
      prevProps.inputPlaceholder === nextProps.inputPlaceholder &&
      prevProps.sidebarCollapsed === nextProps.sidebarCollapsed
    );
  },
);

export default TaskColumn;
