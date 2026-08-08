import { viewModules } from "@/router/viewModules.ts";
import type { Router, RouteRecordRaw } from "vue-router";
import { usePermissionsStore } from "@/stores/permissions.ts";
import type { PermissionMenuOutput } from "@/api/permissions.ts";

export function routeGuard(router: Router) {
  console.log(viewModules);
  router.beforeEach(async (to, from, next) => {
    // 匹配不到，动态添加路由
    if (to.matched.length === 0) {
      const permissionsStore = usePermissionsStore();
      const permissions = await permissionsStore.getPermissions();
      await registerRoute(permissions.menus, router);
      next({
        path: to.fullPath,
        replace: true,
      });
    }
    console.log(123);
    next();

    console.log("routeGuard", to, from, next);
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
