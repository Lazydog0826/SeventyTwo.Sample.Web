<template>
  <n-config-provider :theme="isDark ? darkTheme : null">
    <router-view></router-view>
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

<style scoped lang="scss"></style>
