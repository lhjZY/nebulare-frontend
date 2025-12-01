import React, { useMemo, useState } from "react";
import { Inbox, ListChecks, Sun, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Task } from "@/db/schema";
import { isToday, isWeek } from "./utils";
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
    { key: "all", label: "所有", icon: Inbox, count: tasks.length, active: selectedProjectId === null },
    { key: "today", label: "今天", icon: Sun, count: tasks.filter((t) => isToday(t.dueDate)).length },
    { key: "week", label: "最近7天", icon: ListChecks, count: tasks.filter((t) => isWeek(t.dueDate)).length }
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
      <Card className="flex h-full flex-col bg-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">清单</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-auto pt-0 space-y-4">
          <Section title="智能清单">
            {smartLists.map((item) => (
              <SidebarItem key={item.key} active={item.active} onClick={() => onSelectProject(null)}>
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                <Badge variant="muted">{item.count}</Badge>
              </SidebarItem>
            ))}
          </Section>

          <Section title="清单">
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
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-start gap-2"
              onClick={() => setProjectModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              添加清单
            </Button>
          </Section>
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

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium uppercase text-outline">{title}</div>
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
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-full px-3 py-2 text-sm transition",
        active ? "bg-surface-variant text-on-primary" : "text-[#444746] hover:bg-surface-variant"
      )}
    >
      {children}
    </button>
  );
}
