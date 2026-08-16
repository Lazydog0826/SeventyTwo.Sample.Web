import { defineStore } from "pinia";
import { nextTick, ref } from "vue";
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

  /**
   * 批量关闭页签并销毁其页面缓存（右键菜单的关闭左侧/右侧/其他/全部）。
   * 跳转策略与 removeTab 一致：仅当当前激活页签也在关闭范围内时才返回跳转
   * 路径，优先原位置右侧第一个存活页签，其次左侧最后一个；全部关闭时返回
   * "/"，由路由重定向守卫落到用户默认页。
   */
  function removeTabs(names: string[], currentName: string): string | null {
    const closing = new Set(names);
    // 附带原索引后再过滤：移除前先定位跳转目标，避免原位置信息丢失。
    const remainTabs = visitedTabs.value
      .map((tab, index) => ({ tab, index }))
      .filter(({ tab }) => !closing.has(tab.name));
    const currentIndex = visitedTabs.value.findIndex(tab => tab.name === currentName);

    visitedTabs.value = remainTabs.map(({ tab }) => tab);
    cachedNames.value = cachedNames.value.filter(name => !closing.has(name));

    if (currentIndex < 0 || !closing.has(currentName)) {
      return null;
    }
    const nextTab = remainTabs.find(({ index }) => index > currentIndex)?.tab ?? remainTabs[remainTabs.length - 1]?.tab;
    return nextTab?.path ?? "/";
  }

  /**
   * 重新加载指定页签：先将其移出缓存列表销毁 keep-alive 实例，待销毁生效后
   * 再恢复缓存资格，页面下次挂载时即创建新实例并重新加载数据。
   * 移除与恢复必须间隔一个渲染周期：同步改回时 include 监听只能看到最终值，缓存不会被销毁。
   * 当前激活页签仍挂载在视图中，需由调用方（content.vue）额外更换渲染 key 促成立即重建。
   */
  async function reloadTab(name: string): Promise<void> {
    if (!cachedNames.value.includes(name)) {
      return;
    }
    // 重建实例时页面会完整加载数据，提前消费过期标记，避免残留到之后的缓存恢复引发多余刷新。
    consumeStale(name);
    cachedNames.value = cachedNames.value.filter(cached => cached !== name);
    await nextTick();
    cachedNames.value.push(name);
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
    removeTabs,
    reloadTab,
    markStale,
    consumeStale,
    reset,
  };
});
