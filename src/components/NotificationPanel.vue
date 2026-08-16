<template>
  <div class="notification-panel">
    <div class="notification-header">
      <div class="notification-title">
        <span>{{ t("notifications.title") }}</span>
        <n-tag v-if="unreadCount > 0" :bordered="false" round size="small" type="error">
          {{ unreadCount > 99 ? "99+" : unreadCount }}
        </n-tag>
      </div>
      <n-button v-if="unreadCount > 0" quaternary size="tiny" type="primary" @click="emit('markAllRead')">
        {{ t("notifications.markAllRead") }}
      </n-button>
    </div>

    <ul v-if="notifications.length > 0" class="notification-list">
      <li v-for="item in notifications" :key="item.id" :class="{ 'is-unread': !item.read }" class="notification-item">
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
</template>

<script lang="ts">
// 通知条目结构对外导出，头部维护数据与徽标未读数时复用，避免两处定义漂移。
export interface NotificationItem {
  id: number;
  title: string;
  content: string;
  time: string;
  read: boolean;
}
</script>

<script lang="ts" setup>
import { NButton, NIcon, NTag } from "naive-ui";
import { Inbox } from "@lucide/vue";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

// 面板只负责展示，数据与已读状态由头部维护，保证铃铛徽标与列表一致。
const props = defineProps<{ notifications: Array<NotificationItem> }>();
const emit = defineEmits<{ markAllRead: [] }>();

const { t } = useI18n();
const unreadCount = computed(() => props.notifications.filter(item => !item.read).length);
</script>

<style lang="scss" scoped>
// 父级 popover 已通过 content-style 去除默认内边距，
// 留白与分割线通栏效果由本组件自行控制。
.notification-panel {
  display: flex;
  flex-direction: column;
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 8px;
  // 分割线样式与系统其他面板保持一致（见 home.vue 统计卡片）。
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
  padding: 6px 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  // 弹层高度可控：列表超出最大高度后内部滚动，头部保持固定。
  max-height: 320px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;

  // 条目间以分割线区分，最后一条不画，避免与弹层底边形成双线。
  &:not(:last-child) {
    border-bottom: 1px solid color-mix(in srgb, var(--color-gray-3) 70%, transparent);
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
</style>
