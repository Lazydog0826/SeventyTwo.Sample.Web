import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import { routeGuard } from "@/router/routeGuard";

const defaultRouter: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    meta: {},
    component: () => import("@/views/login.vue"),
  },
  {
    path: "/",
    name: "layout",
    meta: {},
    component: () => import("@/layout/index.vue"),
  },
];

const router = createRouter({
  routes: defaultRouter,
  history: createWebHistory(),
});

routeGuard(router);

export default router;
