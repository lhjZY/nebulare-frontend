# Nebula Frontend

Nebula 是一个离线优先的任务管理 Web 客户端
前端以 IndexedDB 作为单一数据源，提供乐观 UI 与增量同步能力，适配多端协作场景。

## 主要特性
- 离线优先：所有视图渲染基于本地 IndexedDB（Dexie）。
- 乐观更新：任务与项目的增删改立即生效，后台异步同步。
- 增量同步：与后端 `/api/v1/sync` 双向同步，支持断网恢复。
- 任务管理：智能清单、项目列表、任务详情、子任务与优先级。
- 认证流程：登录/注册/刷新 token，自动续期与失效处理。

## 技术栈
- React 19 + TypeScript
- Vite + Tailwind CSS v4
- Dexie (IndexedDB) + Zustand
- React Router + Axios
- Vitest + ESLint + Prettier

## 目录结构
- `src/db`：本地数据库 Schema、Dexie 初始化与数据映射
- `src/services`：同步、认证等业务服务
- `src/pages`：页面与业务视图（任务/项目等）
- `src/components`：通用 UI 组件与布局
- `src/utils`：网络层与工具函数

## 快速开始
```bash
pnpm install
pnpm dev
```

本地开发默认端口为 `5178`，并将 `/api/v1` 代理到 `http://localhost:3000`。

## 环境变量
- `VITE_API_BASE_URL`：后端 API 基础路径，默认 `/api/v1`

## 常用脚本
```bash
pnpm dev
pnpm build
pnpm preview
pnpm lint
pnpm lint:fix
pnpm format
pnpm test
```
