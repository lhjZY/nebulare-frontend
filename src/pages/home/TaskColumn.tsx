import React from "react";
import { Filter, Plus } from "lucide-react";
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
import { useState } from "react";

type Props = {
  groups: TaskGroup[];
  projectLookup: Map<string, string>;
  onSelectTask: (id: string | null) => void;
  selectedTaskId: string | null;
  newTitle: string;
  onChangeTitle: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSyncing: boolean;
  lastError: string | null;
  onDeleteTask: (id: string) => void;
};

export default function TaskColumn({
  groups,
  projectLookup,
  onSelectTask,
  selectedTaskId,
  newTitle,
  onChangeTitle,
  onSubmit,
  isSyncing,
  lastError,
  onDeleteTask
}: Props) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!pendingDeleteId) return;
    await onDeleteTask(pendingDeleteId);
    setPendingDeleteId(null);
  };

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-xl font-semibold">所有</CardTitle>
        <Button variant="ghost" size="sm" className="rounded-lg">
          <Filter className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto space-y-4">
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <Input
            placeholder="添加任务至 '收集箱'"
            value={newTitle}
            onChange={(e) => onChangeTitle(e.target.value)}
            className="focus-visible:ring-offset-1 mt-1"
          />
          <Button type="submit" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
        {isSyncing && <p className="text-xs text-outline">同步中...</p>}
        {lastError && <p className="text-xs text-red-500">同步失败: {lastError}</p>}
        <Accordion type="multiple" className="space-y-2">
          {groups.map((group) => (
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
