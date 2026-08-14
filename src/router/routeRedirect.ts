import type { Router } from "vue-router";
import type { DynamicRouteManager } from "@/router/dynamicRouteManager.ts";
import { isAuthIndependentRoute } from "@/router/dynamicRouteLoader.ts";

/** 注册路由跳转守卫，统一处理无权限、默认页面及未匹配路由。 */
export function routeRedirect(router: Router, dynamicRouteManager: DynamicRouteManager) {
  // 规范：新增或修改守卫应直接返回导航结果，不再使用 Vue Router 5 已弃用的 next 回调；
  // 现有守卫迁移时需保持异步动态路由注册、replace 语义和完整 URL 不变。
  router.beforeEach(async (to, _from, next) => {
    // 静态页面不依赖菜单权限，避免无权限用户无法访问登录页和错误页。
    if (isAuthIndependentRoute(to.name)) {
      return next();
    }

    // 用户没有任何菜单权限时，所有业务页面统一跳转无权限页。
    if (!dynamicRouteManager.hasMenus) {
      return next("/403");
    }

    if (to.path === "/") {
      const defaultPagePath = dynamicRouteManager.defaultPagePath;
      const defaultRoute = defaultPagePath ? router.resolve(defaultPagePath) : null;
      if (defaultPagePath && defaultRoute?.matched.length) {
        return next(defaultPagePath);
      }
      return next("/default-page-unconfigured");
    }

    // 动态路由已注册但仍匹配不到，直接跳转到 404 页面。
    if (to.matched.length === 0) {
      return next("/404");
    }

    return next();
  });
}
