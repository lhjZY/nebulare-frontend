import { Check } from "lucide-react";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTheme } from "@/theme/theme-context";
import { cn } from "@/lib/utils";

type ThemePaletteDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ThemePaletteDialog({ open, onOpenChange }: ThemePaletteDialogProps) {
  const { preset, presets, setTheme } = useTheme();

  const handleSelect = (id: string) => {
    setTheme(id);
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-xl">
        <AlertDialogHeader>
          <AlertDialogTitle>颜色系列</AlertDialogTitle>
          <AlertDialogDescription>点击色块立即切换主题。</AlertDialogDescription>
        </AlertDialogHeader>
        <div role="radiogroup" className="grid grid-cols-3 gap-4 md:grid-cols-4">
          {presets.map((item) => {
            const active = item.id === preset.id;
            return (
              <button
                key={item.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => handleSelect(item.id)}
                className="group flex flex-col items-center gap-2 focus:outline-hidden"
              >
                <span
                  className={cn(
                    "relative h-14 w-14 rounded-xl border border-outline/30 bg-white shadow-xs ring-offset-2 transition hover:shadow-md",
                    active ? "ring-2 ring-(--theme-primary)" : "ring-1 ring-transparent",
                  )}
                  style={{ background: item.asideBg ?? item.color }}
                >
                  {active ? (
                    <span className="absolute -right-2 -bottom-2 grid h-6 w-6 place-items-center rounded-full bg-white text-(--theme-primary) shadow-sm ring-1 ring-outline/20">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : null}
                </span>
                <span className="text-xs text-on-surface">{item.name}</span>
              </button>
            );
          })}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onOpenChange(false)}>关闭</AlertDialogCancel>
          <button
            type="button"
            onClick={() => handleSelect("default")}
            className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-on-surface hover:bg-surface-variant"
          >
            恢复默认
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
