# 前端主题切换方案（AvatarMenu -> 弹窗色板）

## 目标
- 在 `AvatarMenu` 中点击“主题”入口，弹出模态框显示一组颜色选项卡，点击即可切换。
- 主题色作用域：`aside` 背景；`TaskColumn` 内 `Input` 边框。
- 提供持久化（`localStorage`）与即时生效的样式变量，便于后续扩展其他控件。

## 方案概览
- 主题定义：集中维护 `ThemePreset` 数组，含 `id/name/color/token`，色值用于样式变量。
- 状态管理：`ThemeProvider`（React Context + hook）存储 `activeThemeId`，首次加载读取 `localStorage`，切换时写回并调用 `applyTheme`.
- 应用方式：`document.documentElement.style.setProperty` 设置 CSS 变量，如 `--theme-aside-bg`、`--theme-input-border`，避免侵入式修改组件。
- 触发入口：`AvatarMenu` 增加“主题”菜单项，打开 `Dialog`；`Dialog` 内是可聚焦的色块按钮（含勾选标记），兼容键盘操作。

## 主题预设（示例色值，可微调）
| id | 名称 | 主色 `color` | 说明 |
| --- | --- | --- | --- |
| default | 默认 | `#ffffff` | 保持现状，边框用 `#E5E7EB` |
| qinglan | 晴蓝 | `#5D7CFF` | 明亮蓝 |
| songshi | 松石 | `#1FC8A9` | 绿松石 |
| miqing | 秘青 | `#45B3C5` | 青绿 |
| yanlv | 燕绿 | `#A5BDA2` | 灰绿 |
| xinghuang | 杏黄 | `#F7B84B` | 暖黄 |
| taotian | 桃夭 | `#FF8FA3` | 粉橙渐变感 |
| moshanz | 暮山紫 | `#9BA6E6` | 柔紫 |
| chenxiang | 沉香 | `#B49278` | 棕金 |
| canglan | 藏蓝 | `#2E3D70` | 深蓝 |
| huise | 灰色 | `#484C55` | 深灰 |
| yejian | 夜间 | `#1C1C1C` | 纯黑 |

> 变量映射：`color` -> `--theme-primary`; 同时派生 `--theme-aside-bg`（可用同色或渐变）、`--theme-input-border`（同色或 80% 透明度）。

## 交互与布局
- `AvatarMenu` 新增菜单项：“主题”，点击后 `Dialog` 打开。
- `Dialog` 内容：
  - 标题“颜色系列”，下方为 `grid` 形式的色块按钮，宽高约 48px。
  - 选中态显示外环或右下角勾选（SVG），非选中态 hover 有内阴影。
  - 色块下方显示名称文字。
  - 底部提供“关闭”/“恢复默认”按钮（可选），`Esc` 关闭。
- 可通过键盘 Tab 聚焦色块，Enter 选择；ARIA：色块用 `role="radio"`、容器 `role="radiogroup"`。

## 状态与样式应用
```ts
// 伪代码：集中定义主题
type ThemePreset = {
  id: string;
  name: string;
  color: string;
  asideBg?: string; // 可选渐变
  inputBorder?: string;
};

const themePresets: ThemePreset[] = [ ...上表... ];

function applyTheme(preset: ThemePreset) {
  const root = document.documentElement.style;
  root.setProperty('--theme-primary', preset.color);
  root.setProperty('--theme-aside-bg', preset.asideBg ?? preset.color);
  root.setProperty('--theme-input-border', preset.inputBorder ?? preset.color);
}
```

- `App` 顶层用 `ThemeProvider` 包裹，`useTheme` 提供 `activeTheme` 与 `setTheme(id)`.
- 初始加载：读取 `localStorage.getItem('theme')`，找不到则回退 `default`。
- 切换时：`setTheme(id)` -> 更新 context -> `applyTheme` -> 写 `localStorage` -> 关闭弹窗。

## 样式落点
- `aside`：背景改为 `background: var(--theme-aside-bg);`，如需层次可加 `linear-gradient(var(--theme-aside-bg), #ffffff 20%)` 或降低透明度适配浅/深色。
- `TaskColumn` 的 `Input`：边框改为 `border-color: var(--theme-input-border);`，focus 态可用 `box-shadow: 0 0 0 3px color-mix(in srgb, var(--theme-input-border) 35%, transparent);`
- 其他可同步使用 `--theme-primary`（按钮、Tag 等），保持一致性。

