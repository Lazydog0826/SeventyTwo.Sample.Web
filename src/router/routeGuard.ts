import { viewModules } from "@/router/viewModules.ts";
import type { Router, RouteRecordRaw } from "vue-router";
import { usePermissionsStore } from "@/stores/permissions.ts";
import type { PermissionMenuOutput } from "@/api/permissions.ts";
import { BProgress } from "@bprogress/core";
import { useUserStore } from "@/stores/users.ts";

BProgress.configure({
  showSpinner: false,
});

export function routeGuard(router: Router) {
  let routesRegistered = false;
  let hasMenus = false;
  let defaultPagePath: string | undefined;
  let registeringPromise: Promise<void> | null = null;

  // 规范：新增或修改守卫应直接返回导航结果，不再使用 Vue Router 5 已弃用的 next 回调；
  // 现有守卫迁移时需保持异步动态路由注册、replace 语义和完整 URL 不变。
  router.beforeEach(async (to, _from, next) => {
    // 进度条组件
    BProgress.start();

    // 静态页面不依赖菜单权限，避免无权限用户无法访问登录页和错误页。
    if (["login", "403", "404", "defaultPageUnconfigured"].includes(String(to.name))) {
      return next();
    }

    // 首次访问业务页面时注册动态路由，并发导航共享同一个注册任务。
    if (!routesRegistered) {
      if (!registeringPromise) {
        registeringPromise = (async () => {
          const permissionsStore = usePermissionsStore();
          const userStore = useUserStore();
          const [permissions, user] = await Promise.all([permissionsStore.getPermissions(), userStore.getInfo()]);
          registerRoute(permissions.menus, router);
          defaultPagePath = user.defaultPagePath || undefined;
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
        path: to.path,
        query: to.query,
        hash: to.hash,
        replace: true,
      });
    }

    // 用户没有任何菜单权限时，所有业务页面统一跳转无权限页。
    if (!hasMenus) {
      return next("/403");
    }

    if (to.path === "/") {
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

  router.afterEach(async (_to, _from, _next) => {
    // 进度条组件
    BProgress.done();
  });

  router.onError(() => {
    BProgress.done();
  });
}

function registerRoute(menus: Array<PermissionMenuOutput>, router: Router) {
  // 规范：页面权限的 vueComponentPath 必须精确对应 viewModules 的键；routeName 和 routePath
  // 必须在全部页面权限中分别唯一。后端写入时应校验这些约束，前端注册仅做防御性诊断。
  // 注册路由只考虑页面类型
  const pages = menus.filter(x => x.type === "Page").sort((a, b) => a.sortOrder - b.sortOrder);
  const registeredRoutes = router.getRoutes();
  const registeredRouteNames = registeredRoutes
    .map(x => x.name)
    .filter((name): name is string => typeof name === "string");
  const duplicateRouteName = findDuplicate([...registeredRouteNames, ...pages.map(x => x.routeName)]);
  const duplicateRoutePath = findDuplicate([...registeredRoutes.map(x => x.path), ...pages.map(x => x.routePath)]);
  if (duplicateRouteName || duplicateRoutePath) {
    throw new Error(
      `动态路由配置冲突，已拒绝整组注册：routeName=${duplicateRouteName ?? "无"}, routePath=${duplicateRoutePath ?? "无"}`
    );
  }

  pages.forEach(x => {
    const component = viewModules[x.vueComponentPath];
    if (!component) {
      console.error(
        `动态路由组件不存在，已跳过：routeName=${x.routeName}, routePath=${x.routePath}, vueComponentPath=${x.vueComponentPath}`
      );
      return;
    }

    const route: RouteRecordRaw = {
      path: x.routePath,
      name: x.routeName,
      meta: {
        ...x.metaData,
        titleKey: `menu.${x.code}`,
      },
      component,
    };
    router.addRoute("layout", route);
  });
}

function findDuplicate(values: Array<string>) {
  const seen = new Set<string>();
  return values.find(value => {
    if (seen.has(value)) return true;
    seen.add(value);
    return false;
  });
}
