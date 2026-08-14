import type { RouteRecordNameGeneric, Router } from "vue-router";
import type { DynamicRouteManager } from "@/router/dynamicRouteManager.ts";

const AuthIndependentRouteNames = new Set<RouteRecordNameGeneric>([
  "login",
  "403",
  "404",
  "defaultPageUnconfigured",
]);

/** 判断目标路由是否不依赖用户菜单及动态路由。 */
export function isAuthIndependentRoute(name: RouteRecordNameGeneric | null | undefined) {
  return name != null && AuthIndependentRouteNames.has(name);
}

/** 注册动态路由加载守卫，确保后续导航守卫使用完整路由表进行判断。 */
export function dynamicRouteLoader(router: Router, dynamicRouteManager: DynamicRouteManager) {
  router.beforeEach(async (to, _from, next) => {
    if (isAuthIndependentRoute(to.name) || dynamicRouteManager.routesRegistered) {
      return next();
    }

    await dynamicRouteManager.ensureRegistered();

    // 注册期间发生认证重置时，终止当前旧导航，交由登录页导航接管。
    if (!dynamicRouteManager.routesRegistered) {
      return next(false);
    }

    // 无菜单场景无需重新匹配，由后续导航守卫直接跳转到无权限页。
    if (!dynamicRouteManager.hasMenus) {
      return next();
    }

    // 动态路由注册后重新进入导航流程，使目标地址使用新的路由表完成匹配。
    return next({
      path: to.path,
      query: to.query,
      hash: to.hash,
      replace: true,
    });
  });
}
