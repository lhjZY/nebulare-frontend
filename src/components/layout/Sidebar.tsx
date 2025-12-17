import AvatarMenu from "@/components/ui/avatar-menu";
import { Link } from "react-router-dom";
import { ListTodo } from "lucide-react";

type SidebarProps = {
  setThemeDialogOpen: (open: boolean) => void;
};

export default function Sidebar({ setThemeDialogOpen }: SidebarProps) {
  return (
    <aside
      className="w-16 flex flex-col items-center gap-4 border-r border-outline/10 pt-5 transition-colors"
      style={{
        backgroundImage:
          "linear-gradient(180deg, rgb(var(--color-gradient-from-color)), rgb(var(--color-gradient-to-color)))",
      }}
    >
      <AvatarMenu onOpenThemeDialog={() => setThemeDialogOpen(true)} />
      <Link
        className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-variant"
        to="/"
        title="Todo"
      >
        <ListTodo className="h-5 w-5" />
      </Link>
    </aside>
  );
}
