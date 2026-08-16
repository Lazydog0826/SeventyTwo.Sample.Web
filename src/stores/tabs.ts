import { defineStore } from "pinia";
import { ref } from "vue";
import type { RouteLocationNormalizedLoaded } from "vue-router";

/** 已打开页签的展示信息。 */
export interface TabItem {
  /** 路由名称；动态路由注册时已与页面组件名对齐，作为页签与缓存实例的统一标识。 */
  name: string;
  /** 页签点击时的跳转路径。 */
  path: string;
  /** 页面标题的 i18n 键（路由 meta.titleKey）。 */
  titleKey: string;
}

export const useTabsStore = defineStore("tabs", () => {
  const visitedTabs = ref<TabItem[]>([]);
  // 与 keep-alive 的 include 绑定；从中移除名称即销毁对应页面组件的缓存实例。
  const cachedNames = ref<string[]>([]);
  // 数据已过期待刷新的页签名；页面在别处修改数据后标记，目标页签从缓存恢复时消费标记并刷新。
  const staleNames = ref<string[]>([]);

  /** 导航到达业务页面后登记页签；已打开的页面不重复登记。 */
  function addTab(route: RouteLocationNormalizedLoaded) {
    // 仅 meta.isShow 为 true 的页面进页签并纳入 keep-alive 缓存：动态注册的菜单隐藏页
    // （如列表页跳转的编辑页）不进，静态路由（登录、错误页等）未配置 isShow 同样被过滤。
    if (typeof route.name !== "string" || !route.meta.isShow) {
      return;
    }

    if (!visitedTabs.value.some(tab => tab.name === route.name)) {
      visitedTabs.value.push({
        name: route.name,
        path: route.path,
        titleKey: typeof route.meta.titleKey === "string" ? route.meta.titleKey : route.name,
      });
    }
    if (!cachedNames.value.includes(route.name)) {
      cachedNames.value.push(route.name);
    }
  }

  /**
   * 关闭指定页签并销毁其页面缓存。
   * 仅当关闭的是当前激活页签时才需要跳转：优先右侧相邻页签，其次左侧；
   * 全部关闭时返回 "/"，由路由重定向守卫落到用户默认页。
   */
  function removeTab(name: string, closeCurrent: boolean): string | null {
    const index = visitedTabs.value.findIndex(tab => tab.name === name);
    if (index < 0) {
      return null;
    }

    visitedTabs.value.splice(index, 1);
    cachedNames.value = cachedNames.value.filter(cached => cached !== name);
    if (!closeCurrent) {
      return null;
    }

    const nextTab = visitedTabs.value[index] ?? visitedTabs.value[index - 1];
    return nextTab ? nextTab.path : "/";
  }

  /** 标记指定页签的数据已过期；下一次该页签从缓存恢复时由页面自行刷新。 */
  function markStale(name: string) {
    if (!staleNames.value.includes(name)) {
      staleNames.value.push(name);
    }
  }

  /** 消费过期标记：返回该页签是否需要刷新。标记只生效一次，无论页面是否实际刷新。 */
  function consumeStale(name: string) {
    if (!staleNames.value.includes(name)) {
      return false;
    }
    staleNames.value = staleNames.value.filter(stale => stale !== name);
    return true;
  }

  /** 清空全部页签与页面缓存；认证会话重置时调用，避免下一账号命中上一账号的缓存实例。 */
  function reset() {
    visitedTabs.value = [];
    cachedNames.value = [];
    staleNames.value = [];
  }

  return {
    visitedTabs,
    cachedNames,
    addTab,
    removeTab,
    markStale,
    consumeStale,
    reset,
  };
});
