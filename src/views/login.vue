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
      <div>
        <header class="login-header">
          <h1>{{ t("login.welcome") }}</h1>
          <n-text depth="3">{{ t("login.subtitle") }}</n-text>
        </header>

        <!-- out-in 模式先退出旧方式再进入新方式，避免两种表单短暂同屏导致跳动。 -->
        <!-- transition 要求恰好一个子节点，多分支切换必须用 v-if / v-else-if / v-else 连续链。 -->
        <transition mode="out-in" name="login-method">
          <n-form
            v-if="activeMethod === 'account'"
            key="account"
            ref="accountFormRef"
            :model="formValue"
            :rules="rules"
            :show-require-mark="false"
            label-placement="top"
            size="medium"
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
              <n-button text type="primary" @click="showPending">
                {{ t("login.forgotPassword") }}
              </n-button>
            </div>

            <n-button :loading="loading" attr-type="submit" block size="large" type="primary">
              {{ t("common.login") }}
            </n-button>
          </n-form>

          <n-form
            v-else-if="activeMethod === 'phone'"
            key="phone"
            ref="phoneFormRef"
            :model="phoneFormValue"
            :rules="phoneRules"
            :show-require-mark="false"
            label-placement="top"
            size="medium"
            @submit.prevent="handlePhoneLogin"
          >
            <n-form-item :label="t('login.phone')" path="phone">
              <n-input
                v-model:value="phoneFormValue.phone"
                :placeholder="t('login.phonePlaceholder')"
                clearable
                maxlength="11"
              ></n-input>
            </n-form-item>

            <n-form-item :label="t('login.smsCode')" path="smsCode">
              <n-input
                v-model:value="phoneFormValue.smsCode"
                :placeholder="t('login.smsCodePlaceholder')"
                maxlength="6"
              >
                <template #suffix>
                  <n-button text type="primary" :disabled="smsCountdown > 0" @click="handleSendCode">
                    {{ smsCountdown > 0 ? t("login.smsRetry", { seconds: smsCountdown }) : t("login.smsSend") }}
                  </n-button>
                </template>
              </n-input>
            </n-form-item>

            <n-button attr-type="submit" block size="large" type="primary">
              {{ t("common.login") }}
            </n-button>
          </n-form>

          <div v-else key="qrcode" class="qrcode-panel">
            <div class="qrcode-box">
              <svg class="qrcode-svg" viewBox="0 0 25 25" shape-rendering="crispEdges" aria-hidden="true">
                <rect
                  v-for="cell in qrCells"
                  :key="`c-${cell.x}-${cell.y}`"
                  :x="cell.x"
                  :y="cell.y"
                  width="1"
                  height="1"
                  fill="currentColor"
                ></rect>
                <template v-for="pos in qrFinders" :key="`f-${pos.x}-${pos.y}`">
                  <rect :x="pos.x" :y="pos.y" width="7" height="7" fill="currentColor"></rect>
                  <rect :x="pos.x + 1" :y="pos.y + 1" width="5" height="5" fill="#fff"></rect>
                  <rect :x="pos.x + 2" :y="pos.y + 2" width="3" height="3" fill="currentColor"></rect>
                </template>
              </svg>
            </div>
            <n-text depth="3">{{ t("login.qrcodeTip") }}</n-text>
          </div>
        </transition>

        <div class="login-switch">
          <n-text depth="3">{{ t("login.otherMethods") }}</n-text>
          <template v-for="(method, index) in otherMethods" :key="method.key">
            <n-button text type="primary" @click="activeMethod = method.key">
              {{ method.label }}
            </n-button>
            <span v-if="index < otherMethods.length - 1" class="login-switch-divider">·</span>
          </template>
        </div>

        <footer class="login-footer">
          <n-text depth="3">{{ t("login.noAccount") }}</n-text>
          <n-button text type="primary" @click="showPending">
            {{ t("login.createAccount") }}
          </n-button>
        </footer>

        <div class="demo-notice">
          <span>{{ t("login.demoDescription") }}</span>
          <button class="demo-fill" type="button" @click="fillDemoCredentials">
            {{ t("login.demoFillAction") }}
          </button>
        </div>
      </div>

      <n-text depth="3">© 2026 SeventyTwo</n-text>
    </div>
  </main>
</template>

