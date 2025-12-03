import React, { useMemo, useState } from "react";
import { Inbox, ListChecks, Sun, Plus, ChevronDown, CalendarDays, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Task } from "@/db/schema";
import { isToday, isWeek, isTomorrow } from "./utils";
import { ProjectModal } from "@/components/modals/ProjectModal";
import { createProject, ProjectPayload } from "@/api/projects";
import { db } from "@/db";

type SidebarProps = {
  projects: any[];
  tasks: Task[];
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onProjectCreated?: () => void;
};

export default function Sidebar({ 
  projects, 
  tasks,
  selectedProjectId, 
  onSelectProject,
  onProjectCreated
}: SidebarProps) {
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(true);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const t of tasks) {
      if (!t.isDeleted) {
        map.set(t.projectId, (map.get(t.projectId) || 0) + 1);
      }
    }
    return map;
  }, [tasks]);

  const smartLists = [
    { key: "all", label: "所有", icon: ListChecks, count: tasks.length },
    { key: "today", label: "今天", icon: Sun, count: tasks.filter((t) => isToday(t.dueDate)).length },
    { key: "tomorrow", label: "明天", icon: CalendarDays, count: tasks.filter((t) => isTomorrow(t.dueDate)).length },
    { key: "week", label: "最近7天", icon: Archive, count: tasks.filter((t) => isWeek(t.dueDate)).length },
    { key: "inbox", label: "收集箱", icon: Inbox, count: tasks.filter((t) => t.projectId === "inbox").length },
  ];

  const handleCreateProject = async (data: ProjectPayload) => {
    try {
      // 调用 API 创建项目
      const newProject = await createProject(data);
      
      // 同时保存到本地数据库
      await db.projects.put({
        id: newProject.id,
        name: newProject.name,
        color: newProject.color,
        kind: newProject.kind,
        sortOrder: newProject.sortOrder,
        parentId: newProject.parentId || '',
        isDeleted: false,
        syncStatus: 'synced',
        modifiedTime: newProject.serverUpdateTime,
      });
      
      setProjectModalOpen(false);
      
      // 通知父组件触发同步
      if (onProjectCreated) {
        onProjectCreated();
      }
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  };

  return (
    <>
      <Card className="flex h-full flex-col bg-white pt-5">
        <CardContent className="flex-1 overflow-auto pt-0 space-y-4">
          <Section>
            {smartLists.map((item) => (
              <SidebarItem 
                key={item.key} 
                active={selectedProjectId === item.key} 
                onClick={() => onSelectProject(item.key)}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                <Badge variant="muted">{item.count}</Badge>
              </SidebarItem>
            ))}
          </Section>

          <div className="space-y-1">
            <button
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className="w-full flex items-center justify-between text-xs font-medium uppercase text-outline hover:text-on-surface transition-colors"
            >
              <div className={cn("flex items-center gap-1")}>
                <ChevronDown 
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    projectsExpanded ? "rotate-0" : "-rotate-90"
                  )} 
                />
                <span>清单</span>
              </div>
              
              <div className="flex items-center gap-1">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setProjectModalOpen(true);
                  }}
                >
                  <Plus className="h-3.5 w-3.5" />
                </Button>
                
              </div>
            </button>
            {projectsExpanded && (
              <div className="space-y-1 pt-1">
                {projects.map((p: any) => {
                  const id = p.ID ?? p.id;
                  const name = p.Name ?? p.name;
                  const color = p.Color ?? p.color ?? "#c2e7ff";
                  return (
                    <SidebarItem
                      key={id}
                      active={selectedProjectId === id}
                      onClick={() => onSelectProject(id)}
                    >
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                      <span className="flex-1">{name}</span>
                      <Badge variant="muted">{counts.get(id) || 0}</Badge>
                    </SidebarItem>
                  );
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 项目创建弹窗 */}
      <ProjectModal
        open={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        onSubmit={handleCreateProject}
      />
    </>
  );
}

function Section({ children }: {  children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SidebarItem({
  children,
  active,
  onClick
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "flex w-full gap-2 items-center rounded px-3 py-3 text-sm transition",
        active ? "bg-surface-variant text-on-primary" : "text-[#444746] hover:bg-surface-variant"
      )}
    >
      {children}
    </div>
  );
}
