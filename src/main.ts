import { createApp } from "vue";
import "@/style.css";
import App from "@/App.vue";
import i18n from "@/locales";
import store from "@/stores";
import router from "@/router";
import { createDiscreteApi } from "naive-ui";

const { message } = createDiscreteApi(["message"]);
window.$message = message;

const app = createApp(App);
app.use(i18n);
app.use(store);
app.use(router);
app.mount("#app");
