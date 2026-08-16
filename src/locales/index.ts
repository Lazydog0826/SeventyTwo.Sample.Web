import { createI18n } from "vue-i18n";

// 消息树：叶子为文案字符串，其余层级为命名空间对象；与 vue-i18n 的 LocaleMessages 结构同构。
type MessageTree = string | { [key: string]: MessageTree };
type Messages = Record<string, MessageTree>;

// 语言包聚合：自动收集各语言目录（zh-CN、en-US）下的全部文案模块，聚合逻辑全局仅此一份，
// 新增语言目录或文案文件无需登记。统一规范：一个文案文件即一个命名空间（文件名），
// 内容为 default 导出的消息树，如 menu.ts → t("menu.home")、backendMessages.ts →
// t("backendMessages.authentication.refreshTokenInvalid")。
const modules = import.meta.glob("./*/*.ts", { eager: true }) as Record<string, { default: MessageTree }>;

function collectMessages(): Record<string, Messages> {
  const byLocale: Record<string, Messages> = {};
  for (const [path, module] of Object.entries(modules)) {
    // glob key 形如 "./zh-CN/menu.ts"：第二段为语言目录、第三段为模块文件名。
    const [, locale, file] = path.split("/");
    if (!byLocale[locale]) {
      byLocale[locale] = {};
    }
    byLocale[locale][file.slice(0, -".ts".length)] = module.default;
  }
  return byLocale;
}

const savedLocale = localStorage.getItem("locale");

const i18n = createI18n({
  legacy: false,
  locale: savedLocale === "en-US" ? "en-US" : "zh-CN",
  fallbackLocale: "en-US",
  messages: collectMessages(),
});

export default i18n;
