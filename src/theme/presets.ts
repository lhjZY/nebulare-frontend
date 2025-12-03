export type ThemePreset = {
  id: string;
  name: string;
  color: string;
  asideBg?: string;
  inputBorder?: string;
  // 侧边栏渐变色系统
  sidebarBg?: string;      // 侧边栏背景色
  sidebarItem?: string;    // 侧边栏项目背景色（hover）
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
    sidebarItem: "#F7F7F7",
    sidebarItemActive: "#EFEFEF"
  },
  { 
    id: "qinglan", 
    name: "晴蓝", 
    color: "#5D7CFF",
    sidebarBg: "#5D7CFF",
    sidebarItem: "#8798FF",
    sidebarItemActive: "#A9B5FF"
  },
  { 
    id: "songshi", 
    name: "松石", 
    color: "#1FC8A9",
    sidebarBg: "#1FC8A9",
    sidebarItem: "#47D3BA",
    sidebarItemActive: "#70DFCB"
  },
  { 
    id: "miqing", 
    name: "秘青", 
    color: "#45B3C5",
    sidebarBg: "#45B3C5",
    sidebarItem: "#69C8D6",
    sidebarItemActive: "#8DDDE7"
  },
  { id: "yanlv", name: "燕绿", color: "#A5BDA2" },
  { id: "xinghuang", name: "杏黄", color: "#F7B84B" },
  { id: "taotian", name: "桃妖", color: "#FF8FA3" },
  { id: "moshanz", name: "暮山紫", color: "#9BA6E6" },
  { id: "chenxiang", name: "沉香", color: "#B49278" },
  { id: "canglan", name: "藏蓝", color: "#2E3D70" },
  { id: "huise", name: "灰色", color: "#484C55" },
  { id: "yejian", name: "夜间", color: "#1C1C1C" }
];
