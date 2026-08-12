import { viewModules } from "@/router/viewModules.ts";
import type { Router, RouteRecordRaw } from "vue-router";
import { usePermissionsStore } from "@/stores/permissions.ts";
import type { PermissionMenuOutput } from "@/api/permissions.ts";
import { BProgress } from "@bprogress/core";

BProgress.configure({
  showSpinner: false,
});

export function routeGuard(router: Router) {
  let routesRegistered = false;
  let registeringPromise: Promise<void> | null = null;

  router.beforeEach(async (to, _from, next) => {
    // 进度条组件
    BProgress.start();

    // 首次匹配不到时注册动态路由，并发导航共享同一个注册任务。
    if (to.matched.length === 0 && !routesRegistered) {
      if (!registeringPromise) {
        registeringPromise = (async () => {
          const permissionsStore = usePermissionsStore();
          const permissions = await permissionsStore.getPermissions();
          registerRoute(permissions.menus, router);
          routesRegistered = true;
        })().finally(() => {
          registeringPromise = null;
        });
      }

      await registeringPromise;

      // 重新进入守卫，使用注册后的路由表匹配目标地址。
      return next({
        path: to.fullPath,
        replace: true,
      });
    }

    // 动态路由已注册但仍匹配不到，直接跳转到 404 页面。
    if (to.matched.length === 0) {
      return next("/404");
    }

    return next();
  });

  router.afterEach(async (_to, _from, _next) => {
    // 进度条组件
    BProgress.done();
  });

  router.onError(() => {
    BProgress.done();
  });
}

function registerRoute(menus: Array<PermissionMenuOutput>, router: Router) {
  // 2 为页面类型，注册路由只考虑页面类型
  menus
    .filter(x => x.type === "Page")
    .forEach(x => {
      const newRoute: RouteRecordRaw = {
        path: x.routePath,
        name: x.routeName,
        meta: {
          ...x.metaData,
        },
        component: viewModules[x.vueComponentPath],
      };
      router.addRoute("layout", newRoute);
    });
}
