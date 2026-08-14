import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { routeRedirect } from "@/router/routeRedirect.ts";
import { documentTitleGuard } from "@/router/documentTitleGuard";
import { createDynamicRouteManager } from "@/router/dynamicRouteManager.ts";
import { dynamicRouteLoader } from "@/router/dynamicRouteLoader.ts";
import { routeProgress } from "@/router/routeProgress.ts";

const defaultRouter: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    meta: { titleKey: "common.login" },
    component: () => import("@/views/login.vue"),
  },
  {
    path: "/",
    name: "layout",
    meta: {},
    component: () => import("@/layout/index.vue"),
  },
  {
    path: "/404",
    name: "404",
    meta: { titleKey: "notFound.title" },
    component: () => import("@/views/404.vue"),
  },
  {
    path: "/403",
    name: "403",
    meta: { titleKey: "noPermission.title" },
    component: () => import("@/views/403.vue"),
  },
  {
    path: "/default-page-unconfigured",
    name: "defaultPageUnconfigured",
    meta: { titleKey: "defaultPageUnconfigured.title" },
    component: () => import("@/views/default-page-unconfigured.vue"),
  },
];

const router = createRouter({
  routes: defaultRouter,
  // 规范：HTML5 History 部署必须将非静态、非 API 路径回退到 index.html。
  // 当前 createWebHistory() 明确约定部署在站点根路径；若改为子路径部署，必须同时为 Router
  // 配置 import.meta.env.BASE_URL，并复核所有整页跳转生成的 href。
  history: createWebHistory(),
});

const dynamicRouteManager = createDynamicRouteManager(router);
routeProgress(router);
dynamicRouteLoader(router, dynamicRouteManager);
routeRedirect(router, dynamicRouteManager);
documentTitleGuard(router);

/** 清空运行时添加的路由，并恢复应用初始化时的静态路由。 */
export function resetRouter() {
  dynamicRouteManager.reset();
  router.clearRoutes();
  defaultRouter.forEach(route => router.addRoute(route));
}

export default router;
