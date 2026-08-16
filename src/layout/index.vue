<template>
  <n-layout :lang="locale" class="app-layout">
    <layout-header></layout-header>

    <n-layout class="app-body" has-sider>
      <layout-menu :collapsed="collapsed" @toggle="collapsed = !collapsed"></layout-menu>
      <layout-content></layout-content>
    </n-layout>
  </n-layout>
</template>

<script lang="ts" setup>
import { NLayout } from "naive-ui";
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import LayoutContent from "./content.vue";
import LayoutHeader from "./header.vue";
import LayoutMenu from "./menu.vue";

const { locale } = useI18n();
const collapsed = ref(false);
</script>

<style lang="scss" scoped>
.app-layout {
  height: 100vh;
}

.app-body {
  height: calc(100vh - 60px);
}
</style>
