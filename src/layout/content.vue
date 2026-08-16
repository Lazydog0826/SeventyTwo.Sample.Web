<template>
  <n-layout-content class="layout-body">
    <div class="layout-tabs">
      <n-tabs :value="activeName" closable size="small" type="card" @close="handleClose" @update:value="handleSelect">
        <n-tab v-for="tab in tabsStore.visitedTabs" :key="tab.name" :name="tab.name" :tab="tabTitle(tab)"></n-tab>
      </n-tabs>
    </div>

    <div class="layout-router-view">
      <router-view v-slot="{ Component, route }">
        <transition mode="out-in" name="content-route">
          <keep-alive :include="tabsStore.cachedNames">
            <component :is="Component" :key="route.matched[route.matched.length - 1]?.path ?? route.path" />
          </keep-alive>
        </transition>
      </router-view>
    </div>
  </n-layout-content>
</template>

<script lang="ts" setup>
import { NLayoutContent, NTab, NTabs } from "naive-ui";
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
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
