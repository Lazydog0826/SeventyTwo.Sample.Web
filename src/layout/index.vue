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

        <n-dropdown trigger="click" :options="userOptions" @select="handleUserAction">
          <button class="user-summary" type="button" :aria-label="userStore.user.username">
            <n-avatar round size="small">S</n-avatar>
            <span>{{ userStore.user.username }}</span>
          </button>
        </n-dropdown>
      </div>
    </n-layout-header>

    <n-layout class="app-body" has-sider>
      <layout-menu :collapsed="collapsed" @toggle="collapsed = !collapsed"></layout-menu>
      <layout-content></layout-content>
    </n-layout>
  </n-layout>
</template>

<script setup lang="ts">
import { NAvatar, NButton, NDropdown, NIcon, NLayout, NLayoutHeader, type DropdownOption } from "naive-ui";
import { Moon, Sun } from "@lucide/vue";
import { computed, inject, ref, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import { logout as logoutApi } from "@/api/users.ts";
import logoUrl from "@/assets/seventytwo-logo.svg";
import LayoutContent from "./content.vue";
import LayoutMenu from "@/layout/menu.vue";
import { useUserStore } from "@/stores/users.ts";

const { t } = useI18n();
const collapsed = ref(false);
const isLoggingOut = ref(false);
const userStore = useUserStore();
const userOptions = computed<Array<DropdownOption>>(() => [
  {
    label: t("common.logout"),
    key: "logout",
    disabled: isLoggingOut.value,
  },
]);
const { isDark, toggleTheme } = inject<{
  isDark: Ref<boolean>;
  toggleTheme: () => void;
}>("theme")!;

void userStore.getInfo();

async function handleUserAction(key: string | number) {
  if (key !== "logout" || isLoggingOut.value) {
    return;
  }

  isLoggingOut.value = true;
  try {
    await logoutApi();
  } catch {
    // 请求层已统一展示接口错误，前端仍需清除本地登录态。
  } finally {
    window.$accessToken = "";
    window.location.replace("/login");
  }
}
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
  padding: 4px 6px;
  border: 0;
  border-radius: 6px;
  color: inherit;
  background: transparent;
  font: inherit;
  white-space: nowrap;
  cursor: pointer;

  &:hover {
    background: var(--color-gray-2);
  }
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
