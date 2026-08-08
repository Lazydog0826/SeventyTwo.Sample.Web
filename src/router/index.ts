import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

const defaultRouter: RouteRecordRaw[] = [];

const router = createRouter({
  routes: defaultRouter,
  history: createWebHistory(),
});

export default router;
