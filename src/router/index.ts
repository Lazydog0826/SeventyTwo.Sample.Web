import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

const defaultRouter: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "login",
    meta: {},
    component: () => import("@/views/login.vue"),
  },
];

const router = createRouter({
  routes: defaultRouter,
  history: createWebHistory(),
});

export default router;
