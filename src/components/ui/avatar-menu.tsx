import React from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "@/api/auth";
import { LogOut, User } from "lucide-react";
import { Avatar, AvatarFallback } from "./avatar";

export default function AvatarMenu() {
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

  const handleLogout = async () => {
    await logout();
    setOpen(false);
    navigate("/login", { replace: true });
  };

  return (
    <div ref={containerRef} className="relative">
      <Avatar
        onClick={() => setOpen((v) => !v)}
        className="h-9 w-9 rounded-full grid place-items-center text-lg hover:opacity-90 cursor-pointer border border-border"
      >
        <AvatarFallback className="bg-muted">
          <User className="h-4 w-4 text-muted-foreground" />
        </AvatarFallback>
      </Avatar>
      {open ? (
        <div className="absolute right-0 top-12 z-50 w-40 rounded-lg border border-border bg-popover shadow-md overflow-hidden">
          <button
            className="w-full px-4 py-3 text-left text-sm text-destructive hover:bg-destructive/10 flex items-center justify-start transition-colors"
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
