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

        <div class="notification-panel">
          <div class="notification-header">
            <div class="notification-title">
              <span>{{ t("notifications.title") }}</span>
              <n-tag v-if="unreadNotificationCount > 0" :bordered="false" round size="small" type="error">
                {{ unreadNotificationCount > 99 ? "99+" : unreadNotificationCount }}
              </n-tag>
            </div>
            <n-button
              v-if="unreadNotificationCount > 0"
              quaternary
              size="tiny"
              type="primary"
              @click="markAllNotificationsRead"
            >
              {{ t("notifications.markAllRead") }}
            </n-button>
          </div>

          <ul v-if="notifications.length > 0" class="notification-list">
            <li
              v-for="item in notifications"
              :key="item.id"
              :class="{ 'is-unread': !item.read }"
              class="notification-item"
            >
              <span aria-hidden="true" class="notification-item-dot"></span>
              <div class="notification-item-body">
                <div class="notification-item-meta">
                  <span class="notification-item-title">{{ item.title }}</span>
                  <span class="notification-item-time">{{ item.time }}</span>
                </div>
                <p class="notification-item-content">{{ item.content }}</p>
              </div>
            </li>
          </ul>
          <div v-else class="notification-empty">
            <n-icon :size="28">
              <Inbox :size="28" :stroke-width="1.5"></Inbox>
            </n-icon>
            <p>{{ t("notifications.empty") }}</p>
          </div>
        </div>
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
  NTag,
} from "naive-ui";
import { BellRing, Inbox, Languages, Maximize, Minimize, Moon, Sun } from "@lucide/vue";
import { computed, inject, onMounted, onUnmounted, ref, type Ref } from "vue";
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

// 通知中心 demo：数据为本地 mock，后续接入通知接口时仅需替换数据来源与已读逻辑。
interface NotificationItem {
  id: number;
  title: string;
  content: string;
  time: string;
  read: boolean;
}

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

// 弹层内容已通过 :content-style 去除 popover 默认内边距，
// 由 panel 自行控制留白，保证分隔线与 hover 高亮通栏。
.notification-panel {
  display: flex;
  flex-direction: column;
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 8px;
  // 分隔线样式与系统其他面板保持一致（见 home.vue 统计卡片）。
  border-bottom: 1px solid color-mix(in srgb, var(--color-gray-3) 70%, transparent);
}

.notification-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.notification-list {
  margin: 0;
  // 上下留白，避免首尾条目的 hover 色块压到弹层圆角。
  padding: 6px 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  max-height: 320px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;

  &:hover {
    background: var(--color-gray-2);
  }
}

// 左侧状态点：默认透明占位保证已读条目对齐，未读时显示主题 error 色。
.notification-item-dot {
  flex-shrink: 0;
  width: 6px;
  height: 6px;
  margin-top: 7px;
  border-radius: 50%;
  background: transparent;

  .is-unread & {
    background: var(--color-error-6);
  }
}

.notification-item-body {
  flex: 1;
  min-width: 0;
}

.notification-item-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.notification-item-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}

.notification-item-time {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--color-gray-5);
}

.notification-item-content {
  margin: 4px 0 0;
  font-size: 13px;
  color: var(--color-gray-7);
  // 内容过长时最多展示两行，保持列表高度稳定。
  display: -webkit-box;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.notification-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 0;
  color: var(--color-gray-5);

  p {
    margin: 0;
  }
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
