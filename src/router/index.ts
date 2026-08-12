import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { routeGuard } from "@/router/routeGuard";
import { documentTitleGuard } from "@/router/documentTitleGuard";

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
];

const router = createRouter({
  routes: defaultRouter,
  history: createWebHistory(),
});

routeGuard(router);
documentTitleGuard(router);

export default router;
