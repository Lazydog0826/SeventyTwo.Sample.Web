<template>
  <n-layout-content class="layout-body">
    <div class="layout-tabs">
      <n-tabs :value="activeName" closable size="small" type="card" @close="handleClose" @update:value="handleSelect">
        <n-tab
          v-for="tab in tabsStore.visitedTabs"
          :key="tab.name"
          :name="tab.name"
          :tab="tabTitle(tab)"
          @contextmenu.prevent="openContextMenu($event, tab)"
        ></n-tab>
      </n-tabs>
      <n-dropdown
        placement="bottom-start"
        trigger="manual"
        :options="contextMenuOptions"
        :show="contextMenu.show"
        :x="contextMenu.x"
        :y="contextMenu.y"
        @clickoutside="contextMenu.show = false"
        @select="handleContextMenuSelect"
      ></n-dropdown>
    </div>

    <div class="layout-router-view">
      <router-view v-slot="{ Component, route }">
        <transition mode="out-in" name="content-route">
          <keep-alive :include="tabsStore.cachedNames">
            <component :is="Component" :key="viewKey(route)" />
          </keep-alive>
        </transition>
      </router-view>
    </div>
  </n-layout-content>
</template>

<script lang="ts" setup>
import { ArrowLeftToLine, ArrowRightToLine, ListX, RotateCw, SquareX, X } from "@lucide/vue";
import { NDropdown, NLayoutContent, NTab, NTabs, type DropdownOption } from "naive-ui";
import { computed, h, nextTick, reactive, ref, type Component, type VNode } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter, type RouteLocationNormalizedLoaded } from "vue-router";
import { type TabItem, useTabsStore } from "@/stores/tabs.ts";

const route = useRoute();
const router = useRouter();
const { t, te } = useI18n();
const tabsStore = useTabsStore();

const activeName = computed(() => (typeof route.name === "string" ? route.name : ""));

// 标题键缺失翻译时显示键本身，便于发现未配置的菜单文案。
function tabTitle(tab: TabItem): string {
  return te(tab.titleKey) ? t(tab.titleKey) : tab.titleKey;
}

function handleSelect(name: string) {
  const tab = tabsStore.visitedTabs.find(item => item.name === name);
  if (tab) {
    void router.push(tab.path);
  }
}

function handleClose(name: string) {
  const nextPath = tabsStore.removeTab(name, name === activeName.value);
  if (nextPath) {
    void router.push(nextPath);
  }
}

// 各页签的重载序号，拼进 keep-alive 子节点的渲染 key：序号递增即销毁旧实例、创建新实例。
const reloadCounts = ref<Record<string, number>>({});

// 渲染 key 在路由匹配 key 基础上拼接当前页签的重载序号，保证重载后切走再切回仍命中新实例的缓存。
function viewKey(target: RouteLocationNormalizedLoaded): string {
  const routeKey = target.matched[target.matched.length - 1]?.path ?? target.path;
  const count = typeof target.name === "string" ? (reloadCounts.value[target.name] ?? 0) : 0;
  return `${routeKey}#${count}`;
}

// 重新加载：store 负责销毁缓存实例并恢复缓存资格；当前激活页签仍挂载在视图中，
// 需递增重载序号更换渲染 key，才会立即重建组件并重新加载数据。
async function handleReload(name: string) {
  await tabsStore.reloadTab(name);
  if (name === activeName.value) {
    reloadCounts.value = { ...reloadCounts.value, [name]: (reloadCounts.value[name] ?? 0) + 1 };
  }
}

// 右键菜单状态：dropdown 为手动定位模式，由 contextmenu 事件驱动显示位置。
const contextMenu = reactive({ show: false, x: 0, y: 0, name: "" });
const contextTabIndex = computed(() => tabsStore.visitedTabs.findIndex(tab => tab.name === contextMenu.name));

// 图标尺寸与描边粗细沿用全局 16 / 1.5 约定，与侧边栏、头部图标保持一致。
function menuIcon(icon: Component): (() => VNode) | undefined {
  return () => h(icon, { size: 16, strokeWidth: 1.5 });
}

