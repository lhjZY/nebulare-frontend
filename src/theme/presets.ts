export type ThemePreset = {
  id: string;
  name: string;
  color: string;
  asideBg?: string;
  inputBorder?: string;
  // 侧边栏渐变色系统
  sidebarBg?: string; // 侧边栏背景色
  sidebarItem?: string; // 侧边栏项目背景色（hover）
  sidebarItemActive?: string; // 侧边栏项目激活背景色
};

export const themePresets: ThemePreset[] = [
  {
    id: "default",
    name: "默认",
    color: "#ffffff",
    inputBorder: "#E5E7EB",
    asideBg: "#ffffff",
    sidebarBg: "#ffffff",
    sidebarItemActive: "#EFEFEF",
  },
  {
    id: "qinglan",
    name: "晴蓝",
    color: "#5D7CFF",
    sidebarBg: "oklch(95.1% 0.026 236.824)",
    sidebarItemActive: "oklch(90.1% 0.058 230.902)",
  },
  {
    id: "songshi",
    name: "松石",
    color: "oklch(84.5% 0.143 164.978)", // 300
    sidebarBg: "oklch(96.2% 0.044 156.743)", // 100
    sidebarItemActive: "oklch(92.5% 0.084 155.995)", // 200
  },
  { id: "yanlv", name: "燕绿", color: "#A5BDA2" },
  { id: "xinghuang", name: "杏黄", color: "#F7B84B" },
  {
    id: "taotian",
    name: "桃妖",
    color: "oklch(82.3% 0.12 346.018)",
    sidebarBg: "oklch(89.9% 0.061 343.231)",
    sidebarItemActive: "oklch(94.8% 0.028 342.258)",
  },
  { id: "moshanz", name: "暮山紫", color: "#9BA6E6" },
  { id: "chenxiang", name: "沉香", color: "#B49278" },
  { id: "canglan", name: "藏蓝", color: "#2E3D70" },
  { id: "huise", name: "灰色", color: "#484C55" },
  { id: "yejian", name: "夜间", color: "#1C1C1C" },
];
