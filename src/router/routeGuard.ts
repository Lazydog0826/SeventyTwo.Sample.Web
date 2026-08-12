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
  let hasMenus = false;
  let registeringPromise: Promise<void> | null = null;

  router.beforeEach(async (to, _from, next) => {
    // 进度条组件
    BProgress.start();

    // 静态页面不依赖菜单权限，避免无权限用户无法访问登录页和错误页。
    if (["login", "403", "404"].includes(String(to.name))) {
      return next();
    }

    // 首次访问业务页面时注册动态路由，并发导航共享同一个注册任务。
    if (!routesRegistered) {
      if (!registeringPromise) {
        registeringPromise = (async () => {
          const permissionsStore = usePermissionsStore();
          const permissions = await permissionsStore.getPermissions();
          registerRoute(permissions.menus, router);
          hasMenus = permissions.menus.length > 0;
          routesRegistered = true;
        })().finally(() => {
          registeringPromise = null;
        });
      }

      await registeringPromise;

      if (!hasMenus) {
        return next("/403");
      }

      // 重新进入守卫，使用注册后的路由表匹配目标地址。
      return next({
        path: to.fullPath,
        replace: true,
      });
    }

    // 用户没有任何菜单权限时，所有业务页面统一跳转无权限页。
    if (!hasMenus) {
      return next("/403");
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
          titleKey: x.code,
        },
        component: viewModules[x.vueComponentPath],
      };
      router.addRoute("layout", newRoute);
    });
}
