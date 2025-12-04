import React from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "@/api/auth";
import {Palette,LogOut } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import defaultImage from '@/assets/avatar.jpeg'
type AvatarMenuProps = {
  onOpenThemeDialog?: () => void;
};

export default function AvatarMenu({ onOpenThemeDialog }: AvatarMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // 点击外部区域关闭弹窗
  React.useEffect(() => {
    if (!open) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <div ref={containerRef} className="relative">
      <Avatar onClick={() => setOpen((v) => !v)}
        className="h-10 w-10 rounded-full grid place-items-center text-lg hover:opacity-90">
        <AvatarImage src={defaultImage} />
        <AvatarFallback>N</AvatarFallback>
      </Avatar>
      {open ? (
        <div className="absolute left-12 top-0 z-50 w-40 rounded-xl border border-outline/20 bg-white shadow-md">
          <button
            className="w-full px-4 py-3 text-left text-sm hover:bg-surface-variant flex items-center justify-start"
            onClick={() => {
              setOpen(false);
              onOpenThemeDialog?.();
            }}
          >
            <Palette className="w-4 h-4" />
            <span className="pl-2">更换主题</span>
          </button>
          <button
            className="w-full px-4 py-3 text-left text-sm hover:bg-surface-variant flex items-center justify-start"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            <span className="pl-2">退出登录</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
