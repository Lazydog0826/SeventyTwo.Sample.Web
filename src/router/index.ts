import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

const defaultRouter: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    meta: {},
    component: () => import("@/views/login.vue"),
  },
  {
    path: "/home",
    name: "hoe",
    meta: {},
    component: () => import("@/layout/index.vue"),
  },
];

const router = createRouter({
  routes: defaultRouter,
  history: createWebHistory(),
});

export default router;
