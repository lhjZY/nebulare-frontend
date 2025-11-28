import React from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "@/api/auth";
import {Palette,LogOut } from 'lucide-react'
type AvatarMenuProps = {
  onOpenThemeDialog?: () => void;
};

export default function AvatarMenu({ onOpenThemeDialog }: AvatarMenuProps) {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="h-10 w-10 rounded-full bg-primary text-on-primary grid place-items-center text-lg hover:opacity-90"
        aria-label="打开用户菜单"
      >
        T
      </button>
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
