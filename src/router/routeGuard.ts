import { viewModules } from "@/router/viewModules.ts";
import type { Router, RouteRecordRaw } from "vue-router";
import { usePermissionsStore } from "@/stores/permissions.ts";
import type { PermissionMenuOutput } from "@/api/permissions.ts";
import { BProgress } from "@bprogress/core";

BProgress.configure({
  showSpinner: false,
});

export function routeGuard(router: Router) {
  router.beforeEach(async (to, _from, next) => {
    // 进度条组件
    BProgress.start();

    // 匹配不到，动态添加路由
    if (to.matched.length === 0) {
      // 获取权限注册路由
      const permissionsStore = usePermissionsStore();
      const permissions = await permissionsStore.getPermissions();
      await registerRoute(permissions.menus, router);

      // 注册后仍匹配不到则跳转到 404 页面
      const resolved = router.resolve(to.fullPath);
      if (resolved.matched.length === 0) {
        return next("/404");
      }

      return next({
        path: to.fullPath,
        replace: true,
      });
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

async function registerRoute(menus: Array<PermissionMenuOutput>, router: Router) {
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
