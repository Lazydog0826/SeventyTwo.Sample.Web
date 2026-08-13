<template>
  <main :lang="locale" class="error-page">
    <div class="error-toolbar">
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
        <n-button quaternary size="small">
          <template #icon>
            <n-icon>
              <Languages></Languages>
            </n-icon>
          </template>
          {{ locale === "zh-CN" ? "简体中文" : "English" }}
        </n-button>
      </n-dropdown>
    </div>

    <n-card :bordered="false" class="error-card">
      <div class="error-content">
        <div aria-hidden="true" class="error-icon error-icon--warning">
          <ShieldAlert :size="38" :stroke-width="1.8"></ShieldAlert>
        </div>
        <div class="status-code status-code--warning">403</div>
        <h1>{{ t("noPermission.title") }}</h1>
        <n-text depth="3">{{ t("noPermission.description") }}</n-text>
      </div>
    </n-card>
  </main>
</template>

<script lang="ts" setup>
import { Languages, Moon, ShieldAlert, Sun } from "@lucide/vue";
import { NButton, NCard, NDropdown, NIcon, NText } from "naive-ui";
import { inject, type Ref } from "vue";
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();
const { isDark, toggleTheme } = inject<{
  isDark: Ref<boolean>;
  toggleTheme: () => void;
}>("theme")!;

const languageOptions = [
  { label: "简体中文", key: "zh-CN" },
  { label: "English", key: "en-US" },
];

const handleLanguageChange = (key: string | number) => {
  locale.value = String(key);
  localStorage.setItem("locale", locale.value);
};
</script>

<style lang="scss" scoped>
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

.error-toolbar {
  position: fixed;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  top: 24px;
  right: 24px;
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

  .error-toolbar {
    top: 16px;
    right: 16px;
  }
}
</style>
