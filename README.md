# SeventyTwo Sample Web

基于 Vue 3、TypeScript 和 Vite 构建的后台管理示例前端，配套 SeventyTwo Sample 后端使用。

演示地址：<https://sample.web.dot-net.dev/>

## 功能

- 用户登录、退出及登录后重定向
- 访问令牌自动携带、刷新令牌续期和失效跳转
- 基于后端权限数据生成动态菜单和动态路由
- 目录、页面和按钮权限管理
- 机构、商品分类（树形）管理
- 数据字典及字典项管理
- 商品管理（列表页与编辑隐藏页）
- 用户增删改、启停、授权及默认页面配置
- 根据按钮权限控制业务操作入口
- 多标签页导航：右键菜单支持重新加载、关闭、关闭左侧/右侧/其他/全部
- 页签级 keep-alive 页面缓存与数据变更后的过期刷新
- 表格列设置：列显隐、拖拽排序，按页面持久化到 localStorage
- 顶栏通知面板（未读徽标、全部已读）
- 全屏切换
- 中英文切换
- 明暗主题切换
- 路由驱动的文档标题更新
- 示例数据仪表盘
- 全局请求错误提示和路由加载进度条

## 技术栈

- Vue 3、TypeScript、Vite
- Vue Router、Pinia、Vue I18n
- Naive UI、Lucide Icons
- ECharts、Vue ECharts
- VueUse、Ky、BProgress

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

前端请求会携带 Cookie。登录接口返回的访问令牌仅保存在页面内存中；接口返回 `401` 时，前端会通过刷新令牌 Cookie 尝试续期并重放原请求，续期失败后跳转到登录页。

业务菜单、页面路由和按钮操作均由后端权限数据决定。用户访问根路径 `/` 时会进入其配置的默认页面；未配置默认页面、没有菜单权限或访问不存在的动态路由时，会分别进入对应提示页。

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
npm run preview -- --port 5173
```

规范：预览端口需与后端 `CorsConfiguration:Origins` 一致；示例后端配置默认允许 `http://localhost:5173`。

## 目录结构

```text
src/
├─ api/          后端接口定义
├─ assets/       图片和图标资源
├─ components/   通用组件（列设置、通知面板、权限控制等）
├─ composables/  组合式函数（列设置、页签激活刷新等）
├─ constants/    权限码等常量
├─ layout/       后台布局组件（侧边菜单、多标签页内容区等）
├─ locales/      中英文语言资源
├─ router/       路由、路由守卫与动态视图
├─ stores/       Pinia 状态管理（用户、权限、页签等）
├─ utils/        HTTP 请求封装
└─ views/        页面组件
```

## 许可协议

本项目采用 [MIT License](LICENSE)。
