<template>
  <n-layout-content class="layout-content" content-style="padding: 24px;">
    <router-view></router-view>
  </n-layout-content>
</template>

<script setup lang="ts">
import { NLayoutContent } from "naive-ui";
</script>

<style scoped lang="scss">
.layout-content {
  min-height: calc(100vh - 64px);
  background: rgba(128, 128, 128, 0.06);
}

@media (max-width: 640px) {
  .layout-content :deep(.n-layout-scroll-container) {
    padding: 16px !important;
  }
}
</style>
