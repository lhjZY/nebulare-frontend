
---

# TickClone 前端架构与工程规范 (v1.0)

项目名称: TickClone Web Client

版本: 1.0.0

日期: 2025-11-22

设计语言: Google Material Design 3 (Material You)

核心架构: Local-First (IndexedDB) + Optimistic UI + Incremental Sync

---

## 1. 架构概览 (Architecture Overview)

本项目是一个**离线优先**的单页应用 (SPA)。

- **单一数据源 (Source of Truth)**: 前端界面**只**渲染本地 IndexedDB 中的数据。
    
- **乐观 UI (Optimistic UI)**: 用户的任何操作（增删改）立即写入本地数据库并更新视图，不需要等待网络请求。
    
- **同步引擎 (Sync Engine)**: 作为一个独立的后台进程，负责将本地的变更“推”给服务器，并将服务器的变更“拉”回本地。
    

### 数据流向图

代码段

```
graph TD
    User[用户交互] -->|1. 操作| LocalDB[(IndexedDB / Dexie)]
    LocalDB -->|2. 实时订阅 (useLiveQuery)| UI[React 组件]
    
    subgraph Background Process
        LocalDB -->|3. 读取变更| SyncService[同步服务]
        SyncService -->|4. POST /sync| API[后端 API]
        API -->|5. 返回 Updates| SyncService
        SyncService -->|6. 写入/合并| LocalDB
    end
```

---

## 2. 技术栈选型 (Tech Stack)

|**模块**|**选型**|**版本**|**说明**|
|---|---|---|---|
|**Core**|React|18+|视图层框架|
|**Language**|TypeScript|5+|强类型约束，与 Go 后端结构对应|
|**Build**|Vite|5+|极速构建工具|
|**Local DB**|**Dexie.js**|4.x|IndexedDB 的封装库，支持 Hooks|
|**State**|Zustand|4.x|全局 UI 状态 (侧边栏开关, 选中ID)|
|**Network**|Axios|1.x|HTTP 请求，配置拦截器处理 JWT|
|**Style**|Tailwind CSS|3.4+|原子化 CSS|
|**Icons**|Material Symbols|(Google)|Google 官方字体图标|
|**Date**|Day.js|1.x|轻量级日期处理|
|**UUID**|uuid|9.x|**关键**：前端生成业务 ID (v4)|

---

## 3. 数据库设计 (Local Database Schema)

使用 Dexie.js 定义本地数据库。

### 3.1 核心实体定义 (`src/db/schema.ts`)

本地数据结构比后端多一个 `syncStatus` 字段，用于追踪脏数据。

TypeScript

```
// 任务接口
export interface Task {
  id: string;           // UUID v4 (主键)
  projectId: string;    // 归属清单
  title: string;
  content: string;      // 备注
  status: number;       // 0:Todo, 2:Done
  
  // 时间相关
  startDate?: number;   // timestamp
  dueDate?: number;     // timestamp
  timeZone: string;
  isAllDay: boolean;
  
  priority: number;     // 0, 1, 3, 5
  sortOrder: number;    // 排序权重
  
  // 同步元数据
  isDeleted: number;    // 0:正常, 1:已删除
  serverUpdateTime: number; // 后端给的时间戳
  
  // [前端专用] 同步状态标记
  syncStatus: 'synced' | 'created' | 'updated' | 'deleted'; 
}

// 用户设置/元数据表
export interface Meta {
  key: string; // e.g., 'checkPoint', 'currentUser'
  value: any;
}
```

### 3.2 Dexie 实例化 (`src/db/index.ts`)

TypeScript

```
import Dexie, { Table } from 'dexie';

class TickDB extends Dexie {
  tasks!: Table<Task>;
  projects!: Table<Project>;
  meta!: Table<Meta>;

  constructor() {
    super('TickCloneDB');
    this.version(1).stores({
      // 索引设计：id为主键，syncStatus用于查找脏数据，dueDate用于智能清单筛选
      tasks: 'id, projectId, status, syncStatus, isDeleted, dueDate, serverUpdateTime',
      projects: 'id, syncStatus, isDeleted',
      meta: 'key'
    });
  }
}

export const db = new TickDB();
```

