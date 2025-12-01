import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjectPayload, ProjectKind, ProjectResponse } from '@/api/projects';

interface ProjectModalProps {
  open: boolean;
  project?: ProjectResponse | null;
  onClose: () => void;
  onSubmit: (data: ProjectPayload) => Promise<void>;
}

const COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
  '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
  '#F8B195', '#C06C84', '#6C5B7B', '#355C7D',
];

const KIND_OPTIONS: { value: ProjectKind; label: string }[] = [
  { value: 'TASK', label: '任务列表' },
  { value: 'NOTE', label: '笔记本' },
];

export function ProjectModal({ open, project, onClose, onSubmit }: ProjectModalProps) {
  const [formData, setFormData] = useState<ProjectPayload>({
    name: '',
    color: '#FF6B6B',
    kind: 'TASK',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setFormData({
        id: project.id,
        name: project.name,
        color: project.color,
        kind: project.kind,
        parentId: project.parentId,
      });
    } else {
      setFormData({
        name: '',
        color: '#FF6B6B',
        kind: 'TASK',
      });
    }
  }, [project, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || loading) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Failed to save project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{project ? '编辑项目' : '创建新项目'}</DialogTitle>
            <DialogDescription>
              {project ? '修改项目信息' : '添加一个新的任务列表或笔记本'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                项目名称
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="输入项目名称"
                maxLength={100}
                required
                disabled={loading}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">项目类型</label>
              <div className="flex gap-4">
                {KIND_OPTIONS.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="kind"
                      value={option.value}
                      checked={formData.kind === option.value}
                      onChange={(e) =>
                        setFormData({ ...formData, kind: e.target.value as ProjectKind })
                      }
                      disabled={loading}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">颜色</label>
              <div className="flex gap-2 flex-wrap">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-10 h-10 rounded-full border-2 transition-all ${
                      formData.color === color
                        ? 'border-black scale-110'
                        : 'border-gray-300 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setFormData({ ...formData, color })}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? '保存中...' : project ? '保存' : '创建'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
