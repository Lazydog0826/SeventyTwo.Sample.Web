<template>
  <n-layout class="app-layout" has-sider>
    <layout-menu :collapsed="collapsed"></layout-menu>

    <n-layout>
      <n-layout-header class="app-header" bordered>
        <n-button quaternary circle aria-label="切换侧边栏" @click="collapsed = !collapsed">
          <template #icon>
            <n-icon>
              <PanelLeftOpen v-if="collapsed"></PanelLeftOpen>
              <PanelLeftClose v-else></PanelLeftClose>
            </n-icon>
          </template>
        </n-button>

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

      <layout-content></layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { NAvatar, NButton, NIcon, NLayout, NLayoutHeader } from "naive-ui";
import { Moon, PanelLeftClose, PanelLeftOpen, Sun } from "@lucide/vue";
import { inject, ref, type Ref } from "vue";
import { useI18n } from "vue-i18n";
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
  min-height: 100vh;
}

.app-header {
  height: 64px;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

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

@media (max-width: 640px) {
  .app-header {
    padding: 0 12px;
  }

  .user-summary span {
    display: none;
  }
}
</style>
