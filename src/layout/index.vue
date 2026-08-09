<template>
  <n-layout class="app-layout">
    <n-layout-header class="app-header" bordered>
      <div class="header-main">
        <div class="brand">
          <img class="brand-logo" :src="logoUrl" alt="SeventyTwo" />
        </div>
      </div>

      <div class="header-actions">
        <n-button
          quaternary
          circle
          :title="t(isDark ? 'theme.switchToLight' : 'theme.switchToDark')"
          :aria-label="t(isDark ? 'theme.switchToLight' : 'theme.switchToDark')"
          @click="toggleTheme"
        >
          <template #icon>
            <n-icon>
              <Sun v-if="isDark"></Sun>
              <Moon v-else></Moon>
            </n-icon>
          </template>
        </n-button>

        <div class="user-summary">
          <n-avatar round size="small">S</n-avatar>
          <span>SeventyTwo</span>
        </div>
      </div>
    </n-layout-header>

    <n-layout class="app-body" has-sider>
      <layout-menu :collapsed="collapsed" @toggle="collapsed = !collapsed"></layout-menu>
      <layout-content></layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { NAvatar, NButton, NIcon, NLayout, NLayoutHeader } from "naive-ui";
import { Moon, Sun } from "@lucide/vue";
import { inject, ref, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import logoUrl from "@/assets/seventytwo-logo.svg";
import LayoutContent from "./content.vue";
import LayoutMenu from "@/layout/menu.vue";

const { t } = useI18n();
const collapsed = ref(false);
const { isDark, toggleTheme } = inject<{
  isDark: Ref<boolean>;
  toggleTheme: () => void;
}>("theme")!;
</script>

<style scoped lang="scss">
.app-layout {
  height: 100vh;
}

.app-body {
  height: calc(100vh - 64px);
}

.app-header {
  height: 64px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-main,
.header-actions,
.user-summary {
  display: flex;
  align-items: center;
}

.header-actions {
  gap: 12px;
}

.user-summary {
  gap: 8px;
  white-space: nowrap;
}

.brand {
  width: 204px;
  display: flex;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
}

.brand-logo {
  display: block;
  width: 160px;
  height: 48px;
  flex: 0 0 160px;
}

@media (max-width: 640px) {
  .app-header {
    padding: 0 12px;
  }

  .user-summary span {
    display: none;
  }

  .brand {
    width: 44px;
  }
}
</style>