---

## 4. 同步引擎实现 (Sync Engine)

### 4.1 触发机制

同步应在以下情况触发：

1. 应用初始化 (Mount)。
    
2. 网络状态变为 Online (`window.addEventListener('online')`)。
    
3. 用户修改数据后 (Debounce 2秒)。
    
4. 定时轮询 (每5分钟，可选)。
    

### 4.2 核心逻辑 (`src/services/sync.ts`)

TypeScript

```
export const sync = async () => {
  // 1. 获取 CheckPoint
  const cpRecord = await db.meta.get('checkPoint');
  const checkPoint = cpRecord?.value || 0;

  // 2. 收集脏数据 (Dirty Data)
  // 找出所有 syncStatus 不为 'synced' 的记录
  const dirtyTasks = await db.tasks
    .where('syncStatus').notEqual('synced')
    .toArray();

  // 如果没有脏数据且 checkPoint > 0 (非首次)，且不是强制同步，可以考虑跳过上传步骤
  
  // 3. 组装 Payload
  const payload = {
    checkPoint,
    changes: {
      tasks: {
        add: dirtyTasks.filter(t => t.syncStatus === 'created'),
        update: dirtyTasks.filter(t => t.syncStatus === 'updated'),
        delete: dirtyTasks.filter(t => t.syncStatus === 'deleted').map(t => t.id),
      }
    }
  };

  try {
    // 4. 发送请求
    const res = await axios.post('/api/v1/sync', payload);
    const { checkPoint: newCheckPoint, updates } = res.data;

    // 5. 原子写入 (Transaction)
    await db.transaction('rw', db.tasks, db.meta, async () => {
      
      // A. 处理服务端下发的更新 (Inbound)
      if (updates.tasks && updates.tasks.length > 0) {
        const tasksToPut = updates.tasks.map((remoteTask: any) => ({
           ...remoteTask,
           syncStatus: 'synced' // 标记为已同步
        }));
        await db.tasks.bulkPut(tasksToPut);
      }

      // B. 清除本地已上传数据的脏标记 (Ack)
      // 简单策略：将刚才上传的 dirtyTasks 的状态改为 synced
      // 注意：需排除在上传期间用户又修改了的数据 (对比 serverUpdateTime 或乐观锁)
      const uploadedIds = dirtyTasks.map(t => t.id);
      await db.tasks.where('id').anyOf(uploadedIds).modify({ syncStatus: 'synced' });

      // C. 更新 CheckPoint
      await db.meta.put({ key: 'checkPoint', value: newCheckPoint });
    });

  } catch (e) {
    console.error("Sync failed:", e);
    // 失败不做任何处理，保留 syncStatus，下次会自动重试
  }
};
```

---

## 5. UI 设计规范 (Google Material Design)

我们不引入庞大的 MUI 组件库，而是通过 **Tailwind CSS** 实现轻量级的 Material 风格。

### 5.1 色彩系统 (Tailwind Extend)

在 `tailwind.config.js` 中配置：

JavaScript

```
module.exports = {
  theme: {
    extend: {
      colors: {
        // Google Material 3 典型配色
        surface: '#f0f2f5',      // 浅灰底色
        'surface-variant': '#e1e3e6', 
        primary: '#c2e7ff',      // 激活态背景 (淡蓝)
        'on-primary': '#001d35', // 激活态文字 (深蓝)
        outline: '#747775',
        'on-surface': '#1f1f1f', // 主要文字
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
      }
    }
  }
}
```

### 5.2 组件样式规范

- **侧边栏导航项**:
    
    - 默认: `text-[#444746] hover:bg-surface-variant`
        
    - 选中: `bg-primary text-on-primary rounded-full` (Pill Shape)
        
