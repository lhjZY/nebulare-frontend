import { useState, useRef, useEffect } from "react";
import { Flag, ListChecks, List, CheckSquare, Plus } from "lucide-react";
import { v4 as uuid } from "uuid";
import confetti from "canvas-confetti";
import { MdEditor } from "md-editor-rt";
import "md-editor-rt/lib/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import { Task, SubTask } from "@/db/schema";
import { isCompleted, getPriorityConfig, PRIORITY_CONFIG, PriorityLevel } from "./utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

type Props = {
  task: Task | null;
  projectLookup: Map<string, { name: string; color: string }>;
  onToggleComplete: (taskId: string, completed: boolean) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
};

export default function TaskDetail({
  task,
  onToggleComplete,
  onUpdateTask
}: Props) {
  const [content, setContent] = useState("");
  const [isSubtaskMode, setIsSubtaskMode] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const checkboxRef = useRef<HTMLButtonElement>(null);
  const newSubtaskInputRef = useRef<HTMLInputElement>(null);
  const completed = task ? isCompleted(task.status) : false;
  const [priorityOpen, setPriorityOpen] = useState(false);
  const priorityConfig = task ? getPriorityConfig(task.priority) : PRIORITY_CONFIG[0];

  // 同步 task 内容到本地状态
  useEffect(() => {
    if (task) {
      setContent(task.content || "");
      // 如果已有子任务，自动切换到子任务模式
      if (task.items && task.items.length > 0) {
        setIsSubtaskMode(true);
      }
    } else {
      setContent("");
      setIsSubtaskMode(false);
    }
  }, [task?.id]);

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
    if (!task) return;
    if (checked && !completed) {
      triggerConfetti();
      setIsExiting(true);
      setTimeout(() => {
        onToggleComplete(task.id, true);
        setIsExiting(false);
      }, 400);
    } else {
      onToggleComplete(task.id, checked);
    }
  };

  const handleDateChange = (date: number | undefined) => {
    if (!task) return;
    onUpdateTask(task.id, { startDate: date });
  };

  const handlePriorityChange = (priority: PriorityLevel) => {
    if (!task) return;
    onUpdateTask(task.id, { priority });
    setPriorityOpen(false);
  };

  const handleContentChange = (value: string) => {
    setContent(value);
    if (task) {
      onUpdateTask(task.id, { content: value });
    }
  };

  // 将文本内容转换为子任务列表
  const convertToSubtasks = (): SubTask[] => {
    const lines = content.split("\n").filter(line => line.trim());
    return lines.map((line, index) => {
      // 解析已有的 markdown checkbox 格式
      const checkboxMatch = line.match(/^\s*[-*]\s*\[([ xX])\]\s*(.*)/);
      if (checkboxMatch) {
        return {
          id: uuid(),
          title: checkboxMatch[2].trim(),
          completed: checkboxMatch[1].toLowerCase() === "x",
          sortOrder: index
        };
      }
      // 普通文本行
      return {
        id: uuid(),
        title: line.trim(),
        completed: false,
        sortOrder: index
      };
    });
  };

  // 将子任务列表转换为 Markdown 文本
  const convertToMarkdown = (subtasks: SubTask[]): string => {
    return subtasks
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(st => `- [${st.completed ? "x" : " "}] ${st.title}`)
      .join("\n");
  };

  // 切换模式
  const handleToggleMode = () => {
    if (!task) return;
    
    if (!isSubtaskMode) {
      // 切换到子任务模式：将文本转换为子任务
      const subtasks = convertToSubtasks();
      onUpdateTask(task.id, { items: subtasks });
    } else {
      // 切换回文本模式：将子任务转换为 Markdown
      const markdown = convertToMarkdown(task.items || []);
      setContent(markdown);
      onUpdateTask(task.id, { content: markdown, items: [] });
    }
    setIsSubtaskMode(!isSubtaskMode);
  };

  // 切换子任务完成状态
  const handleSubtaskToggle = (subtaskId: string, checked: boolean) => {
    if (!task) return;
    const updatedItems = (task.items || []).map(item =>
      item.id === subtaskId ? { ...item, completed: checked } : item
    );
    onUpdateTask(task.id, { items: updatedItems });
  };

  // 添加新子任务
  const handleAddSubtask = () => {
    if (!task || !newSubtaskTitle.trim()) return;
    
    const currentItems = task.items || [];
    const maxSortOrder = currentItems.length > 0 
      ? Math.max(...currentItems.map(i => i.sortOrder)) 
      : -1;
    
    const newSubtask: SubTask = {
      id: uuid(),
      title: newSubtaskTitle.trim(),
      completed: false,
      sortOrder: maxSortOrder + 1
    };
    
    onUpdateTask(task.id, { items: [...currentItems, newSubtask] });
    setNewSubtaskTitle("");
  };

  // 处理子任务输入框键盘事件
  const handleSubtaskInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSubtask();
    }
  };

  // 计算子任务完成进度
  const getSubtaskProgress = () => {
    if (!task?.items || task.items.length === 0) return null;
    const completed = task.items.filter(i => i.completed).length;
    return { completed, total: task.items.length };
  };

  const progress = getSubtaskProgress();

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-3 text-sm text-outline">
          <Checkbox
            ref={checkboxRef}
            checked={completed}
            onCheckedChange={handleCheckChange}
            disabled={!task}
            className={cn(
              "transition-all duration-300",
              isExiting && "scale-110",
              priorityConfig.borderColor
            )}
          />
          <DatePicker
            value={task?.startDate}
            onChange={handleDateChange}
            triggerClassName="h-8"
          />
        </div>
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="sm" 
            className={cn(
              "gap-1 text-outline",
              isSubtaskMode && "bg-surface-variant"
            )}
            onClick={handleToggleMode}
            disabled={!task}
            title={isSubtaskMode ? "切换到文本模式" : "切换到子任务模式"}
          >
            {isSubtaskMode ? (
              <List className="h-4 w-4" />
            ) : (
              <CheckSquare className="h-4 w-4" />
            )}
          </Button>
          <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className={cn("text-outline", priorityConfig.color)} disabled={!task}>
                <Flag className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2" align="end">
              <div className="text-xs text-outline mb-2 px-1">优先级</div>
              <div className="flex items-center gap-2">
                {([3, 2, 1, 0] as PriorityLevel[]).map((level) => {
                  const config = PRIORITY_CONFIG[level];
                  return (
                    <button
                      key={level}
                      onClick={() => handlePriorityChange(level)}
                      className={cn(
                        "p-2 rounded hover:bg-surface-variant transition-colors",
                        task?.priority === level && "bg-surface-variant"
                      )}
                      title={config.label}
                    >
                      <Flag className={cn("h-5 w-5", config.color)} />
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col space-y-4 overflow-hidden">
        <CardTitle className={cn(
          "text-xl font-semibold transition-all duration-300",
          completed && "line-through text-outline",
          isExiting && "opacity-50"
        )}>
          {task ? task.title : "请选择任务"}
        </CardTitle>

        {progress && (
          <div className="flex items-center gap-2 text-xs text-outline">
            <ListChecks className="h-4 w-4" />
            <span>子任务进度: {progress.completed}/{progress.total}</span>
            <div className="flex-1 h-1.5 bg-surface-variant rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-300"
                style={{ width: `${(progress.completed / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-auto">
          {!task ? (
            <div className="h-full rounded-2xl border border-outline/20 bg-surface p-4 text-sm text-outline flex items-center justify-center">
              未选择任务
            </div>
          ) : isSubtaskMode ? (
            // 子任务列表模式
            <div className="space-y-1">
              {(task.items || []).sort((a, b) => a.sortOrder - b.sortOrder).map((subtask) => (
                <div 
                  key={subtask.id}
                  className="flex items-center gap-3 p-2 rounded hover:bg-surface-variant transition-colors"
                >
                  <Checkbox
                    checked={subtask.completed}
                    onCheckedChange={(checked) => handleSubtaskToggle(subtask.id, !!checked)}
                  />
                  <span className={cn(
                    "text-sm flex-1",
                    subtask.completed && "line-through text-outline"
                  )}>
                    {subtask.title}
                  </span>
                </div>
              ))}
              {/* 新子任务输入框 */}
              <div className="flex items-center gap-3 p-2">
                <Plus className="h-4 w-4 text-outline" />
                <Input
                  ref={newSubtaskInputRef}
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={handleSubtaskInputKeyDown}
                  placeholder="添加子任务，按 Enter 确认"
                  className="flex-1 h-8 border-none shadow-none focus-visible:ring-0 bg-transparent placeholder:text-outline/50"
                />
              </div>
            </div>
          ) : (
            // Markdown 编辑器模式
            <MdEditor
              modelValue={content}
              onChange={handleContentChange}
              language="zh-CN"
              preview={false}
              toolbars={[
                "bold", "italic", "strikeThrough", "-",
                "unorderedList", "orderedList", "task", "-",
                "link", "image", "code", "codeRow"
              ]}
              style={{ height: "100%" }}
              placeholder="在此输入任务描述...每行文本可转换为子任务"
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}
