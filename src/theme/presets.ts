export type ThemePreset = {
  id: string;
  name: string;
  color: string;
  asideBg?: string;
  inputBorder?: string;
};

export const themePresets: ThemePreset[] = [
  { id: "default", name: "默认", color: "#ffffff", inputBorder: "#E5E7EB", asideBg: "#ffffff" },
  { id: "qinglan", name: "晴蓝", color: "#5D7CFF" },
  { id: "songshi", name: "松石", color: "#1FC8A9" },
  { id: "miqing", name: "秘青", color: "#45B3C5" },
  { id: "yanlv", name: "燕绿", color: "#A5BDA2" },
  { id: "xinghuang", name: "杏黄", color: "#F7B84B" },
  { id: "taotian", name: "桃夭", color: "#FF8FA3" },
  { id: "moshanz", name: "暮山紫", color: "#9BA6E6" },
  { id: "chenxiang", name: "沉香", color: "#B49278" },
  { id: "canglan", name: "藏蓝", color: "#2E3D70" },
  { id: "huise", name: "灰色", color: "#484C55" },
  { id: "yejian", name: "夜间", color: "#1C1C1C" }
];
