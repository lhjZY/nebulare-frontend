import { Separator } from "react-resizable-panels";

export default function ResizeHandle() {
  return (
    <Separator className="w-1 cursor-col-resize bg-border transition hover:bg-primary/50" />
  );
}
