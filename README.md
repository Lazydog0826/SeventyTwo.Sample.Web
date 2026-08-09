# SeventyTwo Sample Web

基于 Vue 3、TypeScript 和 Vite 构建的后台管理示例前端。

## 功能

- 用户登录及登录后重定向
- 访问令牌自动携带与刷新令牌续期
- 基于后端权限数据的动态菜单和动态路由
- 页面权限与按钮权限数据管理
- 中英文切换
- 明暗主题切换
- 数据仪表盘
- 全局请求错误提示和路由加载进度条

## 技术栈

- Vue 3 与 TypeScript
- Vite
- Vue Router
- Pinia
- Vue I18n
- Naive UI
- ECharts 与 Vue ECharts
- Ky
- BProgress

## 环境要求

- Node.js `^20.19.0` 或 `>=22.12.0`
- npm
- 可用的配套后端服务

## 安装

```bash
npm ci
```

## 配置

项目通过 `VITE_API_BASE_URL` 指定后端服务地址。默认配置位于 `.env`：

```dotenv
VITE_API_BASE_URL=http://localhost:5272
```

后端需要提供用户登录、用户信息、令牌刷新、退出登录和权限查询接口。前端请求会携带 Cookie，并在访问令牌失效时尝试自动刷新。

## 开发

```bash
npm run dev
```

## 构建

```bash
npm run build
```

构建产物输出到 `dist` 目录。

## 预览构建结果

```bash
npm run preview
```

## 目录结构

```text
src/
├─ api/          后端接口定义
├─ assets/       图片和图标资源
├─ layout/       后台布局组件
├─ locales/      中英文语言资源
├─ router/       路由、路由守卫与动态视图
├─ stores/       Pinia 状态管理
├─ utils/        HTTP 请求封装
└─ views/        页面组件
```

## 许可协议

本项目采用 [MIT License](LICENSE)。
