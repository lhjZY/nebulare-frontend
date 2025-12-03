import React, { useMemo } from "react";
import { Filter, PanelLeftClose, PanelRightClose } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import TaskItem from "./TaskItem";
import { Task } from "@/db/schema";
import { TaskGroup } from "./types";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { useEffect, useRef, useState } from "react";
import { DatePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
type Props = {
  groups: TaskGroup[];
  projectLookup: Map<string, string>;
  onSelectTask: (id: string | null) => void;
  selectedTaskId: string | null;
  selectedProjectId: string | null;
  newTitle: string;
  newStartDate?: number;
  onChangeTitle: (v: string) => void;
  onChangeStartDate: (v: number | undefined) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSyncing: boolean;
  lastError: string | null;
  onDeleteTask: (id: string) => void;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onUpdatePriority: (taskId: string, priority: number) => void;
  columnTitle: string;
  inputPlaceholder: string;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

export default function TaskColumn({
  groups,
  projectLookup,
  onSelectTask,
  selectedTaskId,
  selectedProjectId,
  newTitle,
  newStartDate,
  onChangeTitle,
  onChangeStartDate,
  onSubmit,
  isSyncing,
  lastError,
  onDeleteTask,
  onToggleComplete,
  onUpdatePriority,
  columnTitle,
  inputPlaceholder,
  sidebarCollapsed,
  onToggleSidebar
}: Props) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [inputFocused, setInputFocused] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const isInputEmpty = newTitle.trim() === "";
  const showDatePicker = inputFocused || !isInputEmpty;
  const inputRef = useRef<HTMLInputElement>(null);

  // SmartList 到分组名称的映射
  const smartListToGroup: Record<string, string> = {
    today: "今天",
    tomorrow: "明天",
    week: "最近7天"
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
        filteredGroups.filter((group) => group.tasks.length > 0).map((group) => group.group)
      );
      // 保留之前已展开且仍然存在的分组，同时添加新的有任务的分组
      const merged = new Set([...prev.filter((g) => groupsWithTasks.has(g)), ...groupsWithTasks]);
      return Array.from(merged);
    });
  }, [filteredGroups]);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
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
          <CardTitle className="text-xl font-semibold">{columnTitle}</CardTitle>
        </div>
        <Button variant="ghost" size="sm" className="rounded-lg">
          <Filter className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-4">
        <form onSubmit={onSubmit} className="group relative flex items-center gap-2">
          <Input
            placeholder={inputPlaceholder}
            value={newTitle}
            onChange={(e) => onChangeTitle(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            ref={inputRef}
            className={cn(
              "focus-visible:ring-offset-1 mt-1 w-full pr-[170px] transition-colors border-[var(--theme-input-border)] focus-visible:border-[var(--theme-input-border)] focus-visible:ring-[var(--theme-input-border)]",
              !inputFocused && isInputEmpty ? "bg-gray-100" : "bg-white"
            )}
          />
          <div
            className={cn(
              "absolute inset-y-0 right-0 flex items-center pr-2 transition-opacity duration-150",
              showDatePicker ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
          >
            <DatePicker
              value={newStartDate}
              onChange={onChangeStartDate}
              triggerClassName="pointer-events-auto w-[150px] hover:bg-transparent focus:bg-transparent active:bg-transparent"
              onConfirm={() => inputRef.current?.focus()}
            />
          </div>
        </form>
        {isSyncing && <p className="text-xs text-outline">同步中...</p>}
        {lastError && <p className="text-xs text-red-500">同步失败: {lastError}</p>}
        <Accordion type="multiple" className="space-y-2" value={openGroups} onValueChange={setOpenGroups}>
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
                      projectName={projectLookup.get(task.projectId) || "收集箱"}
                      selected={selectedTaskId === task.id}
                      onSelect={() => onSelectTask(task.id)}
                      onDelete={() => setPendingDeleteId(task.id)}
                      onToggleComplete={onToggleComplete}
                      onUpdatePriority={onUpdatePriority}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <AlertDialog open={pendingDeleteId !== null} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除任务？</AlertDialogTitle>
              <AlertDialogDescription>此操作会在同步后从所有设备移除该任务。</AlertDialogDescription>
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
}
