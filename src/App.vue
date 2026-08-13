<template>
  <n-config-provider v-bind="configProviderProps">
    <router-view v-slot="{ Component, route }">
      <transition mode="out-in" name="app-route">
        <component :is="Component" :key="route.matched[0]?.path ?? route.path" />
      </transition>
    </router-view>
  </n-config-provider>
</template>

<script lang="ts" setup>
import { NConfigProvider } from "naive-ui";
import { provide } from "vue";
import { configProviderProps, isDark, toggleTheme } from "@/theme";

provide("theme", { isDark, toggleTheme });
</script>

<style lang="scss" scoped>
:global(.app-route-enter-active) {
  transition: opacity 180ms ease;
}

:global(.app-route-leave-active) {
  transition: opacity 120ms ease;
}

:global(.app-route-enter-from),
:global(.app-route-leave-to) {
  opacity: 0;
}
</style>
