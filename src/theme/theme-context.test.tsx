import React, { act } from "react";
import { describe, it, expect, beforeEach } from "vitest";
import { createRoot, Root } from "react-dom/client";
import { applyTheme, ThemeProvider, THEME_STORAGE_KEY, useTheme } from "./theme-context";

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

beforeEach(() => {
  localStorage.clear();
  const style = document.documentElement.style;
  style.removeProperty("--theme-primary");
  style.removeProperty("--theme-aside-bg");
  style.removeProperty("--theme-input-border");
});

describe("applyTheme", () => {
  it("writes CSS variables based on preset", () => {
    applyTheme({
      id: "test",
      name: "Test",
      color: "#123456",
      asideBg: "#abcdef",
      inputBorder: "#111111",
    });
    const style = document.documentElement.style;
    expect(style.getPropertyValue("--theme-primary")).toBe("#123456");
    expect(style.getPropertyValue("--theme-aside-bg")).toBe("#abcdef");
    expect(style.getPropertyValue("--theme-input-border")).toBe("#111111");
  });
});

describe("ThemeProvider", () => {
  function renderWithTheme() {
    const container = document.createElement("div");
    document.body.appendChild(container);
    let root: Root | null = null;
    const state: { presetId?: string; setTheme?: (id: string) => void } = {};

    const Capture = () => {
      const { preset, setTheme } = useTheme();
      state.presetId = preset.id;
      state.setTheme = setTheme;
      return null;
    };

    act(() => {
      root = createRoot(container);
      root.render(
        <ThemeProvider>
          <Capture />
        </ThemeProvider>,
      );
    });

    return { container, root: root!, state };
  }

  it("loads preset from storage if available", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "huise");
    const { root, container, state } = renderWithTheme();
    expect(state.presetId).toBe("huise");
    act(() => root.unmount());
    container.remove();
  });

  it("updates CSS variables and storage when theme changes", () => {
    const { root, container, state } = renderWithTheme();
    expect(state.presetId).toBe("default");

    act(() => state.setTheme?.("qinglan"));

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("qinglan");
    expect(document.documentElement.style.getPropertyValue("--theme-primary")).toBe("#5D7CFF");
    act(() => root.unmount());
    container.remove();
  });
});
