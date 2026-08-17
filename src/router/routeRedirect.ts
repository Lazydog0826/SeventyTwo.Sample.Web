import type { Router } from "vue-router";
import type { DynamicRouteManager } from "@/router/dynamicRouteManager.ts";
import { isAuthIndependentRoute } from "@/router/dynamicRouteLoader.ts";

/** 注册路由跳转守卫，统一处理无权限、默认页面及未匹配路由。 */
export function routeRedirect(router: Router, dynamicRouteManager: DynamicRouteManager) {
  // 规范：守卫统一通过 next()/next(目标路径)/next(false) 控制导航结果，且返回值须为
  // next(...) 的返回值以保证语义一致；修改守卫时需保持异步动态路由注册、replace 语义
  // 和完整 URL 不变。
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
      // 规范：defaultPagePath 来源于后端"页面权限的 RoutePath"，必须是非根路径的具体页面路径。
      // 根路径 "/" 已被静态 layout 路由占用（动态注册侧 findDuplicate 会拒绝与静态路由重复的
      // routePath，整组注册失败后走上方 403 分支），因此正常数据不会进入 next("/")；
      // 但若后端因脏数据把 "/" 作为默认页返回，此处会形成无限重定向——后端写入页面权限时
      // 必须校验 RoutePath 不得为 "/" 及其他静态路由路径。
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
