<template>
  <n-layout-header bordered class="app-header">
    <div class="header-main">
      <div class="brand">
        <img :src="logoUrl" alt="SeventyTwo" class="brand-logo" />
      </div>
    </div>

    <div class="header-actions">
      <n-popover
        :content-style="{ padding: 0 }"
        :show-arrow="false"
        :width="320"
        placement="bottom-end"
        trigger="click"
      >
        <template #trigger>
          <n-badge :max="99" :offset="[-4, 4]" :value="unreadNotificationCount">
            <n-button :aria-label="t('notifications.title')" :title="t('notifications.title')" circle quaternary>
              <template #icon>
                <n-icon>
                  <BellRing :size="16" :stroke-width="1.5"></BellRing>
                </n-icon>
              </template>
            </n-button>
          </n-badge>
        </template>

        <NotificationPanel :notifications="notifications" @mark-all-read="markAllNotificationsRead" />
      </n-popover>

      <n-button
        :aria-label="t(isFullscreen ? 'fullscreen.exit' : 'fullscreen.enter')"
        :title="t(isFullscreen ? 'fullscreen.exit' : 'fullscreen.enter')"
        circle
        quaternary
        @click="toggleFullscreen"
      >
        <template #icon>
          <n-icon>
            <Minimize v-if="isFullscreen" :size="16" :stroke-width="1.5"></Minimize>
            <Maximize v-else :size="16" :stroke-width="1.5"></Maximize>
          </n-icon>
        </template>
      </n-button>

      <n-button
        :aria-label="t(isDark ? 'theme.switchToLight' : 'theme.switchToDark')"
        :title="t(isDark ? 'theme.switchToLight' : 'theme.switchToDark')"
        circle
        quaternary
        @click="toggleTheme"
      >
        <template #icon>
          <n-icon>
            <Sun v-if="isDark" :size="16" :stroke-width="1.5"></Sun>
            <Moon v-else :size="16" :stroke-width="1.5"></Moon>
          </n-icon>
        </template>
      </n-button>

      <n-dropdown :options="languageOptions" @select="handleLanguageChange">
        <n-button :aria-label="t('language.switch')" :title="t('language.switch')" circle quaternary>
          <template #icon>
            <n-icon>
              <Languages :size="16" :stroke-width="1.5"></Languages>
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
import {
  type DropdownOption,
  NAvatar,
  NBadge,
  NButton,
  NDropdown,
  NIcon,
  NLayoutHeader,
  NPopover,
  NSkeleton,
} from "naive-ui";
import { BellRing, KeyRound, Languages, LogOut, Maximize, Minimize, Moon, Settings, Sun, User } from "@lucide/vue";
import { type Component, computed, h, inject, onMounted, onUnmounted, ref, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import { logout as logoutApi } from "@/api/users.ts";
import logoUrl from "@/assets/seventytwo-logo.svg";
import NotificationPanel, { type NotificationItem } from "@/components/NotificationPanel.vue";
import { useUserStore } from "@/stores/users.ts";

const { t, locale } = useI18n();
const isLoggingOut = ref(false);
const userStore = useUserStore();
const avatarInitial = computed(() => Array.from(userStore.user.username.trim())[0]?.toUpperCase() ?? "");

// 下拉菜单图标统一走该渲染函数，保持与顶栏按钮一致的线性图标风格。
function renderIcon(icon: Component) {
  return () => h(NIcon, null, { default: () => h(icon, { size: 16, "stroke-width": 1.5 }) });
}

// 个人中心/账号设置/修改密码暂未实现，先以占位选项提供入口，选中后提示开发中。
const userOptions = computed<Array<DropdownOption>>(() => [
  {
    label: t("common.profile"),
    key: "profile",
    icon: renderIcon(User),
  },
  {
    label: t("common.accountSettings"),
    key: "accountSettings",
    icon: renderIcon(Settings),
  },
  {
    label: t("common.changePassword"),
    key: "changePassword",
    icon: renderIcon(KeyRound),
  },
  { type: "divider", key: "divider" },
  {
    label: t("common.logout"),
    key: "logout",
    icon: renderIcon(LogOut),
    disabled: isLoggingOut.value,
  },
]);
const languageOptions: Array<DropdownOption> = [
  { label: "简体中文", key: "zh-CN" },
  { label: "English", key: "en-US" },
];

// 通知中心 demo：数据为本地 mock，后续接入通知接口时仅需替换数据来源与已读逻辑。
const notifications = ref<Array<NotificationItem>>([
  {
    id: 1,
    title: "系统维护通知",
    content: "系统将于本周六 02:00 - 04:00 升级维护，期间暂停访问。",
    time: "10:24",
    read: false,
  },
  { id: 2, title: "待办审核提醒", content: "商品「示例商品 A」已提交审核，请及时处理。", time: "09:15", read: false },
  { id: 3, title: "操作手册更新", content: "新版操作手册已发布，可在帮助中心查看。", time: "昨天", read: true },
]);

const unreadNotificationCount = computed(() => notifications.value.filter(item => !item.read).length);

function markAllNotificationsRead() {
  notifications.value.forEach(item => (item.read = true));
}
const { isDark, toggleTheme } = inject<{
  isDark: Ref<boolean>;
  toggleTheme: () => void;
}>("theme")!;

// 全屏状态由 fullscreenchange 事件驱动，保证用户按 ESC 退出时图标同步。
const isFullscreen = ref(false);

function syncFullscreenState() {
  isFullscreen.value = Boolean(document.fullscreenElement);
}

function toggleFullscreen() {
  if (document.fullscreenElement) {
    void document.exitFullscreen();
  } else {
    // 全屏请求可能被浏览器策略拒绝，无需向用户提示。
    void document.documentElement.requestFullscreen().catch(() => {});
  }
}

onMounted(() => document.addEventListener("fullscreenchange", syncFullscreenState));
onUnmounted(() => document.removeEventListener("fullscreenchange", syncFullscreenState));

void userStore.getInfo();

function handleLanguageChange(key: string | number) {
  locale.value = String(key);
  localStorage.setItem("locale", locale.value);
}

async function handleUserAction(key: string | number) {
  if (key !== "logout") {
    // 占位选项：功能尚未实现，仅提示，不影响现有流程。
    window.$message.info(t("common.featurePending"));
    return;
  }

  if (isLoggingOut.value) {
    return;
  }

  isLoggingOut.value = true;
  // 退出请求期间展示常驻 loading 提示，跳转登录页前销毁，避免残留。
  const loadingMessage = window.$message.loading(t("common.loggingOut"), { duration: 0 });
  try {
    await logoutApi();
  } catch {
    // 请求层已统一展示接口错误，前端仍需清除本地登录态。
  } finally {
    loadingMessage.destroy();
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
