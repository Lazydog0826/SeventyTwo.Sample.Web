import type { Component, ComponentOptions } from "vue";
import type { Router, RouteRecordRaw } from "vue-router";
import type { PermissionMenuOutput } from "@/api/permissions.ts";
import { viewModules } from "@/router/viewModules.ts";
import { usePermissionsStore } from "@/stores/permissions.ts";
import { useUserStore } from "@/stores/users.ts";

/** 动态路由的注册状态及生命周期操作。 */
export interface DynamicRouteManager {
  readonly routesRegistered: boolean;
  readonly hasMenus: boolean;
  readonly defaultPagePath: string | undefined;
  ensureRegistered: () => Promise<void>;
  reset: () => void;
}

/** 创建与指定 Router 绑定的动态路由管理器。 */
export function createDynamicRouteManager(router: Router): DynamicRouteManager {
  let routesRegistered = false;
  let hasMenus = false;
  let defaultPagePath: string | undefined;
  let registeringPromise: Promise<void> | null = null;
  // 重置后使尚未完成的注册任务失效，避免旧账号路由重新写入路由表。
  let stateVersion = 0;

  const ensureRegistered = async () => {
    if (routesRegistered) {
      return;
    }

    if (!registeringPromise) {
      const requestVersion = stateVersion;
      registeringPromise = (async () => {
        const permissionsStore = usePermissionsStore();
        const userStore = useUserStore();
        const [permissions, user] = await Promise.all([permissionsStore.getPermissions(), userStore.getInfo()]);
        if (requestVersion !== stateVersion) {
          return;
        }

        registerRoutes(permissions.menus, router);
        defaultPagePath = user.defaultPagePath || undefined;
        hasMenus = permissions.menus.length > 0;
        routesRegistered = true;
      })();
    }

    const currentPromise = registeringPromise;
    try {
      await currentPromise;
    } finally {
      if (registeringPromise === currentPromise) {
        registeringPromise = null;
      }
    }
  };

  const reset = () => {
    stateVersion++;
    routesRegistered = false;
    hasMenus = false;
    defaultPagePath = undefined;
    registeringPromise = null;
  };

  return {
    get routesRegistered() {
      return routesRegistered;
    },
    get hasMenus() {
      return hasMenus;
    },
    get defaultPagePath() {
      return defaultPagePath;
    },
    ensureRegistered,
    reset,
  };
}

function registerRoutes(menus: Array<PermissionMenuOutput>, router: Router) {
  // 规范：页面权限的 vueComponentPath 必须精确对应 viewModules 的键；routeName 和 routePath
  // 必须在全部页面权限中分别唯一。后端写入时应校验这些约束，前端注册仅做防御性诊断。
  // 注册路由只考虑页面类型。
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
    const loader = viewModules[x.vueComponentPath];
    if (!loader) {
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
      // 组件名对齐 routeName：viewModules 的文件名高度重名（list/edit 等），
      // 无法作为组件级缓存标识；页签缓存（keep-alive include）依赖路由名匹配组件。
      component: () => loader().then(component => withRouteName(component, x.routeName)),
    };
    router.addRoute("layout", route);
  });
}

/** 将视图组件的名称改写为路由名称；同一 loader 仅解析一次，改写是幂等的。 */
function withRouteName(component: Component, routeName: string): Component {
  (component as ComponentOptions).name = routeName;
  return component;
}

function findDuplicate(values: Array<string>) {
  const seen = new Set<string>();
  return values.find(value => {
    if (seen.has(value)) return true;
    seen.add(value);
    return false;
  });
}
