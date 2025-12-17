import React, { useMemo, useState } from "react";
import {
  Inbox,
  ListChecks,
  Sun,
  Plus,
  ChevronDown,
  CalendarDays,
  Archive,
  Logs,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Task } from "@/db/schema";
import { isToday, isWeek, isTomorrow } from "./utils";
import { ProjectModal } from "@/components/modals/ProjectModal";
import { DeleteProjectModal } from "@/components/modals/DeleteProjectModal";
import {
  createProject,
  updateProject,
  deleteProject,
  ProjectPayload,
  ProjectResponse,
} from "@/api/projects";
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
  onProjectCreated,
}: SidebarProps) {
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [editingProject, setEditingProject] = useState<ProjectResponse | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    project: ProjectResponse | null;
  }>({
    open: false,
    project: null,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

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
    {
      key: "today",
      label: "今天",
      icon: Sun,
      count: tasks.filter((t) => isToday(t.startDate, t.timeZone)).length,
    },
    {
      key: "tomorrow",
      label: "明天",
      icon: CalendarDays,
      count: tasks.filter((t) => isTomorrow(t.startDate, t.timeZone)).length,
    },
    {
      key: "week",
      label: "最近7天",
      icon: Archive,
      count: tasks.filter((t) => isWeek(t.startDate, t.timeZone)).length,
    },
    {
      key: "inbox",
      label: "收集箱",
      icon: Inbox,
      count: tasks.filter((t) => t.projectId === "inbox").length,
    },
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
        parentId: newProject.parentId || "",
        isDeleted: false,
        syncStatus: "synced",
        modifiedTime: newProject.serverUpdateTime,
      });

      setProjectModalOpen(false);

      // 通知父组件触发同步
      if (onProjectCreated) {
        onProjectCreated();
      }
    } catch (error) {
      console.error("Failed to create project:", error);
      throw error;
    }
  };

  const handleUpdateProject = async (data: ProjectPayload) => {
    if (!editingProject) return;
    try {
      const updatedProject = await updateProject(editingProject.id, data);

      // 更新本地数据库
      await db.projects.put({
        id: updatedProject.id,
        name: updatedProject.name,
        color: updatedProject.color,
        kind: updatedProject.kind,
        sortOrder: updatedProject.sortOrder,
        parentId: updatedProject.parentId || "",
        isDeleted: false,
        syncStatus: "synced",
        modifiedTime: updatedProject.serverUpdateTime,
      });

      setEditingProject(null);

      if (onProjectCreated) {
        onProjectCreated();
      }
    } catch (error) {
      console.error("Failed to update project:", error);
      throw error;
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteModal.project) return;

    setDeleteLoading(true);
    try {
      await deleteProject(deleteModal.project.id);

      // 从本地数据库删除
      await db.projects.delete(deleteModal.project.id);

      setDeleteModal({ open: false, project: null });

      if (onProjectCreated) {
        onProjectCreated();
      }
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      <Card
        className="project-list-scroller flex h-full flex-col pt-5"
      >
        <CardContent className="hover-scroll flex-1 pt-0 space-y-4">
          <Section>
            {smartLists.map((item) => (
              <SidebarItem
                key={item.key}
                active={
                  selectedProjectId === item.key ||
                  (selectedProjectId === null && item.key === "all")
                }
                onClick={() => onSelectProject(item.key)}
              >
                <item.icon className="h-4 w-4" />
                <span className="flex-1">{item.label}</span>
                <Badge variant="muted">{item.count}</Badge>
              </SidebarItem>
            ))}
          </Section>

          <div className="space-y-1">
            <div
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className="w-full flex items-center justify-between text-xs font-medium uppercase text-outline hover:text-on-surface transition-colors cursor-pointer select-none"
            >
              <div className={cn("flex items-center gap-1")}>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    projectsExpanded ? "rotate-0" : "-rotate-90",
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
            </div>
            {projectsExpanded && (
              <div className="space-y-1 pt-1">
                {projects.map((p: any) => {
                  const project: ProjectResponse = {
                    id: p.ID ?? p.id,
                    name: p.Name ?? p.name,
                    color: p.Color ?? p.color ?? "#c2e7ff",
                    kind: p.Kind ?? p.kind ?? "TASK",
                    sortOrder: p.SortOrder ?? p.sortOrder ?? 0,
                    parentId: p.ParentId ?? p.parentId ?? "",
                    isDeleted: p.IsDeleted ?? p.isDeleted ?? false,
                    serverUpdateTime: p.ServerUpdateTime ?? p.serverUpdateTime ?? 0,
                  };
                  return (
                    <ProjectItem
                      key={project.id}
                      project={project}
                      active={selectedProjectId === project.id}
                      count={counts.get(project.id) || 0}
                      onClick={() => onSelectProject(project.id)}
                      onEdit={() => setEditingProject(project)}
                      onDelete={() => setDeleteModal({ open: true, project })}
                    />
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

      {/* 项目编辑弹窗 */}
      <ProjectModal
        open={!!editingProject}
        project={editingProject}
        onClose={() => setEditingProject(null)}
        onSubmit={handleUpdateProject}
      />

      {/* 删除确认弹窗 */}
      <DeleteProjectModal
        open={deleteModal.open}
        projectName={deleteModal.project?.name || ""}
        onClose={() => setDeleteModal({ open: false, project: null })}
        onConfirm={handleDeleteProject}
        loading={deleteLoading}
      />
    </>
  );
}

function Section({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function SidebarItem({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      data-selected={active}
      className={cn(
        "flex w-full gap-2 items-center rounded px-3 py-3 text-sm transition cursor-pointer hover:bg-primary-8",
        active
          ? "bg-primary-12 text-on-primary"
          : "hover:bg-primary-8",
      )}
    >
      {children}
    </div>
  );
}

function ProjectItem({
  project,
  active,
  count,
  onClick,
  onEdit,
  onDelete,
}: {
  project: ProjectResponse;
  active?: boolean;
  count: number;
  onClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);

  return (
    <div
      onClick={onClick}
      data-selected={active}
      className={cn(
        "group flex w-full gap-2 items-center rounded px-3 py-3 text-sm transition cursor-pointer",
        active ? "bg-primary-12 text-on-primary" : "text-[#444746] hover:bg-primary-8",
      )}
    >
      {/* Left: Logs icon and project name */}
      <Logs className="h-4 w-4 shrink-0" />
      <span className="flex-1 truncate">{project.name}</span>

      {/* Right: color indicator and count */}
      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: project.color }} />
      <Badge variant="muted" className="shrink-0">
        {count}
      </Badge>

      {/* More options button - visible on hover */}
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
              popoverOpen && "opacity-100",
            )}
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-32 p-1" align="end" onClick={(e) => e.stopPropagation()}>
          <button
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-surface-variant transition-colors"
            onClick={() => {
              setPopoverOpen(false);
              onEdit();
            }}
          >
            <Pencil className="h-4 w-4" />
            <span>编辑</span>
          </button>
          <button
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            onClick={() => {
              setPopoverOpen(false);
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
            <span>删除</span>
          </button>
        </PopoverContent>
      </Popover>
    </div>
  );
}
