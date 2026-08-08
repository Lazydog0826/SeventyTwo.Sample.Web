import { createApp } from "vue";
import "@/style.css";
import App from "@/App.vue";
import router from "@/router";
import store from "@/stores";
import i18n from "@/locales";
import { createDiscreteApi } from "naive-ui";

const { message } = createDiscreteApi(["message"]);
window.$message = message;

const app = createApp(App);
app.use(router);
app.use(store);
app.use(i18n);
app.mount("#app");
