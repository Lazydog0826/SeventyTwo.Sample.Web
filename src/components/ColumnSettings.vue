<template>
  <n-popover placement="bottom-end" trigger="click">
    <template #trigger>
      <!-- 触发器由页面提供（通常为工具栏设置按钮），保持组件通用。 -->
      <slot name="trigger"></slot>
    </template>
    <div class="column-settings">
      <div class="column-settings__header">
        <span class="column-settings__title">{{ t("common.columnSettings.title") }}</span>
        <n-button quaternary size="tiny" type="primary" @click="emit('reset')">
          {{ t("common.columnSettings.reset") }}
        </n-button>
      </div>
      <ul class="column-settings__list">
        <!-- 整行可拖（draggable 由 onDragStart 动态控制：仅手柄按下时启用，避免勾选操作与拖拽冲突） -->
        <li
          v-for="(item, index) in orderedItems"
          :key="item.key"
          :class="{
            'column-settings__item--dragging': dragIndex === index,
            'column-settings__item--before': dropIndex === index,
            'column-settings__item--after': dropIndex === index + 1 && index === orderedItems.length - 1,
          }"
          :draggable="handleIndex === index"
          @dragstart="onDragStart($event, index)"
          @dragover="onDragOver($event, index)"
          @drop="onDrop"
          @dragend="onDragEnd"
        >
          <n-icon
            class="column-settings__handle"
            @mousedown="handleIndex = index"
            @mouseup="handleIndex = null"
            @mouseleave="handleIndex = null"
          >
            <GripVertical :size="14" :stroke-width="1.5"></GripVertical>
          </n-icon>
          <n-checkbox
            :checked="!hiddenKeys.includes(item.key)"
            :disabled="lastVisibleKey === item.key"
            @update:checked="emit('toggle', item.key)"
          >
            {{ item.title }}
          </n-checkbox>
        </li>
      </ul>
    </div>
  </n-popover>
</template>

<script lang="ts" setup>
import { computed, ref } from "vue";
import { NButton, NCheckbox, NIcon, NPopover, useThemeVars } from "naive-ui";
import { GripVertical } from "@lucide/vue";
import { useI18n } from "vue-i18n";

/** 可配置列的展示元信息，title 为已本地化文案（由页面 computed 提供，语言切换自动响应）。 */
interface ColumnSettingItem {
  key: string;
  title: string;
}

const props = defineProps<{
  /** 全部可配置列（默认顺序），用于按 key 解析标题。 */
  items: ColumnSettingItem[];
  /** 全量列 key 的当前顺序（由 useColumnSettings 提供）。 */
  orderedKeys: string[];
  /** 隐藏列 key 集合（由 useColumnSettings 提供）。 */
  hiddenKeys: string[];
}>();

const emit = defineEmits<{
  /** 切换某列显示/隐藏（至少保留一列的保护由 useColumnSettings 处理）。 */
  toggle: [key: string];
  /** 拖拽排序：将 from 位置的列移动到 to 位置。 */
  move: [from: number, to: number];
  /** 恢复默认顺序与全部显示。 */
  reset: [];
}>();

const { t } = useI18n();
const themeVars = useThemeVars();
// hover 背景与插入指示线颜色跟随明暗主题（popover 弹层内无 naive-ui 局部 CSS 变量可用，故经 v-bind 注入）。
// noinspection JSUnusedGlobalSymbols
const hoverColor = computed(() => themeVars.value.hoverColor);
// noinspection JSUnusedGlobalSymbols
const indicatorColor = computed(() => themeVars.value.primaryColor);

// 按当前顺序解析展示项；orderedKeys 中理论上不会出现未知 key（useColumnSettings 已清理），filter 兜底。
const orderedItems = computed(() =>
  props.orderedKeys.map(key => props.items.find(item => item.key === key)).filter(item => item !== undefined)
);

// 仅剩一个可见列时禁用其勾选，体现"至少保留一列"约束。
const lastVisibleKey = computed(() => {
  const visible = props.orderedKeys.filter(key => !props.hiddenKeys.includes(key));
  return visible.length === 1 ? visible[0] : null;
});

// 拖拽状态：dragIndex 为被拖拽项索引，dropIndex 为插入点（在 dropIndex 位置插入被拖拽项）。
const dragIndex = ref<number | null>(null);
const dropIndex = ref<number | null>(null);
// 仅当手柄按下时才允许整行拖拽，避免勾选操作被 draggable 干扰。
const handleIndex = ref<number | null>(null);

function onDragStart(event: DragEvent, index: number) {
  dragIndex.value = index;
  // setData 是部分浏览器（如 Firefox）触发 dragover/drop 的前置条件。
  event.dataTransfer?.setData("text/plain", String(index));
  if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
}

function onDragOver(event: DragEvent, index: number) {
  event.preventDefault();
  // offsetY 相对事件目标（可能是子元素）而非整行，改用行矩形与 clientY 判断插入点在上半/下半。
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  dropIndex.value = event.clientY < rect.top + rect.height / 2 ? index : index + 1;
}

function onDrop(event: DragEvent) {
  event.preventDefault();
  if (dragIndex.value === null || dropIndex.value === null) return;
  const from = dragIndex.value;
  const insertAt = dropIndex.value;
  // moveColumn 语义是"先移除 from 再插入 to"：插入点在被拖项之后时需回退一位。
  const to = from < insertAt ? insertAt - 1 : insertAt;
  if (to !== from) emit("move", from, to);
  onDragEnd();
}

function onDragEnd() {
  dragIndex.value = null;
  dropIndex.value = null;
  handleIndex.value = null;
}
</script>

<style lang="scss" scoped>
.column-settings {
  min-width: 200px;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 4px;
  }

  &__title {
    font-weight: 500;
  }

  &__list {
    display: flex;
    flex-direction: column;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 6px;
    border-radius: 3px;
    position: relative;

    &:hover {
      background-color: v-bind("hoverColor");
    }

    // 拖拽中的项半透明；插入指示线颜色经 v-bind 绑定主题色（明暗主题自适应）。
    &--dragging {
      opacity: 0.4;
    }

    &--before::before,
    &--after::after {
      content: "";
      position: absolute;
      left: 4px;
      right: 4px;
      height: 2px;
      border-radius: 1px;
      background-color: v-bind("indicatorColor");
    }

    &--before::before {
      top: -1px;
    }

    &--after::after {
      bottom: -1px;
    }
  }

  &__handle {
    cursor: grab;
    flex: 0 0 auto;
    opacity: 0.5;

    &:active {
      cursor: grabbing;
    }
  }
}
</style>