- **主面板**:
    
    - `bg-white rounded-[28px] shadow-sm` (大圆角卡片)
        
- **FAB (新建按钮)**:
    
    - `rounded-2xl bg-primary text-on-primary hover:shadow-md transition-all`
        
- **图标**:
    
    - 使用 `<span class="material-symbols-rounded">icon_name</span>`
        

---

## 6. 业务逻辑实现 (Business Logic)

### 6.1 智能清单 (Smart Lists)

前端不请求 `/api/tasks/today`，而是使用 Hook 实时计算。

`src/hooks/useSmartList.ts`:

TypeScript

```
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { db } from '../db';

export function useTodayTasks() {
  return useLiveQuery(async () => {
    const start = dayjs().startOf('day').valueOf();
    const end = dayjs().endOf('day').valueOf();

    return await db.tasks
      .where('isDeleted').equals(0)
      .and(t => {
         // 必须过滤掉已删除，且 syncStatus 不是 'deleted'
         if (t.syncStatus === 'deleted') return false;
         // 逻辑：有 DueDate 且在今天范围内
         return !!t.dueDate && t.dueDate >= start && t.dueDate <= end;
      })
      .sortBy('sortOrder');
  });
}
```

### 6.2 任务排序 (Sort Order)

当用户拖拽排序时：

1. 获取 `prevTask.sortOrder` 和 `nextTask.sortOrder`。
    
2. 计算 `newSortOrder = (prev + next) / 2`。
    
3. 更新本地：`db.tasks.update(taskId, { sortOrder: newSortOrder, syncStatus: 'updated' })`。
    

---

## 7. 目录结构 (Directory Structure)

Plaintext

```
/src
  /assets          # 静态资源
  /components      # UI 组件
    /layout        # Sidebar, MainLayout
    /task          # TaskItem, TaskDetail, TaskList
    /ui            # Button, Input, Modal (Atomic)
  /db              # Dexie 数据库定义
    index.ts
    schema.ts
  /hooks           # React Hooks
    useSmartList.ts
    useSync.ts
  /pages           # 路由页面
    InboxPage.tsx
    TodayPage.tsx
    ProjectPage.tsx
    LoginPage.tsx
  /services        # 业务逻辑
    api.ts         # Axios 实例
    auth.ts        # 登录注册
    sync.ts        # 同步引擎核心
  /store           # Zustand 状态
    useUIStore.ts  # (isSidebarOpen, selectedTaskId)
  /utils           # 工具函数
    id-generator.ts # UUID v4
  App.tsx
  main.tsx
```

---

## 8. 开发步骤指南 (Implementation Steps)

1. **项目初始化**:
    
    - `npm create vite@latest tickclone -- --template react-ts`
        
    - `npm install dexie dexie-react-hooks axios dayjs zustand uuid clsx tailwind-merge`
        
    - 配置 Tailwind 和 Google Fonts。
        
2. **数据库层搭建**:
    
    - 编写 `src/db/schema.ts` 和 `index.ts`。
        
    - 创建一个测试页面，验证 `db.tasks.add()` 是否能写入 IndexedDB。
        
3. **UI 框架搭建**:
    
    - 按照 Google Material 风格实现 `Sidebar` 和 `MainLayout`。
        
    - 实现响应式布局（移动端隐藏侧边栏）。
        
4. **业务开发**:
    
    - 实现任务列表渲染 (`useLiveQuery`)。
        
    - 实现“添加任务”功能（生成 UUID -> 写入 DB）。
        
    - 实现“打钩完成”功能。
        
5. **Auth & Sync 对接**:
    
    - 实现登录页，获取 JWT 存入 localStorage。
        
    - 编写 `Sync` 函数，联调后端接口。
        

---

文档结束

你可以使用这份文档作为前端开发的“红宝书”。如果有任何具体的组件代码需要实现，随时告诉我！