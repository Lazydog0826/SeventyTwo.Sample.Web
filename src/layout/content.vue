<template>
  <n-layout-content class="layout-content" content-style="padding: 24px;">
    <router-view v-slot="{ Component, route }">
      <transition mode="out-in" name="content-route">
        <div :key="route.matched[route.matched.length - 1]?.path ?? route.path" class="content-route-page">
          <component :is="Component" />
        </div>
      </transition>
    </router-view>
  </n-layout-content>
</template>

<script lang="ts" setup>
import { NLayoutContent } from "naive-ui";
</script>

<style lang="scss" scoped>
.layout-content {
  background-color: var(--color-bg-page);
  height: calc(100vh - 64px);
  min-height: 0;
}

.content-route-page {
  width: 100%;
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

@media (max-width: 640px) {
  .layout-content :deep(.n-layout-scroll-container) {
    padding: 16px !important;
  }
}
</style>
