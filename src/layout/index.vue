<template>
  <n-layout class="app-layout" :lang="locale">
    <layout-header></layout-header>

    <n-layout class="app-body" has-sider>
      <layout-menu :collapsed="collapsed" @toggle="collapsed = !collapsed"></layout-menu>
      <layout-content></layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { NLayout } from "naive-ui";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import LayoutContent from "./content.vue";
import LayoutHeader from "./header.vue";
import LayoutMenu from "./menu.vue";

const { locale } = useI18n();
const collapsed = ref(false);
</script>

<style scoped lang="scss">
.app-layout {
  height: 100vh;
}

.app-body {
  height: calc(100vh - 64px);
}
</style>
