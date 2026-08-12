<template>
  <main class="error-page">
    <n-card class="error-card" :bordered="false">
      <div class="error-content">
        <div class="error-icon error-icon--warning" aria-hidden="true">
          <ShieldAlert :size="38" :stroke-width="1.8"></ShieldAlert>
        </div>
        <div class="status-code status-code--warning">403</div>
        <h1>{{ t("noPermission.title") }}</h1>
        <n-text depth="3">{{ t("noPermission.description") }}</n-text>
      </div>
    </n-card>
  </main>
</template>

<script setup lang="ts">
import { ShieldAlert } from "@lucide/vue";
import { NCard, NText } from "naive-ui";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<style scoped lang="scss">
.error-page {
  min-height: 100vh;
  box-sizing: border-box;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--color-bg-page);
}

.error-card {
  width: min(100%, 480px);
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
}

.error-content {
  display: flex;
  align-items: center;
  flex-direction: column;
  padding: 24px 12px;
  text-align: center;
}

.error-icon {
  display: grid;
  width: 72px;
  height: 72px;
  place-items: center;
  border-radius: 16px;
}

.error-icon--warning {
  color: var(--color-warning-6);
  background: var(--color-warning-1);
}

.status-code {
  margin-top: 24px;
  font-size: 52px;
  font-weight: 700;
  line-height: 1;
}

.status-code--warning {
  color: var(--color-warning-6);
}

h1 {
  margin: 16px 0 8px;
  color: var(--color-gray-10);
  font-size: 28px;
  line-height: 1.3;
}

.n-text {
  max-width: 360px;
  font-size: 15px;
  line-height: 1.7;
}

@media (max-width: 640px) {
  .error-page {
    padding: 16px;
  }

  .error-content {
    padding: 16px 4px;
  }
}
</style>
