import { useState, useEffect } from "react";
import { ProjectModal } from "@/components/modals/ProjectModal";
import { DeleteProjectModal } from "@/components/modals/DeleteProjectModal";
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  ProjectResponse,
  ProjectPayload,
} from "@/api/projects";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Edit2, Trash2, FolderOpen } from "lucide-react";

export function ProjectsPage() {
  const [projects, setProjects] = useState<ProjectResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [projectModal, setProjectModal] = useState<{
    open: boolean;
    project: ProjectResponse | null;
  }>({
    open: false,
    project: null,
  });
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    project: ProjectResponse | null;
  }>({
    open: false,
    project: null,
  });
  const [deleteLoading, setDeleteLoading] = useState(false);

  // 加载项目列表
  const loadProjects = async () => {
    setLoading(true);
    try {
      const data = await listProjects();
      setProjects(data);
    } catch (error) {
      console.error("Failed to load projects:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  // 创建或更新项目
  const handleSaveProject = async (data: ProjectPayload) => {
    try {
      if (data.id) {
        await updateProject(data.id, data);
      } else {
        await createProject(data);
      }
      await loadProjects();
      setProjectModal({ open: false, project: null });
    } catch (error) {
      console.error("Failed to save project:", error);
      throw error;
    }
  };

  // 删除项目
  const handleDeleteProject = async () => {
    if (!deleteModal.project) return;

    setDeleteLoading(true);
    try {
      await deleteProject(deleteModal.project.id);
      await loadProjects();
      setDeleteModal({ open: false, project: null });
    } catch (error) {
      console.error("Failed to delete project:", error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // 打开创建弹窗
  const handleCreate = () => {
    setProjectModal({ open: true, project: null });
  };

  // 打开编辑弹窗
  const handleEdit = (project: ProjectResponse) => {
    setProjectModal({ open: true, project });
  };

  // 打开删除确认弹窗
  const handleDeleteClick = (project: ProjectResponse) => {
    setDeleteModal({ open: true, project });
  };

  if (loading && projects.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-500">加载中...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* 头部 */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">我的项目</h1>
          <p className="text-gray-500 mt-1">管理你的任务列表和笔记本</p>
        </div>
        <Button onClick={handleCreate} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          新建项目
        </Button>
      </div>

      {/* 项目列表 */}
      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <FolderOpen className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">还没有项目</h3>
          <p className="text-gray-500 mb-4">创建第一个项目来开始管理任务</p>
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            创建项目
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="p-4 hover:shadow-lg transition-shadow cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3 flex-1">
                  <div
                    className="w-4 h-4 rounded-full shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      {project.kind === "TASK" ? "任务列表" : "笔记本"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(project)}
                  className="flex-1"
                >
                  <Edit2 className="h-4 w-4 mr-1" />
                  编辑
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteClick(project)}
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  删除
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 项目弹窗 */}
      <ProjectModal
        open={projectModal.open}
        project={projectModal.project}
        onClose={() => setProjectModal({ open: false, project: null })}
        onSubmit={handleSaveProject}
      />

      {/* 删除确认弹窗 */}
      <DeleteProjectModal
        open={deleteModal.open}
        projectName={deleteModal.project?.name || ""}
        onClose={() => setDeleteModal({ open: false, project: null })}
        onConfirm={handleDeleteProject}
        loading={deleteLoading}
      />
    </div>
  );
}
