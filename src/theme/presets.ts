/** 主题定义 - 仅用于 UI 展示，实际颜色由 CSS 变量控制 */
export type ThemePreset = {
  id: string;
  name: string;
};

/** 可用主题列表 */
export const themePresets: ThemePreset[] = [
  { id: "blue-gradient-theme", name: "蓝色渐变" },
  { id: "turquoise-gradient-theme", name: "绿松石渐变" },
  { id: "lilac-gradient-theme", name: "丁香紫渐变" },
];

/** 从 CSS 变量获取主题主色调（用于预览） */
export function getThemeColor(themeId: string): string {
  // 临时创建元素来读取该主题的 CSS 变量
  const temp = document.createElement("div");
  temp.dataset.theme = themeId;
  temp.style.display = "none";
  document.body.appendChild(temp);

  const style = getComputedStyle(temp);
  const colorRgb = style.getPropertyValue("--color-primary").trim();
  document.body.removeChild(temp);

  return colorRgb ? `rgb(${colorRgb})` : "rgb(71, 114, 250)";
}
