import AvatarMenu from "@/components/ui/avatar-menu";
import { Link, useLocation } from "react-router-dom";
import { ListTodo } from "lucide-react";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { cn } from "@/lib/utils";

export default function Header() {
  const location = useLocation();

  const navItems = [
    { href: "/", icon: ListTodo, label: "任务", isActive: location.pathname === "/" },
    // 后续可以在这里添加更多导航项
    // { href: "/calendar", icon: Calendar, label: "日历", isActive: location.pathname === "/calendar" },
    // { href: "/notes", icon: FileText, label: "笔记", isActive: location.pathname === "/notes" },
  ];

  return (
    <header className="h-14 flex items-center border-b border-border bg-background px-4 transition-colors">
      {/* Left: Logo */}
      <div className="flex items-center gap-2 w-48">
        <Link
          className="flex items-center gap-2 text-foreground hover:text-foreground/80 transition-colors"
          to="/"
        >
          <img src="/workflow.svg" alt="Nebula Logo" className="h-5 w-5" />
          <span className="font-semibold text-lg">Nebula</span>
        </Link>
      </div>

      {/* Center: Navigation */}
      <nav className="flex-1 flex items-center gap-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              item.isActive
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Right: Theme toggle and avatar */}
      <div className="flex items-center gap-2 w-48 justify-end">
        <ThemeToggle />
        <AvatarMenu />
      </div>
    </header>
  );
}
