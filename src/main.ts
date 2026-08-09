import { createApp } from "vue";
import "@bprogress/core/css";
import "@/theme.scss";
import "@/style.scss";
import App from "@/App.vue";
import i18n from "@/locales";
import store from "@/stores";
import router from "@/router";
import { createDiscreteApi } from "naive-ui";
import { configProviderProps, syncThemeOverrides } from "@/theme";

// 静态样式模块加载完成后再读取 CSS 色板，避免初始化阶段得到空色值
syncThemeOverrides();
const { message } = createDiscreteApi(["message"], { configProviderProps });
window.$message = message;

const app = createApp(App);
app.use(i18n);
app.use(store);
app.use(router);
app.mount("#app");
