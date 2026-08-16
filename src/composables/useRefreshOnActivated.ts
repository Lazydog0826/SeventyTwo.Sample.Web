import { onActivated } from "vue";
import { useRoute } from "vue-router";
import { useTabsStore } from "@/stores/tabs.ts";

/**
 * 注册页签缓存恢复时的按需刷新。
 *
 * 仅当页签被标记为数据过期（如编辑页保存成功后标记列表页）时，组件从
 * keep-alive 缓存恢复才执行 refresh；普通页签切换直接复用缓存，不重复请求。
 *
 * 首次挂载后 activated 会紧随 mounted 触发，此时数据已由 onMounted 加载，
 * 跳过刷新，但仍消费过期标记，避免标记残留到之后的页签切换引发多余刷新。
 */
export function useRefreshOnActivated(refresh: () => void): void {
  const route = useRoute();
  const tabsStore = useTabsStore();
  let firstActivation = true;
  onActivated(() => {
    const stale = typeof route.name === "string" && tabsStore.consumeStale(route.name);
    if (firstActivation) {
      firstActivation = false;
      return;
    }
    if (stale) {
      refresh();
    }
  });
}
