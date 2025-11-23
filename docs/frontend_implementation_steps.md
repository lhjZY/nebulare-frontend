# TickClone 前端实现步骤（配合现有后端）

## 1. 项目基础
- 初始化：Vite + React 18 + TS 5，配置 Tailwind + Material Symbols 字体。
- 安装依赖：dexie、dexie-react-hooks、axios、dayjs、zustand、uuid、clsx、tailwind-merge。
- 目录结构：`src/{db,services,hooks,store,components,pages,utils}`。

## 2. 数据模型与 Dexie
- 已落地 `db/schema.ts`：Task/Project/Meta 与后端 JSON 对齐，使用后端的 `modifiedTime` 字段名（对应后端 SyncMeta.server_update_time 的 `json:"modifiedTime"`），补充前端专用 `syncStatus`。
  - Task 字段：id, projectId, title, content, status, priority, progress, isAllDay, timeZone, startDate?, dueDate?, tags[], items[], isDeleted, modifiedTime, syncStatus。
  - Project 字段：id, name, sortOrder, color, kind, parentId, isDeleted, modifiedTime, syncStatus。
  - Meta：key/value。
- 已落地 `db/index.ts`：
  - Dexie 版本 1，索引：tasks `id, projectId, status, syncStatus, isDeleted, modifiedTime, dueDate`; projects `id, syncStatus, isDeleted, modifiedTime`; meta `key`。
  - 工具：`createLocalTask` / `createLocalProject` 统一补齐默认值和 `syncStatus`。
  - 转换：`mapApiTaskToLocal` / `mapLocalTaskToApi`、`mapApiProjectToLocal` / `mapLocalProjectToApi`，保持后端字段名，写入时设置 `syncStatus: "synced"`。

## 3. 网络层与鉴权
- 已落地 `utils/http.ts`：
  - Axios 实例 `baseURL=/api/v1`，请求拦截器自动注入 `Authorization: Bearer <access>`（除非显式 `skipAuth`）。
  - 响应拦截器 401 自动尝试 `POST /auth/refresh {refreshToken}`（带 `skipAuth/skipRefresh` 标记避免递归），成功后重试原请求，失败则清空本地 token。
  - `tokenStorage` 封装本地存取/清理（localStorage）。
  - 统一请求方法 `request<T>` 返回 `res.data`，用于快速封装 GET/POST/PATCH 等 API。
- 已落地 `services/auth.ts`：`register`、`verify`（获取 tokens 并存储）、`login`、`refresh`（skipRefresh 避免递归）、`logout`（清 token，后续可联动清 IndexedDB）。
- Token 存储：localStorage；登出时可清理 IndexedDB（tasks/projects）逻辑按需在调用方补充。

## 10. 视觉与交互方案（对齐截图）

### A. 左侧边栏 (Sidebar)
- 布局：垂直栈 + 分组标题；顶部头像/全局入口；分组间用 8px 间距与浅分割线区隔。
- 智能清单：列表项含图标+标题+灰色徽标（计数），默认文字 `text-[#444746]`，hover `bg-surface-variant`，选中 `bg-primary text-on-primary rounded-full`.
- 自定义清单：彩色小圆点（红/黄/紫等）+ 项目名；保持统一行高（36px）。
- 标签：图标 + 文本，样式同自定义清单；在分组标题下排列。
- 选中态：背景浅灰或淡蓝，对应右侧内容联动高亮。

### B. 中间任务列表 (Task List)
- 头部：左侧大标题（24px/semibold），右侧放排序/筛选图标按钮（浅灰背景圆角）。
- 快速添加栏：常驻输入框行（浅灰底、圆角、left icon “+”），提示文案“添加任务至‘收集箱’”。
- 分组：按时间分组（已过期、最近7天、无日期）；组标题行含左侧折叠箭头；“已过期”标题与时间标记使用红色强调。
- 任务行：左方形 Checkbox；中间标题；右侧 muted 信息（浅灰文本，项目名/日期）。选中行背景浅灰，hover 时轻微高亮。
- 间距：组间 12–16px，行高 40–44px，分组内部 6–8px 垂直间距。

