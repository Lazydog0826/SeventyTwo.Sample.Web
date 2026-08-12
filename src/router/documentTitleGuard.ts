import i18n from "@/locales";
import { watch } from "vue";
import type { RouteLocationNormalizedLoaded, Router } from "vue-router";

const BRAND_TITLE = "SeventyTwo";

export function documentTitleGuard(router: Router) {
  const updateDocumentTitle = (route: RouteLocationNormalizedLoaded) => {
    const titleKey = typeof route.meta.titleKey === "string" ? route.meta.titleKey : "";
    const resolvedTitleKey = [titleKey, `menu.${titleKey}`].find(key => titleKey && i18n.global.te(key));
    const pageTitle = resolvedTitleKey ? i18n.global.t(resolvedTitleKey) : "";
    document.title = pageTitle ? `${pageTitle} - ${BRAND_TITLE}` : BRAND_TITLE;
  };

  router.afterEach(to => {
    updateDocumentTitle(to);
  });

  watch(i18n.global.locale, () => {
    updateDocumentTitle(router.currentRoute.value);
  });
}
