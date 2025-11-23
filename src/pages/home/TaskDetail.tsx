import { CalendarDays, Flag, Archive, ListChecks, MessageSquare, MoreHorizontal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Task } from "@/db/schema";
import { formatDate } from "./utils";

export default function TaskDetail({
  task,
  projectLookup
}: {
  task: Task | null;
  projectLookup: Map<string, string>;
}) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3 text-sm text-outline">
          <Checkbox />
          <Button variant="ghost" size="sm" className="gap-1 text-primary" disabled={!task}>
            <CalendarDays className="h-4 w-4" />
            {task ? formatDate(task.dueDate) : "无日期"}
          </Button>
        </div>
        <Button variant="ghost" size="sm" className="text-outline">
          <Flag className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 space-y-6">
        <CardTitle className="text-2xl font-semibold">{task ? task.title : "请选择任务"}</CardTitle>
        <div className="flex-1 rounded-2xl border border-outline/20 bg-surface p-4 text-sm text-on-surface">
          {task ? "在这里添加任务描述、子任务或备注。" : "未选择任务"}
        </div>
        <div className="flex items-center justify-between text-sm text-outline">
          <div className="flex items-center gap-2">
            <Archive className="h-4 w-4" />
            {task ? projectLookup.get(task.projectId) || "收集箱" : "收集箱"}
          </div>
          <div className="flex items-center gap-3">
            <ListChecks className="h-4 w-4" />
            <MessageSquare className="h-4 w-4" />
            <MoreHorizontal className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
