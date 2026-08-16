<template>
  <main :lang="locale" class="login-page">
    <div class="login-toolbar">
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
    </div>

    <div class="login-content">
      <n-card :bordered="false" class="login-card">
        <header class="login-header">
          <h1>{{ t("login.welcome") }}</h1>
          <n-text depth="3">{{ t("login.subtitle") }}</n-text>
        </header>

        <n-form
          ref="formRef"
          :model="formValue"
          :rules="rules"
          :show-require-mark="false"
          label-placement="top"
          size="large"
          @submit.prevent="handleLogin"
        >
          <n-form-item :label="t('login.account')" path="account">
            <n-input
              v-model:value="formValue.account"
              :placeholder="t('login.accountPlaceholder')"
              autocomplete="username"
              clearable
            ></n-input>
          </n-form-item>

          <n-form-item :label="t('login.password')" path="password">
            <n-input
              v-model:value="formValue.password"
              :placeholder="t('login.passwordPlaceholder')"
              autocomplete="current-password"
              show-password-on="click"
              type="password"
            ></n-input>
          </n-form-item>

          <div class="form-options">
            <n-button text type="primary">
              {{ t("login.forgotPassword") }}
            </n-button>
          </div>

          <n-button :loading="loading" attr-type="submit" block size="large" type="primary">
            {{ t("common.login") }}
          </n-button>
        </n-form>

        <footer class="login-footer">
          <n-text depth="3">{{ t("login.noAccount") }}</n-text>
          <n-button text type="primary">
            {{ t("login.createAccount") }}
          </n-button>
        </footer>

        <div class="demo-notice">
          <span>{{ t("login.demoDescription") }}</span>
          <button :title="t('login.demoFillHint')" class="demo-fill" type="button" @click="fillDemoCredentials">
            {{ t("login.demoAccount") }} · {{ t("login.demoPassword") }}
          </button>
        </div>
      </n-card>

      <n-text depth="3">© 2026 SeventyTwo</n-text>
    </div>
  </main>
</template>

<script lang="ts" setup>
import type { FormInst, FormRules } from "naive-ui";
import { NButton, NCard, NDropdown, NForm, NFormItem, NIcon, NInput, NText } from "naive-ui";
import { Languages, Moon, Sun } from "@lucide/vue";
import { computed, inject, reactive, ref, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { login } from "@/api/users";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const formValue = reactive({
  account: "",
  password: "",
});
const rules = computed<FormRules>(() => ({
  account: { required: true, message: t("login.accountRequired"), trigger: ["input", "blur"] },
  password: { required: true, message: t("login.passwordRequired"), trigger: ["input", "blur"] },
}));
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

// 与后端种子数据一致的演示账号，点击凭据一键填入，省去手动复制。
const fillDemoCredentials = () => {
  formValue.account = "superadmin";
  formValue.password = "123456";
  window.$message.success(t("login.demoFilled"));
};

const handleLogin = async () => {
  if (loading.value) {
    return;
  }

  try {
    await formRef.value?.validate();
  } catch {
    return;
  }

  loading.value = true;
  try {
    const accessToken = await login(formValue);
    if (!accessToken) {
      window.$message.error(t("login.invalidToken"));
      return;
    }

    window.$accessToken = accessToken;
    const redirect = route.query.redirect;
    await router.push(typeof redirect === "string" ? redirect : "/");
  } catch {
    // 请求层已统一展示接口错误。
  } finally {
    loading.value = false;
  }
};
</script>

<style lang="scss" scoped>
.login-page {
  display: grid;
  min-height: 100vh;
  box-sizing: border-box;
  place-items: center;
  padding: 24px;
  background: var(--color-bg-page);
}

.login-content {
  width: min(100%, 400px);
}

.login-card {
  border-radius: 12px;
}

.login-toolbar {
  position: fixed;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 16px;
  top: 24px;
  right: 24px;
}

.login-header {
  margin-bottom: 24px;

  h1 {
    margin: 0 0 6px;
    color: var(--color-gray-10);
    font-size: 22px;
    line-height: 1.3;
  }
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin: 0 0 24px;
}

.login-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 24px;
}

// 演示凭据作为卡片底部的补充说明，不与表单争夺注意力；凭据行可点击一键填入。
.demo-notice {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 20px;
  padding-top: 14px;
  border-top: 1px solid var(--color-gray-2);
  font-size: 13px;
  color: var(--color-gray-6);
}

.demo-fill {
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: var(--color-gray-7);
  text-align: left;
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: var(--color-primary-6);
  }
}

.login-content > .n-text {
  display: block;
  margin-top: 20px;
  text-align: center;
}

// 窄屏下让工具栏参与页面布局，避免与高度可变的登录卡片重叠。
@media (max-width: 480px) {
  .login-page {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .login-toolbar {
    position: static;
    flex: none;
    align-self: flex-end;
    margin-bottom: 24px;
  }

  .login-content {
    flex: none;
    margin-block: auto;
  }
}
</style>
