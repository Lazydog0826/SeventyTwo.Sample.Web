<template>
  <n-config-provider :theme="isDark ? darkTheme : null">
    <router-view v-slot="{ Component, route }">
      <transition name="app-route" mode="out-in">
        <component
          :is="Component"
          :key="route.matched[0]?.path ?? route.path"
        />
      </transition>
    </router-view>
  </n-config-provider>
</template>

<script setup lang="ts">
import { NConfigProvider, darkTheme } from "naive-ui";
import { provide, ref } from "vue";

const isDark = ref(localStorage.getItem("theme") === "dark");

const toggleTheme = () => {
  isDark.value = !isDark.value;
  localStorage.setItem("theme", isDark.value ? "dark" : "light");
};

provide("theme", { isDark, toggleTheme });
</script>

<style scoped lang="scss">
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