<script lang="ts" setup>
import type { FormInst, FormRules } from "naive-ui";
import { NButton, NDropdown, NForm, NFormItem, NIcon, NInput, NText } from "naive-ui";
import { Languages, Moon, Sun } from "@lucide/vue";
import { computed, inject, onUnmounted, reactive, ref, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { login } from "@/api/users";

const { t, locale } = useI18n();
const route = useRoute();
const router = useRouter();
const accountFormRef = ref<FormInst | null>(null);
const phoneFormRef = ref<FormInst | null>(null);
const loading = ref(false);
const formValue = reactive({
  account: "",
  password: "",
});
const rules = computed<FormRules>(() => ({
  account: { required: true, message: t("login.accountRequired"), trigger: ["input", "blur"] },
  password: { required: true, message: t("login.passwordRequired"), trigger: ["input", "blur"] },
}));

// 登录方式：account 账号密码 / phone 手机验证码 / qrcode 扫码，后两者为演示。
type LoginMethod = "account" | "phone" | "qrcode";
const activeMethod = ref<LoginMethod>("account");

// 底部"其他登录方式"链接，仅展示当前未选中的方式。
const otherMethods = computed(() => {
  const options: Array<{ key: LoginMethod; label: string }> = [
    { key: "account", label: t("login.tabAccount") },
    { key: "phone", label: t("login.tabPhone") },
    { key: "qrcode", label: t("login.tabQrcode") },
  ];
  return options.filter(option => option.key !== activeMethod.value);
});

const phoneFormValue = reactive({
  phone: "",
  smsCode: "",
});
const phoneRules = computed<FormRules>(() => ({
  phone: [
    { required: true, message: t("login.phoneRequired"), trigger: ["input", "blur"] },
    // 演示环境按中国大陆手机号格式校验。
    { pattern: /^1[3-9]\d{9}$/, message: t("login.phoneInvalid"), trigger: ["input", "blur"] },
  ],
  smsCode: { required: true, message: t("login.smsCodeRequired"), trigger: ["input", "blur"] },
}));

const smsCountdown = ref(0);
let smsTimer: number | null = null;

const handleSendCode = () => {
  if (smsCountdown.value > 0) {
    return;
  }
  // 与表单校验规则保持一致，不通过时仅提示不触发倒计时。
  if (!/^1[3-9]\d{9}$/.test(phoneFormValue.phone)) {
    window.$message.warning(t("login.phoneInvalid"));
    return;
  }

  // 演示环境不真正发送短信，仅进入 60s 重发倒计时。
  window.$message.success(t("login.smsSent"));
  smsCountdown.value = 60;
  smsTimer = window.setInterval(() => {
    smsCountdown.value -= 1;
    if (smsCountdown.value <= 0 && smsTimer !== null) {
      window.clearInterval(smsTimer);
      smsTimer = null;
    }
  }, 1000);
};

onUnmounted(() => {
  if (smsTimer !== null) {
    window.clearInterval(smsTimer);
  }
});

const handlePhoneLogin = async () => {
  try {
    await phoneFormRef.value?.validate();
  } catch {
    return;
  }
  // 演示环境无短信登录接口，仅提示。
  window.$message.info(t("login.phoneLoginDemo"));
};

// 忘记密码 / 创建账号等未实现入口的占位提示。
const showPending = () => {
  window.$message.info(t("common.featurePending"));
};

// 模拟二维码：固定种子伪随机点阵 + 三个定位角，每次渲染图案稳定。
const QR_SIZE = 25;
const qrCells: Array<{ x: number; y: number }> = (() => {
  let seed = 72;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  // 定位图案 7x7 + 外围 1 格分隔区，点阵避开三个角。
  const inFinderArea = (x: number, y: number) =>
    (x < 8 && y < 8) || (x >= QR_SIZE - 8 && y < 8) || (x < 8 && y >= QR_SIZE - 8);
  const cells: Array<{ x: number; y: number }> = [];
  for (let y = 0; y < QR_SIZE; y += 1) {
    for (let x = 0; x < QR_SIZE; x += 1) {
      if (!inFinderArea(x, y) && rand() > 0.52) {
        cells.push({ x, y });
      }
    }
  }
  return cells;
})();
const qrFinders = [
  { x: 0, y: 0 },
  { x: QR_SIZE - 7, y: 0 },
  { x: 0, y: QR_SIZE - 7 },
];

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
    await accountFormRef.value?.validate();
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

// 登录方式切换动画：淡入 + 轻微上移，时序与 content-route 路由过渡保持一致的轻量节奏。
.login-method-enter-active {
  transition:
    opacity 180ms ease,
    transform 180ms ease;
}

.login-method-leave-active {
  transition:
    opacity 120ms ease,
    transform 120ms ease;
}

.login-method-enter-from,
.login-method-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

// 底部"其他登录方式"切换链接，仅展示未选中的方式。
.login-switch {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;
  font-size: 13px;
}

.login-switch-divider {
  color: var(--color-gray-6);
}

// 扫码登录演示区：白底卡片保证暗色主题下二维码可识别。
.qrcode-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 8px 0 4px;
}

.qrcode-box {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 0 0 1px var(--color-gray-2);
}

.qrcode-svg {
  width: 176px;
  height: 176px;
  // 点阵固定深色不随主题反转：gray-10 在暗色主题下是近白色，会与白底卡片融为一体导致二维码不可见。
  color: #333;
}

.login-footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 24px;
}

// 演示说明作为卡片底部补充，凭据不直接展示，通过链接按钮一键填入。
.demo-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
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
  color: var(--color-primary-6);
  cursor: pointer;
  transition: color 0.2s;

  &:hover {
    color: var(--color-primary-7);
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
