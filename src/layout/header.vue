<template>
  <n-layout-header bordered class="app-header">
    <div class="header-main">
      <div class="brand">
        <img :src="logoUrl" alt="SeventyTwo" class="brand-logo" />
      </div>
    </div>

    <div class="header-actions">
      <n-button
        :aria-label="t(isDark ? 'theme.switchToLight' : 'theme.switchToDark')"
        :title="t(isDark ? 'theme.switchToLight' : 'theme.switchToDark')"
        circle
        quaternary
        @click="toggleTheme"
      >
        <template #icon>
          <n-icon>
            <Sun v-if="isDark"></Sun>
            <Moon v-else></Moon>
          </n-icon>
        </template>
      </n-button>

      <n-dropdown :options="languageOptions" @select="handleLanguageChange">
        <n-button :aria-label="t('language.switch')" :title="t('language.switch')" circle quaternary>
          <template #icon>
            <n-icon>
              <Languages></Languages>
            </n-icon>
          </template>
        </n-button>
      </n-dropdown>

      <n-dropdown :options="userOptions" trigger="click" @select="handleUserAction">
        <button :aria-label="userStore.user.username" class="user-summary" type="button">
          <n-skeleton v-if="userStore.isLoading" circle height="28px" width="28px" />
          <n-avatar v-else round size="small">{{ avatarInitial }}</n-avatar>
          <n-skeleton v-if="userStore.isLoading" text width="72px" />
          <span v-else>{{ userStore.user.username }}</span>
        </button>
      </n-dropdown>
    </div>
  </n-layout-header>
</template>

<script lang="ts" setup>
import { type DropdownOption, NAvatar, NButton, NDropdown, NIcon, NLayoutHeader, NSkeleton } from "naive-ui";
import { Languages, Moon, Sun } from "@lucide/vue";
import { computed, inject, ref, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import { logout as logoutApi } from "@/api/users.ts";
import logoUrl from "@/assets/seventytwo-logo.svg";
import { useUserStore } from "@/stores/users.ts";

const { t, locale } = useI18n();
const isLoggingOut = ref(false);
const userStore = useUserStore();
const avatarInitial = computed(() => Array.from(userStore.user.username.trim())[0]?.toUpperCase() ?? "");
const userOptions = computed<Array<DropdownOption>>(() => [
  {
    label: t("common.logout"),
    key: "logout",
    disabled: isLoggingOut.value,
  },
]);
const languageOptions: Array<DropdownOption> = [
  { label: "简体中文", key: "zh-CN" },
  { label: "English", key: "en-US" },
];
const { isDark, toggleTheme } = inject<{
  isDark: Ref<boolean>;
  toggleTheme: () => void;
}>("theme")!;

void userStore.getInfo();

function handleLanguageChange(key: string | number) {
  locale.value = String(key);
  localStorage.setItem("locale", locale.value);
}

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

<style lang="scss" scoped>
.app-header {
  height: 60px;
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
  gap: 16px;
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
