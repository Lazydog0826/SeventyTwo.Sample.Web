<template>
  <main class="login-page" :class="{ 'login-page--dark': isDark }" :lang="locale">
    <div class="login-toolbar">
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

    <div class="login-content">
      <n-card class="login-card" :bordered="false">
        <header class="login-header">
          <h1>{{ t("login.welcome") }}</h1>
          <n-text depth="3">{{ t("login.subtitle") }}</n-text>
        </header>

        <n-form
          ref="formRef"
          :model="formValue"
          :rules="rules"
          label-placement="top"
          size="large"
          :show-require-mark="false"
          @submit.prevent="handleLogin"
        >
          <n-form-item path="account" :label="t('login.account')">
            <n-input
              v-model:value="formValue.account"
              :placeholder="t('login.accountPlaceholder')"
              autocomplete="username"
              clearable
            ></n-input>
          </n-form-item>

          <n-form-item path="password" :label="t('login.password')">
            <n-input
              v-model:value="formValue.password"
              type="password"
              :placeholder="t('login.passwordPlaceholder')"
              autocomplete="current-password"
              show-password-on="click"
            ></n-input>
          </n-form-item>

          <div class="form-options">
            <n-checkbox>{{ t("login.rememberMe") }}</n-checkbox>
            <n-button text type="primary">
              {{ t("login.forgotPassword") }}
            </n-button>
          </div>

          <n-button type="primary" attr-type="submit" size="large" :loading="loading" block>
            {{ t("common.login") }}
          </n-button>
        </n-form>

        <footer class="login-footer">
          <n-text depth="3">{{ t("login.noAccount") }}</n-text>
          <n-button text type="primary">
            {{ t("login.createAccount") }}
          </n-button>
        </footer>
      </n-card>

      <n-text depth="3">© 2026 SeventyTwo</n-text>
    </div>
  </main>
</template>

<script setup lang="ts">
import { NButton, NCard, NCheckbox, NDropdown, NForm, NFormItem, NIcon, NInput, NText } from "naive-ui";
import type { FormInst, FormRules } from "naive-ui";
import { Languages, Moon, Sun } from "@lucide/vue";
import { computed, inject, reactive, ref, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { login } from "@/api/users";
import { SystemUsername } from "@/constants/users";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const formRef = ref<FormInst | null>(null);
const loading = ref(false);
const formValue = reactive({
  account: SystemUsername.SuperAdmin,
  password: "123456",
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
    await router.push(typeof redirect === "string" ? redirect : "/home");
  } catch {
    // 请求层已统一展示接口错误。
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
.login-page {
  display: grid;
  min-height: 100vh;
  box-sizing: border-box;
  place-items: center;
  padding: 24px;
  background: #f5f7f9;
}

.login-page--dark {
  background: #101014;
}

.login-page--dark .login-header h1 {
  color: rgba(255, 255, 255, 0.9);
}

.login-card {
  border-radius: 16px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.08);
}

.login-content {
  width: min(100%, 400px);
}

.login-toolbar {
  position: fixed;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  top: 24px;
  right: 24px;
}

.login-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  margin-bottom: 28px;
}

.login-header h1 {
  margin: 0;
  font-size: 28px;
}

.form-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 24px;
}

.login-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 24px;
}

.login-content > .n-text {
  display: block;
  margin-top: 20px;
  text-align: center;
}
</style>