### C. 右侧详情页 (Detail View)
- 头部：左侧 Checkbox + 日期标签（蓝色链接态可点击），右侧旗帜图标按钮。
- 标题：大号加粗文本（20–24px/semibold），留足上下空白。
- 内容区：大面积留白，支持富文本或子任务列表；文本颜色 `text-[#1f1f1f]`，辅助信息 `text-outline`.
- 底部工具栏：左侧显示所属项目/盒子，右下角一排图标（子任务、评论、更多），使用浅灰图标+hover 深色。

### 组件拆分建议
- `Sidebar`：接收 smartLists、projects、tags 数据；支持选中态回调。
- `TaskQuickAdd`：输入 + onSubmit。
- `TaskGroup`：折叠/展开逻辑，标题+计数+子任务列表。
- `TaskItem`：Checkbox、标题、muted meta、选中态。
- `TaskDetail`：头部元数据、标题、内容区、底部工具栏。
## 4. 同步引擎（对齐后端 /api/v1/sync 契约）
- 已落地 `services/sync.ts`：
  - 读取 `meta.checkPoint`（默认为 0），查 Dexie 脏数据 `syncStatus != 'synced'`。
  - 组装 payload：`{ checkPoint, changes: { tasks: { add, update, delete }, projects: { ... }}}`，字段沿用后端命名，时间用 `modifiedTime`。
  - `POST /sync`，期望返回 `{ checkPoint, updates: { tasks, projects } }`。
  - 事务内：按 LWW（比较 `modifiedTime`）写入 updates，标记本地脏数据为 `synced`，更新 `meta.checkPoint`。
- 触发：`hooks/useSync.ts` 提供 `syncNow`、`isSyncing`、`lastError`、`lastRun`，组件可在启动/online/轮询（默认 5 分钟）触发；带 2s 防抖。
- 进阶：必要时在 UI 显示同步状态或错误提示；如后端契约有变化（字段名/结构），调整 `services/sync.ts` 的 payload/映射。

## 5. UI 框架
- Layout：Sidebar + MainLayout，Tailwind 实现 Material 3 风格（primary/on-primary 等主题色）。
- 组件：Button/Input/Modal/FAB；TaskItem/TaskList/TaskDetail；Project 列表。
- 状态：Zustand 管理 UI（侧栏开关、选中任务 ID）。

## 6. 业务功能
- 任务列表：`useLiveQuery` 订阅 Dexie；新增/编辑/完成/删除直接写本地并标记 `syncStatus`（created/updated/deleted）。
- 智能清单：`useTodayTasks` 过滤 `isDeleted=0`、`syncStatus!='deleted'` 且 `dueDate` 在今天。
- 排序：拖拽后计算 `newSortOrder=(prev+next)/2`，更新本地并标记 updated。
- 项目管理：新增/重命名/删除（软删）均写本地并标记 `syncStatus`。

## 7. 认证流程 UI
- 注册页：提交 email/password，提示“验证码已发送”；验证码输入后调用 verify 获得 tokens。
- 登录页：提交 email/password，存 tokens，跳转主界面。
- 刷新：应用启动时尝试 refresh；401 兜底跳登录。

## 8. 测试与质量
- 单元：转换函数、auth 服务、sync 组装/解析（可用 MSW 或本地假接口）。
- E2E（可选）：Cypress/Playwright 覆盖登录、创建任务、离线后重连同步。
- 性能：Dexie 查询和 useLiveQuery 避免全表扫描（索引字段齐全）。

## 9. 待确认/对齐
- 后端 `/sync` 请求/响应字段最终命名（`modifiedTime` vs `serverUpdateTime`）。
- Task 额外字段（progress/tags/items/timeZone/isAllDay）是否需要前端支持。
- Project 字段（sortOrder/color/kind/parentId）在 UI 的呈现/编辑策略。
