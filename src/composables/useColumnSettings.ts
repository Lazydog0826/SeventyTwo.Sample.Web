import { computed, type ComputedRef, type Ref } from "vue";
import { useStorage } from "@vueuse/core";

/** 列设置持久化结构：order 为全量列 key 的当前顺序，hidden 为隐藏列 key 集合。 */
interface ColumnSettingsState {
  order: string[];
  hidden: string[];
}

interface UseColumnSettingsOptions {
  /** localStorage key，按页面唯一（如 columnSettings.productsList）。 */
  storageKey: string;
  /** 默认全量列顺序，即页面列定义的自然顺序。 */
  defaultOrder: string[];
}

interface UseColumnSettingsReturn {
  orderedKeys: Ref<string[]>;
  hiddenKeys: Ref<string[]>;
  visibleKeys: ComputedRef<string[]>;
  /** 显示/隐藏切换；至少保留一列，最后一个可见列禁止隐藏。 */
  toggleColumn: (key: string) => void;
  /** 拖拽排序：将 from 位置的列移动到 to 位置（均基于 orderedKeys 索引）。 */
  moveColumn: (from: number, to: number) => void;
  /** 恢复默认顺序与全部显示。 */
  resetColumns: () => void;
}

/**
 * 通用表格列设置状态管理：顺序 + 显隐 + localStorage 持久化。
 *
 * 状态由页面持有并驱动 columns computed，ColumnSettings.vue 仅作展示与交互；
 * 初始化时对存储值做 sanitize（容忍 null/字段缺失等损坏结构，过滤未知 key、
 * 去重、补齐缺失的新列 key），避免列定义变更后遗留脏数据导致列丢失或渲染异常。
 */
export function useColumnSettings(options: UseColumnSettingsOptions): UseColumnSettingsReturn {
  const { storageKey, defaultOrder } = options;

  const stored = useStorage<ColumnSettingsState>(storageKey, { order: [...defaultOrder], hidden: [] });

  // 初始读取的存储值可能为旧版本结构或损坏数据，清理后写回再进入后续流程。
  if (!isSanitized(stored.value, defaultOrder)) {
    stored.value = sanitize(stored.value, defaultOrder);
  }

  const orderedKeys = computed(() => stored.value.order);
  const hiddenKeys = computed(() => stored.value.hidden.filter(key => orderedKeys.value.includes(key)));
  const visibleKeys = computed(() => orderedKeys.value.filter(key => !hiddenKeys.value.includes(key)));

  function toggleColumn(key: string) {
    const hidden = stored.value.hidden;
    if (hidden.includes(key)) {
      stored.value.hidden = hidden.filter(item => item !== key);
      return;
    }
    // 至少保留一列：仅剩一个可见列时禁止隐藏。
    if (visibleKeys.value.length <= 1) return;
    stored.value.hidden = [...hidden, key];
  }

  function moveColumn(from: number, to: number) {
    const order = [...stored.value.order];
    if (from === to || from < 0 || to < 0 || from >= order.length || to >= order.length) return;
    const [moved] = order.splice(from, 1);
    order.splice(to, 0, moved);
    stored.value.order = order;
  }

  function resetColumns() {
    stored.value = { order: [...defaultOrder], hidden: [] };
  }

  return { orderedKeys, hiddenKeys, visibleKeys, toggleColumn, moveColumn, resetColumns };
}

/** 校验 state 是否已是干净结构：字段均为数组、无未知/重复 key、无缺失 key、hidden 均合法。 */
function isSanitized(state: unknown, defaultOrder: string[]): state is ColumnSettingsState {
  if (typeof state !== "object" || state === null) return false;
  const { order, hidden } = state as Partial<ColumnSettingsState>;
  if (!Array.isArray(order) || !Array.isArray(hidden)) return false;
  const uniqueOrder = new Set(order);
  return (
    uniqueOrder.size === order.length &&
    uniqueOrder.size === defaultOrder.length &&
    defaultOrder.every(key => uniqueOrder.has(key)) &&
    hidden.every(key => defaultOrder.includes(key))
  );
}

/** 清理存储值：容忍任意损坏输入，过滤未知 key 与重复项，defaultOrder 中缺失的新列 key 追加到末尾。 */
function sanitize(state: unknown, defaultOrder: string[]): ColumnSettingsState {
  const raw = typeof state === "object" && state !== null ? (state as Partial<ColumnSettingsState>) : {};
  const validOrder = Array.isArray(raw.order) ? raw.order.filter(key => defaultOrder.includes(key)) : [];
  const order = [...new Set(validOrder)];
  for (const key of defaultOrder) {
    if (!order.includes(key)) order.push(key);
  }
  const hidden = Array.isArray(raw.hidden) ? [...new Set(raw.hidden.filter(key => order.includes(key)))] : [];
  return { order, hidden };
}
