import React from "react";
import { PanelResizeHandle } from "react-resizable-panels";

export default function ResizeHandle() {
  return (
    <PanelResizeHandle className="w-1 cursor-col-resize bg-border transition hover:bg-primary/50" />
  );
}