## 开发步骤（无代码改动前的任务清单）
1) 在 `src/theme/presets.ts`（或同级新建）定义 `themePresets` 常量与 `ThemePreset` 类型。
2) 新建 `ThemeProvider` + `useTheme` hook，封装 `localStorage` 读取与 `applyTheme`。
3) `App.tsx` 顶层包裹 `ThemeProvider`，保证全局可用。
4) `AvatarMenu` 增加“主题”菜单项，打开 `Dialog`；`Dialog` 内渲染 `themePresets` 色块（`button`/`Card`），选中态勾选。
5) 在 `aside` 容器与 `TaskColumn` 的 `Input` 样式中使用 CSS 变量，确保默认主题兼容。
6) 可选：提供 `useEffect` 监听 `prefers-color-scheme`，在首次加载时选择更贴近系统的浅/深色预设。

## 验收点
- 视觉：弹窗色板与示例相近，选中态明确；浅色主题下文字可读，深色主题下边框/背景不过暗。
- 交互：点击/键盘均可切换；切换后 `aside` 背景和 `TaskColumn` 输入框边框即刻变化。
- 持久化：刷新后保持最近一次选择；清空存储后回退默认主题。

## TailwindCSS 优化建议
- 变量引用：通过任意值语法直接引用 CSS 变量，例如 `className=\"bg-(--theme-aside-bg)\"`、`className=\"border-(--theme-input-border)\"`，确保主题切换无需条件样式。
- 色板布局：色块按钮可用 `grid grid-cols-4 gap-3 md:grid-cols-6`，按钮使用 `h-12 w-12 rounded-xl shadow-xs hover:shadow-sm`，选中态用 `ring-2 ring-offset-2 ring-(--theme-primary)`.
- 弹窗骨架：复用现有 `Dialog`，内部容器 `p-5 space-y-4`，标题 `text-lg font-semibold`，底部按钮 `inline-flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-50`.
- Input 边框：`className=\"border bg-white focus:ring-2 ring-offset-0 focus:ring-(--theme-input-border)\"`，可避免自定义样式文件。
- 主题按钮：色块下方文字用 `text-xs text-gray-600`，整体组件控制在 `AvatarMenu` 中，减少额外 styled 组件层级。

## 第一性原则拆解与进一步优化
- 问题本质：主题切换 = 数据驱动的样式覆盖。核心是「确定主题 -> 映射到样式变量 -> 在关键节点消费变量」。因此应聚焦于最小可变集合（几个 CSS 变量）而非分散的条件 class。
- 状态与渲染解耦：用 `ThemeProvider` 维护单一 `activeThemeId`（状态），`applyTheme` 只负责写变量（副作用），组件仅消费变量，无需感知主题逻辑，降低耦合。
- 设计约束：变量命名最小化且语义化（`--theme-primary`/`--theme-aside-bg`/`--theme-input-border`），避免出现多处重复色值；Tailwind 任意值直接消费变量，不新增样式文件。
- 可验证性：持久化通过 `localStorage`，加载/切换写入变量后可 snapshot 测试 `document.documentElement.style.getPropertyValue`，避免 UI 依赖。
- 无障碍与可维护性：色块使用 `role="radio"` + 键盘导航，ARIA label 使用名称，符合可访问性基线；代码风格遵循 Google JS Style（清晰命名、早返回、无魔法数、常量集中）。

## 其他优化点
- 主题扩展性：预设定义文件支持 `accent`, `text`, `surface` 等额外字段，先消费核心变量，避免后续大改。
- 性能：只在主题变化时写变量，不在 render 中重复写；Dialog 关闭后不卸载列表也可，避免重复构建色块。
- 安全回退：找不到主题 id 时回退 default，防止 `localStorage` 异常导致空变量。
- 文档与规范：在 `src/theme/README.md`（可选）记录变量含义与新增流程，保持团队一致性；Lint/格式遵循现有 ESLint/Prettier，命名与注释简洁、直译，符合 Google 风格强调清晰可读与小函数单一职责。
#76babf slider bg
#D3e8eb item bg
#c3e1e4 item active bg

#38426b
#d7e9e2
#e0e2e9