const contextMenuOptions = computed<DropdownOption[]>(() => [
  { key: "reload", label: t("tabs.reload"), icon: menuIcon(RotateCw) },
  { key: "close", label: t("tabs.close"), icon: menuIcon(X) },
  // 分割线区分“针对单个页签”与“针对一组页签”的操作。
  { key: "close-divider", type: "divider" },
  // 左/右侧无页签或仅剩自身时对应操作无意义，置灰避免误触。
  { key: "closeLeft", label: t("tabs.closeLeft"), disabled: contextTabIndex.value <= 0, icon: menuIcon(ArrowLeftToLine) },
  { key: "closeRight", label: t("tabs.closeRight"), disabled: contextTabIndex.value >= tabsStore.visitedTabs.length - 1, icon: menuIcon(ArrowRightToLine) },
  // 分割线区分“按方位关闭”与“剩余的整批关闭”操作。
  { key: "close-divider-2", type: "divider" },
  { key: "closeOthers", label: t("tabs.closeOthers"), disabled: tabsStore.visitedTabs.length <= 1, icon: menuIcon(ListX) },
  { key: "closeAll", label: t("tabs.closeAll"), icon: menuIcon(SquareX) },
]);

function openContextMenu(event: MouseEvent, tab: TabItem) {
  // 先复位再在下一帧重新打开：连续右键且位置不变时 dropdown 不会重新定位。
  contextMenu.show = false;
  void nextTick(() => {
    contextMenu.x = event.clientX;
    contextMenu.y = event.clientY;
    contextMenu.name = tab.name;
    contextMenu.show = true;
  });
}

// 批量关闭统一入口：仅当当前激活页签也在关闭范围内时才需要跳转。
function closeTabs(names: string[]) {
  const nextPath = tabsStore.removeTabs(names, activeName.value);
  if (nextPath) {
    void router.push(nextPath);
  }
}

async function handleContextMenuSelect(key: string | number) {
  contextMenu.show = false;
  const name = contextMenu.name;
  const index = tabsStore.visitedTabs.findIndex(tab => tab.name === name);
  if (index < 0) {
    return;
  }

  switch (key) {
    case "reload":
      await handleReload(name);
      break;
    case "close":
      handleClose(name);
      break;
    case "closeLeft":
      closeTabs(tabsStore.visitedTabs.slice(0, index).map(tab => tab.name));
      break;
    case "closeRight":
      closeTabs(tabsStore.visitedTabs.slice(index + 1).map(tab => tab.name));
      break;
    case "closeOthers":
      closeTabs(tabsStore.visitedTabs.filter(tab => tab.name !== name).map(tab => tab.name));
      break;
    case "closeAll":
      closeTabs(tabsStore.visitedTabs.map(tab => tab.name));
      break;
  }
}
</script>

<style lang="scss" scoped>
.layout-body {
  background-color: var(--color-bg-page);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  > :deep(.n-layout-scroll-container) {
    flex: 1 1 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .layout-tabs {
    flex: 0 0 auto;
    // 标签栏使用容器底色，与页面灰底区分，深浅主题由语义变量自动适配。
    background-color: var(--color-bg-container);
    // 负边距抵消 n-tabs 卡片的边框，避免标签栏与外层边缘出现缝隙。
    margin-left: -1px;
    margin-top: -1px;

    // 标签卡片去圆角；未选中用容器底色、选中用页面底色与内容区衔接，深浅主题由语义变量自动适配。
    :deep(.n-tabs-tab) {
      border-radius: 0 !important;
      background-color: var(--color-bg-container) !important;
    }

    :deep(.n-tabs-tab):nth-of-type(n + 2) {
      margin-left: -1px !important;
    }

    :deep(.n-tabs-tab--active) {
      background-color: var(--color-bg-page) !important;
      border-bottom: none !important;
    }

    :deep(.n-tabs-tab-pad) {
      display: none;
    }
  }

  .layout-router-view {
    box-sizing: border-box;
    flex: 1 1 0;
    min-height: 0;
    padding: 18px;
    overflow: auto;
    display: flex;
    flex-direction: column;
  }
}

:global(.content-route-enter-active) {
  transition: opacity 180ms ease;
}

:global(.content-route-leave-active) {
  transition: opacity 120ms ease;
}

:global(.content-route-enter-from),
:global(.content-route-leave-to) {
  opacity: 0;
}
</style>
